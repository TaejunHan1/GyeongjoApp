# 02. researcher 앱 분석 및 대체 요소 후보 제안

**일시**: 2026-04-15
**분석자**: researcher (Explore, Sonnet)
**팀**: calendar-replacement

---

## 앱 기능 요약

GyeongjoApp은 한국 경조사(결혼식, 장례식 등) 관리 앱:
- 경조사 주최: 이벤트 생성, QR 코드 공유, 부조금 수집
- 경조사 참여: personal_schedules 등록, 방명록 작성, 부조금 기록
- 통계/수치: 총 부조금 수령액, 월별 통계, 참여 인원, 평균 금액
- 가이드: 호스트/참여자 예절 가이드, 체크리스트, 예산 계산기

## Supabase 테이블 구조

| 테이블 | 주요 컬럼 |
|--------|-----------|
| events | id, user_id, event_name, event_type (wedding/funeral), event_date, status |
| guest_book | id, event_id, guest_name, amount, relation_category, attending, created_at |
| contributions | id, event_id, contributor_name, amount, relation_to, is_confirmed |
| personal_schedules | id, user_id, title, event_type, event_date, location, notes |
| users | id, subscription_type, max_wedding_events, max_funeral_events |

---

## 현재 캘린더 섹션 분석

- **위치**: HomeScreen.js L1652 ~ L1829 (약 178줄)
- **스타일 키**: calendarSection, calendarContainer, calendarSectionHeader
- **사용 state**: calendarDate, activeEvents, currentEventPage, eventsPerPage, selectedDate, showEventModal, showEventListModal, selectedDateEvents
- **사용 핸들러**: handleCalendarDatePress, handleCalendarMonthChange, getGroupedMonthlyEvents, getMonthlyEvents
- **구성**: 월간 캘린더 그리드 + 이번 달 참여 예정 일정 티켓 목록

---

## 1차 후보 5가지 (앱 기반 기능)

| # | 이름 | 구현 난이도 | 비고 |
|---|------|------------|------|
| 1 | D-Day 카운트다운 카드 슬라이더 | 쉬움 | personal_schedules 활용 |
| 2 | 부조금 주고받기 잔액 요약 카드 | 보통 | monthlyStats 재활용 |
| 3 | 미확인 방명록 알림 피드 | 보통 | guest_book + Realtime |
| 4 | 다음 경조사 준비 체크리스트 | 보통 | AsyncStorage |
| 5 | 관계별 부조금 인사이트 카드 | 어려움 | 데이터 정제 필요 |

**→ 사용자 피드백: "다 별로야, 앱에 없는 기능이어도 상관없어"**

---

## 2차 후보 5가지 (신규 기능)

team-lead가 앱 도메인 특화 아이디어로 재제안:

| # | 이름 | 핵심 가치 |
|---|------|-----------|
| A | 품앗이 장부 | "홍길동에게 5만원 줬음 → 아직 못받음" 상환 트래킹 |
| B | 감사 메시지 빠른 발송 | "아직 감사 문자 안 보낸 분 5명" + 템플릿 문자 1탭 공유 |
| C | 얼마 낼까? 금액 추천 | 관계 입력 → 적정 부조금 추천 |
| D | 내 청첩장/부고장 빠른 공유 | 홈에서 QR/링크 바로 공유 |
| E | 지인 경조사 알림 수신함 | 지인이 앱으로 만든 청첩장 알림 피드 |

**→ 사용자 선택: "A랑 B 둘 다 괜찮은 거 같아"**
