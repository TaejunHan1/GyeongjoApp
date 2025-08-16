// src/screens/main/guides/participant/ParticipantFAQScreen.js
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

export default function ParticipantFAQScreen({ navigation }) {
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

  // 카테고리 데이터
  const categories = [
    { id: 'all', title: '전체', icon: 'grid' },
    { id: 'money', title: '축의금', icon: 'calculator' },
    { id: 'manner', title: '복장&매너', icon: 'shirt' },
    { id: 'etiquette', title: '예절', icon: 'people' },
    { id: 'etc', title: '기타', icon: 'help-circle' },
  ];

  // FAQ 데이터 (참여자용) - 30개
  const allFaqData = [
    // 축의금 관련
    {
      id: '1',
      category: 'money',
      question: '회사 동료 결혼식 축의금은 얼마가 적당한가요?',
      answer: '회사 동료 축의금 기준:\n\n**일반 동료**\n• 같은 팀: 5-10만원\n• 다른 팀: 3-5만원\n\n**친밀도에 따라**\n• 가까운 동료: 10-20만원\n• 평상시 연락하는 사이: 10만원\n• 업무상 만나는 정도: 5만원\n\n**직급 고려**\n• 후배가 선배에게: 5-10만원\n• 선배가 후배에게: 10-20만원\n\n지역과 회사 문화에 따라 차이가 있으니 동료들과 상의해보세요.',
      popular: true,
    },
    {
      id: '2',
      category: 'money',
      question: '친구 결혼식 축의금은 어느 정도가 좋을까요?',
      answer: '친구 결혼식 축의금 가이드:\n\n**친밀도별 기준**\n• 절친/단짝친구: 20-50만원\n• 가까운 친구: 10-20만원\n• 일반 친구: 5-10만원\n• 지인 수준: 3-5만원\n\n**나이대별 평균**\n• 20대: 5-15만원\n• 30대: 10-30만원\n• 40대 이상: 20-50만원\n\n**상호 예식 참석**\n• 내 결혼식에 와준 친구라면 받은 금액과 비슷하게\n• 처음 가는 경우라면 적정 금액으로',
      popular: true,
    },
    {
      id: '3',
      category: 'money',
      question: '축의금 봉투에 어떻게 써야 하나요?',
      answer: '축의금 봉투 작성법:\n\n**앞면 (세로쓰기)**\n• 위쪽: "축 결혼" 또는 "祝 結婚"\n• 가운데: 신랑신부 이름 "○○○ ○○○ 귀하"\n• 아래쪽: 본인 이름\n\n**뒷면**\n• 왼쪽 하단에 본인 이름과 금액\n• 예: "홍길동 금 십만원"\n\n**주의사항**\n• 검은색 펜 사용 (볼펜 가능)\n• 정자로 또박또박 작성\n• 금액은 한글 또는 한자로',
      popular: false,
    },
    {
      id: '4',
      category: 'money',
      question: '장례식 조의금은 얼마가 적당한가요?',
      answer: '조의금 기준 가이드:\n\n**관계별 금액**\n• 가족/친척: 30-100만원\n• 가까운 친구: 10-30만원\n• 회사 동료: 5-10만원\n• 지인: 3-5만원\n\n**연령대별 평균**\n• 20대: 3-10만원\n• 30대: 5-20만원\n• 40대 이상: 10-50만원\n\n**조의금 봉투**\n• "조의" 또는 "부의" 작성\n• 고인과 유족 이름 확인 후 작성\n• 흰 봉투 사용',
      popular: false,
    },

    // 복장&매너 관련
    {
      id: '5',
      category: 'manner',
      question: '결혼식 하객 복장은 어떻게 해야 하나요?',
      answer: '결혼식 하객 복장 가이드:\n\n**남성 복장**\n• 정장 (네이비, 그레이, 블랙)\n• 화이트 셔츠 + 넥타이\n• 구두 (블랙 또는 브라운)\n\n**여성 복장**\n• 원피스, 정장, 한복\n• 무릎 아래 길이 권장\n• 과도한 노출 피하기\n• 편안한 구두 (하이힐 주의)\n\n**피해야 할 색상**\n• 화이트 (신부 색상)\n• 블랙 (상복 연상)\n• 너무 화려한 색상\n\n**계절별 팁**\n• 봄/가을: 파스텔 톤\n• 여름: 밝은 색상, 통풍 좋은 소재\n• 겨울: 진한 색상, 따뜻한 소재',
      popular: true,
    },
    {
      id: '6',
      category: 'manner',
      question: '장례식장에는 어떤 복장으로 가야 하나요?',
      answer: '장례식장 복장 예절:\n\n**기본 원칙**\n• 검은색 계열 정장\n• 화려한 장신구 피하기\n• 향수 사용 금지\n• 단정하고 정숙한 복장\n\n**남성**\n• 검은색 정장 + 검은색 넥타이\n• 흰색 셔츠\n• 검은색 구두\n\n**여성**\n• 검은색 정장, 원피스, 한복\n• 무릎 아래 길이\n• 검은색 구두\n• 진한 메이크업 피하기\n\n**액세서리**\n• 최소한으로 착용\n• 화려한 색상 피하기',
      popular: false,
    },

    // 예절 관련
    {
      id: '7',
      category: 'etiquette',
      question: '결혼식장에서 지켜야 할 매너는?',
      answer: '결혼식장 매너 가이드:\n\n**입장 시**\n• 예식 시작 10-15분 전 도착\n• 방명록 작성 (정자로)\n• 축의금 전달\n\n**예식 중**\n• 휴대폰 무음 또는 진동\n• 사진 촬영 자제 (전문사진사 방해 금지)\n• 조용히 참석\n\n**축하 인사**\n• "축하합니다" 간단명료하게\n• 긴 대화는 피하기\n• 신랑신부 가족에게도 인사\n\n**식사 시**\n• 적당한 양 취식\n• 음식 남기지 않기\n• 술은 적당히',
      popular: true,
    },
    {
      id: '8',
      category: 'etiquette',
      question: '조문 예절을 알려주세요',
      answer: '조문 예절 가이드:\n\n**조문 인사**\n• "고인의 명복을 빕니다"\n• "조의를 표합니다"\n• "삼가 고인의 명복을 빕니다"\n\n**조문 순서**\n1. 접수처에서 조의금 전달\n2. 방명록 작성\n3. 빈소 입장하여 고인께 인사\n4. 유족에게 조문 인사\n5. 간단한 위로 후 퇴장\n\n**주의사항**\n• 큰 소리로 이야기하지 않기\n• 긴 시간 머물지 않기\n• 고인의 사인 묻지 않기\n• 유족에게 긴 위로보다는 간단한 인사',
      popular: true,
    },

    // 기타
    {
      id: '9',
      category: 'etc',
      question: '결혼식에 아이와 함께 가도 될까요?',
      answer: '결혼식 아이 동반 가이드:\n\n**사전 확인**\n• 신랑신부 또는 가족에게 미리 확인\n• 예식장 아이 동반 정책 확인\n\n**준비사항**\n• 조용한 장난감 준비\n• 기저귀, 젖병 등 필수품\n• 아이 간식 (소음 없는 것)\n\n**예식 중 주의사항**\n• 아이가 울면 즉시 밖으로\n• 뛰어다니지 않도록 주의\n• 다른 하객에게 방해되지 않게\n\n**대안**\n• 베이비시터 이용\n• 가족 중 한 명은 아이와 대기\n• 예식만 참석하고 식사는 제외',
      popular: false,
    },
    {
      id: '10',
      category: 'etc',
      question: '예식장 주차는 어떻게 하나요?',
      answer: '예식장 주차 가이드:\n\n**주차 확인사항**\n• 예식장 주차 공간 유무\n• 주차비 부담 여부\n• 발렛파킹 서비스 여부\n\n**주차 팁**\n• 예식 1시간 전 미리 도착\n• 근처 유료 주차장 미리 확인\n• 가능하면 대중교통 이용\n\n**주차 어려운 경우**\n• 지하철/버스 이용\n• 택시 또는 대리운전\n• 카풀 활용\n\n**주의사항**\n• 불법주차 절대 금지\n• 다른 차량 진로 방해 금지\n• 주차비 미리 준비',
      popular: false,
    },
    {
      id: '11',
      category: 'etc',
      question: '코로나 시대 경조사 예절이 바뀌었나요?',
      answer: '코로나 이후 경조사 변화:\n\n**비대면 참석**\n• 온라인 라이브 스트리밍 참석\n• 화상 축하 메시지\n• 비대면 조문\n\n**방역 수칙**\n• 마스크 착용 (실내 필수)\n• 손 소독제 사용\n• 사회적 거리두기\n\n**간소화 경향**\n• 스몰웨딩 증가\n• 가족 위주 소규모 예식\n• 뷔페 → 도시락 형태\n\n**축의금 전달**\n• 계좌이체 증가\n• 모바일 축의금\n• 비대면 전달 방식',
      popular: false,
    },
    {
      id: '12',
      category: 'money',
      question: '결혼식 축의금을 현금이 아닌 선물로 해도 되나요?',
      answer: '축의금 vs 선물 가이드:\n\n**현금 축의금 (일반적)**\n• 신랑신부가 필요한 곳에 사용\n• 금액이 명확함\n• 관리가 편리함\n\n**선물 (특별한 경우)**\n• 아주 가까운 사이에만\n• 미리 신랑신부와 상의\n• 실용적인 품목 선택\n• 결혼선물 리스트 확인\n\n**선물 추천 품목**\n• 주방용품, 생활용품\n• 인테리어 소품\n• 가전제품 (소액)\n\n**주의사항**\n• 겹칠 수 있는 품목 피하기\n• 개인 취향 고려\n• 교환/환불 가능한 것',
      popular: false,
    },
    {
      id: '13',
      category: 'money',
      question: '온라인 축의금 송금은 어떻게 하나요?',
      answer: '온라인 축의금 가이드:\n\n**송금 방법**\n• 계좌이체: 가장 일반적\n• 모바일 뱅킹 앱\n• 축의금 전용 앱\n• QR코드 송금\n\n**온라인 축의금 장점**\n• 코로나 시대 비접촉\n• 현금 준비 불필요\n• 송금 기록 자동 보관\n• 24시간 언제든 가능\n\n**예절**\n• 예식 당일 오전까지\n• 축하 메시지와 함께\n• 계좌번호 정확히 확인\n• 송금 완료 후 연락\n\n**주의사항**\n• 이체 한도 확인\n• 수수료 확인\n• 잘못된 계좌 입금 주의',
      popular: false,
    },
    {
      id: '14',
      category: 'money',
      question: '재혼 결혼식 축의금은 얼마가 적당한가요?',
      answer: '재혼 축의금 가이드:\n\n**일반적인 기준**\n• 초혼의 70-80% 수준\n• 관계의 친밀도에 따라 조절\n• 과도하지 않게 적당히\n\n**관계별 금액**\n• 가족/친척: 10-30만원\n• 가까운 친구: 10-20만원\n• 직장 동료: 5-10만원\n• 지인: 3-5만원\n\n**고려사항**\n• 첫 결혼식 참석 여부\n• 현재 관계의 정도\n• 경제적 상황\n• 지역별 관습\n\n**마음가짐**\n• 새 출발을 축하하는 마음\n• 부담스럽지 않게\n• 진심 어린 축하가 중요',
      popular: false,
    },
    {
      id: '15',
      category: 'money',
      question: '부모님 지인 결혼식 축의금은?',
      answer: '부모님 지인 결혼식 참석:\n\n**부모님을 대신해서 갈 때**\n• 부모님과 상의 후 금액 결정\n• 부모님 명의로 축의금 준비\n• "○○○ 어머니(아버지) 대신" 명시\n\n**나 혼자 초대받았을 때**\n• 부모님을 통한 관계라면 5-10만원\n• 나와 직접적인 인연이 있다면 10-20만원\n• 부담스럽지 않은 선에서\n\n**축의금 봉투 작성**\n• "○○○(내 이름) 드림"\n• 또는 "○○○ 가족 일동"\n• 관계 명시\n\n**예절**\n• 부모님께 결과 보고\n• 신랑신부에게 부모님 안부 전달',
      popular: false,
    },

    // 복장&매너 관련 (5개 추가)
    {
      id: '16',
      category: 'manner',
      question: '결혼식에 아이와 함께 갈 때 주의사항은?',
      answer: '아이 동반 참석 가이드:\n\n**사전 확인**\n• 신랑신부에게 미리 양해 구하기\n• 웨딩홀 아이 동반 정책 확인\n• 수유실, 기저귀 교환대 유무\n\n**준비물**\n• 기저귀, 젖병, 간식\n• 조용한 장난감\n• 여분 옷\n• 물티슈, 손수건\n\n**예식 중 매너**\n• 울면 즉시 밖으로 나가기\n• 뛰어다니지 않도록 주의\n• 조용히 앉아있도록 지도\n• 사진 촬영 방해하지 않기\n\n**대안**\n• 베이비시터 동반\n• 가족 중 한 명은 아이와 대기\n• 예식만 참석하고 식사는 패스',
      popular: false,
    },
    {
      id: '17',
      category: 'manner',
      question: '여름 결혼식 복장은 어떻게 해야 하나요?',
      answer: '여름 결혼식 복장 가이드:\n\n**여성 복장**\n• 시원한 소재 (린넨, 면, 시폰)\n• 무릎 아래 길이 원피스\n• 밝고 화사한 색상 OK\n• 샌들 착용 가능 (단, 정중한 디자인)\n\n**남성 복장**\n• 면 소재 정장\n• 밝은 색상 셔츠 가능\n• 가벼운 소재 넥타이\n• 로퍼나 가벼운 구두\n\n**피해야 할 것**\n• 너무 노출이 심한 옷\n• 플립플랍, 슬리퍼\n• 민소매 (남성)\n• 짧은 반바지\n\n**더위 대비**\n• 부채, 핸드타월 준비\n• 메이크업 수정용품\n• 충분한 수분 섭취',
      popular: false,
    },
    {
      id: '18',
      category: 'manner',
      question: '겨울 결혼식 복장과 방한 대책은?',
      answer: '겨울 결혼식 복장 가이드:\n\n**여성 복장**\n• 두꺼운 소재 원피스\n• 자켓, 볼레로 착용\n• 스타킹, 부츠 착용\n• 목도리, 장갑 준비\n\n**남성 복장**\n• 울 소재 정장\n• 조끼 착용 고려\n• 두꺼운 양말\n• 정장용 방한 코트\n\n**야외 예식 대비**\n• 핫팩 준비\n• 방한용품 지참\n• 실내화 별도 준비\n• 감기 예방\n\n**주의사항**\n• 히터 가까이 앉지 않기\n• 두꺼운 외투는 맡기기\n• 정전기 방지 스프레이\n• 미끄럼 방지 신발',
      popular: false,
    },
    {
      id: '19',
      category: 'manner',
      question: '코로나 시대 결혼식 참석 매너는?',
      answer: '코로나 시대 결혼식 매너:\n\n**방역 수칙**\n• 마스크 필수 착용\n• 손 소독제 사용\n• 발열 체크 협조\n• 거리두기 준수\n\n**참석 관련**\n• 몸이 아프면 참석 자제\n• 최소 인원으로 참석\n• 시간 단축 (1-2시간)\n• 식사 시간 줄이기\n\n**축하 방법**\n• 포옹, 악수 대신 목례\n• 온라인 축하 메시지\n• 비대면 축의금 전달\n• SNS 축하 댓글\n\n**예식장 협조**\n• QR코드 출입 명부\n• 지정석 앉기\n• 뷔페 대신 도시락\n• 방역 지침 준수',
      popular: false,
    },
    {
      id: '20',
      category: 'manner',
      question: '장례식장 복장과 메이크업은?',
      answer: '장례식장 복장 완벽 가이드:\n\n**기본 복장**\n• 검은색 정장 또는 한복\n• 단정하고 정숙한 스타일\n• 과도한 장신구 피하기\n• 향수 사용 금지\n\n**여성 메이크업**\n• 진한 화장 피하기\n• 베이스 메이크업 위주\n• 립스틱은 자연스러운 색상\n• 아이메이크업 최소화\n\n**남성 복장**\n• 검은색 정장 + 검은 넥타이\n• 흰색 셔츠\n• 검은색 구두\n• 깔끔한 헤어스타일\n\n**계절별 주의사항**\n• 여름: 시원하되 정중하게\n• 겨울: 방한복도 검은색 위주\n• 비올 때: 검은 우산 준비',
      popular: false,
    },

    // 예절 관련 (5개 추가)
    {
      id: '21',
      category: 'etiquette',
      question: '결혼식 사진 촬영 예절은?',
      answer: '결혼식 사진 촬영 예절:\n\n**촬영 가능한 시간**\n• 하객 입장 시간\n• 축하 인사 시간\n• 식사 시간\n• 신랑신부가 허락한 순간\n\n**촬영 금지 시간**\n• 예식 진행 중\n• 서약, 반지 교환 시\n• 축가, 주례사 중\n• 전문 사진사 촬영 중\n\n**촬영 매너**\n• 플래시 사용 자제\n• 다른 하객 시야 방해 금지\n• 너무 앞으로 나가지 않기\n• 조용히 촬영하기\n\n**SNS 업로드 주의**\n• 신랑신부 허락 받기\n• 태그 신중하게\n• 적절한 시점에 업로드\n• 개인정보 노출 주의',
      popular: false,
    },
    {
      id: '22',
      category: 'etiquette',
      question: '결혼식 중 울거나 감정이 북받칠 때는?',
      answer: '결혼식 감정 표현 가이드:\n\n**눈물이 날 때**\n• 조용히 휴지로 닦기\n• 과도하게 울지 않기\n• 주위에 방해되지 않게\n• 필요시 잠시 자리 이석\n\n**기쁜 마음 표현**\n• 박수는 적절한 때에\n• 큰 소리로 환호 자제\n• 웃음소리 조절하기\n• 정숙한 분위기 유지\n\n**감동적인 순간**\n• 조용히 감상하기\n• 다른 하객 배려\n• 핸드폰 진동 끄기\n• 집중해서 참관\n\n**예식 후 축하**\n• 진심 어린 축하 인사\n• 간단명료하게\n• 길게 붙잡고 있지 않기\n• 다른 하객들도 배려',
      popular: false,
    },
    {
      id: '23',
      category: 'etiquette',
      question: '조문할 때 하지 말아야 할 말은?',
      answer: '조문 시 금기 사항:\n\n**절대 하면 안 되는 말**\n• "어떻게 돌아가셨어요?"\n• "왜 이렇게 일찍..."\n• "건강하셨는데..."\n• "젊으시기도 하고..."\n\n**위로가 되지 않는 말**\n• "힘내세요" (너무 뻔함)\n• "금방 괜찮아질 거예요"\n• "저도 예전에..." (자신의 경험담)\n• "운명이니까..."\n\n**적절한 조문 인사**\n• "삼가 고인의 명복을 빕니다"\n• "조의를 표합니다"\n• "얼마나 상심이 크시겠어요"\n• "곁에서 함께 슬퍼하겠습니다"\n\n**조문 예절**\n• 짧고 간단하게\n• 진심 어린 마음 전달\n• 종교적 표현 주의\n• 상주의 상황 배려',
      popular: false,
    },
    {
      id: '24',
      category: 'etiquette',
      question: '빈소에서 향을 피우는 방법은?',
      answer: '향 피우기 예절:\n\n**향 피우는 순서**\n1. 영정 앞에서 정중히 인사\n2. 향을 3개 집어들기\n3. 촛불에 향 끝 점화\n4. 손으로 향 불 끄기 (입으로 불지 않기)\n5. 향로에 꽂기\n\n**향 꽂는 방법**\n• 3개를 한 번에 또는 하나씩\n• 향로 가운데 부분에\n• 일정한 간격 유지\n• 깔끔하게 정리\n\n**절하는 방법**\n• 분향 후 영정을 향해\n• 남성: 큰절 1번\n• 여성: 평절 2번\n• 묵념 후 물러나기\n\n**주의사항**\n• 종교에 따라 분향 안 하는 경우\n• 기독교, 천주교는 헌화만\n• 상주에게 예의 지키기',
      popular: false,
    },
    {
      id: '25',
      category: 'etiquette',
      question: '장례식 음식을 먹어야 하나요?',
      answer: '장례식 음식 예절:\n\n**상가 음식의 의미**\n• 고인을 기리는 마음\n• 상주를 위로하는 의미\n• 전통적인 관습\n• 죽은 자와 산 자의 연결\n\n**먹어야 하는 경우**\n• 상주가 권할 때\n• 오랜 시간 조문할 때\n• 가까운 관계인 경우\n• 지역 관습상 필요할 때\n\n**먹지 않아도 되는 경우**\n• 종교적 이유\n• 개인적 사정\n• 짧은 조문 시\n• 위생상 우려 시\n\n**음식 예절**\n• 정중히 감사 인사\n• 적당량만 취하기\n• 남기지 않기\n• 조용히 식사\n• "잘 먹었습니다" 인사',
      popular: false,
    },

    // 기타 (5개 추가)
    {
      id: '26',
      category: 'etc',
      question: '웨딩카 타는 하객 예절은?',
      answer: '웨딩카 탑승 예절:\n\n**탑승 순서**\n• 연장자, 귀빈 먼저\n• 신랑신부 가족 우선\n• 남녀 구분해서 탑승\n• 양복 단정히 정리\n\n**차량 내 매너**\n• 큰 소리로 대화 자제\n• 창문 밖으로 손 내밀지 않기\n• 음식물 반입 금지\n• 시트 더럽히지 않기\n\n**도착 후**\n• 차량에서 내릴 때 조심\n• 드레스 밟지 않도록 주의\n• 기사님께 감사 인사\n• 다른 하객 도움\n\n**특별 상황**\n• 멀미 나면 미리 말하기\n• 응급상황 시 즉시 알리기\n• 교통상황으로 지연 시 양해\n• 차량 고장 시 침착하게 대처',
      popular: false,
    },
    {
      id: '27',
      category: 'etc',
      question: '결혼식 부케 토스에 참여해야 하나요?',
      answer: '부케 토스 참여 가이드:\n\n**참여 대상**\n• 미혼 여성\n• 자발적 참여 원칙\n• 나이 제한 없음\n• 즐거운 마음으로\n\n**참여하지 않아도 되는 경우**\n• 부끄러워하는 성격\n• 나이가 많아 부담스러운 경우\n• 개인적 사정\n• 종교적 이유\n\n**부케 토스 매너**\n• 과격하게 경쟁하지 않기\n• 다른 참여자 밀치지 않기\n• 안전 제일\n• 즐겁게 참여\n\n**부케를 받았을 때**\n• 기쁘게 받기\n• 신부에게 감사 인사\n• 사진 촬영 협조\n• 다른 참여자들과 축하 나누기',
      popular: false,
    },
    {
      id: '28',
      category: 'etc',
      question: '결혼식 답례품을 안 받아도 되나요?',
      answer: '답례품 받기 예절:\n\n**답례품의 의미**\n• 신랑신부의 감사 표현\n• 축하해준 것에 대한 보답\n• 기념품의 의미\n• 예의상 준비한 선물\n\n**받는 것이 예의**\n• 정중히 감사 인사와 함께\n• 거절하면 신랑신부 서운\n• 마음을 담은 선물\n• 예의상 받는 것이 좋음\n\n**정중히 거절할 수 있는 경우**\n• 짐이 너무 많을 때\n• 멀리 여행 중일 때\n• 종교적 이유\n• 개인적 사정\n\n**답례품 활용**\n• 실용적으로 사용\n• 기념품으로 보관\n• 필요한 분께 전달\n• 버리더라도 정중히 받기',
      popular: false,
    },
    {
      id: '29',
      category: 'etc',
      question: '온라인 생중계 결혼식 시청 예절은?',
      answer: '온라인 결혼식 예절:\n\n**사전 준비**\n• 안정적인 인터넷 연결\n• 조용한 환경 조성\n• 적절한 복장 (카메라 온 시)\n• 집중할 수 있는 공간\n\n**시청 중 매너**\n• 채팅으로 축하 메시지\n• 과도한 이모티콘 자제\n• 개인적 대화 피하기\n• 화면 집중하기\n\n**참여 방법**\n• 실시간 댓글로 축하\n• 온라인 축의금 전달\n• SNS 공유 (허락 시)\n• 나중에 개별 축하 연락\n\n**주의사항**\n• 화면 캡처 전 허락받기\n• 개인정보 노출 주의\n• 다른 시청자 배려\n• 네트워크 상황 이해',
      popular: false,
    },
    {
      id: '30',
      category: 'etc',
      question: '결혼식 후 신혼부부에게 언제 연락해야 하나요?',
      answer: '신혼부부 연락 타이밍:\n\n**결혼식 당일**\n• 간단한 축하 메시지\n• SNS 축하 댓글\n• 사진 공유 (허락 시)\n• 무사히 마친 것 축하\n\n**신혼여행 전후**\n• 여행 전: 안전한 여행 기원\n• 여행 중: 연락 자제\n• 여행 후: 여행 후기 물어보기\n• 적당한 거리 유지\n\n**적절한 연락 시기**\n• 결혼 1주일 후\n• 신혼여행 다녀온 후\n• 새집 이사 후\n• 특별한 기념일\n\n**연락 내용**\n• 안부 인사\n• 결혼 생활 축하\n• 도움 필요한 것 물어보기\n• 부담스럽지 않게',
      popular: false,
    },
  ];

  // 화면에 포커스될 때마다 랜덤 FAQ 생성
  useFocusEffect(
    React.useCallback(() => {
      const randomFAQ = getRandomFAQ(allFaqData);
      console.log('🎲 참여자 FAQ 랜덤 생성!', randomFAQ.slice(0, 3).map(q => q.question));
      setDisplayedFAQ(randomFAQ);
      setExpandedItems(new Set()); // 펼쳐진 항목도 초기화
    }, [])
  );

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
          <Text style={styles.headerTitle}>참여자 FAQ</Text>
          <Text style={styles.headerSubtitle}>경조사 참석 시 자주 묻는 질문들</Text>
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