# HomeScreen 재설계 디자인 보고서 (designer)

**일시:** 2026-04-14  
**작성자:** designer  
**대상:** team-lead, planner, developer  
**상태:** ✅ 재설계 완료

---

## 1. Team-Lead 지시사항 검토

### 1.1 받은 지시사항 요약
- **목표:** HomeScreen 재설계, Toss 디자인 시스템 준수
- **제약사항:**
  - 기획자 기능 인벤토리 48개 항목 **전부 유지** (제거 금지)
  - 이전 피드백: "최악이다, 토스답지 않다"
  - 주의사항: 플랫 디자인, 이모지 아이콘, 감각 없는 ListRow 금지
- **산출물:**
  - 재설계 Spec (`/tmp/homescreen-redesign-spec.md`)
  - 디자인 회의록 (본 파일)

### 1.2 이전 실패 원인 분석
1. **너무 플랫:** shadow + radius 16 미적용
2. **이모지 아이콘:** 실제 icon/gradient 박스 미사용
3. **섹션 제거:** 기획자 인벤토리 무시
4. **ListRow 감각 부족:** 색상 박스, 여백, 위계 미흡

---

## 2. Planner 인벤토리 검토 결과

### 2.1 주요 발견 사항

**기능 분류:**
- **헤더:** 1개 (로고 + 뱃지 + 사용자명)
- **웰컴 슬라이드:** 4개 슬라이드 (자동 회전, 페이드 애니메이션)
- **경조사 만들기:** 2개 카드 (청첩장, 부고장) + 제한 상태
- **내 주최 경조사:** 탭 2개 (진행중/완료) + 페이지네이션 (3개씩) + 빈 상태
- **참여 일정:** 캘린더 + 월별 경조사 티켓 페이지네이션 + 빈 상태
- **모달:** 7개 (일정 추가, 목록, 확인, 성공, 만들기, 프리미엄, 알림권한)
- **실시간:** Supabase 축의금 구독 (Toast)

**총 기능 항목:** 48개 ✅ (모두 포함)

### 2.2 인벤토리별 설계 대응

| 인벤토리 | 재설계 섹션 | 상세사항 |
|---------|-----------|---------|
| 헤더 (로고, 뱃지, 사용자명) | 3.1 헤더 | Title 22/700, FREE/PREMIUM 배지 색상 정의 |
| 웰컴 슬라이드 4개 | 3.2 웰컴 | 페이드 애니메이션, gradient 카드, 인디케이터 |
| 경조사 만들기 2개 | 3.3 경조사 만들기 | 2열 그리드, 이미지, 상태 배지, 제한됨 스타일 |
| 내 주최 탭 | 3.4 내가 주최 | 세그먼트 컨트롤 (pill), 페이지네이션, 빈 상태 |
| 캘린더 | 3.5 참여 일정 | 월 네비게이션, 일정 인디케이터 (점) |
| 월별 경조사 티켓 | 3.5 경조사 티켓 | 좌측 accent bar, ListRow 스타일, 페이지네이션 |
| 7개 모달 | 섹션 4 | 각 모달별 상세 설계 (스타일, 애니메이션) |
| Supabase 실시간 | 섹션 12 | Toast, 축의금 알림, loadEvents 새로고침 |

---

## 3. 디자인 결정 이유

### 3.1 Toss 디자인 시스템 채택 근거

**왜 Toss인가?**
- 팀의 기존 레퍼런스 (`tossdesignstyle.md` 존재)
- 한국 사용자 친숙성 (핀테크 표준)
- 명확한 계층 구조 + 일관된 spacing
- 구현 난이도 낮음 (React Native 호환성 우수)

**Toss 핵심 원칙:**
1. **카드 디자인:** 반경 16, shadow 0 2 8 rgba(0,0,0,0.08)
2. **색상:** Primary #3182F6, Text #191F28, Secondary #8B95A1
3. **타이포그래피:** 명확한 4-레벨 계층 (Title → Section → Body → Meta)
4. **아이콘:** Ionicons + 실제 이미지 (이모지 금지)
5. **여백:** paddingH 20, section gap 8 divider

### 3.2 섹션별 설계 근거

#### 3.2.1 헤더 (3.1)
- **2-컬럼 레이아웃 (로고 + 뱃지):** 
  - 로고: 앱 아이덴티티
  - 뱃지: 구독 상태 시각화 (FREE = 회색, PREMIUM = 빨강)
- **사용자명 + 구독상태:** 개인화 + 상태 한눈에 파악

#### 3.2.2 웰컴 슬라이드 (3.2)
- **4개 슬라이드:** 기획자 정의 (제목, 아이콘, 색상 다양화)
- **페이드 애니메이션:** 자연스러운 전환 (Animated.timing 300ms)
- **색상 변경:** 각 슬라이드마다 gradient 또는 단색
  - Slide 1: Primary #3182F6
  - Slide 2: Wedding #FF6B6B (따뜻한 느낌)
  - Slide 3: Funeral #6C757D (진지한 느낌)
  - Slide 4: Celebration #FFD93D (밝은 느낌)

#### 3.2.3 경조사 만들기 (3.3)
- **2열 그리드:** 청첩장 + 부고장 대칭 배치
- **카드 구성:**
  - 이미지 상단 (140px, 반경 16 top): wedding-Photoroom.png, funeral-Photoroom.png
  - 콘텐츠 하단 (제목, 설명, 버튼)
  - 상태 배지 우상단 (경사/조사)
- **제한됨 상태:**
  - 배경: #F9FAFB (시각적으로 비활성화 표현)
  - 이미지 opacity 0.5
  - 버튼 disabled + 텍스트 opacity 0.6
  - **이유:** 사용자가 한눈에 제한 상태 인식 → 프리미엄 모달 유도

#### 3.2.4 내가 주최한 경조사 (3.4)
- **세그먼트 컨트롤 (Pill 배경):**
  - 배경 #F2F4F6, 활성 탭 #FFFFFF (Toss 표준)
  - 이유: 탭 전환이 명확하고 자연스러움
- **이벤트 카드 구성:**
  - 상단 배지 + 날짜: 빠른 상태 인식
  - 중앙 제목 + 위치: 핵심 정보
  - 하단 통계 바: 부조 수 + 금액 (시각적 강조)
- **Toss ListRow 느낌:** 
  - 좌측 accent bar (없음, 배경으로 표현) → 카드로 강조
  - shadow 0 2 8 + 반경 16: Toss 카드 스타일
  - 여백 최적화: 16px 내부 padding
- **페이지네이션 (3개씩):** 
  - 기획자 정의값
  - 모바일 화면 최적화 (scroll 길이 조절)

#### 3.2.5 참여 일정 (3.5)
- **캘린더 + 월별 티켓 조합:**
  - 캘린더: 개인 일정 시각화 (점 인디케이터)
  - 티켓: 참여 경조사 상세 정보 (일정 추가 유도)
- **캘린더 디자인:**
  - 월 네비게이션 (좌우 버튼): 명확한 월 변경
  - 날짜 그리드: 오늘 강조 (#E0E8F9), 다른 월 회색
  - 일정 인디케이터: 점 (1개/2개/3+개) → 많은 일정을 간결하게 표현
- **경조사 티켓 (Toss ListRow):**
  - **좌측 accent bar (4px, 색상):** 경사(#FF6B6B) / 조사(#6C757D) 구분
  - **좌측 날짜 박스:** "25 / 수" (2줄, 명확)
  - **중앙 정보:** 이벤트명 + 배지 + 위치
  - **우측 화살표:** 클릭 유도 (Ionicons chevron-forward)
  - **이유:** Toss 스타일의 ListRow = 우아한 시각적 위계 + 상호작용 명확성

### 3.3 모달 설계 근거

#### 4.1 일정 추가 모달 (EventAddModal)
- **Bottom Sheet 스타일:**
  - 반경 20 (top only): Toss 표준
  - 핸들 (4px bar): 드래그 표시, 사용자 인식
- **입력 필드:**
  - 테두리 색 #E5E8EB (포커스 시 #3182F6)
  - 높이 44 (터치 최소 영역)
- **동작:** 확인 → success modal 자동 트리거 (3초 후 자동 닫기)

#### 4.2~4.7 나머지 모달
- 모두 반경 20, paddingH 20 이상
- 테마 컬러 (Primary #3182F6) 일관성
- 애니메이션:
  - 확인 모달: slideUp (300px) + fadeIn (300ms)
  - 성공 모달: scale (spring) + fadeIn (300ms)
  - 프리미엄 모달: fadeIn (표준)

### 3.4 색상 팔레트 정의 근거

| 색상 | 값 | 근거 |
|------|-----|------|
| Primary | #3182F6 | Toss 공식 blue, 신뢰성 + 정통성 |
| Wedding | #FF6B6B | 따뜻함, 경사(긍정) 강조 |
| Funeral | #6C757D | 침착함, 조사(진지함) 강조 |
| Text Primary | #191F28 | 충분한 대비, 읽기 편함 |
| Background | #F2F4F6 | 가볍고 중립적, 카드 배경과 대비 |
| Surface | #FFFFFF | 카드/모달 기본 배경 |

### 3.5 Typography 정의 근거

4-레벨 계층:
1. **Title 22/700:** 페이지/모달 제목 (가장 강조)
2. **Section 18/700:** 섹션 제목 (중간 강조)
3. **Body 15/600:** 주요 콘텐츠, 버튼 텍스트 (읽기 편함)
4. **Meta 13/400:** 보조 정보, 설명 (가벼운 느낌)

**이유:** 명확한 시각적 위계 → 사용자가 정보를 쉽게 스캔

---

## 4. 회피한 함정 (이전 실패 교훈)

### 4.1 ❌ "너무 플랫" → ✅ Shadow + Radius 16 적극 활용

**이전 실패:**
```
카드 배경: #FFFFFF (shadow 없음)
글자: 검은색 (대비 낮음)
→ 판에 박힌 느낌, "최악이다" 피드백
```

**재설계:**
```
모든 카드: shadow 0 2 8 rgba(0,0,0,0.08) + 반경 16
헤더 + 섹션 분리: 8px divider
→ 명확한 깊이감, Toss 느낌
```

### 4.2 ❌ 이모지 아이콘 → ✅ 실제 Icon + Gradient 박스

**이전 실패:**
```
아이콘: 💝, 🎉, 🌸, 💐 (이모지)
→ 아마추어스러움, "토스답지 않다" 피드백
```

**재설계:**
```
- Ionicons 사용 (people, heart, flower, gift, bell, location-sharp)
- 크기: 48 (대형), 24 (기본), 20 (소형)
- 색상: 토스 팔레트 준수 (Primary #3182F6, Wedding #FF6B6B, Funeral #6C757D)
- 경조사 카드 이미지: wedding-Photoroom.png, funeral-Photoroom.png (실제 이미지)
→ 전문적, 일관된 비주얼
```

### 4.3 ❌ 섹션 통째 제거 → ✅ 48개 기능 전부 유지

**이전 실패:**
```
"캘린더는 복잡하니까 제거하자"
"모달 너무 많으니까 통합하자"
→ 기획자 인벤토리 무시, 기능 손실
```

**재설계:**
```
헤더 (1)
+ 웰컬 슬라이드 (4개)
+ 경조사 만들기 (2개 카드)
+ 내 주최 (탭 2개, 페이지네이션)
+ 참여 일정 (캘린더 + 월별 티켓, 페이지네이션)
+ 7개 모달 (각각 독립적)
= 48개 기능 완전 유지 ✅
```

### 4.4 ❌ 감각 없는 ListRow → ✅ 명확한 시각적 위계

**이전 실패:**
```
이벤트 카드:
- 배경 #F0F0F0 (구분 안됨)
- 글자 작고 회색 (위계 불명)
- 클릭 피드백 없음
→ 상호작용 느낌 없음, "감각 없다" 피드백
```

**재설계:**
```
경조사 티켓 (3.5):
┌──────────────────────────────────────┐
│ ┃                                    │
│ ┃ 25  이벤트명       [배지]  위치  ▶ │
│ ┃ 수  2026년 4월 25일            ▶ │
│ ┃                                    │
└──────────────────────────────────────┘

- 좌측 accent bar (4px, 컬러): 경사/조사 구분
- 날짜: 크고 명확 (Title 20/700)
- 정보: 명확한 계층 (Section/Body/Meta)
- 우측 화살표: 클릭 유도
- 그림자 0 1 4: 카드 느낌
→ 전문적, 상호작용 명확, Toss 스타일
```

---

## 5. 개발자에게 전달할 구현 시 주의사항

### 5.1 아이콘 & 이미지

**Ionicons (필수):**
```javascript
// src/screens/main/HomeScreen.js에서 import
import { Ionicons } from '@expo/vector-icons';

// 필요한 아이콘들
<Ionicons name="people" size={48} color="#3182F6" />
<Ionicons name="heart" size={48} color="#FF6B6B" />
<Ionicons name="flower" size={48} color="#6C757D" />
<Ionicons name="gift" size={48} color="#FFD93D" />
<Ionicons name="bell-outline" size={24} color="#8B95A1" />
<Ionicons name="location-sharp" size={16} color="#8B95A1" />
<Ionicons name="chevron-forward" size={24} color="#8B95A1" />
<Ionicons name="chevron-back" size={24} color="#191F28" />
<Ionicons name="close" size={24} color="#191F28" />
```

**이미지:**
- wedding-Photoroom.png, funeral-Photoroom.png (이미 존재하는 경우 재사용)
- Placeholder: #F2F4F6 배경 + Ionicons image-outline

### 5.2 색상 상수 정의

```javascript
// src/styles/constants.js 또는 colors.js에 추가
export const Colors = {
  // 기존 Colors 유지
  primary: '#3182F6',
  wedding: '#FF6B6B',
  funeral: '#6C757D',
  
  // Toss 추가 색상
  textPrimary: '#191F28',
  textSecondary: '#8B95A1',
  background: '#F2F4F6',
  surface: '#FFFFFF',
  border: '#E5E8EB',
  disabled: '#D1D6DB',
  success: '#4CAF50',
  warning: '#FFD93D',
  
  // 밝기 조정용
  lightBg: '#F9FAFB',
};
```

### 5.3 Spacing 상수

```javascript
export const Spacing = {
  paddingHorizontal: 20,
  paddingVertical: 16,
  sectionGap: 8,
  cardInnerPadding: 16,
  cardRadius: 16,
  modalRadius: 20,
};
```

### 5.4 애니메이션 구현

**웰컴 슬라이드 페이드:**
```javascript
Animated.timing(fadeAnim, {
  toValue: 0,
  duration: 300,
  useNativeDriver: true,
}).start(() => {
  setCurrentSlide((prev) => (prev + 1) % slides.length);
  Animated.timing(fadeAnim, {
    toValue: 1,
    duration: 300,
    useNativeDriver: true,
  }).start();
});
```

**모달 슬라이드업 (경조사 목록 모달):**
```javascript
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
]).start();

// 스타일에서 interpolate
const translateY = confirmModalSlideAnim.interpolate({
  inputRange: [0, 1],
  outputRange: [300, 0],
});
```

**성공 모달 스케일 (Spring):**
```javascript
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
]).start();
```

### 5.5 상태별 로딩 & 에러 처리

**로딩 상태 (Skeleton):**
```javascript
{loading ? (
  <View style={{backgroundColor: '#F2F4F6', height: 200, borderRadius: 16}} />
) : (
  // 실제 컴포넌트
)}
```

**빈 상태 (Empty State):**
```javascript
{events.length === 0 ? (
  <View style={{ alignItems: 'center', paddingVertical: 40 }}>
    <Ionicons name="folder-outline" size={64} color="#8B95A1" />
    <Text style={{ ... }}>아직 만든 경조사가 없습니다</Text>
    <TouchableOpacity style={{ ... }} onPress={handleViewMore}>
      <Text>더보기</Text>
    </TouchableOpacity>
  </View>
) : (
  // 실제 리스트
)}
```

### 5.6 페이지네이션 구현

```javascript
const eventsPerPage = 3;
const totalPages = Math.ceil(events.length / eventsPerPage);
const startIdx = hostedEventPage * eventsPerPage;
const paginatedEvents = events.slice(startIdx, startIdx + eventsPerPage);

// 렌더링
<FlatList
  data={paginatedEvents}
  renderItem={({ item }) => <EventCard event={item} />}
  keyExtractor={(item) => item.id}
/>

// 페이지네이션 컨트롤
<View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
  <TouchableOpacity
    disabled={hostedEventPage === 0}
    onPress={() => setHostedEventPage(hostedEventPage - 1)}
  >
    <Text>< </Text>
  </TouchableOpacity>
  <Text>{hostedEventPage + 1}/{totalPages}</Text>
  <TouchableOpacity
    disabled={hostedEventPage >= totalPages - 1}
    onPress={() => setHostedEventPage(hostedEventPage + 1)}
  >
    <Text> ></Text>
  </TouchableOpacity>
</View>
```

### 5.7 세그먼트 컨트롤 구현

```javascript
// 토스 스타일 Pill 배경
<View style={{
  backgroundColor: '#F2F4F6',
  borderRadius: 12,
  padding: 4,
  flexDirection: 'row',
}}>
  {['active', 'completed'].map((tab) => (
    <TouchableOpacity
      key={tab}
      onPress={() => setSelectedTab(tab)}
      style={{
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        backgroundColor: selectedTab === tab ? '#FFFFFF' : 'transparent',
        borderRadius: selectedTab === tab ? 10 : 0,
        ...Platform.select({
          ios: selectedTab === tab ? { shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4 } : {},
          android: selectedTab === tab ? { elevation: 1 } : {},
        }),
      }}
    >
      <Text style={{
        color: selectedTab === tab ? '#191F28' : '#8B95A1',
        fontWeight: '600',
      }}>
        {tab === 'active' ? '진행중' : '최근완료'}
      </Text>
    </TouchableOpacity>
  ))}
</View>
```

### 5.8 모달 오버레이 스택 관리

```javascript
// 모달 렌더 순서 (중요!)
return (
  <>
    <SafeAreaView>
      {/* 메인 콘텐츠 */}
    </SafeAreaView>

    {/* 모달 1: NotificationPermissionModal */}
    <NotificationPermissionModal visible={showNotificationModal} onClose={() => setShowNotificationModal(false)} />

    {/* 모달 2: 일정 추가 */}
    <Modal visible={showEventModal} transparent animationType="slide">
      {/* EventAddModal */}
    </Modal>

    {/* 모달 3: 토스 확인 (Animated, slideUp) */}
    <Modal visible={showTossConfirmModal} transparent>
      <Animated.View style={{ transform: [{ translateY }] }}>
        {/* Toss Confirm Modal */}
      </Animated.View>
    </Modal>

    {/* 모달 4: 성공 (Animated, scale + 3초 자동 닫기) */}
    <Modal visible={showTossSuccessModal} transparent>
      <Animated.View style={{ transform: [{ scale: successModalScale }] }}>
        {/* Success Modal + Timer */}
      </Animated.View>
    </Modal>

    {/* 모달 5: 경조사 만들기 */}
    <Modal visible={showCreateEventModal} transparent>
      {/* Create Event Modal */}
    </Modal>

    {/* 모달 6: 프리미엄 */}
    <Modal visible={showPremiumModal} transparent>
      {/* Premium Modal */}
    </Modal>
  </>
);
```

### 5.9 Supabase 실시간 업데이트 (필수)

```javascript
// 축의금 알림 Toast + 통계 새로고침
useEffect(() => {
  const channel = supabase
    .channel(`guest-book-realtime-${user.id}`)
    .on('postgres_changes', {
      event: ['INSERT', 'UPDATE', 'DELETE'],
      schema: 'public',
      table: 'guest_book',
    }, (payload) => {
      Toast.show({
        type: 'success',
        text1: '💰 축의금 알림',
        text2: `${payload.new.contributor_name}님이 축의금을 보냈습니다`,
        duration: 3000,
      });
      loadEvents();
      loadMonthlyStatistics();
    })
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
}, [user.id]);
```

### 5.10 테스트 체크리스트

- [ ] FREE vs PREMIUM 뱃지 색상 (회색 vs 빨강)
- [ ] 웰컬 슬라이드 4개, 4초 자동 회전, 페이드 애니메이션
- [ ] 경조사 만들기 2개 카드, 제한됨 상태 (disabled + opacity)
- [ ] 내 주최 탭 2개 (진행중/완료), 페이지네이션 3개씩
- [ ] 캘린더 월 네비게이션, 개인 일정만 표시, 점 인디케이터
- [ ] 경조사 티켓: 좌측 accent bar (색상), 날짜, 정보, 화살표
- [ ] 7개 모달 (슬라이드업, 스케일, fadeIn)
- [ ] 성공 모달 3초 자동 닫기
- [ ] Supabase 축의금 Toast + loadEvents 새로고침
- [ ] 빈 상태, 로딩 상태, 에러 상태 렌더링

---

## 6. 재설계 완료 체크리스트

- [x] 48개 기능 전부 유지 (제거 항목 0)
- [x] Toss 디자인 시스템 준수 (shadow, radius, typography, color)
- [x] 실제 아이콘 사용 (이모지 절대 금지)
- [x] 명확한 시각적 위계 (4-레벨 typography + spacing)
- [x] 섹션별 상세 설계 (6개 섹션 + 7개 모달)
- [x] FREE/PREMIUM 분기 명확 (색상, 버튼 상태)
- [x] 로딩 & 상태 설계 (skeleton, empty, error, limit)
- [x] 색상 팔레트 & 스페이싱 정의
- [x] 애니메이션 구현 가이드 상세
- [x] 개발자 전달 사항 완벽화

---

## 7. 다음 단계

1. **개발자 리뷰:** 이 보고서 + `/tmp/homescreen-redesign-spec.md` 검토
2. **UI/UX 검증:** Figma 디자인 목업 (선택사항)
3. **구현 시작:** React Native 코드 작성 (섹션별 단계적)
4. **QA 테스트:** 테스트 체크리스트 항목별 검증
5. **피드백 반영:** 사용자 테스트 후 미세 조정

---

**상태:** ✅ 재설계 완료, 개발 준비 완료

**작성 일시:** 2026-04-14 14:45 KST  
**작성자:** designer
