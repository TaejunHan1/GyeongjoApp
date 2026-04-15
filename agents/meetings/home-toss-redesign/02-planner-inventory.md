# HomeScreen.js 기능 인벤토리

**파일 경로:** `/Users/hantaejun/Documents/GitHub/GyeongjoApp/src/screens/main/HomeScreen.js`
**줄수:** 3,966줄

---

## 1. State 목록

### 사용자 및 인증 관련
- `[user, setUser]`: 현재 로그인한 사용자 정보 (name, id, email, phone 등)
- `[userSubscription, setUserSubscription]`: 사용자 구독 정보 (subscription_type, current_wedding_events, max_wedding_events 등)

### 이벤트 데이터
- `[events, setEvents]`: 모든 사용자 이벤트 (주최 + 참여 모두)
- `[activeEvents, setActiveEvents]`: 활성 이벤트 (주최한 경조사 + 개인 일정)

### UI 상태 관리
- `[loading, setLoading]`: 데이터 로딩 여부
- `[currentSlide, setCurrentSlide]`: 현재 웰컴 슬라이드 인덱스 (자동 회전)
- `[selectedTab, setSelectedTab]`: 탭 선택 ('active' 또는 'completed')

### 캐싱 및 성능
- `[lastLoadTime, setLastLoadTime]`: 마지막 데이터 로드 시간
- `[dataLoaded, setDataLoaded]`: 초기 데이터 로드 완료 여부
- `CACHE_DURATION`: 30초 캐시 기간 (상수)

### 캘린더 및 날짜
- `[calendarDate, setCalendarDate]`: 캘린더의 현재 선택 월
- `[currentEventPage, setCurrentEventPage]`: "참여할 경조사 일정" 페이지네이션 인덱스
- `[hostedEventPage, setHostedEventPage]`: "내가 주최한 경조사" 페이지네이션 인덱스
- `eventsPerPage`: 페이지당 표시 이벤트 수 (상수: 3)

### 모달 상태
- `[showNotificationModal, setShowNotificationModal]`: 알림 권한 모달 표시 여부
- `[showEventModal, setShowEventModal]`: 일정 추가 모달 표시 여부
- `[selectedDate, setSelectedDate]`: 선택된 날짜 (캘린더에서 선택)
- `[showEventListModal, setShowEventListModal]`: 일정 목록 모달 표시 여부
- `[selectedDateEvents, setSelectedDateEvents]`: 선택된 날짜의 이벤트 목록
- `[showTossConfirmModal, setShowTossConfirmModal]`: 토스 스타일 확인 모달 표시 여부
- `[showTossSuccessModal, setShowTossSuccessModal]`: 토스 스타일 성공 모달 표시 여부
- `[showCreateEventModal, setShowCreateEventModal]`: 경조사 만들기 모달 표시 여부
- `[showPremiumModal, setShowPremiumModal]`: 프리미엄 업그레이드 모달 표시 여부
- `[premiumModalType, setPremiumModalType]`: 프리미엄 모달 타입 ('wedding' 또는 'funeral')

### 통계 데이터
- `[monthlyStats, setMonthlyStats]`: 월별 통계 (구조 아래 참고)
  - `totalEvents`: 전체 경조사 수
  - `monthlyEvents`: 이번 달 경조사 수
  - `activeEvents`: 진행 중인 이벤트 수
  - `totalAmount`: 전체 받은 금액
  - `totalWeddingAmount`: 전체 축의금
  - `totalFuneralAmount`: 전체 조의금
  - `totalEntries`: 전체 기록 수
  - `receivedAmount`: 이번 달 받은 금액
  - `monthlyWeddingAmount`: 이번 달 축의금
  - `monthlyFuneralAmount`: 이번 달 조의금
  - `totalContributions`: 총 축의 수
  - `eventDetails`: 이벤트별 상세 정보
  - `sentAmount`: 보낸 금액
  - `sentContributions`: 보낸 축의 수
  - `period`: 기간 정보

---

## 2. Ref 목록

### 애니메이션
- `fadeAnim = useRef(new Animated.Value(1))`: 웰컴 슬라이드 페이드 애니메이션 (0~1)
- `confirmModalSlideAnim = useRef(new Animated.Value(0))`: 토스 확인 모달 슬라이드업 애니메이션
- `confirmModalOpacity = useRef(new Animated.Value(0))`: 토스 확인 모달 페이드인 애니메이션
- `successModalScale = useRef(new Animated.Value(0))`: 토스 성공 모달 스케일 애니메이션
- `successModalOpacity = useRef(new Animated.Value(0))`: 토스 성공 모달 페이드인 애니메이션

### 데이터 캐싱
- `eventIdsRef = useRef([])`: 현재 사용자의 이벤트 ID 배열 (실시간 업데이트 감지용)

---

## 3. 핸들러 함수

### 데이터 로딩
| 함수명 | 역할 | 트리거 |
|--------|------|--------|
| `loadUserData()` | 현재 사용자 정보 및 구독 정보 로드 | useFocusEffect (초기 로드) |
| `loadSubscriptionInfo(userId)` | 사용자 구독 정보 로드 | loadUserData() 내부 호출 |
| `loadEvents()` | 모든 사용자 이벤트(주최 + 참여) 로드 및 통계 추가 | useFocusEffect (초기 로드) |
| `loadActiveEvents()` | 활성 이벤트(주최 경조사 + 개인 일정) 로드 | useFocusEffect (초기 로드) |
| `loadMonthlyStatistics()` | 월별 통계 데이터 로드 | useFocusEffect (초기 로드) |

### 이벤트 핸들러
| 함수명 | 역할 | 트리거 |
|--------|------|--------|
| `handleQuickStart(eventType)` | 청첩장/부고장 만들기 네비게이션 | 빠른 시작 카드 클릭 |
| `handleActiveEventPress(event, source)` | 이벤트 카드 클릭 → EventDisplay 화면으로 이동 | 이벤트 카드 클릭 (source: 'management' 또는 'calendar') |
| `handleContributePress(event, e)` | 부조하기 버튼 → Contribution 화면으로 이동 | "부조하기" 버튼 클릭 |
| `handleViewMore()` | MyEvents 화면으로 이동 | "더보기" 버튼 클릭 |
| `handleStatisticsDetail()` | MyEvents 통계 탭으로 이동 | 통계 섹션 클릭 |

### 캘린더 핸들러
| 함수명 | 역할 | 트리거 |
|--------|------|--------|
| `handleCalendarDatePress(date, dayEvents)` | 캘린더 날짜 클릭 → 모달 표시 | CalendarComponent의 날짜 클릭 |
| `handleCalendarMonthChange(newDate)` | 캘린더 월 변경 | CalendarComponent의 좌우 네비게이션 |

### 모달 애니메이션
| 함수명 | 역할 | 트리거 |
|--------|------|--------|
| `showConfirmModal()` | 토스 확인 모달 슬라이드업 & 페이드인 애니메이션 | 캘린더 날짜 클릭 (일정 있음) |
| `hideConfirmModal()` | 토스 확인 모달 슬라이드다운 & 페이드아웃 애니메이션 | 모달 닫기 또는 배경 클릭 |
| `showSuccessModal()` | 토스 성공 모달 스케일 & 페이드인 애니메이션 | 일정 추가 성공 후 |
| `hideSuccessModal()` | 토스 성공 모달 스케일다운 & 페이드아웃 애니메이션 | 성공 모달 닫기 또는 3초 타이머 |

### 유틸리티 함수
| 함수명 | 역할 |
|--------|------|
| `isEventCompleted(eventDate)` | 서울 시간 기준으로 이벤트가 완료됐는지 판단 |
| `getUserName()` | 사용자명 반환 (props > metadata > phone > email 우선순위) |
| `getEventRole(event)` | 이벤트 역할 판단 (HOST 또는 PARTICIPANT) |
| `separateEventsByRole(events)` | 이벤트를 주최/참여로 분리 |
| `getMonthlyEvents()` | 현재 캘린더 월의 경조사 필터링 |
| `getGroupedMonthlyEvents()` | 월별 이벤트를 주최자/참여자로 분리 |
| `formatAmount(amount)` | 금액 포맷팅 (예: 10000원) |
| `handleContributionChange(eventType, contribution, eventIds)` | 실시간 축의금 변경 처리 |

### 보조 유틸리티 (Component 외부)
| 함수명 | 역할 |
|--------|------|
| `getEventIcon(eventType)` | 이벤트 타입별 아이콘 반환 |
| `getEventColor(eventType)` | 이벤트 타입별 색상 반환 |
| `getEventStatusColor(eventType)` | 이벤트 상태 배지 색상 반환 |
| `getEventTypeText(eventType)` | 이벤트 타입 텍스트 (경사/조사) 반환 |
| `formatDate(dateString)` | 날짜 포맷팅 (예: 2024년 12월 25일) |
| `formatDateWithTime(dateString, timeString)` | 날짜와 시간 함께 포맷팅 |

---

## 4. 섹션별 구성

### 4.1 헤더 (Header)
**위치:** 화면 최상단 (SafeAreaView 내)

**구성:**
- 좌측: 앱 로고 "정담"
- FREE/PREMIUM 뱃지 (userSubscription.subscription_type 기반)
- 사용자명 + 구독 상태 서브타이틀

**관련 State:**
- `user`, `userSubscription`

**관련 함수:**
- `getUserName()`

---

### 4.2 웰컴 슬라이드 배너 (Welcome Section)
**위치:** ScrollView 최상단

**구성:**
- 슬라이드 카드 (4개 슬라이드)
  - 색상 변경: Colors.primary, Colors.wedding, Colors.funeral, Colors.celebration
  - 제목, 서브타이틀, 아이콘 표시
- 슬라이드 인디케이터 (점 모양)
  
**애니메이션:**
- `fadeAnim`: 300ms fade out/in (슬라이드 변경 시)
- 자동 회전: 4초 간격

**관련 State:**
- `currentSlide`, `fadeAnim`

**관련 useEffect:**
- 자동 슬라이드 useEffect (4초 간격)

**슬라이드 데이터:**
```javascript
[
  { title: '마음을 나누는\n가장 쉬운 방법', subtitle: '정성스러운 마음을 기록해보세요 💝', icon: 'people' },
  { title: '소중한 순간을\n함께 기록하세요', subtitle: '결혼식, 돌잔치 등 기쁜 날들 🎉', icon: 'heart' },
  // ... 더 있음
]
```

---

### 4.3 경조사 만들기 카드 (Quick Section)
**위치:** 웰컴 배너 아래

**구성:**
- 청첩장 카드
  - 이미지 (wedding-Photoroom.png)
  - 제목: "청첩장"
  - 설명: "행복한 결혼 소식을 전해보세요"
  - 만들기 버튼 (Colors.wedding)
  - 상태 뱃지: "경사"
  - 제한 조건: FREE 플랜 시 max_wedding_events 비교

- 부고장 카드
  - 이미지 (funeral-Photoroom.png)
  - 제목: "부고장"
  - 설명: "슬픈 소식을 정중하게 전달하세요"
  - 만들기 버튼 (Colors.funeral)
  - 상태 뱃지: "조사"
  - 제한 조건: FREE 플랜 시 max_funeral_events 비교

**버튼 상태:**
- 제한됨 (disabled): FREE 플랜이고 최대 개수 도달
- 활성 (enabled): 프리미엄 또는 FREE 플랜이지만 여유 있음

**관련 State:**
- `userSubscription`

**관련 함수:**
- `handleQuickStart(eventType)`

**네비게이션:**
- CreateWedding (wedding)
- CreateFuneral (funeral)
- 프리미엄 모달 (제한 시)

---

### 4.4 내가 주최한 경조사 (Events Management Section)
**위치:** 빠른 시작 아래

**탭 구조:**
- 진행중 탭: activeEventsFiltered (isEventCompleted() === false)
- 최근 완료 탭: completedEventsFiltered (isEventCompleted() === true)

**이벤트 카드 구성:**
- 상단: 배지 + 날짜
  - 배지: 경사(wedding) 또는 조사(funeral)
  - 날짜: 이벤트 event_date
- 중단: 이벤트명, 위치
- 하단: 통계 바
  - 부조 수: total_contributions
  - 받은 금액: total_amount (포맷: "1,000원")

**페이지네이션:**
- 한 페이지: 3개 이벤트
- 이전/다음 버튼
- 페이지 인디케이터 (점)
- 현재 페이지: hostedEventPage

**빈 상태:**
- 이벤트가 없을 때: "아직 만든 경조사가 없습니다" 메시지 + 더보기 버튼

**관련 State:**
- `events`, `selectedTab`, `hostedEventPage`, `loading`

**관련 함수:**
- `handleActiveEventPress(event, 'management')`
- `handleViewMore()`

**네비게이션:**
- EventDisplay (이벤트 카드 클릭)
- MyEvents (더보기 클릭)

---

### 4.5 참여할 경조사 일정 (Calendar Section)
**위치:** 이벤트 관리 섹션 아래

**캘린더 컴포넌트:**
- 월 네비게이션 (좌우 버튼)
- 요일 헤더 (일~토)
- 날짜 그리드 (6주)
- 개인 일정만 표시 (source === 'personal' || is_personal_schedule === true)
- 일정 인디케이터: 점(1개), 점(2개), 점(3+개)

**캘린더 월 변경:**
- 좌측 버튼: 이전 월
- 중앙: "YYYY년 MM월"
- 우측 버튼: 다음 월
- 핸들러: handleCalendarMonthChange()

**일정 추가 버튼:**
- "일정 추가" 버튼 (Colors.primary 배경)
- 기본 date: new Date()

**월별 경조사 티켓 섹션:**
**제목:** "{YYYY년 MM월} 참여 예정 일정"

**경조사 티켓 카드 구성:**
- 좌측: 날짜
  - 날짜 (예: 25)
  - 요일 (예: 수)
- 중앙: 이벤트 정보
  - 이벤트명
  - 배지: 경사/조사
  - 위치
  - 날짜 (예: 12월 25일)
- 우측: 화살표

**페이지네이션:**
- 한 페이지: 3개 이벤트
- 이전/다음 버튼
- 페이지 인디케이터
- 현재 페이지: currentEventPage

**빈 상태:**
- "등록된 일정이 없습니다" + "새로운 경조사 일정을 추가해보세요"

**관련 State:**
- `activeEvents`, `calendarDate`, `currentEventPage`

**관련 함수:**
- `handleCalendarDatePress(date, dayEvents)`
- `handleCalendarMonthChange(newDate)`
- `getGroupedMonthlyEvents()` (참여자 일정만 필터링)

---

## 5. 모달 목록

### 5.1 일정 추가 모달 (EventAddModal)
**State:** `showEventModal`, `selectedDate`

**Props:**
- `visible`: showEventModal
- `onClose`: () => setShowEventModal(false)
- `selectedDate`: 선택된 날짜
- `onAddEvent`: 일정 추가 콜백

**콘텐츠:**
- 선택된 날짜 표시
- 이벤트 타입 선택 (wedding/funeral)
- 이벤트명 입력 (TextInput)
- 위치 입력 (TextInput)
- 확인/취소 버튼

**동작:**
- createPersonalSchedule() 호출
- 성공 시: showSuccessModal() 트리거
- 실패 시: Alert.alert()

**관련 State:**
- `selectedDate`, `showEventModal`

---

### 5.2 일정 목록 모달 (Event List Modal)
**State:** `showEventListModal`, `selectedDate`, `selectedDateEvents`

**콘텐츠:**
- 헤더: 선택된 날짜 + 요일
- ScrollView: selectedDateEvents 목록
  - 이벤트명
  - 배지 (결혼/조문)
  - 위치 + 위치 아이콘
  - 화살표
- 하단: "일정 추가" 버튼 (Colors.primary)

**동작:**
- "일정 추가" 클릭 시: showEventListModal 닫고 showEventModal 열기

**관련 State:**
- `showEventListModal`, `selectedDateEvents`

---

### 5.3 토스 스타일 확인 모달 (Toss Confirm Modal)
**State:** `showTossConfirmModal`, `selectedDate`, `selectedDateEvents`

**애니메이션:**
- confirmModalSlideAnim: 300px 하단에서 슬라이드업
- confirmModalOpacity: 0 → 1 (300ms)
- 닫기 시: 역 애니메이션 (250ms)

**콘텐츠:**
- 헤더: 날짜 + "N개의 일정이 있어요"
- ScrollView: selectedDateEvents 목록
  - 타입 배지 (좌측)
  - 이벤트 정보 (제목, 날짜, 위치)
  - 화살표 (우측)
- 하단 액션:
  - "일정 추가하기" 버튼 (Colors.primary)
  - "닫기" 버튼 (취소 스타일)

**동작:**
- "일정 추가하기": hideConfirmModal() → setShowEventModal(true)
- "닫기": hideConfirmModal()
- 배경 클릭: hideConfirmModal()

**관련 State:**
- `showTossConfirmModal`, `confirmModalSlideAnim`, `confirmModalOpacity`

**관련 함수:**
- `showConfirmModal()`
- `hideConfirmModal()`

---

### 5.4 토스 스타일 성공 모달 (Toss Success Modal)
**State:** `showTossSuccessModal`, `selectedDate`

**애니메이션:**
- successModalScale: 0 → 1 (spring, 300ms)
- successModalOpacity: 0 → 1 (300ms)
- 닫기 시: 역 애니메이션 (200ms)
- 자동 닫기: 3초 타이머

**콘텐츠:**
- 체크마크 아이콘 (흰색, 반경 배경)
- 제목: "일정이 추가되었어요"
- 서브타이틀: 날짜 (예: "12월 25일")
- 확인 버튼

**동작:**
- 확인 버튼 또는 3초 후 자동 닫기

**관련 State:**
- `showTossSuccessModal`, `successModalScale`, `successModalOpacity`

**관련 함수:**
- `showSuccessModal()`
- `hideSuccessModal()`

---

### 5.5 경조사 만들기 모달 (Create Event Modal)
**State:** `showCreateEventModal`

**콘텐츠:**
- 핸들 (드래그 표시)
- 제목: "경조사 만들기"
- 서브타이틀: "어떤 경조사를 준비하시나요?"
- 옵션 1: 청첩장 만들기
  - 아이콘 (wedding-Photoroom.png)
  - 설명: "결혼식 초대장과 부조금 관리"
  - 화살표
- 구분선 (Divider)
- 옵션 2: 부고장 만들기
  - 아이콘 (funeral-Photoroom.png)
  - 설명: "장례 안내와 조의금 관리"
  - 화살표
- 닫기 버튼 (하단)

**동작:**
- 청첩장: setShowCreateEventModal(false) → handleQuickStart('wedding')
- 부고장: setShowCreateEventModal(false) → handleQuickStart('funeral')
- 닫기: setShowCreateEventModal(false)

**관련 State:**
- `showCreateEventModal`

**관련 함수:**
- `handleQuickStart(eventType)`

---

### 5.6 프리미엄 업그레이드 모달 (Premium Modal)
**State:** `showPremiumModal`, `premiumModalType`

**콘텐츠:**
- 헤더: PREMIUM 뱃지 + 닫기 버튼
- 제목: "{청첩장/부고장} 무제한 생성"
- 서브타이틀: "프리미엄 플랜으로 업그레이드하고 제한 없이 이용하세요"
- 기능 목록:
  - 무제한 경조사 생성
  - 프리미엄 템플릿 이용
  - 고급 통계 및 분석
  - 우선 고객 지원
- 현재 제한 표시: "무료 플랜: {결혼식/장례식} 1개 제한"
- 버튼:
  - "나중에" (취소)
  - "프리미엄 시작하기" (Colors.primary)

**동작:**
- 프리미엄 시작하기: Alert.alert("준비 중")
- 나중에: setShowPremiumModal(false)
- 닫기: setShowPremiumModal(false)

**트리거:**
- handleQuickStart() 내에서 checkEventCreationLimit() 실패 시

**관련 State:**
- `showPremiumModal`, `premiumModalType`

---

### 5.7 알림 권한 모달 (NotificationPermissionModal)
**Component:** `<NotificationPermissionModal />`

**Props:**
- `visible`: showNotificationModal
- `onClose`: () => setShowNotificationModal(false)
- `userInfo`: userInfo

**관련 State:**
- `showNotificationModal`

**트리거:**
- useEffect: push_notification_enabled === false 시 2초 후 자동 표시

---

## 6. 네비게이션 경로

| 액션 | 대상 화면 | 파라미터 |
|------|----------|---------|
| 청첩장 만들기 | CreateWedding | - |
| 부고장 만들기 | CreateFuneral | - |
| 이벤트 카드 클릭 | EventDisplay | { eventId, templateStyle, categorizedImages, eventData } |
| "부조하기" 버튼 | Contribution | { eventId, eventName } |
| 더보기 클릭 | MyEvents | - |
| 통계 상세 | MyEvents | { initialTab: 'statistics' } |
| 알림 클릭 (축의금) | EventDisplay | { eventId } |

---

## 7. Supabase 데이터 로딩

### 로드된 함수들 (supabaseHelper에서 import)

| 함수명 | 용도 | 반환 데이터 |
|--------|------|-----------|
| `getUserEvents(userInfo)` | 사용자의 주최 경조사 로드 | events[] |
| `getActiveEvents(userInfo)` | 활성 이벤트 (주최 + 개인 일정) 로드 | events[] |
| `getAllUserEvents(userInfo)` | 모든 이벤트 로드 (주최 + 참여) | events[] |
| `createPersonalSchedule(scheduleData, userInfo)` | 개인 일정 생성 | { success, data, error } |
| `getPersonalSchedules(userInfo)` | 개인 일정 로드 | schedules[] |
| `debugUserInfo()` | 디버그: 사용자 정보 로깅 | - |
| `getEventGuestBook(eventId)` | 이벤트 방명록 로드 | guestbook[] |
| `getMonthlyStatistics(userId)` | 월별 통계 로드 | monthlyStats |
| `getEventStatistics(eventId)` | 이벤트별 통계 로드 | eventStats |
| `getUserSubscriptionInfo(userId)` | 사용자 구독 정보 로드 | subscriptionInfo |

### 실시간 Supabase 구독

**채널명:** `guest-book-realtime-{userId}`

**테이블:** `guest_book`

**감지 이벤트:** INSERT, UPDATE, DELETE

**동작:**
- 내 이벤트에 축의금이 들어오면:
  - Toast.show(): "💰 축의금 알림" 표시
  - handleContributionChange() 호출
  - loadEvents() 및 loadMonthlyStatistics() 새로고침

---

## 8. 구독 등급별 조건 렌더링

### FREE vs PREMIUM 분기

| 항목 | FREE | PREMIUM |
|------|------|---------|
| 청첩장 제한 | max_wedding_events (기본 1) | 무제한 |
| 부고장 제한 | max_funeral_events (기본 1) | 무제한 |
| 헤더 뱃지 | "FREE" (회색) | "PREMIUM" (빨강) |
| 빠른 시작 버튼 | 제한 도달 시 "제한됨" (disabled) | 활성 |
| 모달 트리거 | 제한 도달 시 프리미엄 모달 | - |

**확인 위치:**
```javascript
userSubscription?.subscription_type === 'free'
userSubscription?.current_wedding_events >= userSubscription?.max_wedding_events
userSubscription?.current_funeral_events >= userSubscription?.max_funeral_events
```

---

## 9. 애니메이션 상세

### 9.1 웰컰 슬라이드 페이드 애니메이션
```
Animated.timing(fadeAnim, {
  toValue: 0,
  duration: 300,
  useNativeDriver: true,
})
→ setCurrentSlide() 변경
→ Animated.timing(fadeAnim, {
  toValue: 1,
  duration: 300,
  useNativeDriver: true,
})
```
**주기:** 4초마다 자동 실행

### 9.2 토스 확인 모달 슬라이드업
```
Animated.parallel([
  Animated.timing(confirmModalSlideAnim, {
    toValue: 1,
    duration: 300,
    useNativeDriver: true,
  }),
  Animated.timing(confirmModalOpacity, {
    toValue: 1,
    duration: 300,
    useNativeDriver: true,
  }),
])
```
**interpolate:**
```javascript
confirmModalSlideAnim.interpolate({
  inputRange: [0, 1],
  outputRange: [300, 0], // 300px 아래에서 슬라이드업
})
```

### 9.3 토스 성공 모달 스케일 애니메이션
```
Animated.parallel([
  Animated.spring(successModalScale, {
    toValue: 1,
    tension: 50,
    friction: 8,
    useNativeDriver: true,
  }),
  Animated.timing(successModalOpacity, {
    toValue: 1,
    duration: 300,
    useNativeDriver: true,
  }),
])
```

---

## 10. useEffect 훅 목록

| 훅 순서 | 의존성 | 역할 | 정리 함수 |
|---------|--------|------|----------|
| 1 | [userInfo, session, isAuthenticated] | 네트워크 테스트 (Supabase 연결) | - |
| 2 (useFocusEffect) | [userInfo, session, dataLoaded, lastLoadTime] | 캐싱된 데이터 로드 (3개 함수 병렬) | - |
| 3 | [events] | eventIdsRef 최신 유지 | - |
| 4 | [fadeAnim] | 웰컴 슬라이드 자동 회전 (4초) | clearInterval |
| 5 | [userInfo] | 알림 권한 체크 | - |
| 6 | [userInfo] | 푸시 알림 리스너 등록 | removeNotificationSubscription |
| 7 | [userInfo] | Supabase 실시간 축의금 구독 | removeChannel |

---

## 11. 캘린더 컴포넌트 (CalendarComponent)

**Props:**
- `events`: activeEvents (개인 일정 포함)
- `onDatePress`: handleCalendarDatePress
- `onEventPress`: handleActiveEventPress
- `currentCalendarDate`: calendarDate
- `onMonthChange`: handleCalendarMonthChange

**구성:**
- 월 네비게이션 버튼
- 요일 헤더 (일~토)
- 날짜 그리드 (6주 × 7일)
- 날짜별 이벤트 인디케이터:
  - 1개: 점 1개
  - 2개: 점 2개
  - 3+개: "점 3개" + "N+"

**필터링:**
- 개인 일정만 표시 (source === 'personal' || is_personal_schedule === true)
- 주최한 경조사 제외

---

## 12. EventAddModal 컴포넌트

**Props:**
- `visible`: boolean
- `onClose`: () => void
- `selectedDate`: Date
- `onAddEvent`: (eventTitle, eventType, eventLocation) => void

**State:**
- `[eventTitle, setEventTitle]`: 입력된 일정명
- `[eventType, setEventType]`: 'wedding' 또는 'funeral'
- `[eventLocation, setEventLocation]`: 입력된 위치

**입력 필드:**
- 이벤트명 (TextInput, 필수)
- 이벤트 타입 (RadioButton: 결혼식/장례식)
- 위치 (TextInput, 선택)

**동작:**
- 확인 버튼: onAddEvent() 콜백
- 취소 버튼: onClose()

---

## 13. 주요 데이터 구조

### Event 객체 (내가 주최한 경조사)
```javascript
{
  id: string,
  event_type: 'wedding' | 'funeral',
  event_name: string,
  event_date: string (YYYY-MM-DD),
  location: string,
  created_by: string (userId),
  user_id: string,
  // ... 결혼식 필드
  groom_name: string,
  bride_name: string,
  ceremony_time: string,
  // ... 장례식 필드
  deceased_name: string,
  funeral_home: string,
  // ... 통계 필드 (로드 시 추가)
  total_contributions: number,
  total_amount: number,
  verified_count: number,
  attending_count: number,
  average_amount: number,
}
```

### Personal Schedule 객체 (개인 일정)
```javascript
{
  id: string,
  title: string,
  event_type: 'wedding' | 'funeral',
  event_date: string (YYYY-MM-DD),
  location: string,
  source: 'personal',
  is_personal_schedule: true,
  created_at: string,
}
```

### Subscription 객체
```javascript
{
  subscription_type: 'free' | 'premium',
  current_wedding_events: number,
  max_wedding_events: number,
  current_funeral_events: number,
  max_funeral_events: number,
}
```

---

## 14. 상수 및 설정값

| 상수명 | 값 | 용도 |
|--------|-----|------|
| `CACHE_DURATION` | 30000 (ms) | 데이터 캐시 기간 |
| `eventsPerPage` | 3 | 페이지네이션 항목 수 |
| `slides.length` | 4 (추정) | 웰컬 슬라이드 개수 |
| `EVENT_ROLES.HOST` | 'host' | 주최자 역할 |
| `EVENT_ROLES.PARTICIPANT` | 'participant' | 참여자 역할 |

---

## 15. 조건부 렌더링 주요 포인트

### 로딩 상태
```javascript
{loading ? (
  <View><Ionicons name="refresh" /></View>
) : currentEvents.length > 0 ? (
  <View>이벤트 목록</View>
) : (
  <View>빈 상태</View>
)}
```

### 구독 제한 확인
```javascript
disabled={
  userSubscription?.subscription_type === 'free' && 
  userSubscription?.current_wedding_events >= userSubscription?.max_wedding_events
}
```

### 개인 일정 필터링
```javascript
const personalSchedules = events.filter(event => 
  event.source === 'personal' || event.is_personal_schedule
);
```

### 진행중/완료 분류
```javascript
const activeEvents = hostedEvents.filter(event => !isEventCompleted(event.event_date));
const completedEvents = hostedEvents.filter(event => isEventCompleted(event.event_date));
```

---

## 16. 알림 관련 기능

### 푸시 알림
- **트리거:** Expo Notifications 수신
- **타입:** 'contribution' (축의금)
- **동작:**
  - 포그라운드: Toast.show() + loadEvents() + loadMonthlyStatistics()
  - 알림 클릭: EventDisplay 화면으로 이동

### 실시간 업데이트 (Supabase Channel)
- **테이블:** guest_book
- **감지:** INSERT, UPDATE, DELETE
- **동작:** Toast.show() + handleContributionChange()

### 알림 권한 모달
- **표시 조건:** push_notification_enabled === false && 2초 후
- **컴포넌트:** NotificationPermissionModal

---

## 17. 주의사항 및 특수 처리

### 시간대 처리
- 서울 시간 기준 (UTC+9)
- isEventCompleted(): 자정 기준으로 완료 판단
- 날짜만 비교 (시간 무시)

### 중복 제거
```javascript
const hostedEvents = events.filter((event, index, self) => {
  const isUnique = index === self.findIndex(e => e.id === event.id);
  return isUnique && isNotPersonalSchedule && isHostedEvent;
});
```

### 사용자 정보 우선순위
1. Props: userInfo.userId
2. Supabase: session.user.id
3. AsyncStorage: 'userInfo'
4. 폴백: '사용자'

### 역할 구분
- **HOST**: created_by 있음 또는 user_id 있고 is_personal_schedule !== true
- **PARTICIPANT**: source === 'personal' 또는 is_personal_schedule === true

---

## 18. 체크리스트 (QA용)

### 헤더
- [ ] 정담 로고 표시
- [ ] FREE/PREMIUM 뱃지 표시 (구독 타입 기반)
- [ ] 사용자명 + 구독 상태 서브타이틀

### 웰컴 슬라이드
- [ ] 4개 슬라이드 자동 회전 (4초 간격)
- [ ] 슬라이드 인디케이터 표시
- [ ] 페이드 애니메이션 (300ms)
- [ ] 모든 슬라이드 제목/서브타이틀/아이콘 표시

### 경조사 만들기
- [ ] 청첩장 카드 표시
- [ ] 부고장 카드 표시
- [ ] FREE 플랜 제한 체크 (청첩장)
- [ ] FREE 플랜 제한 체크 (부고장)
- [ ] 제한됨 상태 버튼 비활성화
- [ ] 클릭 시 CreateWedding/CreateFuneral 네비게이션

### 내가 주최한 경조사
- [ ] 탭 2개 표시 (진행중/최근 완료)
- [ ] 이벤트 카드 3개씩 페이지네이션
- [ ] 이벤트 카드 구성: 배지 + 날짜 + 위치 + 통계
- [ ] 빈 상태 메시지 표시
- [ ] 더보기 버튼 → MyEvents 이동

### 캘린더 및 일정
- [ ] 캘린더 월 네비게이션 (좌우 버튼)
- [ ] 개인 일정만 표시 (주최 경조사 제외)
- [ ] 일정 인디케이터 (점 표시)
- [ ] "일정 추가" 버튼 클릭 → 모달 표시
- [ ] 캘린더 날짜 클릭:
  - [ ] 일정 없음: EventAddModal
  - [ ] 일정 있음: 토스 확인 모달
- [ ] 월별 경조사 티켓 3개씩 페이지네이션
- [ ] 빈 상태 메시지 표시

### 모달 - 일정 추가
- [ ] EventAddModal 표시 (캘린더 클릭 시)
- [ ] 날짜 표시 (자동 설정)
- [ ] 이벤트명 입력
- [ ] 타입 선택 (wedding/funeral)
- [ ] 위치 입력
- [ ] 확인 버튼 → 데이터 저장
- [ ] 성공 모달 자동 표시 (3초 후 자동 닫기)

### 모달 - 토스 확인
- [ ] 확인 모달 슬라이드업 애니메이션 (300ms)
- [ ] 날짜 + "N개의 일정이 있어요" 표시
- [ ] 일정 목록 스크롤
- [ ] "일정 추가하기" 버튼 → EventAddModal 열기
- [ ] "닫기" 버튼 → 모달 닫기
- [ ] 배경 클릭 → 모달 닫기

### 모달 - 토스 성공
- [ ] 성공 모달 스케일 애니메이션 (spring)
- [ ] 체크마크 아이콘 표시
- [ ] "일정이 추가되었어요" 텍스트
- [ ] 날짜 표시
- [ ] 3초 후 자동 닫기
- [ ] 확인 버튼 클릭 → 즉시 닫기

### 모달 - 경조사 만들기
- [ ] 모달 표시 (빠른 시작에서 트리거 가능)
- [ ] 청첩장 옵션 표시
- [ ] 부고장 옵션 표시
- [ ] 각 옵션 클릭 → 해당 CreateScreen 이동

### 모달 - 프리미엄
- [ ] 제한 도달 시 표시
- [ ] 제한 타입 (wedding/funeral) 표시
- [ ] 기능 목록 표시
- [ ] "프리미엄 시작하기" 버튼
- [ ] "나중에" 버튼

### 모달 - 알림 권한
- [ ] 알림 권한 확인 (push_notification_enabled === false)
- [ ] 2초 후 자동 표시
- [ ] NotificationPermissionModal 렌더링

### 실시간 기능
- [ ] 축의금 들어올 때 Toast 표시
- [ ] 축의금 알림 클릭 → EventDisplay 이동
- [ ] 통계 자동 새로고침 (loadMonthlyStatistics)

### 네비게이션
- [ ] EventDisplay: eventId, templateStyle, categorizedImages, eventData 전달
- [ ] Contribution: eventId, eventName 전달
- [ ] MyEvents: initialTab 파라미터 전달
- [ ] CreateWedding/CreateFuneral: 경조사 타입 따라 이동

---

**작성 완료 날짜:** 2026-04-14

