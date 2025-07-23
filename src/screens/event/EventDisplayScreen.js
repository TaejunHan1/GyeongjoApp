// src/screens/event/EventDisplayScreen.js - 부조하기 버튼 QR코드 연결
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Animated,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../styles/constants';
import { getEventDetail } from '../../lib/supabaseHelper';
import WeddingTemplatePreview from './templates/WeddingTemplatePreview';
import FuneralTemplatePreview from './templates/FuneralTemplatePreview';

const { width, height } = Dimensions.get('window');

export default function EventDisplayScreen({ navigation, route }) {
  const { 
    eventId, 
    templateStyle,
    categorizedImages,
    eventData: passedEventData 
  } = route.params;
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showExitButton, setShowExitButton] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    console.log('🎭 EventDisplayScreen 시작 - 파라미터:', {
      eventId,
      templateStyle,
      hasCategorizedImages: !!categorizedImages,
      hasPassedEventData: !!passedEventData,
    });

    if (eventId === 'preview' && passedEventData) {
      setIsPreviewMode(true);
      setEvent(passedEventData);
      setLoading(false);
    } else {
      loadEventData();
    }
    
    startAnimations();
    
    const exitTimer = setTimeout(() => {
      setShowExitButton(true);
    }, 8000);

    return () => {
      clearTimeout(exitTimer);
    };
  }, [eventId, passedEventData]);

  const loadEventData = async () => {
    try {
      setLoading(true);
      console.log('🔄 DB에서 이벤트 데이터 로드 시작:', eventId);
      
      const result = await getEventDetail(eventId);
      
      if (result.success) {
        console.log('✅ DB 데이터 로드 성공:', {
          eventName: result.data.event_name,
          eventType: result.data.event_type,
        });
        
        setEvent(result.data);
      } else {
        console.error('❌ 이벤트 로딩 실패:', result.error);
        Alert.alert('오류', '경조사를 불러올 수 없습니다.');
        navigation.goBack();
      }
    } catch (error) {
      console.error('❌ 이벤트 로딩 예외:', error);
      Alert.alert('오류', '경조사를 불러오는 중 문제가 발생했습니다.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const startAnimations = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  };

  const getFinalTemplateStyle = () => {
    if (templateStyle) {
      return templateStyle;
    }
    
    if (event?.template_style) {
      return event.template_style;
    }
    
    const defaultStyle = getEventType() === 'funeral' ? 'traditional-dark' : 'modern-dark';
    return defaultStyle;
  };

  const getEventType = () => {
    if (passedEventData?.type) {
      return passedEventData.type;
    }
    
    if (event?.event_type) {
      return event.event_type;
    }
    
    return 'wedding';
  };

  const getFinalEventData = () => {
    if (passedEventData) {
      return passedEventData;
    }

    if (event) {
      const eventType = event.event_type;
      
      if (eventType === 'funeral') {
        const funeralData = {
          type: 'funeral',
          deceasedName: event.deceased_name || event.main_person_name,
          deceasedAge: event.deceased_age,
          deathDate: event.death_date,
          deceasedGender: event.deceased_gender || '남',
          casketDate: event.casket_date || event.funeral_start_date,
          casketTime: event.casket_time,
          burialDate: event.burial_date || event.funeral_end_date,
          burialTime: event.burial_time,
          burialLocation: event.burial_location,
          secondaryBurialLocation: event.secondary_burial_location,
          funeralHome: event.funeral_home,
          location: event.location,
          detailedAddress: event.detailed_address,
          familyMembers: Array.isArray(event.family_members) ? event.family_members : [],
          primaryContact: event.primary_contact,
          secondaryContact: event.secondary_contact,
          funeralDirector: event.funeral_director,
          customMessage: event.custom_message,
        };

        if (event.additional_info) {
          Object.assign(funeralData, event.additional_info);
        }

        return funeralData;
      } else {
        return {
          type: event.event_type,
          groomName: event.groom_name,
          brideName: event.bride_name,
          date: event.event_date,
          ceremonyTime: event.ceremony_time,
          receptionTime: event.additional_info?.reception_time,
          location: event.location,
          detailedAddress: event.detailed_address,
          customMessage: event.custom_message,
          parkingInfo: event.parking_info,
          groomFatherName: event.groom_father_name,
          groomMotherName: event.groom_mother_name,
          brideFatherName: event.bride_father_name,
          brideMotherName: event.bride_mother_name,
          groomContact: event.groom_contact,
          brideContact: event.bride_contact,
        };
      }
    }

    return {};
  };

  const getFinalCategorizedImages = () => {
    if (categorizedImages && Object.keys(categorizedImages).length > 0) {
      return categorizedImages;
    }

    if (event) {
      if (event.additional_info?.categorized_images) {
        return event.additional_info.categorized_images;
      }

      if (event.image_urls && event.image_urls.length > 0) {
        const processedImages = {
          main: event.image_urls.filter(img => img.category === 'main'),
          gallery: event.image_urls.filter(img => img.category === 'gallery'),
          groom: event.image_urls.filter(img => img.category === 'groom'),
          bride: event.image_urls.filter(img => img.category === 'bride'),
          all: event.image_urls
        };
        
        return processedImages;
      }
    }

    return {};
  };

  const getMessageSettings = () => {
    if (passedEventData?.allowMessages !== undefined) {
      return {
        allowMessages: passedEventData.allowMessages,
        messageSettings: passedEventData.messageSettings || {
          placeholder: getEventType() === 'funeral' ? '삼가 고인의 명복을 빕니다.' : '축하합니다!',
          requireLogin: true,
        }
      };
    }

    if (event) {
      return {
        allowMessages: event.allow_messages || false,
        messageSettings: {
          placeholder: event.message_placeholder || 
                      (event.event_type === 'funeral' ? '삼가 고인의 명복을 빕니다.' : '축하합니다!'),
          requireLogin: true,
        }
      };
    }

    return {
      allowMessages: false,
      messageSettings: {
        placeholder: getEventType() === 'funeral' ? '삼가 고인의 명복을 빕니다.' : '축하합니다!',
        requireLogin: true,
      }
    };
  };

  // 🔥 부조하기 버튼 핸들러 - QR코드 화면으로 연결
  const handleContribute = () => {
    if (isPreviewMode) {
      Alert.alert('알림', '미리보기 모드입니다. 실제 부조는 완성된 경조사에서 가능합니다.');
      return;
    }
    
    // QR코드 화면으로 이동
    navigation.navigate('QRCode', {
      eventId: event.id,
      eventName: event.event_name
    });
  };

  const handleMessageSubmit = async (messageData) => {
    console.log('📝 메시지 제출:', messageData);
    Alert.alert('감사합니다', '메시지가 전달되었습니다.');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <Ionicons name="tv" size={48} color={Colors.primary} />
          <Text style={styles.loadingText}>
            {getEventType() === 'funeral' ? '추모 화면 준비 중...' : '청첩장 준비 중...'}
          </Text>
        </View>
      </View>
    );
  }

  if (!event && !isPreviewMode) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color={Colors.error} />
        <Text style={styles.errorText}>
          {getEventType() === 'funeral' ? '부고를 불러올 수 없습니다' : '청첩장을 불러올 수 없습니다'}
        </Text>
        <TouchableOpacity 
          style={styles.errorButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.errorButtonText}>돌아가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const finalEventType = getEventType();
  const finalTemplateStyle = getFinalTemplateStyle();
  const finalEventData = getFinalEventData();
  const finalCategorizedImages = getFinalCategorizedImages();
  const finalTemplate = { style: finalTemplateStyle };
  const messageSettings = getMessageSettings();

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      
      {isPreviewMode && (
        <View style={styles.previewBanner}>
          <Ionicons name="eye" size={16} color={Colors.white} />
          <Text style={styles.previewBannerText}>미리보기 모드</Text>
        </View>
      )}
      
      <Animated.View style={[{ flex: 1 }, { opacity: fadeAnim }]}>
        {finalEventType === 'funeral' ? (
          <FuneralTemplatePreview
            template={finalTemplate}
            eventData={finalEventData}
            categorizedImages={finalCategorizedImages}
            userImages={event?.image_urls || []}
            allowMessages={messageSettings.allowMessages}
            messageSettings={messageSettings.messageSettings}
            onMessageSubmit={handleMessageSubmit}
          />
        ) : (
          <WeddingTemplatePreview
            template={finalTemplate}
            eventData={finalEventData}
            categorizedImages={finalCategorizedImages}
            userImages={event?.image_urls || []}
            allowMessages={messageSettings.allowMessages}
            messageSettings={messageSettings.messageSettings}
            onMessageSubmit={handleMessageSubmit}
          />
        )}
      </Animated.View>
      
      {/* 🔥 부조하기 플로팅 버튼 - QR코드로 연결 */}
      {!isPreviewMode && (
        <TouchableOpacity 
          style={styles.contributeFloatingButton}
          onPress={handleContribute}
        >
          <Ionicons name="qr-code" size={20} color={Colors.white} />
          <Text style={styles.contributeFloatingText}>부조 QR코드</Text>
        </TouchableOpacity>
      )}
      
      {(showExitButton || isPreviewMode) && (
        <TouchableOpacity 
          style={styles.exitButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={20} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  
  previewBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(74, 136, 255, 0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
    zIndex: 1000,
  },
  previewBannerText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: 40,
    gap: 20,
  },
  errorText: {
    fontSize: 18,
    color: Colors.error,
    textAlign: 'center',
    fontWeight: '500',
  },
  errorButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: {
    fontSize: 16,
    color: Colors.white,
    fontWeight: '600',
  },
  
  exitButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  
  // 🔥 부조하기 플로팅 버튼 - QR코드 아이콘 추가
  contributeFloatingButton: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    gap: 8,
    zIndex: 1000,
  },
  contributeFloatingText: {
    fontSize: 14,
    color: Colors.white,
    fontWeight: '600',
  },
});