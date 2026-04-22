// src/screens/main/guides/faqData.js
// 통합 FAQ 데이터 (주최자 / 참여자 공용)

export const HOST_CATEGORIES = [
  { id: 'all',         title: '전체',     icon: 'grid' },
  { id: 'wedding',     title: '결혼식',   icon: 'heart' },
  { id: 'funeral',     title: '장례식',   icon: 'flower' },
  { id: 'budget',      title: '예산',     icon: 'calculator' },
  { id: 'preparation', title: '준비사항', icon: 'checkmark-circle' },
];

export const PARTICIPANT_CATEGORIES = [
  { id: 'all',       title: '전체',       icon: 'grid' },
  { id: 'money',     title: '축의금',     icon: 'calculator' },
  { id: 'manner',    title: '복장&매너',  icon: 'shirt' },
  { id: 'etiquette', title: '예절',       icon: 'people' },
  { id: 'etc',       title: '기타',       icon: 'help-circle' },
];

export const HOST_FAQS = [
  { id: 'h1',  category: 'wedding',     popular: true,  question: '결혼식 준비는 언제부터 시작해야 하나요?', answer: '일반적으로 결혼식 6개월 전부터 본격적인 준비를 시작하는 것이 좋습니다.\n\n• 6개월 전: 웨딩홀, 스드메(스튜디오, 드레스, 메이크업) 예약\n• 3개월 전: 한복, 청첩장, 답례품 준비\n• 1개월 전: 최종 인원 확정, 세부 사항 점검\n• 1주일 전: 최종 리허설 및 확인' },
  { id: 'h2',  category: 'wedding',     popular: true,  question: '웨딩홀 선택 시 가장 중요한 체크포인트는?', answer: '웨딩홀 선택 시 다음 사항들을 꼼꼼히 확인하세요:\n\n• 교통 접근성 (지하철역, 주차 공간)\n• 홀 규모와 하객 수 적합성\n• 음식 품질 및 메뉴 구성\n• 부대시설 (신부 대기실, 촬영 공간)\n• 추가 비용 항목 확인\n• 취소 및 연기 정책' },
  { id: 'h3',  category: 'wedding',     popular: false, question: '스몰웨딩과 일반 웨딩의 차이점은?', answer: '스몰웨딩과 일반 웨딩의 주요 차이점:\n\n**스몰웨딩 (30명 이하)**\n• 친밀한 분위기, 개인적인 소통 가능\n• 비용 절약 (평균 1,000-3,000만원)\n• 간소한 절차, 자유로운 진행\n\n**일반 웨딩 (50명 이상)**\n• 격식 있는 예식, 전통적인 진행\n• 더 많은 하객과 함께 축하\n• 상대적으로 높은 비용' },
  { id: 'h4',  category: 'funeral',     popular: true,  question: '장례식 준비 절차를 알려주세요', answer: '장례식 준비는 다음 순서로 진행됩니다:\n\n**임종 후 즉시**\n• 사망진단서 발급\n• 장례식장 예약 및 빈소 설치\n• 가족, 친지에게 부고 연락\n\n**1일차**\n• 수의 준비, 염습\n• 상주 복장 준비\n• 부고장 제작 및 발송\n\n**2일차**\n• 조문객 접대\n• 발인 준비\n\n**3일차**\n• 발인식, 운구, 하관' },
  { id: 'h5',  category: 'funeral',     popular: false, question: '장례식장 선택 기준은 무엇인가요?', answer: '장례식장 선택 시 고려사항:\n\n• **위치**: 조문객들의 접근 편의성\n• **시설**: 빈소 크기, 주차 공간, 편의시설\n• **서비스**: 장례용품 제공, 직원 전문성\n• **비용**: 기본 패키지 vs 개별 서비스\n• **종교**: 종교별 특별 서비스 제공 여부' },
  { id: 'h6',  category: 'budget',      popular: true,  question: '결혼식 평균 비용은 얼마정도 인가요?', answer: '2024년 기준 결혼식 평균 비용:\n\n**일반 웨딩 (100명 기준)**\n• 웨딩홀: 3,000-8,000만원\n• 스드메: 1,000-2,000만원\n• 한복: 300-800만원\n• 청첩장/답례품: 200-500만원\n• 기타: 500-1,000만원\n\n**총 예상 비용: 5,000-12,000만원**\n\n지역, 평일/주말, 홀 등급에 따라 차이가 큽니다.' },
  { id: 'h7',  category: 'budget',      popular: false, question: '예산을 절약할 수 있는 방법이 있나요?', answer: '결혼식 예산 절약 팁:\n\n**시기 선택**\n• 평일 예식 (30-50% 할인)\n• 비수기 (11월-2월) 예약\n\n**스타일 변경**\n• 스몰웨딩 또는 가족형 웨딩\n• 뷔페식 → 코스식 변경\n\n**DIY 활용**\n• 청첩장 직접 제작\n• 답례품 개별 구매\n\n**패키지 활용**\n• 올인원 패키지 할인 혜택' },
  { id: 'h8',  category: 'preparation', popular: false, question: '결혼식 하객 수는 어떻게 정하나요?', answer: '하객 수 결정 가이드:\n\n**가족/친지**\n• 양가 부모님과 상의하여 결정\n• 직계가족, 친척 범위 설정\n\n**친구/동료**\n• 평상시 연락하는 가까운 사이\n• 상호 예식 참석 관계 고려\n\n**일반적인 비율**\n• 가족/친지: 40-50%\n• 친구: 30-40%\n• 직장 동료: 10-20%' },
  { id: 'h9',  category: 'preparation', popular: true,  question: '청첩장은 언제 보내야 하나요?', answer: '청첩장 발송 타이밍:\n\n**발송 시기**\n• 예식 4-6주 전 발송\n• 명절이나 휴가철은 더 일찍\n\n**발송 방법별 특징**\n• **모바일 청첩장**: 즉시 발송, 환경친화적\n• **종이 청첩장**: 격식 있음, 기념품 가치\n• **하이브리드**: 모바일 + 특별한 분만 종이' },
  { id: 'h10', category: 'wedding',     popular: false, question: '웨딩드레스는 언제 정해야 하나요?', answer: '웨딩드레스 준비 스케줄:\n\n**시기별 준비**\n• 4-6개월 전: 스튜디오 예약, 드레스 시착\n• 3개월 전: 최종 드레스 결정\n• 1개월 전: 최종 피팅\n• 1주일 전: 마지막 확인' },
  { id: 'h11', category: 'wedding',     popular: false, question: '웨딩 케이크는 어떻게 준비하나요?', answer: '웨딩 케이크 준비 가이드:\n\n**종류**\n• 실제 케이크: 모든 층이 진짜 케이크\n• 더미 케이크: 장식용 + 일부만 실제 케이크\n• 컵케이크: 개별 포장으로 편리함\n\n**주문 시기**\n• 1-2개월 전 주문\n• 맛보기 예약 필수' },
  { id: 'h12', category: 'wedding',     popular: false, question: '리허설은 언제 어떻게 하나요?', answer: '결혼식 리허설 가이드:\n\n**리허설 시기**\n• 예식 1주일 전 또는 전날\n• 실제 예식 시간대와 비슷하게\n\n**참석 인원**\n• 신랑신부, 양가 부모님\n• 주례, 사회자, 성가대\n\n**리허설 내용**\n• 입장 순서와 동선 연습\n• 음향, 조명 체크' },
  { id: 'h13', category: 'wedding',     popular: false, question: '혼수는 어떻게 준비해야 하나요?', answer: '혼수 준비 가이드:\n\n**필수 혼수 품목**\n• 침구류: 이불, 베개, 시트\n• 주방용품: 냄비, 그릇, 수저\n• 생활용품: 수건, 세제 등\n• 가전제품: 냉장고, 세탁기 등\n\n**준비 시기**\n• 3-4개월 전부터 차근차근\n• 신혼집 구조 확정 후' },
  { id: 'h14', category: 'wedding',     popular: false, question: '웨딩 플래너가 필요한가요?', answer: '웨딩 플래너 필요성:\n\n**플래너가 필요한 경우**\n• 처음 결혼 준비하는 경우\n• 시간이 부족한 직장인\n• 특별한 테마 웨딩 원하는 경우\n\n**플래너 없이 준비하는 경우**\n• 예산이 제한적인 경우\n• 직접 준비하는 즐거움을 원하는 경우' },
  { id: 'h15', category: 'wedding',     popular: false, question: '예식 당일 준비사항은?', answer: '예식 당일 체크리스트:\n\n**신부 준비**\n• 4-5시간 전: 헤어, 메이크업 시작\n• 2시간 전: 드레스 착용\n• 1시간 전: 최종 터치업\n\n**신랑 준비**\n• 2시간 전: 정장 착용\n• 1시간 전: 헤어 정리' },
  { id: 'h16', category: 'funeral',     popular: true,  question: '상가에서 해야 할 첫 번째 일은?', answer: '임종 직후 해야 할 일들:\n\n**즉시 해야 할 일**\n• 의사에게 사망진단서 발급 요청\n• 가까운 가족, 친지에게 연락\n• 장례식장 선택 및 빈소 예약\n\n**준비해야 할 서류**\n• 사망진단서\n• 가족관계증명서\n• 주민등록등본\n• 신분증' },
  { id: 'h17', category: 'funeral',     popular: false, question: '빈소 차리는 방법을 알려주세요', answer: '빈소 차리기 가이드:\n\n**기본 구성**\n• 영정 사진 (최근 5년 이내)\n• 위패 또는 명패\n• 제단 꽃 장식\n• 향로, 촛대\n• 상차림 (과일, 떡 등)\n\n**배치 순서**\n• 가운데: 영정 사진\n• 앞쪽: 제단과 상차림' },
  { id: 'h18', category: 'funeral',     popular: false, question: '부고는 언제 어떻게 알려야 하나요?', answer: '부고 알리기 가이드:\n\n**알리는 시기**\n• 임종 후 가능한 빨리\n• 늦어도 당일 중\n\n**알릴 대상 순서**\n1. 직계 가족\n2. 친척\n3. 고인의 친구, 동료\n4. 가족의 지인' },
  { id: 'h19', category: 'funeral',     popular: false, question: '장례 기간은 며칠이 적당한가요?', answer: '장례 기간 결정 가이드:\n\n**일반적인 기간**\n• 3일장: 가장 일반적\n• 5일장: 조금 더 여유 있게\n• 당일장: 간소하게 (화장 시)\n\n**기간 결정 요소**\n• 고인의 사회적 지위\n• 조문객 예상 규모' },
  { id: 'h20', category: 'funeral',     popular: false, question: '상복은 누가 언제까지 입어야 하나요?', answer: '상복 착용 가이드:\n\n**착용 대상**\n• 직계 가족: 배우자, 자녀\n• 직계 손자녀\n• 며느리, 사위\n\n**착용 기간**\n• 장례 기간 중 계속\n• 탈상 전까지 (보통 49재까지)' },
  { id: 'h21', category: 'funeral',     popular: false, question: '화장과 매장 중 어떤 것을 선택해야 하나요?', answer: '화장 vs 매장 선택 가이드:\n\n**화장의 장점**\n• 경제적 부담 적음\n• 관리 편리함\n• 위생적\n\n**매장의 장점**\n• 전통적 방식\n• 성묘 문화 유지' },
  { id: 'h22', category: 'funeral',     popular: true,  question: '장례 비용은 대략 얼마나 드나요?', answer: '장례 비용 가이드:\n\n**병원 장례식장 (3일장 기준)**\n• 기본 패키지: 300-500만원\n• 추가 비용: 100-300만원\n• 총 비용: 400-800만원\n\n**전문 장례식장**\n• 기본 패키지: 500-800만원\n• 총 비용: 700-1300만원' },
  { id: 'h23', category: 'funeral',     popular: false, question: '종교별 장례 절차 차이점은?', answer: '종교별 장례 절차:\n\n**불교식**\n• 염불, 독경\n• 49재까지 추도\n• 화장 선호\n\n**기독교식**\n• 찬송, 기도\n• 예배식으로 진행\n\n**천주교식**\n• 미사로 진행\n• 연도 행사' },
  { id: 'h24', category: 'budget',      popular: true,  question: '예산이 부족할 때 우선순위는?', answer: '예산 부족 시 우선순위:\n\n**결혼식 필수 항목**\n1. 웨딩홀 (장소 확보)\n2. 음식 (하객 접대)\n3. 사진 (평생 기념)\n4. 드레스/정장\n\n**절약 가능 항목**\n• 화려한 장식 → 간단한 꽃 장식\n• 고급 답례품 → 실용적 답례품' },
  { id: 'h25', category: 'budget',      popular: false, question: '웨딩 대출 받을 때 주의사항은?', answer: '웨딩 대출 가이드:\n\n**대출 종류**\n• 신용대출: 무담보, 신속\n• 적금 담보대출: 낮은 금리\n• 전세자금 대출: 신혼집 마련\n\n**주의사항**\n• 과도한 대출 피하기\n• 상환 계획 미리 세우기' },
  { id: 'h26', category: 'budget',      popular: false, question: '축의금 관리는 어떻게 해야 하나요?', answer: '축의금 관리 가이드:\n\n**받을 때**\n• 축의금 대장 작성\n• 금액과 이름 정확히 기록\n• 봉투는 따로 보관\n\n**관리 방법**\n• 전용 통장 개설\n• 당일 입금하기\n• 엑셀로 정리' },
  { id: 'h27', category: 'budget',      popular: false, question: '신혼여행 예산은 얼마나 잡아야 하나요?', answer: '신혼여행 예산 가이드:\n\n**국내 여행**\n• 3박 4일: 100-200만원\n• 5박 6일: 150-300만원\n\n**해외 여행**\n• 동남아 (5-7일): 200-400만원\n• 일본 (4-6일): 150-350만원\n• 유럽 (8-10일): 400-800만원' },
  { id: 'h28', category: 'preparation', popular: false, question: '날씨가 안 좋을 때 대비책은?', answer: '날씨 대비 가이드:\n\n**비 오는 날**\n• 하객용 우산 준비\n• 실내 촬영 장소 확보\n\n**더운 여름**\n• 선풍기, 부채 준비\n• 음료수 추가 준비\n\n**추운 겨울**\n• 히터, 온열기 준비\n• 따뜻한 음료 서비스' },
  { id: 'h29', category: 'preparation', popular: false, question: '신혼집 준비는 언제부터 해야 하나요?', answer: '신혼집 준비 타이밍:\n\n**전세/매매 (6개월 전부터)**\n• 지역, 평수 결정\n• 중개업소 발품 팔기\n\n**임대 (3개월 전부터)**\n• 입지 조건 정하기\n• 온라인 매물 확인\n\n**인테리어 (2개월 전부터)**\n• 필수 수리 사항 점검' },
  { id: 'h30', category: 'preparation', popular: false, question: '응급상황 대처 방법을 알려주세요', answer: '예식 당일 응급상황 대처:\n\n**신부 관련**\n• 드레스 손상: 안전핀, 양면테이프\n• 메이크업 번짐: 파우더, 립스틱 보완\n\n**신랑 관련**\n• 넥타이 문제: 여분 넥타이\n\n**진행 관련**\n• 음향 시설 고장: 예비 장비' },
];

export const PARTICIPANT_FAQS = [
  { id: 'p1',  category: 'money',     popular: true,  question: '회사 동료 결혼식 축의금은 얼마가 적당한가요?', answer: '회사 동료 축의금 기준:\n\n**일반 동료**\n• 같은 팀: 5-10만원\n• 다른 팀: 3-5만원\n\n**친밀도에 따라**\n• 가까운 동료: 10-20만원\n• 평상시 연락하는 사이: 10만원\n\n**직급 고려**\n• 후배가 선배에게: 5-10만원\n• 선배가 후배에게: 10-20만원' },
  { id: 'p2',  category: 'money',     popular: true,  question: '친구 결혼식 축의금은 어느 정도가 좋을까요?', answer: '친구 결혼식 축의금 가이드:\n\n**친밀도별 기준**\n• 절친/단짝친구: 20-50만원\n• 가까운 친구: 10-20만원\n• 일반 친구: 5-10만원\n\n**나이대별 평균**\n• 20대: 5-15만원\n• 30대: 10-30만원\n• 40대 이상: 20-50만원' },
  { id: 'p3',  category: 'money',     popular: false, question: '축의금 봉투에 어떻게 써야 하나요?', answer: '축의금 봉투 작성법:\n\n**앞면 (세로쓰기)**\n• 위쪽: "축 결혼" 또는 "祝 結婚"\n• 가운데: 신랑신부 이름\n• 아래쪽: 본인 이름\n\n**뒷면**\n• 왼쪽 하단에 본인 이름과 금액\n\n**주의사항**\n• 검은색 펜 사용\n• 정자로 또박또박 작성' },
  { id: 'p4',  category: 'money',     popular: false, question: '장례식 조의금은 얼마가 적당한가요?', answer: '조의금 기준 가이드:\n\n**관계별 금액**\n• 가족/친척: 30-100만원\n• 가까운 친구: 10-30만원\n• 회사 동료: 5-10만원\n• 지인: 3-5만원\n\n**조의금 봉투**\n• "조의" 또는 "부의" 작성\n• 흰 봉투 사용' },
  { id: 'p5',  category: 'manner',    popular: true,  question: '결혼식 하객 복장은 어떻게 해야 하나요?', answer: '결혼식 하객 복장 가이드:\n\n**남성 복장**\n• 정장 (네이비, 그레이, 블랙)\n• 화이트 셔츠 + 넥타이\n• 구두 (블랙 또는 브라운)\n\n**여성 복장**\n• 원피스, 정장, 한복\n• 무릎 아래 길이 권장\n\n**피해야 할 색상**\n• 화이트 (신부 색상)\n• 블랙 (상복 연상)' },
  { id: 'p6',  category: 'manner',    popular: false, question: '장례식장에는 어떤 복장으로 가야 하나요?', answer: '장례식장 복장 예절:\n\n**기본 원칙**\n• 검은색 계열 정장\n• 화려한 장신구 피하기\n• 향수 사용 금지\n\n**남성**\n• 검은색 정장 + 검은색 넥타이\n• 흰색 셔츠\n\n**여성**\n• 검은색 정장, 원피스, 한복\n• 무릎 아래 길이' },
  { id: 'p7',  category: 'etiquette', popular: true,  question: '결혼식장에서 지켜야 할 매너는?', answer: '결혼식장 매너 가이드:\n\n**입장 시**\n• 예식 시작 10-15분 전 도착\n• 방명록 작성 (정자로)\n• 축의금 전달\n\n**예식 중**\n• 휴대폰 무음 또는 진동\n• 사진 촬영 자제\n• 조용히 참석' },
  { id: 'p8',  category: 'etiquette', popular: true,  question: '조문 예절을 알려주세요', answer: '조문 예절 가이드:\n\n**조문 인사**\n• "고인의 명복을 빕니다"\n• "조의를 표합니다"\n\n**조문 순서**\n1. 접수처에서 조의금 전달\n2. 방명록 작성\n3. 빈소 입장\n4. 유족에게 조문 인사\n5. 간단한 위로 후 퇴장' },
  { id: 'p9',  category: 'etc',       popular: false, question: '결혼식에 아이와 함께 가도 될까요?', answer: '결혼식 아이 동반 가이드:\n\n**사전 확인**\n• 신랑신부 또는 가족에게 미리 확인\n• 예식장 아이 동반 정책 확인\n\n**준비사항**\n• 조용한 장난감 준비\n• 기저귀, 젖병 등 필수품' },
  { id: 'p10', category: 'etc',       popular: false, question: '예식장 주차는 어떻게 하나요?', answer: '예식장 주차 가이드:\n\n**주차 확인사항**\n• 예식장 주차 공간 유무\n• 주차비 부담 여부\n• 발렛파킹 서비스 여부\n\n**주차 팁**\n• 예식 1시간 전 미리 도착\n• 근처 유료 주차장 미리 확인' },
  { id: 'p11', category: 'etc',       popular: false, question: '코로나 시대 경조사 예절이 바뀌었나요?', answer: '코로나 이후 경조사 변화:\n\n**비대면 참석**\n• 온라인 라이브 스트리밍 참석\n• 화상 축하 메시지\n\n**방역 수칙**\n• 마스크 착용\n• 손 소독제 사용\n\n**간소화 경향**\n• 스몰웨딩 증가\n• 가족 위주 소규모 예식' },
  { id: 'p12', category: 'money',     popular: false, question: '결혼식 축의금을 현금이 아닌 선물로 해도 되나요?', answer: '축의금 vs 선물 가이드:\n\n**현금 축의금 (일반적)**\n• 신랑신부가 필요한 곳에 사용\n• 금액이 명확함\n\n**선물 (특별한 경우)**\n• 아주 가까운 사이에만\n• 미리 신랑신부와 상의\n• 실용적인 품목 선택' },
  { id: 'p13', category: 'money',     popular: false, question: '온라인 축의금 송금은 어떻게 하나요?', answer: '온라인 축의금 가이드:\n\n**송금 방법**\n• 계좌이체: 가장 일반적\n• 모바일 뱅킹 앱\n• QR코드 송금\n\n**예절**\n• 예식 당일 오전까지\n• 축하 메시지와 함께\n• 송금 완료 후 연락' },
  { id: 'p14', category: 'money',     popular: false, question: '재혼 결혼식 축의금은 얼마가 적당한가요?', answer: '재혼 축의금 가이드:\n\n**일반적인 기준**\n• 초혼의 70-80% 수준\n• 관계의 친밀도에 따라 조절\n\n**관계별 금액**\n• 가족/친척: 10-30만원\n• 가까운 친구: 10-20만원\n• 직장 동료: 5-10만원' },
  { id: 'p15', category: 'money',     popular: false, question: '부모님 지인 결혼식 축의금은?', answer: '부모님 지인 결혼식 참석:\n\n**부모님을 대신해서 갈 때**\n• 부모님과 상의 후 금액 결정\n• 부모님 명의로 축의금 준비\n\n**나 혼자 초대받았을 때**\n• 부모님을 통한 관계라면 5-10만원\n• 나와 직접적인 인연이 있다면 10-20만원' },
  { id: 'p16', category: 'manner',    popular: false, question: '결혼식에 아이와 함께 갈 때 주의사항은?', answer: '아이 동반 참석 가이드:\n\n**사전 확인**\n• 신랑신부에게 미리 양해 구하기\n• 웨딩홀 아이 동반 정책 확인\n\n**준비물**\n• 기저귀, 젖병, 간식\n• 조용한 장난감\n• 여분 옷' },
  { id: 'p17', category: 'manner',    popular: false, question: '여름 결혼식 복장은 어떻게 해야 하나요?', answer: '여름 결혼식 복장 가이드:\n\n**여성 복장**\n• 시원한 소재 (린넨, 면, 시폰)\n• 무릎 아래 길이 원피스\n• 밝고 화사한 색상 OK\n\n**남성 복장**\n• 면 소재 정장\n• 밝은 색상 셔츠 가능' },
  { id: 'p18', category: 'manner',    popular: false, question: '겨울 결혼식 복장과 방한 대책은?', answer: '겨울 결혼식 복장 가이드:\n\n**여성 복장**\n• 두꺼운 소재 원피스\n• 자켓, 볼레로 착용\n• 스타킹, 부츠 착용\n\n**남성 복장**\n• 울 소재 정장\n• 조끼 착용 고려' },
  { id: 'p19', category: 'manner',    popular: false, question: '코로나 시대 결혼식 참석 매너는?', answer: '코로나 시대 결혼식 매너:\n\n**방역 수칙**\n• 마스크 필수 착용\n• 손 소독제 사용\n\n**참석 관련**\n• 몸이 아프면 참석 자제\n• 최소 인원으로 참석' },
  { id: 'p20', category: 'manner',    popular: false, question: '장례식장 복장과 메이크업은?', answer: '장례식장 복장 완벽 가이드:\n\n**기본 복장**\n• 검은색 정장 또는 한복\n• 단정하고 정숙한 스타일\n• 과도한 장신구 피하기\n\n**여성 메이크업**\n• 진한 화장 피하기\n• 베이스 메이크업 위주' },
  { id: 'p21', category: 'etiquette', popular: false, question: '결혼식 사진 촬영 예절은?', answer: '결혼식 사진 촬영 예절:\n\n**촬영 가능한 시간**\n• 하객 입장 시간\n• 축하 인사 시간\n• 식사 시간\n\n**촬영 금지 시간**\n• 예식 진행 중\n• 서약, 반지 교환 시\n• 축가, 주례사 중' },
  { id: 'p22', category: 'etiquette', popular: false, question: '결혼식 중 울거나 감정이 북받칠 때는?', answer: '결혼식 감정 표현 가이드:\n\n**눈물이 날 때**\n• 조용히 휴지로 닦기\n• 과도하게 울지 않기\n\n**기쁜 마음 표현**\n• 박수는 적절한 때에\n• 큰 소리로 환호 자제' },
  { id: 'p23', category: 'etiquette', popular: false, question: '조문할 때 하지 말아야 할 말은?', answer: '조문 시 금기 사항:\n\n**절대 하면 안 되는 말**\n• "어떻게 돌아가셨어요?"\n• "왜 이렇게 일찍..."\n\n**적절한 조문 인사**\n• "삼가 고인의 명복을 빕니다"\n• "조의를 표합니다"' },
  { id: 'p24', category: 'etiquette', popular: false, question: '빈소에서 향을 피우는 방법은?', answer: '향 피우기 예절:\n\n**향 피우는 순서**\n1. 영정 앞에서 정중히 인사\n2. 향을 3개 집어들기\n3. 촛불에 향 끝 점화\n4. 손으로 향 불 끄기\n5. 향로에 꽂기' },
  { id: 'p25', category: 'etiquette', popular: false, question: '장례식 음식을 먹어야 하나요?', answer: '장례식 음식 예절:\n\n**상가 음식의 의미**\n• 고인을 기리는 마음\n• 상주를 위로하는 의미\n\n**음식 예절**\n• 정중히 감사 인사\n• 적당량만 취하기\n• 남기지 않기' },
  { id: 'p26', category: 'etc',       popular: false, question: '웨딩카 타는 하객 예절은?', answer: '웨딩카 탑승 예절:\n\n**탑승 순서**\n• 연장자, 귀빈 먼저\n• 신랑신부 가족 우선\n\n**차량 내 매너**\n• 큰 소리로 대화 자제\n• 창문 밖으로 손 내밀지 않기\n• 음식물 반입 금지' },
  { id: 'p27', category: 'etc',       popular: false, question: '결혼식 부케 토스에 참여해야 하나요?', answer: '부케 토스 참여 가이드:\n\n**참여 대상**\n• 미혼 여성\n• 자발적 참여 원칙\n\n**부케 토스 매너**\n• 과격하게 경쟁하지 않기\n• 안전 제일\n• 즐겁게 참여' },
  { id: 'p28', category: 'etc',       popular: false, question: '결혼식 답례품을 안 받아도 되나요?', answer: '답례품 받기 예절:\n\n**답례품의 의미**\n• 신랑신부의 감사 표현\n• 축하해준 것에 대한 보답\n\n**받는 것이 예의**\n• 정중히 감사 인사와 함께\n• 거절하면 신랑신부 서운' },
  { id: 'p29', category: 'etc',       popular: false, question: '온라인 생중계 결혼식 시청 예절은?', answer: '온라인 결혼식 예절:\n\n**사전 준비**\n• 안정적인 인터넷 연결\n• 조용한 환경 조성\n\n**시청 중 매너**\n• 채팅으로 축하 메시지\n• 과도한 이모티콘 자제' },
  { id: 'p30', category: 'etc',       popular: false, question: '결혼식 후 신혼부부에게 언제 연락해야 하나요?', answer: '신혼부부 연락 타이밍:\n\n**결혼식 당일**\n• 간단한 축하 메시지\n• SNS 축하 댓글\n\n**신혼여행 전후**\n• 여행 전: 안전한 여행 기원\n• 여행 중: 연락 자제\n• 여행 후: 여행 후기 물어보기' },
];

// Fisher-Yates 셔플 (공용)
export const shuffleFaqs = (arr) => {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};
