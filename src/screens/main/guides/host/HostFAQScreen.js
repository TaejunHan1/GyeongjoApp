// src/screens/main/guides/host/HostFAQScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '../../../../styles/constants';

const { width } = Dimensions.get('window');

export default function HostFAQScreen({ navigation }) {
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [displayedFAQ, setDisplayedFAQ] = useState([]);

  // Fisher-Yates 셔플 알고리즘으로 완전 랜덤 선택
  const getRandomFAQ = (data, count = 15) => {
    const shuffled = [...data];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, count);
  };

  // 화면에 포커스될 때마다 랜덤 FAQ 생성
  useFocusEffect(
    React.useCallback(() => {
      const randomFAQ = getRandomFAQ(allFaqData);
      console.log('🎲 주최자 FAQ 랜덤 생성!', randomFAQ.slice(0, 3).map(q => q.question));
      setDisplayedFAQ(randomFAQ);
      setExpandedItems(new Set()); // 펼쳐진 항목도 초기화
    }, [])
  );

  // 카테고리 데이터
  const categories = [
    { id: 'all', title: '전체', icon: 'grid' },
    { id: 'wedding', title: '결혼식', icon: 'heart' },
    { id: 'funeral', title: '장례식', icon: 'flower' },
    { id: 'budget', title: '예산', icon: 'calculator' },
    { id: 'preparation', title: '준비사항', icon: 'checkmark-circle' },
  ];

  // FAQ 데이터 (주최자용) - 30개
  const allFaqData = [
    // 결혼식 관련 (15개)
    {
      id: '1',
      category: 'wedding',
      question: '결혼식 준비는 언제부터 시작해야 하나요?',
      answer: '일반적으로 결혼식 6개월 전부터 본격적인 준비를 시작하는 것이 좋습니다.\n\n• 6개월 전: 웨딩홀, 스드메(스튜디오, 드레스, 메이크업) 예약\n• 3개월 전: 한복, 청첩장, 답례품 준비\n• 1개월 전: 최종 인원 확정, 세부 사항 점검\n• 1주일 전: 최종 리허설 및 확인',
      popular: true,
    },
    {
      id: '2',
      category: 'wedding',
      question: '웨딩홀 선택 시 가장 중요한 체크포인트는?',
      answer: '웨딩홀 선택 시 다음 사항들을 꼼꼼히 확인하세요:\n\n• 교통 접근성 (지하철역, 주차 공간)\n• 홀 규모와 하객 수 적합성\n• 음식 품질 및 메뉴 구성\n• 부대시설 (신부 대기실, 촬영 공간)\n• 추가 비용 항목 확인\n• 취소 및 연기 정책',
      popular: true,
    },
    {
      id: '3',
      category: 'wedding',
      question: '스몰웨딩과 일반 웨딩의 차이점은?',
      answer: '스몰웨딩과 일반 웨딩의 주요 차이점:\n\n**스몰웨딩 (30명 이하)**\n• 친밀한 분위기, 개인적인 소통 가능\n• 비용 절약 (평균 1,000-3,000만원)\n• 간소한 절차, 자유로운 진행\n\n**일반 웨딩 (50명 이상)**\n• 격식 있는 예식, 전통적인 진행\n• 더 많은 하객과 함께 축하\n• 상대적으로 높은 비용',
      popular: false,
    },

    // 장례식 관련
    {
      id: '4',
      category: 'funeral',
      question: '장례식 준비 절차를 알려주세요',
      answer: '장례식 준비는 다음 순서로 진행됩니다:\n\n**임종 후 즉시**\n• 사망진단서 발급\n• 장례식장 예약 및 빈소 설치\n• 가족, 친지에게 부고 연락\n\n**1일차**\n• 수의 준비, 염습\n• 상주 복장 준비\n• 부고장 제작 및 발송\n\n**2일차**\n• 조문객 접대\n• 발인 준비\n\n**3일차**\n• 발인식, 운구, 하관',
      popular: true,
    },
    {
      id: '5',
      category: 'funeral',
      question: '장례식장 선택 기준은 무엇인가요?',
      answer: '장례식장 선택 시 고려사항:\n\n• **위치**: 조문객들의 접근 편의성\n• **시설**: 빈소 크기, 주차 공간, 편의시설\n• **서비스**: 장례용품 제공, 직원 전문성\n• **비용**: 기본 패키지 vs 개별 서비스\n• **종교**: 종교별 특별 서비스 제공 여부\n\n대부분의 종합병원에 장례식장이 있어 편리하며, 전문 장례식장은 더 다양한 서비스를 제공합니다.',
      popular: false,
    },

    // 예산 관련
    {
      id: '6',
      category: 'budget',
      question: '결혼식 평균 비용은 얼마정도 인가요?',
      answer: '2024년 기준 결혼식 평균 비용:\n\n**일반 웨딩 (100명 기준)**\n• 웨딩홀: 3,000-8,000만원\n• 스드메: 1,000-2,000만원\n• 한복: 300-800만원\n• 청첩장/답례품: 200-500만원\n• 기타: 500-1,000만원\n\n**총 예상 비용: 5,000-12,000만원**\n\n지역, 평일/주말, 홀 등급에 따라 차이가 큽니다.',
      popular: true,
    },
    {
      id: '7',
      category: 'budget',
      question: '예산을 절약할 수 있는 방법이 있나요?',
      answer: '결혼식 예산 절약 팁:\n\n**시기 선택**\n• 평일 예식 (30-50% 할인)\n• 비수기 (11월-2월) 예약\n\n**스타일 변경**\n• 스몰웨딩 또는 가족형 웨딩\n• 뷔페식 → 코스식 변경\n\n**DIY 활용**\n• 청첩장 직접 제작\n• 답례품 개별 구매\n• 웨딩소품 직접 준비\n\n**패키지 활용**\n• 올인원 패키지 할인 혜택\n• 제휴사 할인 적극 활용',
      popular: false,
    },

    // 준비사항 관련
    {
      id: '8',
      category: 'preparation',
      question: '결혼식 하객 수는 어떻게 정하나요?',
      answer: '하객 수 결정 가이드:\n\n**가족/친지**\n• 양가 부모님과 상의하여 결정\n• 직계가족, 친척 범위 설정\n\n**친구/동료**\n• 평상시 연락하는 가까운 사이\n• 상호 예식 참석 관계 고려\n\n**일반적인 비율**\n• 가족/친지: 40-50%\n• 친구: 30-40%\n• 직장 동료: 10-20%\n\n**최종 확인**\n• 예식 2주 전 최종 인원 확정\n• 10% 여유분 고려하여 준비',
      popular: false,
    },
    {
      id: '9',
      category: 'preparation',
      question: '청첩장은 언제 보내야 하나요?',
      answer: '청첩장 발송 타이밍:\n\n**발송 시기**\n• 예식 4-6주 전 발송\n• 명절이나 휴가철은 더 일찍\n\n**발송 방법별 특징**\n• **모바일 청첩장**: 즉시 발송, 환경친화적\n• **종이 청첩장**: 격식 있음, 기념품 가치\n• **하이브리드**: 모바일 + 특별한 분만 종이\n\n**내용 포함사항**\n• 예식 일시, 장소 정확한 정보\n• 지도 및 교통편 안내\n• 주차 정보\n• 식사 여부 안내',
      popular: true,
    },
    {
      id: '10',
      category: 'wedding',
      question: '웨딩드레스는 언제 정해야 하나요?',
      answer: '웨딩드레스 준비 스케줄:\n\n**시기별 준비**\n• 4-6개월 전: 스튜디오 예약, 드레스 시착\n• 3개월 전: 최종 드레스 결정\n• 1개월 전: 최종 피팅\n• 1주일 전: 마지막 확인\n\n**고려사항**\n• 계절과 웨딩홀 분위기에 맞는 스타일\n• 체형에 맞는 실루엣\n• 편안함과 움직임의 용이성\n• 사진 촬영 시 효과',
      popular: false,
    },
    {
      id: '11',
      category: 'wedding',
      question: '웨딩 케이크는 어떻게 준비하나요?',
      answer: '웨딩 케이크 준비 가이드:\n\n**종류**\n• 실제 케이크: 모든 층이 진짜 케이크\n• 더미 케이크: 장식용 + 일부만 실제 케이크\n• 컵케이크: 개별 포장으로 편리함\n\n**주문 시기**\n• 1-2개월 전 주문\n• 맛보기 예약 필수\n\n**디자인 고려사항**\n• 웨딩 테마와 조화\n• 하객 수에 맞는 크기\n• 계절 과일 활용',
      popular: false,
    },
    {
      id: '12',
      category: 'wedding',
      question: '리허설은 언제 어떻게 하나요?',
      answer: '결혼식 리허설 가이드:\n\n**리허설 시기**\n• 예식 1주일 전 또는 전날\n• 실제 예식 시간대와 비슷하게\n\n**참석 인원**\n• 신랑신부, 양가 부모님\n• 주례, 사회자, 성가대\n• 하객 대표 몇 명\n\n**리허설 내용**\n• 입장 순서와 동선 연습\n• 음향, 조명 체크\n• 예식 진행 순서 확인\n• 응급상황 대처 방안',
      popular: false,
    },
    {
      id: '13',
      category: 'wedding',
      question: '혼수는 어떻게 준비해야 하나요?',
      answer: '혼수 준비 가이드:\n\n**필수 혼수 품목**\n• 침구류: 이불, 베개, 시트\n• 주방용품: 냄비, 그릇, 수저\n• 생활용품: 수건, 세제 등\n• 가전제품: 냉장고, 세탁기 등\n\n**준비 시기**\n• 3-4개월 전부터 차근차근\n• 신혼집 구조 확정 후\n\n**현대적 접근**\n• 필요한 것만 실용적으로\n• 신랑신부가 함께 선택\n• 온라인 혼수 리스트 활용',
      popular: false,
    },
    {
      id: '14',
      category: 'wedding',
      question: '웨딩 플래너가 필요한가요?',
      answer: '웨딩 플래너 필요성:\n\n**플래너가 필요한 경우**\n• 처음 결혼 준비하는 경우\n• 시간이 부족한 직장인\n• 특별한 테마 웨딩 원하는 경우\n• 예산 관리가 어려운 경우\n\n**플래너 없이 준비하는 경우**\n• 예산이 제한적인 경우\n• 직접 준비하는 즐거움을 원하는 경우\n• 간단한 스몰웨딩\n\n**선택 기준**\n• 경험과 포트폴리오\n• 예산과 서비스 범위\n• 소통 방식과 성향',
      popular: false,
    },
    {
      id: '15',
      category: 'wedding',
      question: '예식 당일 준비사항은?',
      answer: '예식 당일 체크리스트:\n\n**신부 준비**\n• 4-5시간 전: 헤어, 메이크업 시작\n• 2시간 전: 드레스 착용\n• 1시간 전: 최종 터치업\n\n**신랑 준비**\n• 2시간 전: 정장 착용\n• 1시간 전: 헤어 정리\n\n**공통 준비사항**\n• 결혼반지 확인\n• 부케, 부토니어 준비\n• 응급 키트 준비\n• 연락처 정리\n• 답례품 준비 완료',
      popular: false,
    },

    // 장례식 관련 (8개)
    {
      id: '16',
      category: 'funeral',
      question: '상가에서 해야 할 첫 번째 일은?',
      answer: '임종 직후 해야 할 일들:\n\n**즉시 해야 할 일**\n• 의사에게 사망진단서 발급 요청\n• 가까운 가족, 친지에게 연락\n• 장례식장 선택 및 빈소 예약\n\n**준비해야 할 서류**\n• 사망진단서\n• 가족관계증명서\n• 주민등록등본\n• 신분증\n\n**주의사항**\n• 차분하게 상황을 정리\n• 장례식장 직원과 상담\n• 종교에 따른 절차 확인',
      popular: true,
    },
    {
      id: '17',
      category: 'funeral',
      question: '빈소 차리는 방법을 알려주세요',
      answer: '빈소 차리기 가이드:\n\n**기본 구성**\n• 영정 사진 (최근 5년 이내)\n• 위패 또는 명패\n• 제단 꽃 장식\n• 향로, 촛대\n• 상차림 (과일, 떡 등)\n\n**배치 순서**\n• 가운데: 영정 사진\n• 앞쪽: 제단과 상차림\n• 양옆: 조화, 화환\n• 뒤쪽: 조문객 접견 공간\n\n**종교별 차이**\n• 불교: 불상, 경문\n• 기독교: 십자가, 찬송가\n• 무종교: 간소하게',
      popular: false,
    },
    {
      id: '18',
      category: 'funeral',
      question: '부고는 언제 어떻게 알려야 하나요?',
      answer: '부고 알리기 가이드:\n\n**알리는 시기**\n• 임종 후 가능한 빨리\n• 늦어도 당일 중\n\n**알릴 대상 순서**\n1. 직계 가족\n2. 친척\n3. 고인의 친구, 동료\n4. 가족의 지인\n\n**알리는 방법**\n• 전화: 가까운 가족, 친척\n• 문자메시지: 직장 동료, 지인\n• 부고장: 공식적인 알림\n• SNS: 넓은 범위 알림\n\n**부고 내용**\n• 고인 성명, 나이\n• 별세 일시, 장소\n• 발인 일시, 장소\n• 상주 연락처',
      popular: false,
    },
    {
      id: '19',
      category: 'funeral',
      question: '장례 기간은 며칠이 적당한가요?',
      answer: '장례 기간 결정 가이드:\n\n**일반적인 기간**\n• 3일장: 가장 일반적\n• 5일장: 조금 더 여유 있게\n• 당일장: 간소하게 (화장 시)\n\n**기간 결정 요소**\n• 고인의 사회적 지위\n• 조문객 예상 규모\n• 가족 상황과 경제적 여건\n• 종교적 관습\n\n**각 일정별 특징**\n• 1일차: 입관, 첫날밤\n• 2일차: 조문 접수\n• 3일차: 발인, 화장/매장\n\n**현대적 변화**\n• 간소화 추세\n• 직장 여건 고려\n• 코로나 이후 축소 경향',
      popular: false,
    },
    {
      id: '20',
      category: 'funeral',
      question: '상복은 누가 언제까지 입어야 하나요?',
      answer: '상복 착용 가이드:\n\n**착용 대상**\n• 직계 가족: 배우자, 자녀\n• 직계 손자녀\n• 며느리, 사위\n\n**착용 기간**\n• 장례 기간 중 계속\n• 탈상 전까지 (보통 49재까지)\n• 현대적으로는 장례 기간만\n\n**상복 종류**\n• 남성: 검은 정장, 검은 넥타이\n• 여성: 검은 한복 또는 양복\n• 어린이: 검은색 또는 흰색 옷\n\n**현대적 변화**\n• 꼭 한복이 아니어도 됨\n• 검은색 정장으로 대체 가능\n• 실용성과 편의성 고려',
      popular: false,
    },
    {
      id: '21',
      category: 'funeral',
      question: '화장과 매장 중 어떤 것을 선택해야 하나요?',
      answer: '화장 vs 매장 선택 가이드:\n\n**화장의 장점**\n• 경제적 부담 적음\n• 관리 편리함\n• 위생적\n• 납골당, 자연장 선택 가능\n\n**매장의 장점**\n• 전통적 방식\n• 성묘 문화 유지\n• 가족 묘역 조성 가능\n\n**결정 요소**\n• 고인의 종교, 의향\n• 경제적 여건\n• 가족 전통\n• 향후 관리 편의성\n\n**현재 추세**\n• 화장률 80% 이상\n• 자연장 선호 증가\n• 수목장, 해양장 등 다양화',
      popular: false,
    },
    {
      id: '22',
      category: 'funeral',
      question: '장례 비용은 대략 얼마나 드나요?',
      answer: '장례 비용 가이드:\n\n**병원 장례식장 (3일장 기준)**\n• 기본 패키지: 300-500만원\n• 추가 비용: 100-300만원\n• 총 비용: 400-800만원\n\n**전문 장례식장**\n• 기본 패키지: 500-800만원\n• 추가 비용: 200-500만원\n• 총 비용: 700-1300만원\n\n**비용 절약 방법**\n• 꼭 필요한 서비스만 선택\n• 여러 업체 견적 비교\n• 간소한 조화, 화환\n• 검은 리본으로 대체\n\n**추가 고려사항**\n• 화장/매장 비용 별도\n• 음식 접대비\n• 교통비, 숙박비',
      popular: true,
    },
    {
      id: '23',
      category: 'funeral',
      question: '종교별 장례 절차 차이점은?',
      answer: '종교별 장례 절차:\n\n**불교식**\n• 염불, 독경\n• 49재까지 추도\n• 화장 선호\n• 승려 집전\n\n**기독교식**\n• 찬송, 기도\n• 예배식으로 진행\n• 화장/매장 모두 가능\n• 목사 집전\n\n**천주교식**\n• 연옥영혼 위한 기도\n• 미사로 진행\n• 연도 행사\n• 신부 집전\n\n**무종교식**\n• 경건한 추도식\n• 고인 생전 업적 회고\n• 자유로운 형식\n• 가족 또는 지인 진행\n\n**공통사항**\n• 모든 종교 상호 존중\n• 조문객 종교 무관하게 접대',
      popular: false,
    },

    // 예산 관련 (4개)
    {
      id: '24',
      category: 'budget',
      question: '예산이 부족할 때 우선순위는?',
      answer: '예산 부족 시 우선순위:\n\n**결혼식 필수 항목**\n1. 웨딩홀 (장소 확보)\n2. 음식 (하객 접대)\n3. 사진 (평생 기념)\n4. 드레스/정장 (주인공 복장)\n\n**절약 가능 항목**\n• 화려한 장식 → 간단한 꽃 장식\n• 고급 답례품 → 실용적 답례품\n• 많은 화환 → 꼭 필요한 것만\n• 큰 케이크 → 작은 케이크\n\n**절약 팁**\n• 평일 예식으로 20-30% 절약\n• 패키지보다 개별 선택\n• DIY 소품 제작\n• 지인 재능 활용',
      popular: true,
    },
    {
      id: '25',
      category: 'budget',
      question: '웨딩 대출 받을 때 주의사항은?',
      answer: '웨딩 대출 가이드:\n\n**대출 종류**\n• 신용대출: 무담보, 신속\n• 적금 담보대출: 낮은 금리\n• 혼수 대출: 가구, 가전 구입\n• 전세자금 대출: 신혼집 마련\n\n**신청 전 체크사항**\n• 소득 대비 상환 능력\n• 금리와 상환 조건\n• 중도상환 수수료\n• 신용등급 영향\n\n**주의사항**\n• 과도한 대출 피하기\n• 여러 곳 동시 신청 금지\n• 상환 계획 미리 세우기\n• 부모님과 충분한 상의\n\n**대안**\n• 계모임 활용\n• 적금 미리 준비\n• 필수 항목만 선택',
      popular: false,
    },
    {
      id: '26',
      category: 'budget',
      question: '축의금 관리는 어떻게 해야 하나요?',
      answer: '축의금 관리 가이드:\n\n**받을 때**\n• 축의금 대장 작성\n• 금액과 이름 정확히 기록\n• 봉투는 따로 보관\n• 매일 정산하기\n\n**관리 방법**\n• 전용 통장 개설\n• 당일 입금하기\n• 엑셀로 정리\n• 영수증 보관\n\n**답례 계획**\n• 받은 축의금 금액 기억\n• 상대방 경조사 시 비슷한 금액\n• 관계에 따른 차등 적용\n\n**세금 관리**\n• 일정 금액 이상 시 증여세\n• 가족 간 증여는 공제 한도\n• 필요시 세무사 상담',
      popular: false,
    },
    {
      id: '27',
      category: 'budget',
      question: '신혼여행 예산은 얼마나 잡아야 하나요?',
      answer: '신혼여행 예산 가이드:\n\n**국내 여행**\n• 3박 4일: 100-200만원\n• 5박 6일: 150-300만원\n• 제주도, 부산, 강원도 인기\n\n**해외 여행**\n• 동남아 (5-7일): 200-400만원\n• 일본 (4-6일): 150-350만원\n• 유럽 (8-10일): 400-800만원\n• 하와이 (6-8일): 300-600만원\n\n**예산 절약 팁**\n• 허니문 패키지 활용\n• 비수기 여행\n• 항공료 미리 예약\n• 숙박 등급 조절\n\n**결혼 후 계획**\n• 결혼식 직후 vs 나중에\n• 신혼집 마련 후 여유 있게\n• 기념일 여행으로 대체',
      popular: false,
    },

    // 준비사항 관련 (3개)
    {
      id: '28',
      category: 'preparation',
      question: '날씨가 안 좋을 때 대비책은?',
      answer: '날씨 대비 가이드:\n\n**비 오는 날**\n• 하객용 우산 준비\n• 실내 촬영 장소 확보\n• 드레스 자락 보호 방법\n• 헤어, 메이크업 보완 용품\n\n**더운 여름**\n• 선풍기, 부채 준비\n• 음료수 추가 준비\n• 그늘막 설치\n• 아이스박스 활용\n\n**추운 겨울**\n• 히터, 온열기 준비\n• 따뜻한 음료 서비스\n• 실내 대기 공간 확보\n• 두꺼운 담요 준비\n\n**미세먼지**\n• 실내 행사로 변경\n• 마스크 착용 고려\n• 공기청정기 가동',
      popular: false,
    },
    {
      id: '29',
      category: 'preparation',
      question: '신혼집 준비는 언제부터 해야 하나요?',
      answer: '신혼집 준비 타이밍:\n\n**전세/매매 (6개월 전부터)**\n• 지역, 평수 결정\n• 중개업소 발품 팔기\n• 대출 상담\n• 계약 체결\n\n**임대 (3개월 전부터)**\n• 입지 조건 정하기\n• 온라인 매물 확인\n• 직접 방문 후 결정\n\n**인테리어 (2개월 전부터)**\n• 필수 수리 사항 점검\n• 도배, 바닥재 교체\n• 주방, 화장실 정리\n• 가구 배치 계획\n\n**입주 준비 (1개월 전)**\n• 생필품 구입\n• 이사 업체 선정\n• 주소 변경 신고\n• 각종 요금 개통',
      popular: false,
    },
    {
      id: '30',
      category: 'preparation',
      question: '응급상황 대처 방법을 알려주세요',
      answer: '예식 당일 응급상황 대처:\n\n**신부 관련**\n• 드레스 손상: 안전핀, 양면테이프\n• 메이크업 번짐: 파우더, 립스틱 보완\n• 구두 불편: 밴드, 여분 구두\n• 부케 문제: 예비 부케 준비\n\n**신랑 관련**\n• 넥타이 문제: 여분 넥타이\n• 정장 얼룩: 얼룩 제거제\n• 구두 문제: 여분 구두\n\n**진행 관련**\n• 음향 시설 고장: 예비 장비\n• 정전: 비상 발전기\n• 음식 문제: 추가 주문\n• 하객 과다: 추가 좌석\n\n**응급 키트**\n• 상비약, 밴드\n• 바늘, 실, 안전핀\n• 얼룩 제거제\n• 휴대용 다리미',
      popular: false,
    },
  ];

  // 카테고리별 필터링 (랜덤 표시된 FAQ에서)
  const filteredFAQ = selectedCategory === 'all' 
    ? displayedFAQ 
    : displayedFAQ.filter(item => item.category === selectedCategory);

  // 아이템 토글
  const toggleItem = (id) => {
    const newExpandedItems = new Set(expandedItems);
    if (expandedItems.has(id)) {
      newExpandedItems.delete(id);
    } else {
      newExpandedItems.add(id);
    }
    setExpandedItems(newExpandedItems);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>주최자 FAQ</Text>
          <Text style={styles.headerSubtitle}>행사 준비 중 자주 묻는 질문들</Text>
        </View>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={() => {
            const newFAQ = getRandomFAQ(allFaqData);
            console.log('🔄 수동 랜덤 생성:', newFAQ.slice(0, 3).map(q => q.question));
            setDisplayedFAQ(newFAQ);
            setExpandedItems(new Set());
          }}
        >
          <Ionicons name="refresh" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* 카테고리 탭 */}
      <View style={styles.categoryContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryTab,
                selectedCategory === category.id && styles.categoryTabActive
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Ionicons 
                name={category.icon} 
                size={20} 
                color={selectedCategory === category.id ? Colors.white : Colors.textSecondary} 
              />
              <Text style={[
                styles.categoryText,
                selectedCategory === category.id && styles.categoryTextActive
              ]}>
                {category.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* FAQ 리스트 */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.faqContainer}>
          {/* 인기 질문 섹션 */}
          {selectedCategory === 'all' && (
            <View style={styles.popularSection}>
              <Text style={styles.sectionTitle}>🔥 인기 질문</Text>
              {displayedFAQ.filter(item => item.popular).map((item) => (
                <TouchableOpacity
                  key={`popular-${item.id}`}
                  style={[styles.faqItem, styles.popularItem]}
                  onPress={() => toggleItem(`popular-${item.id}`)}
                  activeOpacity={0.8}
                >
                  <View style={styles.faqHeader}>
                    <View style={styles.faqIconContainer}>
                      <Ionicons name="flame" size={20} color={Colors.orange} />
                    </View>
                    <Text style={styles.faqQuestion}>{item.question}</Text>
                    <Ionicons 
                      name={expandedItems.has(`popular-${item.id}`) ? "chevron-up" : "chevron-down"} 
                      size={20} 
                      color={Colors.textSecondary} 
                    />
                  </View>
                  {expandedItems.has(`popular-${item.id}`) && (
                    <View style={styles.faqAnswer}>
                      <Text style={styles.faqAnswerText}>{item.answer}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* 전체 질문 섹션 */}
          <View style={styles.allSection}>
            <Text style={styles.sectionTitle}>
              {selectedCategory === 'all' ? '전체 질문' : `${categories.find(c => c.id === selectedCategory)?.title} 질문`}
            </Text>
            {filteredFAQ.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.faqItem}
                onPress={() => toggleItem(item.id)}
                activeOpacity={0.8}
              >
                <View style={styles.faqHeader}>
                  <Text style={styles.faqQuestion}>{item.question}</Text>
                  <Ionicons 
                    name={expandedItems.has(item.id) ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={Colors.textSecondary} 
                  />
                </View>
                {expandedItems.has(item.id) && (
                  <View style={styles.faqAnswer}>
                    <Text style={styles.faqAnswerText}>{item.answer}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 하단 여백 */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },

  // 헤더
  header: {
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: Colors.gray50,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },

  // 카테고리
  categoryContainer: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  categoryScroll: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.gray50,
    gap: 6,
  },
  categoryTabActive: {
    backgroundColor: Colors.primary,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  categoryTextActive: {
    color: Colors.white,
  },

  // 콘텐츠
  content: {
    flex: 1,
  },
  faqContainer: {
    paddingHorizontal: 20,
  },

  // 섹션
  popularSection: {
    marginTop: 24,
    marginBottom: 32,
  },
  allSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 16,
  },

  // FAQ 아이템
  faqItem: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.gray100,
    overflow: 'hidden',
  },
  popularItem: {
    borderColor: Colors.orange + '30',
    backgroundColor: Colors.orange + '05',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  faqIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.orange + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  faqQuestion: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
    backgroundColor: Colors.gray50,
  },
  faqAnswerText: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.textSecondary,
    marginTop: 12,
  },
});