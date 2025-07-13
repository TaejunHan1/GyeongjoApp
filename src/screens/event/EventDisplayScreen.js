// src/screens/event/EventDisplayScreen.js - WeddingTemplatePreview 사용하도록 완전 수정
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
          templateStyle: result.data.template_style,
          imageUrls: result.data.image_urls?.length || 0,
          additionalInfo: !!result.data.additional_info
        });
        
        setEvent(result.data);
      } else {
        console.error('❌ 이벤트 로딩 실패:', result.error);
        Alert.alert('오류', '청첩장을 불러올 수 없습니다.');
        navigation.goBack();
      }
    } catch (error) {
      console.error('❌ 이벤트 로딩 예외:', error);
      Alert.alert('오류', '청첩장을 불러오는 중 문제가 발생했습니다.');
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
    
    // 3. 기본값
    console.log('⚠️ 기본 템플릿 스타일 사용: modern-dark');
    return 'modern-dark';
  };

  // 🔥 최종 이벤트 데이터 준비
  const getFinalEventData = () => {
    // HomeScreen에서 전달받은 데이터가 있으면 우선 사용
    if (passedEventData) {
      console.log('✅ HomeScreen 이벤트 데이터 사용');
      return passedEventData;
    }

    // DB 데이터를 WeddingTemplatePreview 형식으로 변환
    if (event) {
      console.log('✅ DB 데이터를 템플릿 형식으로 변환');
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

  // 로딩 화면
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <Ionicons name="tv" size={48} color={Colors.primary} />
          <Text style={styles.loadingText}>청첩장 준비 중...</Text>
        </View>
      </View>
    );
  }

  // 에러 화면
  if (!event && !isPreviewMode) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color={Colors.error} />
        <Text style={styles.errorText}>청첩장을 불러올 수 없습니다</Text>
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
  const finalTemplateStyle = getFinalTemplateStyle();
  const finalEventData = getFinalEventData();
  const finalCategorizedImages = getFinalCategorizedImages();
  const finalTemplate = { style: finalTemplateStyle };

  console.log('🎭 WeddingTemplatePreview에 전달할 최종 데이터:', {
    templateStyle: finalTemplateStyle,
    eventDataKeys: Object.keys(finalEventData),
    categorizedImagesCounts: {
      main: finalCategorizedImages.main?.length || 0,
      gallery: finalCategorizedImages.gallery?.length || 0,
      groom: finalCategorizedImages.groom?.length || 0,
      bride: finalCategorizedImages.bride?.length || 0
    }
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
      
      {/* 🔥 WeddingTemplatePreview 컴포넌트 사용 - CreateEventScreen과 동일 */}
      <Animated.View style={[{ flex: 1 }, { opacity: fadeAnim }]}>
        <WeddingTemplatePreview
          template={finalTemplate}
          eventData={finalEventData}
          categorizedImages={finalCategorizedImages}
          userImages={event?.image_urls || []} // 백업용
        />
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
          <Ionicons name="heart" size={20} color="white" />
          <Text style={styles.contributeFloatingText}>부조하기</Text>
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