# 13. 줬음 기록 모달 흰색 배경 복원

**일시**: 2026-04-15
**작업자**: team-lead (직접 수정)
**팀**: calendar-replacement

---

## 사용자 피드백

> "취소랑 저장 버튼 뒤에 하얀색 배경 왜지운거야?"

---

## 원인

이전 수정(모달 외부 탭 닫기)에서 tossSheet를 `TouchableOpacity`로 감싸는 방식을 사용:

```jsx
// 문제 코드
<TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
  <View style={styles.tossSheet}>
    ...
  </View>
</TouchableOpacity>
```

`TouchableOpacity`가 `paddingBottom`을 포함한 하단 영역을 제대로 렌더링하지 못해, 취소/저장 버튼 아래 흰색 배경이 사라짐.

---

## 수정 내용

오버레이를 `position: 'absolute'`로 깔고, 시트는 순수 `View`로 유지:

```jsx
<Modal visible={showPumasiGaveSheet} transparent animationType="slide">
  <View style={{ flex: 1, justifyContent: 'flex-end' }}>
    {/* 외부 탭 → 닫기 (절대 위치 오버레이) */}
    <TouchableOpacity
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' }}
      activeOpacity={1}
      onPress={() => setShowPumasiGaveSheet(false)}
    />
    {/* 시트는 View 유지 → paddingBottom 정상 적용 */}
    <View style={styles.tossSheet}>
      ...
    </View>
  </View>
</Modal>
```

---

## 빌드 검증

| 항목 | 결과 |
|------|------|
| Expo Web Export | ✅ 성공 |
