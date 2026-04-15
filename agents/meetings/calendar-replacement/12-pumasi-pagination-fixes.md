# 12. 품앗이 페이지네이션 + 버튼 + 저장 + 모달 닫기 수정

**일시**: 2026-04-15
**작업자**: team-lead (직접 수정)
**팀**: calendar-replacement

---

## 수정 내용

### 1. 페이지네이션 (전체 보기 → prev/next)
- `pumasiReceivedPage`, `pumasiGavePage` state 추가
- `PUMASI_PER_PAGE = 5` 상수
- 받음/줬음 탭 모두 5개씩 페이지 슬라이싱
- 하단에 `← 1/3 →` 형태 페이지네이션 컨트롤
  - 비활성 버튼: #F2F4F6 배경, 회색 아이콘
  - 활성 버튼: #EBF3FE 배경, 파란 아이콘
- 탭 전환 시, 필터 초기화 시 페이지 0으로 리셋

### 2. 줬음 기록 버튼 스타일 변경
- 이전: 회색 배경, 회색 텍스트 (태그처럼 보임)
- 수정: 파란 배경(#3182F6), 흰 텍스트 (버튼처럼 보임)
- `pmGaveTag` → `pmGaveBtn` / `pmGaveTagText` → `pmGaveBtnText` 로 교체

### 3. 저장 버튼 동작 수정
- `user?.id || userInfo?.userId` → `userInfo?.userId || session?.user?.id` 로 수정
- DB 에러 시 `Alert.alert('오류', ...)` 로 사용자에게 알림
- pumasi_gave 테이블 미생성 시 안내 메시지 표시

### 4. 줬음 기록 모달 외부 탭으로 닫기
- 오버레이 `TouchableOpacity` + `activeOpacity={1}` + `onPress={() => setShowPumasiGaveSheet(false)}`
- 내부 시트는 `e.stopPropagation()` 으로 이벤트 차단

---

## 빌드 검증

| 항목 | 결과 |
|------|------|
| Expo Web Export | ✅ 성공 |
