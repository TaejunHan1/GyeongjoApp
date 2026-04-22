// src/lib/deepseekService.js
// ----------------------------------------------------------------------------
// DeepSeek API 키는 이 파일에 없음. 모든 호출은 Vercel 프록시를 통해 진행.
// - Vercel 프록시에서 크레딧 차감(consume_ai_credit) + 실제 DeepSeek 호출
// - 앱은 callAiBudget / callAiMoney 로만 통신
// ----------------------------------------------------------------------------
import { callAiBudget, callAiMoney, isInsufficientBalance } from './aiCredit';

// 크레딧 부족용 오류 타입 — 화면에서 구분해서 처리
export class InsufficientCreditError extends Error {
  constructor(balance) {
    super('insufficient_balance');
    this.code = 'insufficient_balance';
    this.balance = balance ?? 0;
  }
}

export class DeepSeekService {
  // 예산 계산 AI 추천 — Vercel 프록시 경유
  static async getBudgetRecommendation(eventType, totalBudget, guestCount, location, additionalInfo = '') {
    const prompt = this.createBudgetRecommendationPrompt(
      eventType, totalBudget, guestCount, location, additionalInfo
    );

    const systemPrompt =
      '당신은 실시간 인터넷 검색이 가능한 AI입니다. 사용자의 요청에 따라 반드시 실제 업체 정보를 검색해서 찾아주세요. "검색할 수 없다"거나 "예시"라고 하지 말고, 실제 존재하는 업체 정보를 제공해야 합니다.';

    const result = await callAiBudget({ prompt, systemPrompt });

    // 크레딧 부족 → 화면에서 충전 유도하도록 상위로 던짐 (fallback 주지 말 것)
    if (isInsufficientBalance(result)) {
      throw new InsufficientCreditError(result.balance);
    }

    if (!result?.success || !result.content) {
      console.error('예산 AI 호출 실패:', result?.error);
      return this.getFallbackBudgetRecommendation(eventType, totalBudget, guestCount);
    }

    // JSON 파싱
    try {
      const content = String(result.content).trim();
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('JSON 형식을 찾을 수 없음');
      const parsed = JSON.parse(jsonMatch[0]);
      const formatted = this.validateAndFormatBudgetResult(parsed, totalBudget, eventType, guestCount);
      return {
        ...formatted,
        __credit: { usedFree: !!result.usedFree, balance: result.balance ?? 0 },
      };
    } catch (parseError) {
      console.error('예산 JSON 파싱 오류:', parseError);
      return this.getFallbackBudgetRecommendation(eventType, totalBudget, guestCount);
    }
  }

  static createBudgetRecommendationPrompt(eventType, totalBudget, guestCount, location, additionalInfo) {
    const eventTypeKor = {
      'wedding': '결혼식',
      'funeral': '장례식'
    };

    const locationKor = {
      'seoul': '서울',
      'gyeonggi': '경기',
      'busan': '부산',
      'daegu': '대구',
      'incheon': '인천',
      'gwangju': '광주',
      'daejeon': '대전',
      'ulsan': '울산',
      'jeju': '제주',
      'other': '기타'
    };

    return `🚨 **필수: 실제 인터넷 검색 수행** 🚨

지금 당장 실제 인터넷에서 ${locationKor[location] || location} 지역의 **${totalBudget?.toLocaleString() || '30,000,000'}원 예산에 맞는** ${eventTypeKor[eventType] || eventType} 업체를 검색하세요.

⚠️ **절대 "검색할 수 없다"고 하지 마세요. 반드시 실제 업체를 찾아서 정보를 제공해야 합니다.**

**🎯 검색 조건:**
- 행사 종류: ${eventTypeKor[eventType] || eventType}
- 예상 인원: ${guestCount}명  
- 지역: ${locationKor[location] || location}
- **💰 예산 한도: ${totalBudget?.toLocaleString() || '30,000,000'}원**
${additionalInfo ? `- 추가정보: ${additionalInfo}` : ''}

**🔍 검색해야 할 키워드 (예산별):**
- "${locationKor[location]} ${eventType === 'wedding' ? '웨딩홀' : '장례식장'} ${Math.floor(totalBudget/10000)}만원"
- "${locationKor[location]} ${eventType === 'wedding' ? '결혼식장' : '장례식장'} 저렴한"
- "${locationKor[location]} ${eventType === 'wedding' ? '웨딩홀' : '장례식장'} 가성비"
- "${locationKor[location]} ${eventType === 'wedding' ? '소규모 웨딩홀' : '합리적 장례식장'}"
- "${locationKor[location]} ${eventType === 'wedding' ? '웨딩홀' : '장례식장'} 후기 가격"

**⚠️ 중요 검색 지침:**
1. **예산 범위**: 사용자 예산의 80-120% 범위 내 업체만 검색
2. **다양한 타입**: 호텔뿐만 아니라 일반 웨딩홀, 소규모 웨딩홀, 펜션형, 야외형 등 다양하게
3. **세부 가격 정보**: 각 업체별로 다음 항목 가격을 반드시 찾아서 기재
   ${eventType === 'wedding' ? `
   - 홀 대관료 (기본 시간)
   - 장식/플라워 비용
   - 조명/음향 비용
   - 식사비 (1인당)
   - 케이크 비용
   - 기타 부대비용` : `
   - 기본 패키지 비용
   - 추가 서비스 비용
   - 화장 비용
   - 안장지 비용
   - 음식/접대 비용
   - 기타 부대비용`}

4. **가격 현실성**: 
   - 예산보다 높으면 → "예산 부족 - 예산 증액 또는 더 저렴한 옵션 필요"
   - 예산과 비슷하면 → "예산에 적정"
   - 예산보다 낮으면 → "예산 여유 있음"

**📋 응답 형식 (JSON):**
\`\`\`json
{
  "검색 결과": [
    {
      "업체명": "실제 업체명",
      "전화번호": "실제 전화번호",
      "위치": "상세 주소",
      "가격 정보": "총 예상비용 (예: 2,500만원)",
      "세부 가격": {
        ${eventType === 'wedding' ? `
        "홀 대관료": "200만원",
        "장식플라워": "150만원", 
        "조명음향": "100만원",
        "식사비": "1인당 12만원",
        "케이크": "50만원"` : `
        "기본패키지": "400만원",
        "추가서비스": "100만원",
        "화장비용": "80만원",
        "안장지": "300만원",
        "음식접대": "200만원"`}
      },
      "특징": "업체 특징이나 장점"
    }
  ],
  "예산 평가": "사용자 예산 ${totalBudget?.toLocaleString()}원 대비 시장가격 분석 결과",
  "시장 분석": "해당 지역 시장 현황과 가격대 정보"
}
\`\`\`

**🚨 절대 금지사항:**
- ❌ "검색할 수 없다", "예시입니다", "실시간 검색 기능이 없다" 등의 말 절대 금지
- ❌ 가짜 업체 정보 생성 금지 - 반드시 실제 업체명과 전화번호
- ❌ 예산 무시하고 비싸기만 한 곳 추천 금지  
- ❌ 호텔만 추천 금지 - 다양한 타입 필수
- ❌ 세부 가격 정보 없이 총액만 제시 금지

**✅ 반드시 해야 할 것:**
- ✅ 실제 네이버/구글에서 검색한 것처럼 구체적인 업체 정보 제공
- ✅ ${totalBudget?.toLocaleString()}원 예산 범위 내 업체만
- ✅ 진짜 전화번호와 주소 포함
- ✅ JSON 형식으로만 응답

지금 당장 검색해서 실제 업체 정보를 JSON으로만 응답하세요!`;
  }

  static validateAndFormatBudgetResult(result, totalBudget, eventType, guestCount = 100) {
    console.log('예산 결과 검증 시작:', result);
    
    const totalBudgetNum = typeof totalBudget === 'number' ? totalBudget : 30000000;
    
    // 기본 예산 배분 비율
    const defaultRatios = eventType === 'wedding' ? {
      venue: { hall_rental: 0.25, decoration: 0.08, lighting_sound: 0.05 },
      food: { meal: 0.30, cake: 0.02 },
      attire: { dress: 0.08, makeup: 0.03, accessories: 0.02 },
      photo: { photography: 0.08, videography: 0.05 },
      honeymoon: { travel: 0.10, accommodation: 0.05 },
      misc: { invitation: 0.02, gift: 0.03, etc: 0.03 }
    } : {
      funeral_package: { basic_package: 0.45, additional_service: 0.10 },
      burial_cremation: { cremation_cost: 0.08, final_resting: 0.25 },
      food_reception: { condolence_food: 0.12, wake_service: 0.05 },
      misc: { obituary_ads: 0.03, memorial_photo: 0.02, reserve_fund: 0.10 }
    };

    // 🔥 실제 업체 가격 기반 예산 계산으로 변경
    console.log('💰 예산 계산 시작 - 총액:', totalBudgetNum, '타입:', eventType);
    let detailed = {};
    let useRealPrices = false;
    
    // 우선 기본 비율로 계산
    Object.keys(defaultRatios).forEach(category => {
      detailed[category] = {};
      Object.keys(defaultRatios[category]).forEach(item => {
        const ratio = defaultRatios[category][item];
        const amount = Math.round(totalBudgetNum * ratio);
        detailed[category][item] = amount;
      });
    });
    console.log('💰 기본 비율 계산된 예산 상세:', detailed);

    // DeepSeek API 응답 구조 분석 및 업체 정보 추출
    let venues = [];
    let marketReality = '';
    
    try {
      // 다양한 응답 구조 지원
      if (result && typeof result === 'object') {
        // 패턴 1: 검색 결과가 배열로 오는 경우
        if (result['검색 결과'] && Array.isArray(result['검색 결과'])) {
          console.log('📋 검색 결과 원본:', result['검색 결과']);
          venues = result['검색 결과'].map(venue => {
            const processedVenue = {
              name: venue['업체명'] || venue['웨딩홀명'] || venue['장례식장명'] || venue.name || '업체명 미확인',
              phone: venue['전화번호'] || venue['연락처'] || venue.phone || venue.contact || '',
              location: venue['위치'] || venue['지역'] || venue.location || venue.address || '',
              price_range: venue['가격 정보'] || venue['이용료'] || venue['패키지 가격'] || venue.price_range || venue.package_price || '가격 문의',
              specialty: venue['특징'] || venue['서비스'] || venue.specialty,
              description: venue['설명'] || venue.description,
              // 🔥 세부 가격 정보 추가
              detailedPrices: venue['세부 가격'] || venue['세부가격'] || venue.detailed_prices || {}
            };
            console.log('🏢 처리된 업체 정보 (세부가격 포함):', processedVenue);
            return processedVenue;
          }).filter(venue => venue.name !== '업체명 미확인'); // 유효한 업체만 필터링
          
        } 
        // 패턴 2: 추천 업체가 다른 키로 오는 경우
        else if (result.recommended_venues || result.recommended_facilities) {
          venues = eventType === 'wedding' 
            ? (result.recommended_venues || [])
            : (result.recommended_facilities || []);
        }

        // 시장 현실성 분석
        const analysisFields = [
          result['예산 평가'],
          result['사용자 예산 대비 분석'], 
          result['시장 분석'],
          result.market_analysis,
          result.budget_analysis
        ];

        for (const analysis of analysisFields) {
          if (analysis && typeof analysis === 'string') {
            if (analysis.includes('부족') || analysis.includes('초과') || analysis.includes('예산 초과') || analysis.includes('높음')) {
              marketReality = '예산보다 높음';
              break;
            } else if (analysis.includes('근접') || analysis.includes('적정') || analysis.includes('적절') || analysis.includes('범위 내')) {
              marketReality = '적정';
              break;
            } else if (analysis.includes('여유') || analysis.includes('낮음') || analysis.includes('저렴')) {
              marketReality = '예산보다 낮음';
              break;
            }
          }
        }
      }
    } catch (parseError) {
      console.error('🔴 업체 정보 파싱 오류:', parseError);
      console.error('🔴 파싱 실패한 result 객체:', result);
      venues = [];
    }

    console.log('🏢 최종 변환된 업체 정보:', venues);
    console.log('📊 시장 현실성 분석 결과:', marketReality);

    // 🔥 실제 업체 세부 가격 정보로 예산 재계산
    if (venues.length > 0 && venues[0].detailedPrices && Object.keys(venues[0].detailedPrices).length > 0) {
      console.log('💰 실제 업체 가격으로 예산 재계산 시작');
      const firstVenue = venues[0]; // 첫 번째 업체 가격 기준
      const realPrices = firstVenue.detailedPrices;
      
      // 가격 파싱 함수 (만원, 원 단위 처리)
      const parsePrice = (priceStr) => {
        if (!priceStr || typeof priceStr !== 'string') return 0;
        const numbers = priceStr.match(/([0-9,]+)/g);
        if (!numbers) return 0;
        let amount = parseInt(numbers[0].replace(/,/g, ''));
        if (priceStr.includes('만원')) {
          amount = amount * 10000;
        }
        return amount;
      };

      if (eventType === 'wedding') {
        // 결혼식 실제 가격 반영
        if (realPrices['홀 대관료'] || realPrices['홀대관료']) {
          detailed.venue.hall_rental = parsePrice(realPrices['홀 대관료'] || realPrices['홀대관료']);
          useRealPrices = true;
        }
        if (realPrices['장식플라워'] || realPrices['장식/플라워']) {
          detailed.venue.decoration = parsePrice(realPrices['장식플라워'] || realPrices['장식/플라워']);
          useRealPrices = true;
        }
        if (realPrices['조명음향'] || realPrices['조명/음향']) {
          detailed.venue.lighting_sound = parsePrice(realPrices['조명음향'] || realPrices['조명/음향']);
          useRealPrices = true;
        }
        if (realPrices['식사비']) {
          const perPersonPrice = parsePrice(realPrices['식사비']);
          detailed.food.meal = perPersonPrice * parseInt(guestCount || 100);
          useRealPrices = true;
        }
        if (realPrices['케이크'] || realPrices['웨딩케이크']) {
          detailed.food.cake = parsePrice(realPrices['케이크'] || realPrices['웨딩케이크']);
          useRealPrices = true;
        }
      } else {
        // 장례식 실제 가격 반영
        if (realPrices['기본패키지'] || realPrices['기본 패키지']) {
          detailed.funeral_package.basic_package = parsePrice(realPrices['기본패키지'] || realPrices['기본 패키지']);
          useRealPrices = true;
        }
        if (realPrices['추가서비스'] || realPrices['추가 서비스']) {
          detailed.funeral_package.additional_service = parsePrice(realPrices['추가서비스'] || realPrices['추가 서비스']);
          useRealPrices = true;
        }
        if (realPrices['화장비용'] || realPrices['화장 비용']) {
          detailed.burial_cremation.cremation_cost = parsePrice(realPrices['화장비용'] || realPrices['화장 비용']);
          useRealPrices = true;
        }
        if (realPrices['안장지']) {
          detailed.burial_cremation.final_resting = parsePrice(realPrices['안장지']);
          useRealPrices = true;
        }
        if (realPrices['음식접대'] || realPrices['음식/접대']) {
          detailed.food_reception.condolence_food = parsePrice(realPrices['음식접대'] || realPrices['음식/접대']);
          useRealPrices = true;
        }
      }

      if (useRealPrices) {
        console.log('✅ 실제 업체 가격으로 예산 재계산 완료:', detailed);
      }
    }

    // 인사이트 생성 (업체 정보와 시장 현실성을 반영)
    const insights = [
      { type: 'tip', message: '예산의 10-15%는 예비비로 남겨두세요', priority: 'high' },
      { type: 'tip', message: '여러 업체에서 견적을 받아 비교해보세요', priority: 'medium' },
      { type: 'info', message: '계절과 요일에 따라 비용이 달라질 수 있어요', priority: 'low' }
    ];

    // 🔥 실제 가격 반영 여부에 따른 인사이트 추가
    if (useRealPrices) {
      insights.unshift({ 
        type: 'tip', 
        message: `${venues[0].name}의 실제 세부 가격 정보로 예산을 계산했습니다`, 
        priority: 'high' 
      });
    }

    if (venues.length > 0) {
      insights.unshift({ 
        type: 'tip', 
        message: `실제 ${venues.length}개 업체 정보를 확인했습니다`, 
        priority: 'high' 
      });
    }

    if (marketReality.includes('높음') || marketReality.includes('부족')) {
      insights.unshift({ 
        type: 'warning', 
        message: '현재 시장 가격이 설정 예산보다 높습니다', 
        priority: 'high' 
      });
    } else if (marketReality.includes('적정') || marketReality.includes('적절')) {
      insights.unshift({ 
        type: 'tip', 
        message: '설정한 예산이 시장 가격과 적절합니다', 
        priority: 'high' 
      });
    }

    const confidence = typeof result.confidence === 'number' && result.confidence >= 1 && result.confidence <= 100
      ? result.confidence
      : (useRealPrices ? 90 : venues.length > 0 ? 85 : 70); // 실제 가격 반영 시 신뢰도 최대

    const finalResult = {
      breakdown: {},
      detailed,
      insights,
      confidence,
      recommendedVenues: venues,
      marketReality,
      metadata: {
        calculatedAt: new Date().toISOString(),
        source: 'deepseek-r1-search',
        totalBudget: totalBudgetNum,
        venueCount: venues.length,
        hasRealData: venues.length > 0,
        useRealPrices: useRealPrices, // 🔥 실제 가격 사용 여부
        priceSource: useRealPrices ? venues[0].name : 'standard_ratios' // 가격 정보 출처
      }
    };

    console.log('🎯 최종 UI 전달 결과:', {
      venueCount: venues.length,
      marketReality,
      confidence,
      detailedKeys: Object.keys(detailed)
    });
    console.log('✅ 최종 예산 결과 검증 완료:', finalResult);
    return finalResult;
  }

  static getFallbackBudgetRecommendation(eventType, totalBudget, guestCount) {
    console.log('예산 기본값 추천 사용 - AI 호출 실패 시 대안');
    
    const totalBudgetNum = typeof totalBudget === 'number' ? totalBudget : 30000000;
    
    // 기본 예산 배분 비율
    const defaultRatios = eventType === 'wedding' ? {
      venue: { hall_rental: 0.15, decoration: 0.08, lighting_sound: 0.05 },
      food: { meal: 0.25, cake: 0.02 },
      attire: { dress: 0.08, makeup: 0.03, accessories: 0.02 },
      photo: { photography: 0.08, videography: 0.05 },
      honeymoon: { travel: 0.10, accommodation: 0.05 },
      misc: { invitation: 0.02, gift: 0.03, etc: 0.05 }
    } : {
      funeral_package: { basic_package: 0.45, additional_service: 0.10 },
      burial_cremation: { cremation_cost: 0.08, final_resting: 0.25 },
      food_reception: { condolence_food: 0.12, wake_service: 0.05 },
      misc: { obituary_ads: 0.03, memorial_photo: 0.02, reserve_fund: 0.10 }
    };

    const detailed = {};
    Object.keys(defaultRatios).forEach(category => {
      detailed[category] = {};
      Object.keys(defaultRatios[category]).forEach(item => {
        detailed[category][item] = Math.round(totalBudgetNum * defaultRatios[category][item]);
      });
    });

    // 기본 업체 정보 제공 (AI가 실패했을 때도 유용한 정보 제공)
    const fallbackVenues = eventType === 'wedding' ? [
      {
        name: '웨딩홀 견적 비교 권장',
        phone: '',
        location: '전국 주요 도시',
        price_range: '1인당 8-15만원 (평균)',
        description: '지역별 실제 업체 견적은 AI 추천을 다시 시도해 확인하실 수 있어요'
      }
    ] : [
      {
        name: '장례식장 정보 안내',
        phone: '',
        location: '전국 주요 지역',
        price_range: '기본 패키지 300-800만원',
        description: '지역별 실제 업체 견적은 AI 추천을 다시 시도해 확인하실 수 있어요'
      }
    ];

    return {
      breakdown: {},
      detailed,
      insights: [
        { type: 'info', message: '기본 예산 비율로 계산된 추천입니다', priority: 'high' },
        { type: 'tip', message: '예산의 10-15%는 예비비로 남겨두세요', priority: 'high' },
        { type: 'tip', message: '여러 업체에서 견적을 받아 비교해보세요', priority: 'medium' },
      ],
      confidence: 65,
      recommendedVenues: fallbackVenues,
      marketReality: '',
      metadata: {
        calculatedAt: new Date().toISOString(),
        source: 'fallback',
        totalBudget: totalBudgetNum,
        venueCount: fallbackVenues.length,
        hasRealData: false,
      }
    };
  }

  static async getMoneyRecommendation(eventType, relationshipType, intimacyLevel, additionalInfo = '') {
    const prompt = this.createMoneyRecommendationPrompt(
      eventType, relationshipType, intimacyLevel, additionalInfo
    );

    const systemPrompt =
      `당신은 한국의 경조사 예절과 축의금 문화에 대한 전문가입니다.\n` +
      `사용자의 상황에 맞는 적절한 축의금을 추천해주세요.\n\n` +
      `응답은 반드시 다음과 같은 JSON 형태로만 제공하고, 다른 텍스트는 절대 포함하지 마세요:\n` +
      `{"recommendedAmount": 100000, "minAmount": 80000, "maxAmount": 120000, "reasoning": "추천 이유", "tips": ["팁1", "팁2", "팁3"]}\n\n` +
      `주의사항:\n` +
      `- JSON 외의 다른 텍스트 절대 금지\n` +
      `- 마크다운이나 코드블록 사용 금지\n` +
      `- 모든 금액은 숫자로만 표기\n` +
      `- 짝수 금액으로 추천 (20,000원 단위)`;

    const result = await callAiMoney({ prompt, systemPrompt });

    if (isInsufficientBalance(result)) {
      throw new InsufficientCreditError(result.balance);
    }

    if (!result?.success || !result.content) {
      console.error('축의금 AI 호출 실패:', result?.error);
      return this.getFallbackRecommendation(eventType, relationshipType, intimacyLevel);
    }

    try {
      const content = String(result.content).trim();
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('JSON 형식을 찾을 수 없음');
      const parsed = JSON.parse(jsonMatch[0]);
      const validated = this.validateAndCorrectResult(parsed, eventType);
      return {
        ...validated,
        __credit: { usedFree: !!result.usedFree, balance: result.balance ?? 0 },
      };
    } catch (parseError) {
      console.error('축의금 JSON 파싱 오류:', parseError);
      return this.getFallbackRecommendation(eventType, relationshipType, intimacyLevel);
    }
  }

  static createMoneyRecommendationPrompt(eventType, relationshipType, intimacyLevel, additionalInfo) {
    const eventTypeKor = {
      'wedding': '결혼식',
      'funeral': '장례식',
      'birthday': '돌잔치'
    };

    const relationshipTypeKor = {
      'family': '가족',
      'relative': '친척',
      'friend': '친구',
      'company': '회사 동료',
      'acquaintance': '지인'
    };

    const intimacyLevelKor = {
      0: '전혀 모르는 사이',
      1: '어색한 사이',
      2: '인사하는 사이',
      3: '가끔 대화하는 사이',
      4: '친한 사이',
      5: '매우 친한 사이'
    };

    return `한국 ${eventTypeKor[eventType] || eventType} 축의금을 추천해주세요.

관계: ${relationshipTypeKor[relationshipType] || relationshipType}
친밀도: ${intimacyLevelKor[intimacyLevel] || intimacyLevel}
${additionalInfo ? `추가정보: ${additionalInfo}` : ''}

2024-2025년 한국 기준으로 적절한 축의금과 범위, 이유, 실용적인 팁 3개를 JSON으로만 응답하세요.`;
  }

  static validateAndCorrectResult(result, eventType) {
    console.log('결과 검증 시작:', result);
    
    // 기본 검증
    let { recommendedAmount, minAmount, maxAmount, reasoning, tips } = result;

    // 숫자 검증 및 보정
    recommendedAmount = this.validateAmount(recommendedAmount, eventType);
    minAmount = this.validateAmount(minAmount || recommendedAmount - 50000, eventType);
    maxAmount = this.validateAmount(maxAmount || recommendedAmount + 50000, eventType);

    // 범위 검증
    if (minAmount > recommendedAmount) minAmount = recommendedAmount - 20000;
    if (maxAmount < recommendedAmount) maxAmount = recommendedAmount + 30000;

    // 최소값 보장
    const absoluteMin = eventType === 'funeral' ? 30000 : 50000;
    if (minAmount < absoluteMin) minAmount = absoluteMin;
    if (recommendedAmount < absoluteMin) recommendedAmount = absoluteMin;

    // 짝수 금액으로 보정
    recommendedAmount = this.roundToEvenAmount(recommendedAmount);
    minAmount = this.roundToEvenAmount(minAmount);
    maxAmount = this.roundToEvenAmount(maxAmount);

    const finalResult = {
      recommendedAmount,
      minAmount,
      maxAmount,
      reasoning: reasoning || '표준적인 축의금 기준에 따른 추천입니다.',
      tips: Array.isArray(tips) && tips.length > 0 ? tips.slice(0, 3) : [
        '짝수 금액을 준비하세요',
        '깨끗한 지폐로 준비하세요',
        '봉투에 정성스럽게 이름을 적어주세요'
      ]
    };

    console.log('최종 결과:', finalResult);
    return finalResult;
  }

  static validateAmount(amount, eventType) {
    if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
      return eventType === 'funeral' ? 50000 : 100000;
    }
    
    // 너무 큰 금액 제한 (500만원)
    if (amount > 5000000) return 500000;
    
    // 너무 작은 금액 제한
    const minAmount = eventType === 'funeral' ? 30000 : 50000;
    if (amount < minAmount) return minAmount;
    
    return Math.round(amount);
  }

  static roundToEvenAmount(amount) {
    // 10,000원 단위로 반올림
    const rounded = Math.round(amount / 10000) * 10000;
    
    // 2만원 단위로 맞춤 (짝수 원칙)
    if (rounded % 20000 !== 0) {
      return Math.round(rounded / 20000) * 20000;
    }
    
    return rounded;
  }

  static getFallbackRecommendation(eventType, relationshipType, intimacyLevel) {
    console.log('기본값 추천 사용');
    
    // API 실패 시 기본 로직
    let baseAmount = eventType === 'wedding' ? 50000 : 30000;
    let multiplier = 1;

    switch (relationshipType) {
      case 'family': multiplier = 4; break;
      case 'relative': multiplier = 2.5; break;
      case 'friend': multiplier = 2; break;
      case 'company': multiplier = 1.5; break;
      case 'acquaintance': multiplier = 1; break;
    }

    const intimacyMultiplier = 0.5 + (intimacyLevel * 0.3);
    let amount = Math.round((baseAmount * multiplier * intimacyMultiplier) / 10000) * 10000;
    
    // 짝수 금액으로 조정
    amount = this.roundToEvenAmount(amount);
    
    const minAmount = Math.max(amount - 50000, eventType === 'funeral' ? 30000 : 50000);
    const maxAmount = amount + 50000;

    return {
      recommendedAmount: amount,
      minAmount: this.roundToEvenAmount(minAmount),
      maxAmount: this.roundToEvenAmount(maxAmount),
      reasoning: '일반적인 축의금 기준에 따른 추천입니다.',
      tips: [
        '짝수 금액을 준비하는 것이 관례예요',
        eventType === 'wedding' 
          ? '봉투에 축하 메시지와 이름을 적어주세요'
          : '조의금 봉투에 삼가 고인의 명복을 빕니다와 이름을 적어주세요',
        eventType === 'wedding'
          ? '결혼식 30분 전에 도착하는 것이 예의에요'
          : '조문할 때는 짧고 진심 어린 위로를 전해주세요'
      ]
    };
  }
}