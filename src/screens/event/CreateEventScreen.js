// src/screens/event/CreateEventScreen.js - Event Type Selection Screen
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../styles/constants';
import { getUserSubscriptionInfo, checkEventCreationLimit } from '../../lib/supabaseHelper';

export default function CreateEventScreen({ navigation, route, userInfo, session }) {
  const { selectedDate, presetDate } = route?.params || {};
  const [userSubscription, setUserSubscription] = useState(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitModalType, setLimitModalType] = useState(null); // 'wedding' or 'funeral'

  // 구독 정보 로드
  useEffect(() => {
    const loadSubscriptionInfo = async () => {
      const userId = userInfo?.userId || session?.user?.id;
      if (userId) {
        try {
          const result = await getUserSubscriptionInfo(userId);
          console.log('💳 CreateEventScreen 구독 정보:', result);
          
          // subscription 객체 추출 및 필드명 변환
          const subscriptionInfo = result?.subscription ? {
            subscription_type: result.subscription.type || 'free',
            max_wedding_events: result.subscription.maxWeddingEvents || 1,
            max_funeral_events: result.subscription.maxFuneralEvents || 1,
            current_wedding_events: result.subscription.currentWeddingEvents || 0,
            current_funeral_events: result.subscription.currentFuneralEvents || 0
          } : null;
          
          setUserSubscription(subscriptionInfo);
        } catch (error) {
          console.error('구독 정보 로드 오류:', error);
        }
      }
    };
    
    loadSubscriptionInfo();
  }, [userInfo, session]);

  const handleEventTypeSelection = async (eventType) => {
    // 구독 제한 체크
    const userId = userInfo?.userId || session?.user?.id;
    if (userId) {
      const canCreate = await checkEventCreationLimit(eventType, userId);
      if (!canCreate) {
        setLimitModalType(eventType);
        setShowLimitModal(true);
        return;
      }
    }

    const params = {
      selectedDate,
      presetDate,
      userInfo,
      session,
    };

    if (eventType === 'wedding') {
      navigation.navigate('CreateWedding', params);
    } else if (eventType === 'funeral') {
      navigation.navigate('CreateFuneral', params);
    }
  };

  // 이벤트 타입별 제한 확인
  const isWeddingDisabled = userSubscription && 
    userSubscription.subscription_type === 'free' && 
    userSubscription.current_wedding_events >= userSubscription.max_wedding_events;
    
  const isFuneralDisabled = userSubscription && 
    userSubscription.subscription_type === 'free' && 
    userSubscription.current_funeral_events >= userSubscription.max_funeral_events;

  const getModalContent = () => {
    const eventTypeName = limitModalType === 'wedding' ? '결혼식' : '장례식';
    return {
      title: '무료 플랜 제한',
      message: `무료 플랜에서는 ${eventTypeName} 이벤트를 1개만 만들 수 있습니다.\n프리미엄 플랜으로 업그레이드하여 무제한으로 이용해보세요!`,
      buttonText: '프리미엄으로 업그레이드'
    };
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>경조사 만들기</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>어떤 경조사를 만드시겠어요?</Text>
        <Text style={styles.subtitle}>용도에 맞는 템플릿을 준비했어요</Text>

        <View style={styles.optionsContainer}>
          <TouchableOpacity 
            style={[
              styles.optionCard, 
              styles.weddingCard,
              isWeddingDisabled && styles.disabledCard
            ]}
            onPress={() => handleEventTypeSelection('wedding')}
            disabled={isWeddingDisabled}
          >
            <View style={styles.optionIcon}>
              <Ionicons 
                name="heart" 
                size={32} 
                color={isWeddingDisabled ? '#BDC3C7' : Colors.wedding} 
              />
            </View>
            <Text style={[
              styles.optionTitle,
              isWeddingDisabled && styles.disabledText
            ]}>
              결혼식
            </Text>
            <Text style={[
              styles.optionDescription,
              isWeddingDisabled && styles.disabledText
            ]}>
              청첩장과 축의금 관리
            </Text>
            {isWeddingDisabled && (
              <View style={styles.disabledOverlay}>
                <Ionicons name="lock-closed" size={16} color="#BDC3C7" />
                <Text style={styles.disabledLabel}>제한됨</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.optionCard, 
              styles.funeralCard,
              isFuneralDisabled && styles.disabledCard
            ]}
            onPress={() => handleEventTypeSelection('funeral')}
            disabled={isFuneralDisabled}
          >
            <View style={styles.optionIcon}>
              <Ionicons 
                name="flower" 
                size={32} 
                color={isFuneralDisabled ? '#BDC3C7' : Colors.funeral} 
              />
            </View>
            <Text style={[
              styles.optionTitle,
              isFuneralDisabled && styles.disabledText
            ]}>
              장례식
            </Text>
            <Text style={[
              styles.optionDescription,
              isFuneralDisabled && styles.disabledText
            ]}>
              부고장과 조의금 관리
            </Text>
            {isFuneralDisabled && (
              <View style={styles.disabledOverlay}>
                <Ionicons name="lock-closed" size={16} color="#BDC3C7" />
                <Text style={styles.disabledLabel}>제한됨</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {selectedDate && (
          <View style={styles.selectedDateContainer}>
            <Ionicons name="calendar" size={16} color={Colors.primary} />
            <Text style={styles.selectedDateText}>
              선택된 날짜: {selectedDate.toLocaleDateString()}
            </Text>
          </View>
        )}
      </View>

      {/* 제한 모달 */}
      <Modal
        visible={showLimitModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLimitModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Ionicons name="lock-closed" size={24} color="#F39C12" />
              <Text style={styles.modalTitle}>{getModalContent().title}</Text>
            </View>
            
            <Text style={styles.modalMessage}>
              {getModalContent().message}
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowLimitModal(false)}
              >
                <Text style={styles.cancelButtonText}>닫기</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.upgradeButton}
                onPress={() => {
                  setShowLimitModal(false);
                  // TODO: 프리미엄 업그레이드 화면으로 이동
                  Alert.alert('준비 중', '프리미엄 업그레이드 기능을 준비 중입니다.');
                }}
              >
                <Text style={styles.upgradeButtonText}>{getModalContent().buttonText}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  
  placeholder: {
    width: 40,
  },
  
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 48,
  },
  
  optionsContainer: {
    gap: 20,
  },
  
  optionCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.gray100,
  },
  
  weddingCard: {
    borderColor: Colors.wedding + '20',
    backgroundColor: Colors.wedding + '05',
  },
  
  funeralCard: {
    borderColor: Colors.funeral + '20',
    backgroundColor: Colors.funeral + '05',
  },
  
  optionIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  optionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  
  optionDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  
  selectedDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    padding: 12,
    backgroundColor: Colors.primary + '10',
    borderRadius: 8,
    gap: 8,
  },
  
  selectedDateText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  
  // 비활성화 스타일
  disabledCard: {
    opacity: 0.5,
    backgroundColor: '#F8F9FA',
  },
  
  disabledText: {
    color: '#BDC3C7',
  },
  
  disabledOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECF0F1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  
  disabledLabel: {
    fontSize: 10,
    color: '#BDC3C7',
    fontWeight: '600',
  },
  
  // 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  
  modalContainer: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 320,
  },
  
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  
  modalMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 24,
    textAlign: 'center',
  },
  
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    alignItems: 'center',
  },
  
  cancelButtonText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  
  upgradeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
  },
  
  upgradeButtonText: {
    fontSize: 14,
    color: Colors.white,
    fontWeight: '600',
  },
});