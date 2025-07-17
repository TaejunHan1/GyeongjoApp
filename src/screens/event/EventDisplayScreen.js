// src/screens/event/EventDisplayScreen.js - 부고 지원 추가
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
  // 🔥 HomeScreen에서 전달받은 파라미터들
  const { 
    eventId, 
    templateStyle,      // HomeScreen에서 전달
    categorizedImages,  // HomeScreen에서 전달  
    eventData: passedEventData // HomeScreen에서 전달
  } = route.params;
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showExitButton, setShowExitButton] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // 애니메이션
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    console.log('🎭 EventDisplayScreen 시작 - 파라미터:', {
      eventId,
      templateStyle,
      hasCategorizedImages: !!categorizedImages,
      hasPassedEventData: !!passedEventData,
      categorizedImagesCounts: categorizedImages ? {
        main: categorizedImages.main?.length || 0,
        gallery: categorizedImages.gallery?.length || 0,
        groom: categorizedImages.groom?.length || 0,
        bride: categorizedImages.bride?.length || 0
      } : 'none'
    });

    if (eventId === 'preview' && passedEventData) {
      setIsPreviewMode(true);
      setEvent(passedEventData);
      setLoading(false);
    } else {
      loadEventData();
    }
    
    startAnimations();
    
    // 8초 후 닫기 버튼 표시
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
          templateStyle: result.data.template_style,
          imageUrls: result.data.image_urls?.length || 0,
          additionalInfo: !!result.data.additional_info
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

  // 🔥 최종 템플릿 스타일 결정
  const getFinalTemplateStyle = () => {
    // 1. HomeScreen에서 전달받은 templateStyle 우선 사용
    if (templateStyle) {
      console.log('✅ HomeScreen 템플릿 스타일 사용:', templateStyle);
      return templateStyle;
    }
    
    // 2. DB에서 불러온 template_style 사용
    if (event?.template_style) {
      console.log('✅ DB 템플릿 스타일 사용:', event.template_style);
      return event.template_style;
    }
    
    // 3. 기본값 - 이벤트 타입에 따라 다르게
    const defaultStyle = getEventType() === 'funeral' ? 'traditional-dark' : 'modern-dark';
    console.log('⚠️ 기본 템플릿 스타일 사용:', defaultStyle);
    return defaultStyle;
  };

  // 🔥 이벤트 타입 결정
  const getEventType = () => {
    // 1. passedEventData에서 타입 확인
    if (passedEventData?.type) {
      return passedEventData.type;
    }
    
    // 2. DB 데이터에서 타입 확인
    if (event?.event_type) {
      return event.event_type;
    }
    
    // 3. 기본값
    return 'wedding';
  };

  // 🔥 최종 이벤트 데이터 준비 - 결혼식과 부고 분기 처리
  const getFinalEventData = () => {
    // HomeScreen에서 전달받은 데이터가 있으면 우선 사용
    if (passedEventData) {
      console.log('✅ HomeScreen 이벤트 데이터 사용:', passedEventData);
      return passedEventData;
    }

    // DB 데이터를 템플릿 형식으로 변환
    if (event) {
      const eventType = event.event_type;
      console.log('✅ DB 데이터를 템플릿 형식으로 변환 - 타입:', eventType);
      console.log('🔍 전체 DB 이벤트 데이터:', event);
      
      if (eventType === 'funeral') {
        // 부고 데이터 변환 - 더 상세하게
        const funeralData = {
          type: 'funeral',
          
          // 고인 정보
          deceasedName: event.deceased_name || event.main_person_name,
          deceasedAge: event.deceased_age,
          deathDate: event.death_date,
          deceasedGender: event.deceased_gender || '남',
          
          // 장례 일정
          casketDate: event.casket_date || event.funeral_start_date,
          casketTime: event.casket_time,
          burialDate: event.burial_date || event.funeral_end_date,
          burialTime: event.burial_time,
          burialLocation: event.burial_location,
          secondaryBurialLocation: event.secondary_burial_location,
          
          // 장례식장 정보
          funeralHome: event.funeral_home,
          location: event.location, // 장례식장 주소
          detailedAddress: event.detailed_address, // 빈소 위치
          
          // 가족 정보 (상주)
          familyMembers: Array.isArray(event.family_members) ? event.family_members : [],
          
          // 연락처
          primaryContact: event.primary_contact,
          secondaryContact: event.secondary_contact,
          funeralDirector: event.funeral_director,
          
          // 메시지
          customMessage: event.custom_message,
        };

        // additional_info가 있으면 추가 정보 병합
        if (event.additional_info) {
          console.log('🔍 additional_info 발견:', event.additional_info);
          Object.assign(funeralData, event.additional_info);
        }

        console.log('🎭 변환된 부고 데이터:', {
          deceasedName: funeralData.deceasedName,
          familyMembersCount: funeralData.familyMembers?.length || 0,
          familyMembers: funeralData.familyMembers,
          primaryContact: funeralData.primaryContact,
          funeralHome: funeralData.funeralHome,
          burialDate: funeralData.burialDate,
          burialTime: funeralData.burialTime,
          burialLocation: funeralData.burialLocation
        });

        return funeralData;
      } else {
        // 결혼식 데이터 변환 (기존 로직 유지)
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
          
          // 부모님 정보
          groomFatherName: event.groom_father_name,
          groomMotherName: event.groom_mother_name,
          brideFatherName: event.bride_father_name,
          brideMotherName: event.bride_mother_name,
          groomContact: event.groom_contact,
          brideContact: event.bride_contact,
          
          // additional_info에서 추가 정보
          groomFatherContact: event.additional_info?.groom_father_contact,
          groomMotherContact: event.additional_info?.groom_mother_contact,
          brideFatherContact: event.additional_info?.bride_father_contact,
          brideMotherContact: event.additional_info?.bride_mother_contact,
        };
      }
    }

    return {};
  };

  // 🔥 최종 카테고리별 이미지 준비
  const getFinalCategorizedImages = () => {
    // 1. HomeScreen에서 전달받은 카테고리별 이미지 우선 사용
    if (categorizedImages && Object.keys(categorizedImages).length > 0) {
      console.log('✅ HomeScreen 카테고리별 이미지 사용:', {
        main: categorizedImages.main?.length || 0,
        gallery: categorizedImages.gallery?.length || 0,
        groom: categorizedImages.groom?.length || 0,
        bride: categorizedImages.bride?.length || 0
      });
      return categorizedImages;
    }

    // 2. DB 데이터에서 카테고리별 이미지 추출
    if (event) {
      console.log('🔄 DB 데이터에서 카테고리별 이미지 추출 시도');
      
      // additional_info에서 먼저 시도
      if (event.additional_info?.categorized_images) {
        console.log('✅ additional_info에서 카테고리별 이미지 발견');
        return event.additional_info.categorized_images;
      }

      // image_urls에서 카테고리별로 분류
      if (event.image_urls && event.image_urls.length > 0) {
        console.log('🔄 image_urls에서 카테고리별 분류 시도');
        const processedImages = {
          main: event.image_urls.filter(img => img.category === 'main'),
          gallery: event.image_urls.filter(img => img.category === 'gallery'),
          groom: event.image_urls.filter(img => img.category === 'groom'),
          bride: event.image_urls.filter(img => img.category === 'bride'),
          all: event.image_urls
        };
        
        console.log('✅ 분류된 이미지:', {
          main: processedImages.main.length,
          gallery: processedImages.gallery.length,
          groom: processedImages.groom.length,
          bride: processedImages.bride.length
        });
        
        return processedImages;
      }
    }

    // 3. 빈 객체 반환
    console.log('⚠️ 카테고리별 이미지 없음, 기본값 사용');
    return {};
  };

  // 🔥 방명록 설정 가져오기
  const getMessageSettings = () => {
    // 1. passedEventData에서 확인
    if (passedEventData?.allowMessages !== undefined) {
      return {
        allowMessages: passedEventData.allowMessages,
        messageSettings: passedEventData.messageSettings || {
          placeholder: getEventType() === 'funeral' ? '삼가 고인의 명복을 빕니다.' : '축하합니다!',
          requireLogin: true,
        }
      };
    }

    // 2. DB 데이터에서 확인
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

    // 3. 기본값
    return {
      allowMessages: false,
      messageSettings: {
        placeholder: getEventType() === 'funeral' ? '삼가 고인의 명복을 빕니다.' : '축하합니다!',
        requireLogin: true,
      }
    };
  };

  const handleContribute = () => {
    if (isPreviewMode) {
      Alert.alert('알림', '미리보기 모드입니다. 실제 부조는 완성된 경조사에서 가능합니다.');
      return;
    }
    
    navigation.navigate('Contribution', {
      eventId: event.id,
      eventName: event.event_name
    });
  };

  const handleMessageSubmit = async (messageData) => {
    console.log('📝 메시지 제출:', messageData);
    // 실제 구현에서는 여기서 API 호출하여 메시지 저장
    Alert.alert('감사합니다', '메시지가 전달되었습니다.');
  };

  // 로딩 화면
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

  // 에러 화면
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

  // 🔥 최종 데이터 준비
  const finalEventType = getEventType();
  const finalTemplateStyle = getFinalTemplateStyle();
  const finalEventData = getFinalEventData();
  const finalCategorizedImages = getFinalCategorizedImages();
  const finalTemplate = { style: finalTemplateStyle };
  const messageSettings = getMessageSettings();

  console.log('🎭 템플릿에 전달할 최종 데이터:', {
    eventType: finalEventType,
    templateStyle: finalTemplateStyle,
    eventDataKeys: Object.keys(finalEventData),
    categorizedImagesCounts: {
      main: finalCategorizedImages.main?.length || 0,
      gallery: finalCategorizedImages.gallery?.length || 0,
      groom: finalCategorizedImages.groom?.length || 0,
      bride: finalCategorizedImages.bride?.length || 0
    },
    allowMessages: messageSettings.allowMessages
  });

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      
      {/* 미리보기 모드 배너 */}
      {isPreviewMode && (
        <View style={styles.previewBanner}>
          <Ionicons name="eye" size={16} color={Colors.white} />
          <Text style={styles.previewBannerText}>미리보기 모드</Text>
        </View>
      )}
      
      {/* 🔥 이벤트 타입에 따른 템플릿 렌더링 */}
      <Animated.View style={[{ flex: 1 }, { opacity: fadeAnim }]}>
        {finalEventType === 'funeral' ? (
          <FuneralTemplatePreview
            template={finalTemplate}
            eventData={finalEventData}
            categorizedImages={finalCategorizedImages}
            userImages={event?.image_urls || []} // 백업용
            allowMessages={messageSettings.allowMessages}
            messageSettings={messageSettings.messageSettings}
            onMessageSubmit={handleMessageSubmit}
          />
        ) : (
          <WeddingTemplatePreview
            template={finalTemplate}
            eventData={finalEventData}
            categorizedImages={finalCategorizedImages}
            userImages={event?.image_urls || []} // 백업용
            allowMessages={messageSettings.allowMessages}
            messageSettings={messageSettings.messageSettings}
            onMessageSubmit={handleMessageSubmit}
          />
        )}
      </Animated.View>
      
      {/* 닫기 버튼 */}
      {(showExitButton || isPreviewMode) && (
        <TouchableOpacity 
          style={styles.exitButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={20} color="white" />
        </TouchableOpacity>
      )}

      {/* 부조하기 플로팅 버튼 */}
      {!isPreviewMode && (
        <TouchableOpacity 
          style={styles.contributeFloatingButton}
          onPress={handleContribute}
        >
          <Ionicons 
            name={finalEventType === 'funeral' ? "flower" : "heart"} 
            size={20} 
            color="white" 
          />
          <Text style={styles.contributeFloatingText}>
            {finalEventType === 'funeral' ? '조의하기' : '부조하기'}
          </Text>
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
  
  // 미리보기 배너
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
  
  // 로딩 화면
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
  
  // 에러 화면
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
  
  // 닫기 버튼
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
  
  // 부조하기 플로팅 버튼
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