import React, { useCallback, useRef, useState } from 'react';
import {
  Image,
  Linking,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import {
  dismissAdminModal,
  getActiveAdminModals,
  getCurrentAppUserId,
} from '../lib/adminConsole';

export default function AdminAppModalHost({ targetScreen, userInfo, session }) {
  const [modalQueue, setModalQueue] = useState([]);
  const [currentModal, setCurrentModal] = useState(null);
  const sessionDismissedRef = useRef(new Set());

  const userId = getCurrentAppUserId(userInfo, session);

  const loadModals = useCallback(async () => {
    const result = await getActiveAdminModals(targetScreen, userId);
    if (result.success) {
      const visibleModals = result.data.filter(
        (modal) => !sessionDismissedRef.current.has(modal.id),
      );
      setModalQueue(visibleModals);
      setCurrentModal(visibleModals[0] || null);
    }
  }, [targetScreen, userId]);

  useFocusEffect(
    useCallback(() => {
      loadModals();
    }, [loadModals]),
  );

  const closeCurrent = async (forever = false) => {
    if (!currentModal) return;
    sessionDismissedRef.current.add(currentModal.id);
    await dismissAdminModal(currentModal.id, userId, forever);
    const nextQueue = modalQueue.filter((item) => item.id !== currentModal.id);
    setModalQueue(nextQueue);
    setCurrentModal(nextQueue[0] || null);
  };

  const openCta = async () => {
    if (!currentModal?.cta_url) return;
    const canOpen = await Linking.canOpenURL(currentModal.cta_url);
    if (canOpen) Linking.openURL(currentModal.cta_url);
  };

  return (
    <Modal
      visible={!!currentModal}
      transparent
      animationType="fade"
      onRequestClose={() => closeCurrent(false)}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => closeCurrent(false)}
            activeOpacity={0.75}
          >
            <Ionicons name="close" size={20} color="#6B7684" />
          </TouchableOpacity>

          {!!currentModal?.image_url && (
            <Image
              source={{ uri: currentModal.image_url }}
              style={styles.image}
              resizeMode="cover"
            />
          )}

          <View style={styles.content}>
            <Text style={styles.badge}>정담 공지</Text>
            <Text style={styles.title}>{currentModal?.title}</Text>
            {!!currentModal?.body && (
              <Text style={styles.body}>{currentModal.body}</Text>
            )}

            {!!currentModal?.cta_label && !!currentModal?.cta_url && (
              <TouchableOpacity
                style={styles.ctaButton}
                onPress={openCta}
                activeOpacity={0.84}
              >
                <Text style={styles.ctaText}>{currentModal.cta_label}</Text>
              </TouchableOpacity>
            )}

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => closeCurrent(false)}
                activeOpacity={0.78}
              >
                <Text style={styles.secondaryText}>닫기</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.neverButton}
                onPress={() => closeCurrent(true)}
                activeOpacity={0.78}
              >
                <Text style={styles.neverText}>다시 보지 않기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
    backgroundColor: 'rgba(15, 23, 42, 0.36)',
  },
  card: {
    width: '100%',
    maxWidth: 430,
    overflow: 'hidden',
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.18,
    shadowRadius: 30,
    elevation: 12,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 2,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  image: {
    width: '100%',
    height: 178,
    backgroundColor: '#F2F4F6',
  },
  content: {
    padding: 22,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#E8F3FF',
    color: '#3182F6',
    fontSize: 12,
    fontWeight: '900',
  },
  title: {
    marginTop: 14,
    fontSize: 24,
    lineHeight: 31,
    fontWeight: '900',
    color: '#191F28',
    letterSpacing: 0,
  },
  body: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
    color: '#6B7684',
    letterSpacing: 0,
  },
  ctaButton: {
    marginTop: 18,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3182F6',
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  actionRow: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    height: 50,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F4F6',
  },
  secondaryText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#4E5968',
  },
  neverButton: {
    flex: 1,
    height: 50,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF4FF',
  },
  neverText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#3182F6',
  },
});
