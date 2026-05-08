import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const DEFAULT_BUTTONS = [{ text: '확인' }];

const getAlertTone = (title = '') => {
  if (/오류|실패|에러|삭제|탈퇴|부족/.test(title)) {
    return {
      icon: 'alert-circle-outline',
      iconColor: '#B42318',
      iconBackground: '#FEF3F2',
      primary: '#111827',
    };
  }

  if (/완료|성공|감사|복사/.test(title)) {
    return {
      icon: 'checkmark-circle-outline',
      iconColor: '#0F766E',
      iconBackground: '#ECFDF5',
      primary: '#0F766E',
    };
  }

  if (/준비|안내|알림|확인|인쇄|권한/.test(title)) {
    return {
      icon: 'information-circle-outline',
      iconColor: '#2563EB',
      iconBackground: '#EFF6FF',
      primary: '#111827',
    };
  }

  return {
    icon: 'chatbubble-ellipses-outline',
    iconColor: '#4B5563',
    iconBackground: '#F3F4F6',
    primary: '#111827',
  };
};

export default function GlobalAlertHost() {
  const [alertState, setAlertState] = useState({
    visible: false,
    title: '',
    message: '',
    buttons: DEFAULT_BUTTONS,
    options: {},
  });
  const scaleAnim = useRef(new Animated.Value(0.96)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const originalAlert = Alert.alert;

    Alert.alert = (title, message, buttons, options) => {
      const nextButtons = Array.isArray(buttons) && buttons.length > 0 ? buttons : DEFAULT_BUTTONS;
      setAlertState({
        visible: true,
        title: title || '',
        message: message || '',
        buttons: nextButtons,
        options: options || {},
      });
    };

    return () => {
      Alert.alert = originalAlert;
    };
  }, []);

  useEffect(() => {
    if (alertState.visible) {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 140,
          friction: 12,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    opacityAnim.setValue(0);
    scaleAnim.setValue(0.96);
  }, [alertState.visible, opacityAnim, scaleAnim]);

  const tone = useMemo(() => getAlertTone(alertState.title), [alertState.title]);

  const closeAlert = (button) => {
    const callback = button?.onPress;
    setAlertState(prev => ({ ...prev, visible: false }));
    setTimeout(() => {
      callback?.();
    }, 80);
  };

  const closeByBackdrop = () => {
    if (alertState.options?.cancelable === false) return;
    setAlertState(prev => ({ ...prev, visible: false }));
    setTimeout(() => {
      alertState.options?.onDismiss?.();
    }, 80);
  };

  if (!alertState.visible) return null;

  return (
    <Modal
      transparent
      visible={alertState.visible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={closeByBackdrop}
    >
      <TouchableWithoutFeedback onPress={closeByBackdrop}>
        <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <Animated.View
              style={[
                styles.card,
                {
                  opacity: opacityAnim,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <View style={[styles.iconWrap, { backgroundColor: tone.iconBackground }]}>
                <Ionicons name={tone.icon} size={32} color={tone.iconColor} />
              </View>

              {!!alertState.title && (
                <Text style={styles.title}>{alertState.title}</Text>
              )}
              {!!alertState.message && (
                <Text style={styles.message}>{alertState.message}</Text>
              )}

              <View style={[
                styles.buttonWrap,
                alertState.buttons.length > 2 && styles.buttonWrapStacked,
              ]}>
                {alertState.buttons.map((button, index) => {
                  const isCancel = button?.style === 'cancel';
                  const isDestructive = button?.style === 'destructive';
                  const isPrimary = !isCancel && index === alertState.buttons.length - 1;

                  return (
                    <TouchableOpacity
                      key={`${button?.text || 'button'}-${index}`}
                      style={[
                        styles.button,
                        alertState.buttons.length > 2 && styles.buttonStacked,
                        isPrimary && styles.primaryButton,
                        isPrimary && { backgroundColor: isDestructive ? '#B42318' : tone.primary },
                      ]}
                      activeOpacity={0.82}
                      onPress={() => closeAlert(button)}
                    >
                      <Text
                        style={[
                          styles.buttonText,
                          isPrimary && styles.primaryButtonText,
                          isDestructive && isPrimary && styles.destructiveButtonText,
                        ]}
                      >
                        {button?.text || '확인'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.54)',
  },
  card: {
    width: '100%',
    maxWidth: 360,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 18,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.2,
    shadowRadius: 28,
    elevation: 12,
  },
  iconWrap: {
    width: 62,
    height: 62,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 9,
  },
  message: {
    fontSize: 14,
    lineHeight: 21,
    color: '#4B5563',
    textAlign: 'center',
  },
  buttonWrap: {
    width: '100%',
    flexDirection: 'row',
    gap: 9,
    marginTop: 20,
  },
  buttonWrapStacked: {
    flexDirection: 'column',
  },
  button: {
    flex: 1,
    minHeight: 48,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    backgroundColor: '#F3F4F6',
  },
  buttonStacked: {
    width: '100%',
    flex: 0,
  },
  primaryButton: {
    backgroundColor: '#111827',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#4B5563',
    textAlign: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
  },
  destructiveButtonText: {
    color: '#FFFFFF',
  },
});
