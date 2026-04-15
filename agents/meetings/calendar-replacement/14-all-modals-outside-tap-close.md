# 14. 모든 품앗이 모달 외부 탭 닫기 적용

**일시**: 2026-04-15
**작업자**: team-lead (직접 수정)
**팀**: calendar-replacement

---

## 사용자 피드백

> "모달들은 전부다 내가 줬음 기록 부분을 다른 부분 눌러도 모달이 꺼지게 하라고 했으면 알아서 필터 부분들도 다 그런식으로 작업 해서 갖고와야 하는거 아니야?"

---

## 수정 내용

`position: 'absolute'` 오버레이 패턴을 모든 품앗이 모달에 일괄 적용.

### 1. 필터 바텀시트 (`showPumasiFilterSheet`)

```jsx
<Modal visible={showPumasiFilterSheet} transparent animationType="slide">
  <View style={{ flex: 1, justifyContent: 'flex-end' }}>
    <TouchableOpacity
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' }}
      activeOpacity={1}
      onPress={() => setShowPumasiFilterSheet(false)}
    />
    <View style={styles.tossSheet}>
      ...
    </View>
  </View>
</Modal>
```

### 2. 직접 추가 모달 (`showPumasiAddModal`)

```jsx
<Modal visible={showPumasiAddModal} transparent animationType="slide">
  <View style={styles.modalOverlay}>
    <TouchableOpacity
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      activeOpacity={1}
      onPress={() => setShowPumasiAddModal(false)}
    />
    <View style={styles.pumasiModalContainer}>
      ...
    </View>
  </View>
</Modal>
```

### 3. 줬음 기록 바텀시트 (`showPumasiGaveSheet`)
- 이전 수정(13번)에서 이미 적용됨

---

## 빌드 검증

| 항목 | 결과 |
|------|------|
| Expo Web Export | ✅ 성공 |
