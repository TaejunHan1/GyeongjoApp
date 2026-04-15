# HomeScreen 재설계 Spec (Toss Design System 준수)

**작성자:** designer  
**작성일:** 2026-04-14  
**목표:** 48개 기능 전부 유지, Toss 디자인 언어 적용, 시각적 위계와 상호작용 개선

---

## 1. 디자인 원칙

### 1.1 Toss 디자인 시스템 준수
- **카드 디자인**: 반경 16px, 배경 #FFFFFF, subtle shadow (0 2 8 rgba(0,0,0,0.08))
- **타이포그래피**: 명확한 계층 구조 (Title 22/700 → Section 18/700 → Body 15/600 → Meta 13/400)
- **색상**: Primary #3182F6, Text Primary #191F28, Text Secondary #8B95A1, Background #F2F4F6
- **아이콘**: 실제 icon 또는 gradient 박스 (이모지 절대 금지)
- **여백**: paddingHorizontal 20, section gap 8 divider, 일관된 spacing

### 1.2 이전 실패 교훈
❌ 제거된 항목: 없음 (인벤토리 48개 전부 유지)  
❌ 플랫 디자인: Shadow + Radius 16 적극 활용  
❌ 이모지 아이콘: 컬러 박스 + 실제 icon  
❌ 감각 없는 ListRow: 명확한 시각적 위계, 좌측 accent 컬러, 여백 최적화

---

## 2. 전체 화면 구조 (ASCII Wireframe)

```
┌─────────────────────────────────────────┐
│ 헤더                                    │
│ [정담] [FREE]  2026년 4월               │
└─────────────────────────────────────────┘
│ [SafeAreaView 시작]                     │
├─────────────────────────────────────────┤
│ 📱 웰컴 슬라이드 배너                     │
│ [슬라이드 카드 (4개)] ● ● ◯ ◯            │
│ 페이드 애니메이션 (300ms)               │
├─────────────────────────────────────────┤
│ 경조사 만들기 카드 그리드                │
│ ┌──────────────┬──────────────┐        │
│ │ [결혼] 이미지 │ [장례] 이미지 │        │
│ │ 청첩장        │ 부고장        │        │
│ │ 만들기        │ 만들기        │        │
│ └──────────────┴──────────────┘        │
├─────────────────────────────────────────┤
│ 내가 주최한 경조사                       │
│ [진행중] [최근완료] ← 세그먼트 컨트롤   │
│ [3개 이벤트 카드] ← 페이지네이션 3/N   │
│ < [점점점] >                           │
├─────────────────────────────────────────┤
│ 참여할 경조사 일정                       │
│ [캘린더] (월별 네비게이션)               │
│ ◀ 2026년 4월 ▶                         │
│ [날짜 그리드 6주 × 7일]                 │
│ [일정 추가 버튼]                        │
│                                        │
│ 2026년 4월 참여 예정 일정                │
│ ┌──────────────────────────────┐      │
│ │ [25] [3개 일정] →           │      │
│ │ [수]                        │      │
│ │ 이벤트명, [배지], 위치       │      │
│ └──────────────────────────────┘      │
│ [< 1/2 >] 페이지네이션                 │
└─────────────────────────────────────────┘
[푸시 알림 모달, 성공 모달 등 레이어드 오버레이]
```

---

## 3. 섹션별 상세 설계

### 3.1 헤더 (Header)

**레이아웃:**
```
┌────────────────────────────────────────┐
│ [정담]  [FREE 뱃지]  사용자명 · 구독상태 │
│        paddingH 20, paddingV 12        │
└────────────────────────────────────────┘
```

**컴포넌트:**
- **좌측:** "정담" 텍스트 (Title 22/700, #191F28)
- **중앙:** 사용자명 (Body 15/600, #191F28) + 구독상태 (Meta 13/400, #8B95A1)
- **우측:** 뱃지
  - FREE: 배경 #E5E8EB, 텍스트 #191F28 (Meta 13/700)
  - PREMIUM: 배경 #FF5722 (또는 #E31C3D), 텍스트 #FFFFFF (Meta 13/700)

**여백:**
- paddingHorizontal: 20
- paddingVertical: 12
- 헤더 하단: 8px separator (#E5E8EB)

**상태 관리:**
- `user.name` → 사용자명 표시
- `userSubscription.subscription_type` → 뱃지 컬러 결정

---

### 3.2 웰컴 슬라이드 배너 (Welcome Section)

**레이아웃:**
```
┌────────────────────────────────────────┐
│ [← 슬라이드 카드 (색상 변경) →]         │
│ ● ● ◯ ◯ (인디케이터)                  │
│ paddingH 20, 슬라이드마다 gap 12       │
└────────────────────────────────────────┘
```

**슬라이드 카드 스타일:**
- **배경:** Gradient (Primary #3182F6 → 더 밝은 blue) 또는 단색
- **반경:** 16
- **높이:** 200 (fixed)
- **여백:** paddingH 16, paddingV 20
- **그림자:** shadow 0 2 12 rgba(0,0,0,0.1)

**슬라이드별 배경색:**
1. Primary #3182F6 (기본 파란색)
2. Wedding #FF6B6B (따뜻한 빨강 또는 #FF5722)
3. Funeral #6C757D (회색)
4. Celebration #FFD93D (노랑)

**타이포그래피:**
- **제목:** Section 18/700, #FFFFFF
- **서브타이틀:** Body 15/600, #FFFFFF (opacity 0.9)
- **아이콘:** Ionicons (people, heart, flower, gift) 또는 custom SVG, 크기 48, 우측 정렬

**애니메이션:**
- **페이드:** Fade in/out 300ms (슬라이드 변경)
- **자동 회전:** 4초 간격
- **인디케이터:** 현재 활성 점은 Primary #3182F6, 비활성 점은 #D1D6DB

**관련 State:**
- `currentSlide` (0~3)
- `fadeAnim` (useRef Animated.Value)

---

### 3.3 경조사 만들기 (Quick Start Cards)

**레이아웃:**
```
┌────────────────────────────────────────┐
│ 경조사 만들기                          │
│ ┌──────────────┬──────────────┐       │
│ │ [이미지]      │ [이미지]      │       │
│ │ 청첩장        │ 부고장        │       │
│ │ 행복한 결혼... │ 슬픈 소식...  │       │
│ │ [만들기]      │ [만들기]      │       │
│ │ [경사]        │ [조사]        │       │
│ └──────────────┴──────────────┘       │
│ paddingH 20, 카드 gap 12              │
└────────────────────────────────────────┘
```

**카드 구성 (각 카드):**

**이미지 섹션:**
- 이미지 높이: 140
- 반경: 16 (top)
- AspectRatio: square
- Placeholder: #F2F4F6 (로딩 중)

**컨텐츠 섹션:**
- 배경: #FFFFFF
- 반경: 16 (bottom)
- paddingH 12, paddingV 16

**타이포그래피:**
- **제목:** Body 15/700, #191F28 (예: "청첩장")
- **설명:** Meta 13/400, #8B95A1 (예: "행복한 결혼 소식을 전해보세요")

**액션 영역:**
- 마진: marginTop 12
- **버튼:**
  - 활성: Background Colors.wedding (#FF6B6B) or Colors.funeral (#6C757D), 텍스트 #FFFFFF
  - 제한됨: Background #E5E8EB, 텍스트 #8B95A1, opacity 0.6, disabled={true}
  - 높이: 40
  - 반경: 8
  - 텍스트: Body 15/600

**상태 배지:**
- 위치: 카드 우상단 (절대 위치, top 12, right 12)
- 배경: Colors.wedding (경사) 또는 Colors.funeral (조사)
- 텍스트: #FFFFFF (Meta 13/700)
- 반경: 6
- paddingH 8, paddingV 4

**카드 전체 스타일:**
- 배경: #FFFFFF
- 반경: 16
- 그림자: 0 2 8 rgba(0,0,0,0.08)
- 높이: ~280

**제한됨 상태 디자인:**
- 배경: #F9FAFB (배제됨 시각화)
- 이미지: opacity 0.5
- 버튼: disabled
- 컨텐츠: opacity 0.6

**관련 State:**
- `userSubscription.current_wedding_events`
- `userSubscription.max_wedding_events`
- `userSubscription.current_funeral_events`
- `userSubscription.max_funeral_events`

---

### 3.4 내가 주최한 경조사 (Events Management Section)

**레이아웃:**
```
┌────────────────────────────────────────┐
│ 내가 주최한 경조사                      │
│ [진행중] [최근완료] ← Pill 배경 segmented control │
│                                        │
│ ┌────────────────────────────────┐   │
│ │ [경사] 2026년 4월 25일          │   │
│ │ 김철수의 결혼식                  │   │
│ │ 올림픽 공원 올림픽홀 B홀         │   │
│ │ 부조: 42명 | 받은금액: 2,100,000원 │   │
│ └────────────────────────────────┘   │
│ ┌────────────────────────────────┐   │
│ │ ...                             │   │
│ └────────────────────────────────┘   │
│ [< 1/3 >] 페이지네이션                │
└────────────────────────────────────────┘
```

**세그먼트 컨트롤:**
- 배경: #F2F4F6
- 활성 탭: 배경 #FFFFFF, 반경 12, 그림자 0 1 4 rgba(0,0,0,0.06)
- 비활성 탭: 배경 transparent
- 텍스트: Body 15/600, 활성 #191F28, 비활성 #8B95A1
- 높이: 40
- paddingH 4

**이벤트 카드:**

**상단 배지 + 날짜:**
- 배경: transparent
- flexDirection: row
- justifyContent: space-between
- marginBottom: 8
  - 좌측: 배지 (경사 #FF6B6B / 조사 #6C757D, 텍스트 #FFFFFF, Meta 13/700, paddingH 8, paddingV 4)
  - 우측: 날짜 (Body 15/600, #8B95A1, "2026년 4월 25일")

**중앙 이벤트 정보:**
- marginBottom: 12
  - 이벤트명: Section 16/700, #191F28
  - 위치: Meta 13/400, #8B95A1 (Ionicons location 아이콘 포함, icon color #8B95A1)

**하단 통계 바:**
- 배경: #F2F4F6
- paddingH 12, paddingV 8
- 반경: 8
- flexDirection: row
- justifyContent: space-around
  - 각 항목: Meta 13/600, #191F28, 중앙정렬
    - 부조: "42명"
    - 금액: "2,100,000원"

**카드 전체:**
- 배경: #FFFFFF
- 반径: 16
- paddingH 16, paddingV 16
- marginBottom: 12
- 그림자: 0 2 8 rgba(0,0,0,0.08)
- 터치 시: backgroundColor fade (0.04)

**페이지네이션:**
- 위치: 카드 하단
- 스타일: "[< 1/3 >]" 형태 또는 점 표시 (● ◯ ◯)
- Meta 13/400, #8B95A1, 중앙정렬

**빈 상태 (Empty State):**
```
┌────────────────────────────────────────┐
│ [봉투 아이콘 또는 이미지]              │
│ 아직 만든 경조사가 없습니다             │
│ [더보기 버튼]                         │
└────────────────────────────────────────┘
```
- 텍스트: Body 15/600, #191F28
- 부설명: Meta 13/400, #8B95A1
- 버튼: 아래 정의

**관련 State:**
- `events` (필터링: 내 주최)
- `selectedTab` ('active' | 'completed')
- `hostedEventPage` (페이지네이션)

---

### 3.5 참여할 경조사 일정 (Calendar Section)

**섹션 구조:**
```
┌────────────────────────────────────────┐
│ 참여할 경조사 일정                      │
│                                        │
│ 월 네비게이션:                         │
│ ◀ 2026년 4월 ▶                       │
│                                        │
│ 캘린더 그리드:                         │
│ 일 월 화 수 목 금 토                  │
│ [1]  [2]  ...  [7]                   │
│ ...                                   │
│ [28] [29] ... [30]                   │
│                                        │
│ [일정 추가] 버튼                       │
│                                        │
│ 2026년 4월 참여 예정 일정              │
│ ┌────────────────────────────┐       │
│ │ [25] [수] [이벤트정보] →   │       │
│ │ [26] [목] [이벤트정보] →   │       │
│ │ [27] [금] [이벤트정보] →   │       │
│ └────────────────────────────┘       │
│ [< 1/2 >]                            │
└────────────────────────────────────────┘
```

**캘린더 컴포넌트:**

**월 네비게이션:**
- flexDirection: row
- justifyContent: space-between
- alignItems: center
- paddingH 20, marginBottom 16
  - 좌측: 버튼 (Ionicons chevron-back, 50x50, pressable)
  - 중앙: 텍스트 (Section 18/700, #191F28, "2026년 4월")
  - 우측: 버튼 (Ionicons chevron-forward, 50x50, pressable)

**요일 헤더:**
- 7개 셀 (일~토)
- 텍스트: Meta 13/700, #8B95A1, 중앙정렬
- 높이: 32

**날짜 그리드:**
- 6주 × 7일
- 각 셀:
  - 현재 월: 배경 transparent, 텍스트 #191F28
  - 다른 월: 배경 transparent, 텍스트 #D1D6DB
  - 오늘: 배경 #E0E8F9 (subtle), 텍스트 #3182F6 (Section 15/600)
  - 높이: 40
  - 반경: 8 (호버 시에만)

**일정 인디케이터:**
- 위치: 날짜 텍스트 하단
- 점의 크기: 4
- 점의 색상: #3182F6 (personal schedule)
- 간격: 2
- 1개: 중앙 정렬, 2개: 좌우 대칭, 3+개: 점 3개 + "+"

**일정 추가 버튼:**
- marginTop: 16
- marginH: 20
- 전체 너비
- 배경: #3182F6
- 텍스트: #FFFFFF (Body 15/700)
- 높이: 44
- 반경: 8

**경조사 티켓 섹션:**

**섹션 제목:**
- marginTop: 24
- marginH: 20
- marginBottom: 12
- 텍스트: Section 18/700, #191F28 ("2026년 4월 참여 예정 일정")

**티켓 카드:**
```
┌──────────────────────────────────────┐
│ [좌측]  [중앙]             [우측]     │
│ ┃       이벤트명            ▶         │
│ ┃ 25    [경사] | 올림픽홀   ▶         │
│ ┃       12월 25일           ▶         │
│ ┃ 수     위치 표시          ▶         │
└──────────────────────────────────────┘
```

**카드 구성:**

**좌측 (Accent Bar):**
- 너비: 4
- 배경: event_type에 따른 색상 (wedding #FF6B6B / funeral #6C757D)
- 높이: 전체 카드 높이

**좌측 (날짜 영역):**
- paddingH 12, paddingV 12
- flexDirection: column
- alignItems: center
  - 날짜 숫자: Title 20/700, #191F28 (예: "25")
  - 요일: Meta 13/400, #8B95A1 (예: "수")

**중앙 (이벤트 정보):**
- paddingV 12, 확장 (flex 1)
- flexDirection: column
  - 이벤트명: Body 15/700, #191F28
  - 배지 + 위치: flexDirection row, gap 8
    - 배지: Meta 13/700, 색상 (경사 #FF6B6B / 조사 #6C757D), 배경 rgba(색상, 0.1)
    - 위치: Meta 13/400, #8B95A1 (Ionicons location-sharp 아이콘)

**우측 (액션):**
- paddingH 12, paddingV 12
- Ionicons chevron-forward, #8B95A1

**카드 전체:**
- 배경: #FFFFFF
- 반径: 12
- marginH 20, marginBottom 12
- flexDirection: row
- alignItems: center
- 그림자: 0 1 4 rgba(0,0,0,0.06)

**페이지네이션:**
- marginTop: 12
- 점 스타일 또는 "[< 1/2 >]"

**빈 상태 (Empty State):**
```
┌────────────────────────────────────────┐
│ [캘린더 아이콘]                        │
│ 등록된 일정이 없습니다                  │
│ 새로운 경조사 일정을 추가해보세요       │
│ [일정 추가 버튼]                       │
└────────────────────────────────────────┘
```

**관련 State:**
- `activeEvents` (필터링: 참여 경조사만)
- `calendarDate` (현재 월)
- `currentEventPage` (페이지네이션)

---

## 4. 모달 설계 (7개)

### 4.1 일정 추가 모달 (EventAddModal)

**스타일:**
- 배경: #FFFFFF
- 높이: auto (최대 90% 화면 높이)
- 반경: 20 (top only)
- paddingH 20, paddingV 24

**콘텐츠:**

**핸들:**
- 높이: 4
- 너비: 40
- 배경: #D1D6DB
- 반경: 2
- 중앙정렬, marginBottom 16

**제목:**
- Section 18/700, #191F28, marginBottom 8

**날짜 표시:**
- Body 15/600, #8B95A1, marginBottom 20
- 예: "2026년 4월 25일 (수)"

**입력 필드:**

**이벤트명:**
- 레이블: Meta 13/700, #191F28, marginBottom 4
- 입력: TextInput, BorderWidth 1, BorderColor #E5E8EB, 높이 44, 반경 8, paddingH 12
- placeholder: #8B95A1 (opacity 0.5)

**이벤트 타입 (라디오 버튼):**
- 레이블: Meta 13/700, #191F28, marginTop 16, marginBottom 8
- 옵션:
  - "결혼식" (Colors.wedding)
  - "장례식" (Colors.funeral)
- 각 옵션: flexDirection row, gap 8, marginBottom 8
  - 원형 버튼: 크기 20, borderWidth 2
  - 텍스트: Body 15/600

**위치 입력:**
- 레이블: Meta 13/700, #191F28, marginTop 16, marginBottom 4
- 입력: TextInput (선택사항), BorderWidth 1, BorderColor #E5E8EB, 높이 44, 반경 8, paddingH 12

**액션 버튼:**
- marginTop: 24
- flexDirection: row
- gap: 8
  - "취소": 배경 #F2F4F6, 텍스트 #191F28, 높이 44, 반경 8, flex 1
  - "확인": 배경 #3182F6, 텍스트 #FFFFFF, 높이 44, 반경 8, flex 1

---

### 4.2 일정 목록 모달 (Event List Modal)

**스타일:**
- 배경: #FFFFFF
- 높이: 90%
- 반경: 20 (top)
- paddingH 0, paddingV 0

**헤더:**
- paddingH 20, paddingV 16
- borderBottom 1 / #E5E8EB
- flexDirection: row
- justifyContent: space-between
  - 좌측: 텍스트 (Section 18/700, #191F28, "선택된 날짜 (요일)")
  - 우측: 닫기 버튼 (Ionicons close)

**일정 목록:**
- ScrollView, paddingH 20, paddingV 12
- 각 일정:
  - 배경: transparent
  - 높이: 64
  - borderBottom 1 / #E5E8EB
  - flexDirection: row
  - gap: 12
    - 배지: 너비 4, 배경 색상 (경사/조사)
    - 정보: flex 1
      - 제목: Body 15/700, #191F28
      - 배지 + 위치: Meta 13/400, #8B95A1
    - 아이콘: Ionicons chevron-forward, #8B95A1

**하단 액션:**
- borderTop 1 / #E5E8EB
- paddingH 20, paddingV 16
- "일정 추가" 버튼: 배경 #3182F6, 텍스트 #FFFFFF, 높이 44, 반경 8, 전체 너비

---

### 4.3 토스 확인 모달 (Toss Confirm Modal)

**애니메이션:**
- 진입: slideUp (300px 아래에서) + fadeIn, 300ms
- 퇴장: slideDown + fadeOut, 250ms

**스타일:**
- 배경: #FFFFFF (또는 반투명 배경 오버레이)
- 높이: auto
- 반경: 20 (top)
- paddingH 20, paddingV 20

**헤더:**
- flexDirection: row
- justifyContent: space-between
- marginBottom: 16
  - 좌측: 텍스트 (Section 18/700, #191F28, "선택된 날짜" + "N개의 일정이 있어요")
  - 우측: 닫기 버튼

**일정 목록:**
- ScrollView, marginBottom 16
- 각 일정 (4.2와 동일)

**액션 버튼:**
- flexDirection: column
- gap: 8
  - "일정 추가하기": 배경 #3182F6, 텍스트 #FFFFFF, 높이 44, 반경 8
  - "닫기": 배경 #F2F4F6, 텍스트 #191F28, 높이 44, 반경 8

---

### 4.4 성공 모달 (Toss Success Modal)

**애니메이션:**
- 진입: scale (0 → 1, spring, 300ms) + fadeIn
- 퇴장: scale (1 → 0) + fadeOut, 200ms
- 자동 닫기: 3초 타이머

**배경:**
- 반투명 오버레이 (rgba(0,0,0,0.4))

**모달 콘텐츠:**
- 배경: #FFFFFF
- 반경: 16
- paddingH 24, paddingV 32
- 너비: 280 (고정)
- 중앙정렬 (Flex center)

**구성:**
- 체크마크 아이콘: 크기 80, 배경 #E8F5E9 (green), 중앙정렬, 반경 40
  - 아이콘 색상: #4CAF50
- 제목: Section 18/700, #191F28, marginTop 20, 중앙정렬
  - 텍스트: "일정이 추가되었어요"
- 서브타이틀: Body 15/600, #8B95A1, marginTop 8, 중앙정렬
  - 텍스트: 선택된 날짜 (예: "12월 25일")
- 버튼: marginTop 24, 배경 #3182F6, 텍스트 #FFFFFF, 높이 44, 반경 8, 전체 너비

---

### 4.5 경조사 만들기 모달 (Create Event Modal)

**스타일:**
- 배경: #FFFFFF
- 높이: auto
- 반경: 20 (top)
- paddingH 20, paddingV 24

**핸들:**
- 높이: 4, 너비: 40, 배경: #D1D6DB, 반경: 2, 중앙정렬

**제목:**
- Section 18/700, #191F28, marginBottom 8
- 텍스트: "경조사 만들기"

**서브타이틀:**
- Body 15/600, #8B95A1, marginBottom 20
- 텍스트: "어떤 경조사를 준비하시나요?"

**옵션 1 - 청첩장:**
- 배경: transparent
- paddingH 0, paddingV 16
- flexDirection: row
- gap: 12
- borderBottom: 1 / #E5E8EB
  - 이미지: 크기 60x60, 반径 8, 이미지 로드
  - 텍스트 (flex 1):
    - 제목: Body 15/700, #191F28 ("청첩장 만들기")
    - 설명: Meta 13/400, #8B95A1 ("결혼식 초대장과 부조금 관리")
  - 아이콘: Ionicons chevron-forward, #8B95A1

**옵션 2 - 부고장:**
- 옵션 1과 동일 (이미지, 텍스트, 아이콘만 변경)

**닫기 버튼:**
- marginTop: 20
- 배경: #F2F4F6
- 텍스트: #191F28
- 높이: 44
- 반경: 8
- 텍스트: "닫기"

---

### 4.6 프리미엄 업그레이드 모달 (Premium Modal)

**스타일:**
- 배경: 반투명 오버레이
- 모달: 배경 #FFFFFF, 반径 20, paddingH 24, paddingV 32, 너비 90%

**헤더:**
- flexDirection: row
- justifyContent: space-between
- marginBottom: 16
  - 좌측: 뱃지 (배경 #FF5722, 텍스트 #FFFFFF, "PREMIUM")
  - 우측: 닫기 버튼

**제목:**
- Title 22/700, #191F28, marginBottom 8
- 텍스트: "{청첩장/부고장} 무제한 생성"

**서브타이틀:**
- Body 15/600, #8B95A1, marginBottom 20
- 텍스트: "프리미엄 플랜으로 업그레이드하고 제한 없이 이용하세요"

**기능 목록:**
- marginBottom: 20
- 각 항목: flexDirection row, gap 8, marginBottom 8
  - 체크마크: #3182F6
  - 텍스트: Body 15/600, #191F28
    - "무제한 경조사 생성"
    - "프리미엄 템플릿 이용"
    - "고급 통계 및 분석"
    - "우선 고객 지원"

**현재 제한:**
- 배경: #FFF3E0 (또는 #FFE0B2)
- paddingH 12, paddingV 12
- 반경: 8
- marginBottom: 20
- 텍스트: Body 13/400, #E65100
- 텍스트: "무료 플랜: 결혼식 1개 제한"

**액션 버튼:**
- flexDirection: column
- gap: 8
  - "나중에": 배경 #F2F4F6, 텍스트 #191F28, 높이 44, 반경 8
  - "프리미엄 시작하기": 배경 #3182F6, 텍스트 #FFFFFF, 높이 44, 반경 8

---

### 4.7 알림 권한 모달 (NotificationPermissionModal)

**스타일:**
- 배경: 반투명 오버레이
- 모달: 배경 #FFFFFF, 반径 20, paddingH 24, paddingV 32

**콘텐츠:**
- 아이콘: Ionicons bell-outline, 크기 64, 색상 #3182F6, 중앙정렬, marginBottom 16
- 제목: Section 18/700, #191F28, 중앙정렬, marginBottom 8
  - 텍스트: "알림을 켜시겠어요?"
- 설명: Body 15/600, #8B95A1, 중앙정렬, marginBottom 24
  - 텍스트: "축의금 소식을 받으려면 알림을 허용해주세요"

**액션 버튼:**
- flexDirection: column
- gap: 8
  - "예, 켜겠습니다": 배경 #3182F6, 텍스트 #FFFFFF, 높이 44, 반경 8
  - "나중에": 배경 #F2F4F6, 텍스트 #191F28, 높이 44, 반경 8

---

## 5. 로딩 & 상태 관리 디자인

### 5.1 로딩 상태 (Skeleton)

**스켈레톤 패턴:**
- 배경: #F2F4F6
- 애니메이션: 좌우 fade (shimmer, 1.5s)
- 반경: 8 (일반), 16 (카드)
- 높이: 실제 컴포넌트 높이와 동일

**영역별:**
- 헤더: 로고 + 뱃지 스켈레톤
- 웰컴 슬라이드: 전체 카드 스켈레톤
- 이벤트 카드: 배지 + 제목 + 설명 스켈레톤 (3개)
- 캘린더: 날짜 그리드 스켈레톤

### 5.2 빈 상태 (Empty State)

**공통 구성:**
- 아이콘 또는 illustration (크기 100)
- 제목: Section 16/700, #191F28
- 설명: Body 15/600, #8B95A1
- 액션 버튼: 배경 #3182F6, 텍스트 #FFFFFF, 높이 44, 반경 8 (필요 시)

**경조사 빈 상태:**
- 아이콘: Ionicons folder-outline
- 제목: "아직 만든 경조사가 없습니다"
- 설명: "행복한 순간을 함께 기록해보세요"
- 버튼: "더보기"

**일정 빈 상태:**
- 아이콘: Ionicons calendar-outline
- 제목: "등록된 일정이 없습니다"
- 설명: "새로운 경조사 일정을 추가해보세요"
- 버튼: "일정 추가"

### 5.3 에러 상태

**구성:**
- 아이콘: Ionicons alert-circle-outline, 색상 #FF6B6B
- 제목: Section 16/700, #191F28 ("오류가 발생했습니다")
- 설명: Body 15/600, #8B95A1 (구체적인 에러 메시지)
- 버튼: "다시 시도", 배경 #3182F6

### 5.4 구독 한도 도달 상태

**경조사 만들기 카드 (제한됨):**
- 배경: #F9FAFB
- 이미지: opacity 0.4
- 버튼: disabled, 배경 #E5E8EB, 텍스트 #8B95A1
- 오버레이: "제한됨" 배지 또는 락 아이콘 표시

---

## 6. 색상 팔레트 (Toss Official)

| 역할 | 색상값 | 용도 |
|------|--------|------|
| Primary | #3182F6 | 주요 버튼, 활성 상태, 링크 |
| Wedding | #FF6B6B | 경조사 배지, 결혼식 강조 |
| Funeral | #6C757D | 부고장 배지, 장례식 강조 |
| Text Primary | #191F28 | 제목, 주요 텍스트 |
| Text Secondary | #8B95A1 | 설명, 보조 텍스트 |
| Background | #F2F4F6 | 배경색 |
| Surface | #FFFFFF | 카드, 모달 배경 |
| Border | #E5E8EB | 구분선, 입력 테두리 |
| Disabled | #D1D6DB | 비활성 요소 |
| Success | #4CAF50 | 성공 상태 |
| Warning | #FFD93D | 경고 |

---

## 7. Typography

| 레벨 | 크기 | 굵기 | 용도 |
|------|------|------|------|
| Title | 22 | 700 | 페이지 제목, 모달 제목 |
| Section | 18 | 700 | 섹션 제목 |
| Body | 15 | 600 | 주요 콘텐츠, 버튼 텍스트 |
| Meta | 13 | 400 | 보조 정보, 설명 |
| SmallMeta | 12 | 400 | 매우 작은 텍스트 |

---

## 8. Spacing & Sizing

| 항목 | 값 |
|------|-----|
| paddingHorizontal (기본) | 20 |
| paddingVertical (섹션) | 16 |
| Section 간 gap | 8 (divider line) |
| 카드 내부 padding | 16 |
| 버튼 높이 | 44 (primary), 40 (secondary) |
| Input 높이 | 44 |
| Card border radius | 16 |
| Modal border radius | 20 (top) |
| Icon size | 48 (large), 24 (default), 20 (small) |

---

## 9. Shadow & Elevation

| 레벨 | CSS/RN Style |
|------|------|
| 1 (Subtle) | shadow 0 1 4 rgba(0,0,0,0.06) |
| 2 (Default) | shadow 0 2 8 rgba(0,0,0,0.08) |
| 3 (Elevated) | shadow 0 4 16 rgba(0,0,0,0.1) |
| 4 (Modal) | shadow 0 8 24 rgba(0,0,0,0.15) |

---

## 10. 상호작용 & 상태

### 버튼 상태
- **활성 (Active):** 배경 Primary (#3182F6), 텍스트 #FFFFFF, 터치 시 backgroundColor fade (opacity 0.9)
- **비활성 (Disabled):** 배경 #E5E8EB, 텍스트 #8B95A1, opacity 0.6, pointerEvents "none"
- **호버 (Hover):** 배경 색 어두워짐 (opacity 0.95)

### 카드 상태
- **활성 (Active):** 터치 시 배경 fade (rgba(0,0,0,0.04))
- **프레스 (Pressed):** 그림자 감소 (elevation 낮아짐)

### 입력 필드 상태
- **기본:** borderColor #E5E8EB
- **포커스:** borderColor #3182F6, borderWidth 2
- **에러:** borderColor #FF6B6B

---

## 11. 네비게이션 경로 (유지)

| 액션 | 목표 화면 | 파라미터 |
|------|----------|---------|
| 청첩장 만들기 | CreateWedding | - |
| 부고장 만들기 | CreateFuneral | - |
| 이벤트 카드 클릭 | EventDisplay | { eventId, ... } |
| "부조하기" 버튼 | Contribution | { eventId, eventName } |
| 더보기 클릭 | MyEvents | - |
| 통계 상세 | MyEvents | { initialTab: 'statistics' } |

---

## 12. 구현 시 주의사항

### 개발자 전달 사항

1. **아이콘 사용:**
   - Ionicons 활용 (people, heart, flower, gift, bell, location-sharp, chevron-back, chevron-forward, close, alert-circle-outline, folder-outline, calendar-outline)
   - 색상은 토스 색상팔레트 준수
   - SVG 사용 가능 (단, 레이아웃 일관성 유지)

2. **이미지 처리:**
   - 웰컴 슬라이드: 배경 그라디언트 또는 배경색만 (이미지 불필요)
   - 경조사 만들기 카드: 이미지 필수 (wedding-Photoroom.png, funeral-Photoroom.png)
   - Placeholder: #F2F4F6 배경, Ionicons image-outline

3. **애니메이션:**
   - 웰컴 슬라이드 페이드: Animated.timing(300ms), useNativeDriver true
   - 모달 슬라이드업: Animated.timing(300ms), translate Y (0 → 300px)
   - 성공 모달 스케일: Animated.spring (tension 50, friction 8)
   - 모든 애니메이션 자연스럽고 부드러운 느낌

4. **반응형 설계:**
   - 기본 설계: iPhone SE (375px 기준)
   - 태블릿 고려: iPad에서도 일관된 레이아웃
   - 화면 방향: portrait만 지원 (가로 모드 필요 시 별도 논의)

5. **접근성:**
   - 모든 상호작용 요소: accessibilityLabel 추가
   - 최소 터치 영역: 44x44 (버튼)
   - 색상 대비: WCAG AA 이상

6. **성능:**
   - FlatList 사용 (ScrollView 대신, 리스트 많을 때)
   - 이미지 캐싱: 웰컴 슬라이드, 경조사 카드 이미지
   - 모달: 불필요한 re-render 방지 (shouldComponentUpdate 또는 useMemo)

7. **상태 관리:**
   - loading 중 스켈레톤 표시 (필수)
   - 빈 상태 감지 (length === 0)
   - 에러 처리: try-catch, 사용자 피드백 (Alert 또는 Toast)

8. **모달 스택 관리:**
   - 모달 오픈/클로즈 순서 명확히
   - 중복 모달 방지 (예: 성공 모달 + 알림 권한 모달 동시 표시 X)
   - 모달 닫기 시 이전 상태 복원

9. **데이터 로딩:**
   - 초기 로드: 캐시 확인 (30초 기간)
   - 새로고침: pull-to-refresh 구현 (가능 시)
   - 실시간 업데이트: Supabase 채널 구독 (축의금 Toast)

10. **테스트 케이스:**
    - FREE vs PREMIUM 플랜 렌더링
    - 페이지네이션 (3개씩, 다음/이전 버튼)
    - 모달 애니메이션 (부드러움, 스냅샷)
    - 빈 상태, 로딩 상태, 에러 상태
    - 실시간 축의금 알림 (Supabase 채널)

---

## 13. 재설계 완료 체크리스트

- [x] 48개 기능 전부 유지 (제거 항목 0)
- [x] Toss 디자인 시스템 준수 (카드 16, shadow, typography)
- [x] 실제 아이콘 사용 (이모지 없음)
- [x] 명확한 시각적 위계 (typography + spacing)
- [x] 섹션별 상세 설계 (5개 메인 섹션 + 헤더)
- [x] 7개 모달 트리거 포인트 명시
- [x] FREE/PREMIUM 분기 명확히
- [x] 로딩 & 상태 설계 (skeleton, empty, error, limit)
- [x] 색상 팔레트 & typography 정의
- [x] 개발자 전달 사항 상세화

**상태:** ✅ 재설계 완료, 개발 시작 가능

---

**작성 완료 일시:** 2026-04-14 14:30 KST
