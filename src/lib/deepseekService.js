// src/lib/deepseekService.js
const DEEPSEEK_API_KEY = 'sk-6dc707c794ba4207b8f7cf4be6eef1a7';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

export class DeepSeekService {
  static async getMoneyRecommendation(eventType, relationshipType, intimacyLevel, additionalInfo = '') {
    try {
      const prompt = this.createMoneyRecommendationPrompt(
        eventType, 
        relationshipType, 
        intimacyLevel, 
        additionalInfo
      );

      console.log('DeepSeek API 호출 시작...');

      const response = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: `당신은 한국의 경조사 예절과 축의금 문화에 대한 전문가입니다. 
              사용자의 상황에 맞는 적절한 축의금을 추천해주세요. 
              
              응답은 반드시 다음과 같은 JSON 형태로만 제공하고, 다른 텍스트는 절대 포함하지 마세요:
              {"recommendedAmount": 100000, "minAmount": 80000, "maxAmount": 120000, "reasoning": "추천 이유를 한국어로 설명", "tips": ["팁1", "팁2", "팁3"]}
              
              주의사항:
              - JSON 외의 다른 텍스트 절대 금지
              - 마크다운이나 코드블록 사용 금지
              - 모든 금액은 숫자로만 표기 (쉼표나 원 단위 제외)
              - 짝수 금액으로 추천 (20,000원 단위)`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 500,
          temperature: 0.1,
          stream: false
        })
      });

      console.log('API 응답 상태:', response.status);

      if (!response.ok) {
        console.error(`DeepSeek API Error: ${response.status}`);
        throw new Error(`DeepSeek API Error: ${response.status}`);
      }

      const data = await response.json();
      console.log('API 응답 데이터:', data);

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('잘못된 API 응답 형식');
      }

      const content = data.choices[0].message.content.trim();
      console.log('API 응답 내용:', content);
      
      // JSON 파싱 시도
      try {
        // 응답에서 JSON 부분만 추출
        const jsonMatch = content.match(/\{.*\}/s);
        if (!jsonMatch) {
          throw new Error('JSON 형식을 찾을 수 없음');
        }

        const jsonString = jsonMatch[0];
        console.log('추출된 JSON 문자열:', jsonString);
        
        const result = JSON.parse(jsonString);
        console.log('파싱된 결과:', result);
        
        // 결과 검증 및 보정
        return this.validateAndCorrectResult(result, eventType);
      } catch (parseError) {
        console.error('JSON 파싱 오류:', parseError);
        console.error('원본 응답:', content);
        // 파싱 실패 시 기본값 반환
        return this.getFallbackRecommendation(eventType, relationshipType, intimacyLevel);
      }

    } catch (error) {
      console.error('DeepSeek API 호출 오류:', error);
      // API 호출 실패 시 기본값 반환
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