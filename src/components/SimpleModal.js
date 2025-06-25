// src/components/SimpleModal.js
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../styles/constants';

const { width, height } = Dimensions.get('window');

const SimpleModal = ({
  visible = false,
  onClose,
  title,
  message,
  confirmText = '확인',
  cancelText,
  onConfirm,
  onCancel,
  type = 'default', // default, success, warning, error
  icon,
  dangerous = false,
  children,
  animationType = 'fade', // fade, slide, scale
  position = 'center', // center, bottom
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    if (visible) {
      showModal();
    } else {
      hideModal();
    }
  }, [visible]);

  const showModal = () => {
    if (animationType === 'scale') {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (animationType === 'slide') {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  };

  const hideModal = () => {
    if (animationType === 'scale') {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (animationType === 'slide') {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: height,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleBackdropPress = () => {
    if (onClose) {
      onClose();
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    if (onClose) {
      onClose();
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    if (onClose) {
      onClose();
    }
  };

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          iconName: 'checkmark-circle',
          iconColor: Colors.success,
          confirmColor: Colors.success,
        };
      case 'warning':
        return {
          iconName: 'warning',
          iconColor: Colors.warning,
          confirmColor: Colors.warning,
        };
      case 'error':
        return {
          iconName: 'close-circle',
          iconColor: Colors.error,
          confirmColor: Colors.error,
        };
      default:
        return {
          iconName: 'information-circle',
          iconColor: Colors.primary,
          confirmColor: dangerous ? Colors.error : Colors.primary,
        };
    }
  };

  const typeStyles = getTypeStyles();

  const getModalTransform = () => {
    if (animationType === 'scale') {
      return [{ scale: scaleAnim }];
    } else if (animationType === 'slide') {
      return [{ translateY: slideAnim }];
    }
    return [];
  };

  const getModalStyle = () => {
    const baseStyle = [styles.modalContent];
    
    if (position === 'bottom') {
      baseStyle.push(styles.modalContentBottom);
    } else {
      baseStyle.push(styles.modalContentCenter);
    }
    
    return baseStyle;
  };

  if (!visible) return null;

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                getModalStyle(),
                {
                  opacity: fadeAnim,
                  transform: getModalTransform(),
                },
              ]}
            >
              {/* 아이콘 */}
              {(icon || type !== 'default') && (
                <View style={styles.iconContainer}>
                  <Ionicons
                    name={icon || typeStyles.iconName}
                    size={48}
                    color={typeStyles.iconColor}
                  />
                </View>
              )}

              {/* 제목 */}
              {title && (
                <Text style={styles.title}>{title}</Text>
              )}

              {/* 메시지 */}
              {message && (
                <Text style={styles.message}>{message}</Text>
              )}

              {/* 커스텀 컨텐츠 */}
              {children && (
                <View style={styles.customContent}>
                  {children}
                </View>
              )}

              {/* 버튼들 */}
              <View style={styles.buttonContainer}>
                {cancelText && (
                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={handleCancel}
                  >
                    <Text style={styles.cancelButtonText}>{cancelText}</Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.confirmButton,
                    { backgroundColor: typeStyles.confirmColor },
                    cancelText && styles.buttonFlex,
                  ]}
                  onPress={handleConfirm}
                >
                  <Text style={styles.confirmButtonText}>{confirmText}</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

// 미리 정의된 모달 타입들
export const ConfirmModal = (props) => (
  <SimpleModal
    {...props}
    cancelText={props.cancelText || '취소'}
    confirmText={props.confirmText || '확인'}
  />
);

export const AlertModal = (props) => (
  <SimpleModal
    {...props}
    confirmText={props.confirmText || '확인'}
  />
);

export const SuccessModal = (props) => (
  <SimpleModal
    {...props}
    type="success"
    confirmText={props.confirmText || '확인'}
  />
);

export const ErrorModal = (props) => (
  <SimpleModal
    {...props}
    type="error"
    confirmText={props.confirmText || '확인'}
  />
);

export const WarningModal = (props) => (
  <SimpleModal
    {...props}
    type="warning"
    cancelText={props.cancelText || '취소'}
    confirmText={props.confirmText || '확인'}
  />
);

export const DangerModal = (props) => (
  <SimpleModal
    {...props}
    dangerous={true}
    cancelText={props.cancelText || '취소'}
    confirmText={props.confirmText || '삭제'}
  />
);

export const BottomModal = (props) => (
  <SimpleModal
    {...props}
    position="bottom"
    animationType="slide"
  />
);

export const ScaleModal = (props) => (
  <SimpleModal
    {...props}
    animationType="scale"
  />
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
    width: width - 80,
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalContentCenter: {
    alignSelf: 'center',
  },
  modalContentBottom: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    width: 'auto',
    maxWidth: 'none',
    borderRadius: 20,
  },
  
  // 아이콘
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  
  // 텍스트
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 24,
  },
  message: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  
  // 커스텀 컨텐츠
  customContent: {
    marginBottom: 24,
  },
  
  // 버튼들
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  buttonFlex: {
    flex: 1,
  },
  cancelButton: {
    backgroundColor: Colors.gray100,
    flex: 1,
  },
  confirmButton: {
    backgroundColor: Colors.primary,
    flex: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});

export default SimpleModal;