// Alert.alert() 대체 — iOS/Android 통일된 커스텀 모달
// 기존 SimpleModal 컴포넌트와 짝을 이룸.
//
// 사용법:
//   const { showAlert, alertProps } = useSimpleAlert();
//   showAlert({ title: '알림', message: '저장 완료' });
//   showAlert({
//     title: '삭제',
//     message: '정말 삭제할까요?',
//     confirmText: '삭제',
//     cancelText: '취소',
//     dangerous: true,
//     onConfirm: () => doDelete(),
//   });
//
//   // 렌더 트리 어딘가에:
//   <SimpleModal {...alertProps} />
import { useState } from 'react';

export function useSimpleAlert() {
  const [state, setState] = useState({ visible: false });

  const showAlert = (opts = {}) => {
    setState({ visible: true, ...opts });
  };

  const hide = () => setState(s => ({ ...s, visible: false }));

  const alertProps = {
    visible: state.visible,
    onClose: hide,
    title: state.title || '',
    message: state.message || '',
    confirmText: state.confirmText || '확인',
    cancelText: state.cancelText || null,
    dangerous: !!state.dangerous,
    animationType: state.animationType || 'scale',
    onConfirm: () => {
      state.onConfirm?.();
      hide();
    },
    onCancel: () => {
      state.onCancel?.();
      hide();
    },
  };

  return { showAlert, alertProps };
}
