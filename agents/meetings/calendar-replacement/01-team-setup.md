# 01. 팀 구성 및 태스크 설정

**일시**: 2026-04-15
**팀명**: calendar-replacement
**팀리드**: team-lead (본 세션)

---

## 이전 팀 정리

- `home-toss-redesign` 팀이 이미 존재 → TeamDelete로 정리 후 신규 팀 생성

## 팀 생성

```
TeamCreate: calendar-replacement
설명: 홈스크린 '참여할 경조사 일정' 섹션을 더 유용한 요소로 대체
```

## 태스크 목록

| # | 태스크 | 담당 | 의존성 |
|---|--------|------|--------|
| 1 | 앱 전체 분석 및 대체 요소 후보 제안 | researcher | 없음 |
| 2 | 선택된 대체 요소 HomeScreen에 구현 | frontend | Task #1 완료 후 |

---

## Task #1 상세

- 분석 범위: src/screens/ 전체, Supabase 테이블, 캘린더 섹션 위치
- 제안 조건: 실용적, 기존 데이터 활용 가능, 토스 스타일 적합
- 산출물: /tmp/calendar-replacement-analysis.md

## Task #2 상세

- 캘린더 섹션 JSX 제거
- team-lead 선택 요소 구현
- 토스 디자인 시스템 준수
- 빌드 검증 필수
