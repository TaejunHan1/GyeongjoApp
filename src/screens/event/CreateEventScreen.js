// src/screens/event/CreateEventScreen.js - 토스 스타일 디자인 적용 (수정된 버전)
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  Dimensions,
  Modal,
  Animated,
  Easing,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../styles/constants';
import { createEvent } from '../../lib/supabaseHelper';
import DaumPostcode from '../../components/DaumPostcode';
import WeddingTemplatePreview from './templates/WeddingTemplatePreview';

const { width, height } = Dimensions.get('window');

// 토스 스타일 컬러 팔레트
const TossColors = {
  primary: '#0064FF',
  secondary: '#F5F7FA',
  background: '#FFFFFF',
  card: '#FFFFFF',
  text: '#191F28',
  textSecondary: '#6B7684',
  textTertiary: '#8B95A1',
  border: '#E5E8EB',
  success: '#00C851',
  warning: '#FF9500',
  error: '#FF4747',
  accent: '#7B61FF',
  shadow: 'rgba(0, 0, 0, 0.06)',
};

export default function CreateEventScreen({ navigation, route }) {
  const { eventType = 'wedding' } = route.params || {};
  
  const [currentStep, setCurrentStep] = useState(1);
  const [eventData, setEventData] = useState({
    type: eventType,
    title: '',
    date: null,
    time: null,
    location: '',
    detailedAddress: '',
    
    groomName: '',
    brideName: '',
    groomFatherName: '',
    groomMotherName: '',
    brideFatherName: '',
    brideMotherName: '',
    groomContact: '',
    brideContact: '',
    ceremonyTime: null,
    receptionTime: null,
    customMessage: '',
    parkingInfo: '',
    
    familyRelations: ['신랑측', '신부측'],
    presetAmounts: [100000, 200000, 300000],
    selectedTemplate: null,
    images: [],
  });
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showAddressSearch, setShowAddressSearch] = useState(false);
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // 사진 카테고리 선택 관련 state
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [selectedImageForCategory, setSelectedImageForCategory] = useState(null);

  // 애니메이션 값
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
    ]).start();
  }, [currentStep]);

  const eventTypes = [
    { 
      key: 'wedding', 
      label: '결혼식', 
      icon: '💐', 
      color: TossColors.primary,
      description: '소중한 결혼식 청첩장',
      gradient: ['#0064FF', '#4A90E2']
    },
    { 
      key: 'funeral', 
      label: '부고', 
      icon: '🕯️', 
      color: '#6B7684',
      description: '정중한 부고 안내',
      gradient: ['#6B7684', '#8B95A1']
    },
    { 
      key: 'birthday', 
      label: '돌잔치', 
      icon: '🎂', 
      color: '#FF9500',
      description: '첫 번째 생일 축하',
      gradient: ['#FF9500', '#FFB84D']
    },
    { 
      key: 'other', 
      label: '기타', 
      icon: '🎉', 
      color: '#7B61FF',
      description: '특별한 행사',
      gradient: ['#7B61FF', '#9C88FF']
    },
  ];

  const templates = {
    wedding: [
      {
        id: 'modern-dark',
        name: '모던 다크',
        description: '세련되고 감각적인 디자인',
        preview: require('../../../assets/images/aa1.png'),
        colors: ['#0064FF', '#4A90E2', '#ffffff'],
        style: 'modern-dark',
        features: ['다크 모드', '그라디언트 배경', '애니메이션 효과', '실시간 카운트다운'],
        photoCategories: [
          { key: 'main', label: '메인 사진', icon: '🖼️', description: '청첩장 대표 사진' },
          { key: 'groom', label: '신랑 사진', icon: '🤵', description: '신랑 소개 사진' },
          { key: 'bride', label: '신부 사진', icon: '👰', description: '신부 소개 사진' },
          { key: 'couple', label: '커플 사진', icon: '💕', description: '함께 찍은 사진' },
          { key: 'gallery', label: '갤러리', icon: '📷', description: '추억 사진들' },
        ]
      },
      {
        id: 'romantic-gold', 
        name: '한국 전통',
        description: '우아한 한국 전통 스타일',
        preview: require('../../../assets/images/aa2.png'),
        colors: ['#8B4513', '#F7E7CE', '#E8B4A0'],
        style: 'romantic-gold',
        features: ['전통 색상', '한국적 레이아웃', '감성적 디자인', '실시간 카운트다운'],
        photoCategories: [
          { key: 'main', label: '메인 사진', icon: '🖼️', description: '청첩장 대표 사진' },
          { key: 'hanbok', label: '한복 사진', icon: '👘', description: '한복 입은 사진' },
          { key: 'ceremony', label: '전통 예식', icon: '🏛️', description: '전통 예식 사진' },
          { key: 'family', label: '가족 사진', icon: '👨‍👩‍👧‍👦', description: '양가 가족 사진' },
          { key: 'gallery', label: '갤러리', icon: '📷', description: '추억 사진들' },
        ]
      },
      {
        id: 'vintage-app',
        name: '빈티지 앱',
        description: '트렌디한 스토리 스타일',
        preview: require('../../../assets/images/aa3.png'),
        colors: ['#6c5ce7', '#fd79a8', '#00b894'],
        style: 'vintage-app',
        features: ['스토리 타임라인', '모던 색감', '인터랙티브 요소', '실시간 타이머'],
        photoCategories: [
          { key: 'first_meet', label: '첫 만남', icon: '👋', description: '처음 만났을 때' },
          { key: 'dating', label: '연인이 되다', icon: '💕', description: '연인이 된 순간' },
          { key: 'proposal', label: '프로포즈', icon: '💍', description: '프로포즈 순간' },
          { key: 'engagement', label: '약혼', icon: '👫', description: '약혼 사진' },
          { key: 'wedding', label: '결혼식', icon: '💒', description: '결혼식 당일' },
          { key: 'honeymoon', label: '신혼여행', icon: '✈️', description: '신혼여행 사진' },
        ]
      },
    ],
    funeral: [
      {
        id: 'funeral-solemn',
        name: '차분한 추모',
        description: '정중하고 엄숙한 분위기',
        preview: require('../../../assets/images/bb1.png'),
        colors: ['#f8f9fa', '#64748b'],
        style: 'solemn',
        photoCategories: [
          { key: 'portrait', label: '영정 사진', icon: '🖼️', description: '고인의 영정 사진' },
          { key: 'life', label: '생전 모습', icon: '📸', description: '생전 추억 사진' },
          { key: 'family', label: '가족 사진', icon: '👨‍👩‍👧‍👦', description: '가족과 함께' },
        ]
      },
    ],
    birthday: [
      {
        id: 'birthday-happy',
        name: '행복한 돌잔치',
        description: '밝고 즐거운 첫 번째 생일',
        preview: require('../../../assets/images/aa1.png'),
        colors: ['#fffbf0', '#f59e0b'],
        style: 'garden',
        photoCategories: [
          { key: 'baby', label: '아기 사진', icon: '👶', description: '돌잔치 주인공' },
          { key: 'growth', label: '성장 과정', icon: '📈', description: '성장하는 모습' },
          { key: 'family', label: '가족 사진', icon: '👨‍👩‍👧‍👦', description: '가족과 함께' },
          { key: 'celebration', label: '축하 순간', icon: '🎉', description: '돌잔치 순간' },
        ]
      },
    ],
    other: [
      {
        id: 'other-celebration',
        name: '기념일 축하',
        description: '특별한 순간을 위한 디자인',
        preview: require('../../../assets/images/aa1.png'),
        colors: ['#ebf8ff', '#3b82f6'],
        style: 'classic',
        photoCategories: [
          { key: 'main', label: '메인 사진', icon: '🖼️', description: '행사 대표 사진' },
          { key: 'celebration', label: '축하 사진', icon: '🎉', description: '축하하는 순간' },
          { key: 'group', label: '단체 사진', icon: '👥', description: '함께한 사람들' },
        ]
      },
    ],
  };

  // 경조사 타입에 따른 텍스트 설정
  const getEventTypeTexts = () => {
    switch (eventData.type) {
      case 'wedding':
        return {
          moneyLabel: '축의금',
          moneyDescription: '하객들이 선택할 수 있는 축의금 금액을 설정해 주세요',
          relationLabel: '관계',
          defaultRelations: ['신랑측', '신부측'],
          presetOptions: [
            { 
              label: '소규모', 
              amounts: [50000, 100000, 150000], 
              description: '가까운 지인들과 함께',
              icon: '👥'
            },
            { 
              label: '일반적', 
              amounts: [100000, 200000, 300000], 
              description: '일반적인 결혼식 축의금',
              icon: '💝'
            },
            { 
              label: '정식', 
              amounts: [200000, 300000, 500000], 
              description: '정식 결혼식 행사',
              icon: '🎩'
            },
            { 
              label: '고액', 
              amounts: [300000, 500000, 1000000], 
              description: '격식있는 대규모 결혼식',
              icon: '👑'
            },
          ]
        };
      case 'funeral':
        return {
          moneyLabel: '조의금',
          moneyDescription: '조문객들이 선택할 수 있는 조의금 금액을 설정해 주세요',
          relationLabel: '관계',
          defaultRelations: ['가족', '친지', '지인', '직장동료'],
          presetOptions: [
            { 
              label: '소규모', 
              amounts: [30000, 50000, 100000], 
              description: '가까운 지인들과 함께',
              icon: '👥'
            },
            { 
              label: '일반적', 
              amounts: [50000, 100000, 200000], 
              description: '일반적인 조의금',
              icon: '🙏'
            },
            { 
              label: '정식', 
              amounts: [100000, 200000, 300000], 
              description: '정식 조문',
              icon: '🕯️'
            },
            { 
              label: '고액', 
              amounts: [200000, 300000, 500000], 
              description: '특별한 관계',
              icon: '🌹'
            },
          ]
        };
      case 'birthday':
        return {
          moneyLabel: '축하금',
          moneyDescription: '하객들이 선택할 수 있는 축하금 금액을 설정해 주세요',
          relationLabel: '관계',
          defaultRelations: ['가족', '친지', '지인'],
          presetOptions: [
            { 
              label: '소규모', 
              amounts: [50000, 100000, 150000], 
              description: '가까운 가족과 친지',
              icon: '👶'
            },
            { 
              label: '일반적', 
              amounts: [100000, 200000, 300000], 
              description: '일반적인 돌잔치 축하금',
              icon: '🎂'
            },
            { 
              label: '정식', 
              amounts: [200000, 300000, 500000], 
              description: '정식 돌잔치 행사',
              icon: '🎉'
            },
            { 
              label: '고액', 
              amounts: [300000, 500000, 1000000], 
              description: '격식있는 돌잔치',
              icon: '👑'
            },
          ]
        };
      default:
        return {
          moneyLabel: '축하금',
          moneyDescription: '참석자들이 선택할 수 있는 축하금 금액을 설정해 주세요',
          relationLabel: '관계',
          defaultRelations: ['가족', '친지', '지인'],
          presetOptions: [
            { 
              label: '소규모', 
              amounts: [30000, 50000, 100000], 
              description: '가까운 지인들과 함께',
              icon: '👥'
            },
            { 
              label: '일반적', 
              amounts: [50000, 100000, 200000], 
              description: '일반적인 축하금',
              icon: '🎉'
            },
            { 
              label: '정식', 
              amounts: [100000, 200000, 300000], 
              description: '정식 기념행사',
              icon: '🎊'
            },
            { 
              label: '고액', 
              amounts: [200000, 300000, 500000], 
              description: '특별한 기념일',
              icon: '⭐'
            },
          ]
        };
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setEventData({ ...eventData, date: selectedDate });
    }
  };

  const handleTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setEventData({ ...eventData, ceremonyTime: selectedTime });
    }
  };

  const handleAddressComplete = (data) => {
    setEventData({
      ...eventData,
      location: data.address,
    });
    setShowAddressSearch(false);
  };

  const formatDate = (date) => {
    if (!date) return '날짜를 선택해 주세요';
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return '날짜를 선택해 주세요';
      
      return dateObj.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
      });
    } catch (error) {
      return '날짜를 선택해 주세요';
    }
  };

  const formatTime = (time) => {
    if (!time) return '시간을 선택해 주세요';
    
    try {
      if (time instanceof Date && !isNaN(time.getTime())) {
        return time.toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });
      }
      return '시간을 선택해 주세요';
    } catch (error) {
      return '시간을 선택해 주세요';
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('ko-KR').format(amount) + '원';
  };

  const pickImages = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한 필요', '사진 선택을 위해 갤러리 접근 권한이 필요해요.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled) {
        const newImage = result.assets[0];
        setSelectedImageForCategory({
          ...newImage,
          tempId: Date.now()
        });
        setShowCategorySelector(true);
      }
    } catch (error) {
      Alert.alert('오류', '사진 선택 중 문제가 발생했어요.');
    }
  };

  const handleCategorySelect = (category) => {
    if (!selectedImageForCategory) return;

    const imageWithCategory = {
      ...selectedImageForCategory,
      category: category.key,
      categoryLabel: category.label,
      id: selectedImageForCategory.tempId
    };

    // 단일 사진 카테고리 처리
    if (category.key !== 'gallery') {
      const newImages = eventData.images.filter(img => img.category !== category.key);
      setEventData({
        ...eventData,
        images: [...newImages, imageWithCategory].slice(0, 20),
      });
    } else {
      // 갤러리는 여러 개 허용
      setEventData({
        ...eventData,
        images: [...eventData.images, imageWithCategory].slice(0, 20),
      });
    }

    setShowCategorySelector(false);
    setSelectedImageForCategory(null);
  };

  const removeImage = (index) => {
    const newImages = eventData.images.filter((_, i) => i !== index);
    setEventData({ ...eventData, images: newImages });
  };

  const handleTemplatePreview = (template) => {
    setPreviewTemplate(template);
    setShowTemplatePreview(true);
  };

  const handleTemplateSelect = (template) => {
    setEventData({ ...eventData, selectedTemplate: template });
    setShowTemplatePreview(false);
  };

  const validateStep1 = () => {
    if (eventData.type === 'wedding') {
      if (!eventData.groomName.trim()) {
        Alert.alert('입력 확인', '신랑 이름을 입력해 주세요.');
        return false;
      }
      if (!eventData.brideName.trim()) {
        Alert.alert('입력 확인', '신부 이름을 입력해 주세요.');
        return false;
      }
      if (!eventData.date) {
        Alert.alert('입력 확인', '결혼식 날짜를 선택해 주세요.');
        return false;
      }
    } else {
      if (!eventData.title.trim()) {
        Alert.alert('입력 확인', '행사명을 입력해 주세요.');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (validateStep1()) {
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      if (!eventData.selectedTemplate) {
        Alert.alert('템플릿 선택', '마음에 드는 템플릿을 선택해 주세요.');
        return;
      }
      handleSave();
    }
  };

  const handleSave = async () => {
    setIsLoading(true);

    try {
      const fullLocation = eventData.detailedAddress 
        ? `${eventData.location} ${eventData.detailedAddress}`.trim()
        : eventData.location.trim();

      const eventTitle = eventData.type === 'wedding' 
        ? `${eventData.groomName} ♥ ${eventData.brideName} 결혼식`
        : eventData.title.trim();

      const formattedEventData = {
        event_type: eventData.type,
        event_name: eventTitle,
        main_person_name: eventData.type === 'wedding' 
          ? `${eventData.groomName}, ${eventData.brideName}`
          : eventData.hostName?.trim(),
        event_date: eventData.date && eventData.date instanceof Date && !isNaN(eventData.date.getTime()) ? 
          eventData.date.toISOString().split('T')[0] : null,
        location: fullLocation || null,
        detailed_address: eventData.detailedAddress.trim() || null,
        template_style: eventData.selectedTemplate?.style || 'modern-dark',
        family_relations: eventData.familyRelations,
        preset_amounts: eventData.presetAmounts,
        
        ...(eventData.type === 'wedding' && {
          bride_name: eventData.brideName.trim(),
          groom_name: eventData.groomName.trim(),
          bride_father_name: eventData.brideFatherName.trim() || null,
          bride_mother_name: eventData.brideMotherName.trim() || null,
          groom_father_name: eventData.groomFatherName.trim() || null,
          groom_mother_name: eventData.groomMotherName.trim() || null,
          bride_contact: eventData.brideContact.trim() || null,
          groom_contact: eventData.groomContact.trim() || null,
          ceremony_time: eventData.ceremonyTime && eventData.ceremonyTime instanceof Date && !isNaN(eventData.ceremonyTime.getTime()) ? 
            eventData.ceremonyTime.toTimeString().split(' ')[0] : null,
          custom_message: eventData.customMessage.trim() || null,
          parking_info: eventData.parkingInfo.trim() || null,
          additional_info: {
            reception_time: eventData.receptionTime && eventData.receptionTime instanceof Date && !isNaN(eventData.receptionTime.getTime()) ? 
              eventData.receptionTime.toTimeString().split(' ')[0] : null,
          }
        }),
        
        status: 'active',
        is_finalized: false,
        image_urls: [],
      };

      const result = await createEvent(formattedEventData);

      if (result.success) {
        setCurrentStep(3);
        setTimeout(() => {
          navigation.navigate('EventDisplay', { 
            eventId: result.data.id,
            templateStyle: eventData.selectedTemplate?.style || 'modern-dark'
          });
        }, 2000);
      } else {
        Alert.alert('오류', '경조사 등록에 실패했어요. 다시 시도해 주세요.');
      }
    } catch (error) {
      Alert.alert('오류', '경조사 등록 중 문제가 발생했어요.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderWeddingFields = () => (
    <Animated.View style={[styles.formContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      {/* 신랑 신부 이름 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>신랑 & 신부</Text>
        <Text style={styles.cardSubtitle}>결혼하실 두 분의 이름을 입력해 주세요</Text>
        
        <View style={styles.coupleInputRow}>
          <View style={styles.coupleInputContainer}>
            <Text style={styles.inputLabel}>신랑 이름</Text>
            <TextInput
              style={[styles.textInput, !eventData.groomName && styles.textInputRequired]}
              placeholder="예: 김민수"
              value={eventData.groomName}
              onChangeText={(text) => setEventData({ ...eventData, groomName: text })}
              placeholderTextColor={TossColors.textTertiary}
            />
          </View>
          
          <View style={styles.coupleInputContainer}>
            <Text style={styles.inputLabel}>신부 이름</Text>
            <TextInput
              style={[styles.textInput, !eventData.brideName && styles.textInputRequired]}
              placeholder="예: 이영희"
              value={eventData.brideName}
              onChangeText={(text) => setEventData({ ...eventData, brideName: text })}
              placeholderTextColor={TossColors.textTertiary}
            />
          </View>
        </View>
      </View>

      {/* 연락처 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>연락처</Text>
        <Text style={styles.cardSubtitle}>하객들이 연락할 수 있는 번호예요</Text>
        
        <View style={styles.coupleInputRow}>
          <View style={styles.coupleInputContainer}>
            <Text style={styles.inputLabel}>신랑 연락처</Text>
            <TextInput
              style={styles.textInput}
              placeholder="010-1234-5678"
              value={eventData.groomContact}
              onChangeText={(text) => setEventData({ ...eventData, groomContact: text })}
              keyboardType="phone-pad"
              placeholderTextColor={TossColors.textTertiary}
            />
          </View>
          
          <View style={styles.coupleInputContainer}>
            <Text style={styles.inputLabel}>신부 연락처</Text>
            <TextInput
              style={styles.textInput}
              placeholder="010-9876-5432"
              value={eventData.brideContact}
              onChangeText={(text) => setEventData({ ...eventData, brideContact: text })}
              keyboardType="phone-pad"
              placeholderTextColor={TossColors.textTertiary}
            />
          </View>
        </View>
      </View>

      {/* 양가 부모님 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>양가 부모님</Text>
        <Text style={styles.cardSubtitle}>청첩장에 표시될 부모님 성함이에요</Text>
        
        <View style={styles.parentsSection}>
          <Text style={styles.parentTitle}>👨‍👩‍👧‍👦 신랑측 부모님</Text>
          <View style={styles.coupleInputRow}>
            <View style={styles.coupleInputContainer}>
              <Text style={styles.inputLabel}>아버님</Text>
              <TextInput
                style={styles.textInput}
                placeholder="김○○"
                value={eventData.groomFatherName}
                onChangeText={(text) => setEventData({ ...eventData, groomFatherName: text })}
                placeholderTextColor={TossColors.textTertiary}
              />
            </View>
            <View style={styles.coupleInputContainer}>
              <Text style={styles.inputLabel}>어머님</Text>
              <TextInput
                style={styles.textInput}
                placeholder="박○○"
                value={eventData.groomMotherName}
                onChangeText={(text) => setEventData({ ...eventData, groomMotherName: text })}
                placeholderTextColor={TossColors.textTertiary}
              />
            </View>
          </View>
        </View>

        <View style={styles.parentsSection}>
          <Text style={styles.parentTitle}>👨‍👩‍👧‍👦 신부측 부모님</Text>
          <View style={styles.coupleInputRow}>
            <View style={styles.coupleInputContainer}>
              <Text style={styles.inputLabel}>아버님</Text>
              <TextInput
                style={styles.textInput}
                placeholder="이○○"
                value={eventData.brideFatherName}
                onChangeText={(text) => setEventData({ ...eventData, brideFatherName: text })}
                placeholderTextColor={TossColors.textTertiary}
              />
            </View>
            <View style={styles.coupleInputContainer}>
              <Text style={styles.inputLabel}>어머님</Text>
              <TextInput
                style={styles.textInput}
                placeholder="최○○"
                value={eventData.brideMotherName}
                onChangeText={(text) => setEventData({ ...eventData, brideMotherName: text })}
                placeholderTextColor={TossColors.textTertiary}
              />
            </View>
          </View>
        </View>
      </View>

      {/* 인사말 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>💌 인사말</Text>
        <Text style={styles.cardSubtitle}>하객들에게 전할 따뜻한 메시지를 적어보세요</Text>
        
        <TextInput
          style={[styles.textInput, styles.messageInput]}
          placeholder="저희의 소중한 첫 걸음에 함께해 주시는 모든 분들께 진심으로 감사드립니다. 앞으로도 많은 사랑과 격려 부탁드립니다."
          value={eventData.customMessage}
          onChangeText={(text) => setEventData({ ...eventData, customMessage: text })}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          placeholderTextColor={TossColors.textTertiary}
        />
      </View>

      {/* 추가 정보 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🅿️ 주차 안내</Text>
        <Text style={styles.cardSubtitle}>주차에 대한 안내사항을 적어주세요</Text>
        
        <TextInput
          style={styles.textInput}
          placeholder="예: 건물 지하 1층 주차장 이용 (2시간 무료)"
          value={eventData.parkingInfo}
          onChangeText={(text) => setEventData({ ...eventData, parkingInfo: text })}
          placeholderTextColor={TossColors.textTertiary}
        />
      </View>
    </Animated.View>
  );

  const renderBasicFields = () => (
    <Animated.View style={[styles.formContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>기본 정보</Text>
        <Text style={styles.cardSubtitle}>행사의 기본 정보를 입력해 주세요</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>행사명</Text>
          <TextInput
            style={[styles.textInput, !eventData.title && styles.textInputRequired]}
            placeholder={`예: ${eventData.type === 'funeral' ? '故 김영희 장례식' :
                            eventData.type === 'birthday' ? '김민수 첫 돌잔치' : '특별한 기념일'}`}
            value={eventData.title}
            onChangeText={(text) => setEventData({ ...eventData, title: text })}
            placeholderTextColor={TossColors.textTertiary}
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>주최자</Text>
          <TextInput
            style={styles.textInput}
            placeholder="주최자 이름을 입력해 주세요"
            value={eventData.hostName}
            onChangeText={(text) => setEventData({ ...eventData, hostName: text })}
            placeholderTextColor={TossColors.textTertiary}
          />
        </View>
      </View>
    </Animated.View>
  );

  const getCurrentPhotoCategories = () => {
    if (!eventData.selectedTemplate) {
      // 기본 카테고리 제공
      return [
        { key: 'main', label: '메인 사진', icon: '🖼️', description: '대표 사진' },
        { key: 'gallery', label: '갤러리', icon: '📷', description: '추억 사진들' },
      ];
    }
    return eventData.selectedTemplate.photoCategories || [];
  };

  const getCategoryStats = () => {
    const categories = getCurrentPhotoCategories();
    const stats = {};
    
    categories.forEach(cat => {
      stats[cat.key] = 0;
    });
    
    eventData.images.forEach(img => {
      if (img.category && stats[img.category] !== undefined) {
        stats[img.category]++;
      }
    });
    
    return stats;
  };

  const renderStep1 = () => {
    const eventTypeTexts = getEventTypeTexts();
    
    return (
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 경조사 타입 선택 */}
        <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.cardTitle}>어떤 경조사인가요?</Text>
          <Text style={styles.cardSubtitle}>준비하실 경조사 종류를 선택해 주세요</Text>
          
          <View style={styles.typeGrid}>
            {eventTypes.map((type) => (
              <TouchableOpacity
                key={type.key}
                style={[
                  styles.typeCard,
                  eventData.type === type.key && styles.typeCardSelected,
                ]}
                onPress={() => setEventData({ ...eventData, type: type.key })}
              >
                <LinearGradient
                  colors={eventData.type === type.key ? type.gradient : ['transparent', 'transparent']}
                  style={[
                    styles.typeCardGradient,
                    eventData.type === type.key && styles.typeCardGradientSelected
                  ]}
                >
                  <Text style={styles.typeIcon}>{type.icon}</Text>
                  <Text style={[
                    styles.typeLabel,
                    eventData.type === type.key && styles.typeLabelSelected
                  ]}>
                    {type.label}
                  </Text>
                  <Text style={[
                    styles.typeDescription,
                    eventData.type === type.key && styles.typeDescriptionSelected
                  ]}>
                    {type.description}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* 동적 필드 렌더링 */}
        {eventData.type === 'wedding' ? renderWeddingFields() : renderBasicFields()}

        {/* 날짜 & 시간 */}
        <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.cardTitle}>📅 날짜 & 시간</Text>
          <Text style={styles.cardSubtitle}>행사가 열리는 날짜와 시간을 선택해 주세요</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>날짜</Text>
            <TouchableOpacity
              style={[styles.selectButton, !eventData.date && styles.selectButtonRequired]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={[
                styles.selectButtonText,
                !eventData.date && styles.selectButtonTextPlaceholder
              ]}>
                {formatDate(eventData.date)}
              </Text>
              <Ionicons name="calendar-outline" size={20} color={TossColors.textSecondary} />
            </TouchableOpacity>
          </View>

          {eventData.type === 'wedding' && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>예식 시간</Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={[
                  styles.selectButtonText,
                  !eventData.ceremonyTime && styles.selectButtonTextPlaceholder
                ]}>
                  {formatTime(eventData.ceremonyTime)}
                </Text>
                <Ionicons name="time-outline" size={20} color={TossColors.textSecondary} />
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>

        {/* 장소 */}
        <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.cardTitle}>📍 장소</Text>
          <Text style={styles.cardSubtitle}>행사가 열리는 장소를 입력해 주세요</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>주소</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowAddressSearch(true)}
            >
              <Text style={[
                styles.selectButtonText,
                !eventData.location && styles.selectButtonTextPlaceholder
              ]}>
                {eventData.location || '주소를 검색해 주세요'}
              </Text>
              <Ionicons name="search-outline" size={20} color={TossColors.primary} />
            </TouchableOpacity>
            
            {eventData.location && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>상세 주소</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="예: 3층 그랜드볼룸"
                  value={eventData.detailedAddress}
                  onChangeText={(text) => setEventData({ ...eventData, detailedAddress: text })}
                  placeholderTextColor={TossColors.textTertiary}
                />
              </View>
            )}
          </View>
        </Animated.View>

        {/* 사진 업로드 - Step 1에 추가 */}
        <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.cardTitle}>📷 사진 업로드</Text>
          <Text style={styles.cardSubtitle}>
            {eventData.type === 'wedding' 
              ? '결혼식에 사용할 사진들을 업로드해 주세요 (최대 20장)'
              : '경조사에 사용할 사진들을 업로드해 주세요 (최대 20장)'
            }
          </Text>

          {/* 카테고리별 현황 */}
          <View style={styles.categoryStatusGrid}>
            {getCurrentPhotoCategories().map(category => {
              const count = getCategoryStats()[category.key] || 0;
              const maxCount = category.key === 'gallery' ? '∞' : '1';
              return (
                <View key={category.key} style={styles.categoryStatusCard}>
                  <Text style={styles.categoryStatusIcon}>{category.icon}</Text>
                  <Text style={styles.categoryStatusLabel}>{category.label}</Text>
                  <Text style={[
                    styles.categoryStatusCount,
                    { color: count > 0 ? TossColors.primary : TossColors.textTertiary }
                  ]}>
                    {count}/{maxCount}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* 사진 업로드 버튼 */}
          <TouchableOpacity style={styles.uploadButton} onPress={pickImages}>
            <Ionicons name="camera" size={24} color={TossColors.primary} />
            <Text style={styles.uploadButtonText}>사진 추가하기</Text>
            <Text style={styles.uploadButtonSubtext}>갤러리에서 선택</Text>
          </TouchableOpacity>

          {/* 업로드된 사진들 */}
          {eventData.images.length > 0 && (
            <View style={styles.uploadedImagesContainer}>
              <Text style={styles.uploadedImagesTitle}>업로드된 사진 ({eventData.images.length})</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.uploadedImagesScroll}>
                {eventData.images.map((image, index) => (
                  <View key={image.id || index} style={styles.uploadedImageItem}>
                    <Image source={{ uri: image.uri }} style={styles.uploadedImage} />
                    
                    {image.category && (
                      <View style={styles.uploadedImageCategory}>
                        <Text style={styles.uploadedImageCategoryText}>
                          {getCurrentPhotoCategories().find(cat => cat.key === image.category)?.icon || '📷'}
                        </Text>
                      </View>
                    )}
                    
                    <TouchableOpacity
                      style={styles.uploadedImageRemove}
                      onPress={() => removeImage(index)}
                    >
                      <Ionicons name="close-circle" size={20} color={TossColors.error} />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </Animated.View>

        {/* 축의금/조의금/축하금 설정 */}
        <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.cardTitle}>💰 {eventTypeTexts.moneyLabel} 설정</Text>
          <Text style={styles.cardSubtitle}>{eventTypeTexts.moneyDescription}</Text>
          
          <View style={styles.presetGrid}>
            {eventTypeTexts.presetOptions.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.presetCard,
                  JSON.stringify(eventData.presetAmounts) === JSON.stringify(option.amounts) &&
                    styles.presetCardSelected,
                ]}
                onPress={() => setEventData({ ...eventData, presetAmounts: option.amounts })}
              >
                <Text style={styles.presetIcon}>{option.icon}</Text>
                <Text style={[
                  styles.presetLabel,
                  JSON.stringify(eventData.presetAmounts) === JSON.stringify(option.amounts) &&
                    styles.presetLabelSelected,
                ]}>
                  {option.label}
                </Text>
                <Text style={[
                  styles.presetDescription,
                  JSON.stringify(eventData.presetAmounts) === JSON.stringify(option.amounts) &&
                    styles.presetDescriptionSelected,
                ]}>
                  {option.description}
                </Text>
                <View style={styles.presetAmounts}>
                  {option.amounts.map((amount, i) => (
                    <Text
                      key={i}
                      style={[
                        styles.presetAmount,
                        JSON.stringify(eventData.presetAmounts) === JSON.stringify(option.amounts) &&
                          styles.presetAmountSelected,
                      ]}
                    >
                      {formatAmount(amount)}
                    </Text>
                  ))}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </ScrollView>
    );
  };

  const renderStep2 = () => (
    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
      {/* 템플릿 선택 */}
      <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <Text style={styles.cardTitle}>🎨 템플릿 선택</Text>
        <Text style={styles.cardSubtitle}>
          {eventData.type === 'wedding' 
            ? `${eventData.groomName} & ${eventData.brideName}의 결혼식에 어울리는 템플릿을 선택해 주세요`
            : `${eventData.title}에 어울리는 템플릿을 선택해 주세요`
          }
        </Text>

        <View style={styles.templateGrid}>
          {templates[eventData.type]?.map((template) => (
            <TouchableOpacity
              key={template.id}
              style={[
                styles.templateCard,
                eventData.selectedTemplate?.id === template.id && styles.templateCardSelected,
              ]}
              onPress={() => setEventData({ ...eventData, selectedTemplate: template })}
            >
              <View style={styles.templateImageContainer}>
                <Image source={template.preview} style={styles.templateImage} />
                {eventData.selectedTemplate?.id === template.id && (
                  <View style={styles.templateSelectedOverlay}>
                    <Ionicons name="checkmark-circle" size={30} color="#FFFFFF" />
                  </View>
                )}
              </View>
              
              <View style={styles.templateInfo}>
                <Text style={styles.templateName}>{template.name}</Text>
                <Text style={styles.templateDescription}>{template.description}</Text>
                
                <View style={styles.templateFeatures}>
                  {template.features.slice(0, 2).map((feature, index) => (
                    <View key={index} style={styles.templateFeature}>
                      <Text style={styles.templateFeatureText}>{feature}</Text>
                    </View>
                  ))}
                </View>
                
                <View style={styles.templateColors}>
                  {template.colors.map((color, index) => (
                    <View
                      key={index}
                      style={[styles.templateColor, { backgroundColor: color }]}
                    />
                  ))}
                </View>
              </View>
              
              <TouchableOpacity
                style={styles.templatePreviewButton}
                onPress={() => handleTemplatePreview(template)}
              >
                <Ionicons name="eye" size={16} color={TossColors.primary} />
                <Text style={styles.templatePreviewButtonText}>미리보기</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>
    </ScrollView>
  );

  const renderStep3 = () => (
    <View style={styles.completionContainer}>
      <Animated.View style={[styles.completionContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.completionIconContainer}>
          <Ionicons name="checkmark-circle" size={80} color={TossColors.success} />
        </View>
        <Text style={styles.completionTitle}>
          {eventData.type === 'wedding' 
            ? '결혼식 청첩장이 완성되었어요!'
            : eventData.type === 'funeral'
            ? '부고가 완성되었어요!'
            : eventData.type === 'birthday'
            ? '돌잔치 초대장이 완성되었어요!'
            : '경조사가 완성되었어요!'
          }
        </Text>
        <Text style={styles.completionSubtitle}>
          잠시 후 청첩장 화면으로 이동해요
        </Text>
        <View style={styles.completionAnimation}>
          <Text style={styles.completionEmoji}>🎉</Text>
        </View>
      </Animated.View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerBackButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={TossColors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {currentStep === 1 ? '기본 정보' : currentStep === 2 ? '디자인 선택' : '완료'}
        </Text>
        <View style={styles.headerRight} />
      </View>

      {/* 프로그레스 바 */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(currentStep / 3) * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {currentStep}/3
        </Text>
      </View>

      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}

        {/* 하단 버튼 */}
        {currentStep < 3 && (
          <View style={styles.bottomButtonContainer}>
            {currentStep > 1 && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setCurrentStep(currentStep - 1)}
              >
                <Text style={styles.backButtonText}>이전</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[
                styles.nextButton,
                isLoading && styles.nextButtonDisabled,
                currentStep === 1 && { flex: 1 }
              ]}
              onPress={handleNext}
              disabled={isLoading}
            >
              <Text style={styles.nextButtonText}>
                {isLoading ? '생성 중...' : 
                 currentStep === 1 ? '다음 단계' : 
                 eventData.type === 'wedding' ? '결혼식 청첩장 만들기' :
                 eventData.type === 'funeral' ? '부고 만들기' :
                 eventData.type === 'birthday' ? '돌잔치 초대장 만들기' : '경조사 만들기'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 날짜 선택 모달 */}
        {showDatePicker && (
          <DateTimePicker
            value={eventData.date || new Date()}
            mode="date"
            display="default"
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}

        {showTimePicker && (
          <DateTimePicker
            value={eventData.ceremonyTime || new Date()}
            mode="time"
            display="default"
            onChange={handleTimeChange}
          />
        )}

        {/* 주소 검색 모달 */}
        <DaumPostcode
          visible={showAddressSearch}
          onComplete={handleAddressComplete}
          onClose={() => setShowAddressSearch(false)}
        />

        {/* 사진 카테고리 선택 모달 */}
        <Modal
          visible={showCategorySelector}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowCategorySelector(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.categoryModal}>
              <View style={styles.categoryModalHeader}>
                <Text style={styles.categoryModalTitle}>사진 용도 선택</Text>
                <TouchableOpacity
                  style={styles.categoryModalClose}
                  onPress={() => setShowCategorySelector(false)}
                >
                  <Ionicons name="close" size={24} color={TossColors.textSecondary} />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.categoryModalSubtitle}>
                이 사진을 어떤 용도로 사용하시겠어요?
              </Text>
              
              <ScrollView style={styles.categoryList}>
                {getCurrentPhotoCategories().map((category) => {
                  const currentCount = getCategoryStats()[category.key] || 0;
                  const isDisabled = category.key !== 'gallery' && currentCount >= 1;
                  
                  return (
                    <TouchableOpacity
                      key={category.key}
                      style={[
                        styles.categoryItem,
                        isDisabled && styles.categoryItemDisabled
                      ]}
                      onPress={() => !isDisabled && handleCategorySelect(category)}
                      disabled={isDisabled}
                    >
                      <View style={styles.categoryItemContent}>
                        <View style={styles.categoryItemIcon}>
                          <Text style={styles.categoryItemIconText}>{category.icon}</Text>
                        </View>
                        <View style={styles.categoryItemText}>
                          <Text style={[
                            styles.categoryItemLabel,
                            isDisabled && styles.categoryItemLabelDisabled
                          ]}>
                            {category.label}
                          </Text>
                          <Text style={[
                            styles.categoryItemDescription,
                            isDisabled && styles.categoryItemDescriptionDisabled
                          ]}>
                            {category.description}
                          </Text>
                          {isDisabled && (
                            <Text style={styles.categoryItemDisabledText}>
                              이미 {category.label}이 설정되어 있어요
                            </Text>
                          )}
                        </View>
                      </View>
                      {!isDisabled && (
                        <Ionicons name="chevron-forward" size={20} color={TossColors.textSecondary} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* 템플릿 미리보기 모달 */}
        <Modal
          visible={showTemplatePreview}
          animationType="slide"
          presentationStyle="fullScreen"
        >
          <View style={styles.previewModalContainer}>
            <TouchableOpacity 
              style={styles.previewModalClose}
              onPress={() => setShowTemplatePreview(false)}
            >
              <Ionicons name="close" size={24} color="#ffffff" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.previewModalSelect}
              onPress={() => handleTemplateSelect(previewTemplate)}
            >
              <Text style={styles.previewModalSelectText}>이 템플릿 선택</Text>
            </TouchableOpacity>
            
            {previewTemplate && (
              <WeddingTemplatePreview
                template={previewTemplate}
                eventData={eventData}
                userImages={eventData.images}
              />
            )}
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: TossColors.secondary,
  },
  
  // 헤더
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: TossColors.background,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: TossColors.border,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: TossColors.text,
  },
  headerRight: {
    width: 40,
  },
  
  // 프로그레스 바
  progressContainer: {
    backgroundColor: TossColors.background,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: TossColors.border,
    borderRadius: 2,
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: TossColors.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: TossColors.textSecondary,
  },
  
  // 콘텐츠
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  formContainer: {
    gap: 16,
  },
  
  // 카드 스타일
  card: {
    backgroundColor: TossColors.background,
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    shadowColor: TossColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: TossColors.text,
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: TossColors.textSecondary,
    marginBottom: 24,
    lineHeight: 20,
  },
  
  // 경조사 타입 선택
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeCard: {
    width: (width - 64) / 2,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: TossColors.border,
  },
  typeCardSelected: {
    borderColor: TossColors.primary,
    borderWidth: 2,
  },
  typeCardGradient: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: TossColors.background,
  },
  typeCardGradientSelected: {
    // 그라디언트는 이미 적용됨
  },
  typeIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  typeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: TossColors.text,
    marginBottom: 4,
  },
  typeLabelSelected: {
    color: TossColors.background,
  },
  typeDescription: {
    fontSize: 12,
    color: TossColors.textSecondary,
    textAlign: 'center',
  },
  typeDescriptionSelected: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  
  // 입력 필드
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: TossColors.text,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: TossColors.secondary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: TossColors.text,
    borderWidth: 1,
    borderColor: TossColors.border,
  },
  textInputRequired: {
    borderColor: TossColors.primary,
    borderWidth: 2,
  },
  messageInput: {
    height: 100,
    paddingTop: 16,
    textAlignVertical: 'top',
  },
  
  // 커플 입력
  coupleInputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  coupleInputContainer: {
    flex: 1,
  },
  
  // 부모님 섹션
  parentsSection: {
    marginBottom: 24,
  },
  parentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: TossColors.text,
    marginBottom: 16,
  },
  
  // 선택 버튼
  selectButton: {
    backgroundColor: TossColors.secondary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: TossColors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectButtonRequired: {
    borderColor: TossColors.primary,
    borderWidth: 2,
  },
  selectButtonText: {
    fontSize: 16,
    color: TossColors.text,
    flex: 1,
  },
  selectButtonTextPlaceholder: {
    color: TossColors.textTertiary,
  },
  
  // 축의금 설정
  presetGrid: {
    gap: 12,
  },
  presetCard: {
    backgroundColor: TossColors.secondary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: TossColors.border,
  },
  presetCardSelected: {
    backgroundColor: TossColors.primary + '10',
    borderColor: TossColors.primary,
    borderWidth: 2,
  },
  presetIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  presetLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: TossColors.text,
    marginBottom: 4,
  },
  presetLabelSelected: {
    color: TossColors.primary,
  },
  presetDescription: {
    fontSize: 13,
    color: TossColors.textSecondary,
    marginBottom: 12,
  },
  presetDescriptionSelected: {
    color: TossColors.primary,
  },
  presetAmounts: {
    flexDirection: 'row',
    gap: 8,
  },
  presetAmount: {
    fontSize: 12,
    fontWeight: '500',
    color: TossColors.textSecondary,
    backgroundColor: TossColors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  presetAmountSelected: {
    color: TossColors.primary,
    backgroundColor: TossColors.background,
  },
  
  // 템플릿 선택
  templateGrid: {
    gap: 16,
  },
  templateCard: {
    backgroundColor: TossColors.background,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: TossColors.border,
  },
  templateCardSelected: {
    borderColor: TossColors.primary,
    borderWidth: 2,
  },
  templateImageContainer: {
    position: 'relative',
  },
  templateImage: {
    width: '100%',
    height: 200,
    backgroundColor: TossColors.secondary,
  },
  templateSelectedOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: TossColors.primary,
    borderRadius: 20,
    padding: 4,
  },
  templateInfo: {
    padding: 16,
  },
  templateName: {
    fontSize: 18,
    fontWeight: '600',
    color: TossColors.text,
    marginBottom: 4,
  },
  templateDescription: {
    fontSize: 14,
    color: TossColors.textSecondary,
    marginBottom: 12,
  },
  templateFeatures: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  templateFeature: {
    backgroundColor: TossColors.secondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  templateFeatureText: {
    fontSize: 11,
    color: TossColors.textSecondary,
  },
  templateColors: {
    flexDirection: 'row',
    gap: 6,
  },
  templateColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: TossColors.border,
  },
  templatePreviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: TossColors.secondary,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  templatePreviewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: TossColors.primary,
  },
  
  // 사진 카테고리 상태
  categoryStatusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  categoryStatusCard: {
    backgroundColor: TossColors.secondary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    minWidth: (width - 80) / 3,
  },
  categoryStatusIcon: {
    fontSize: 18,
    marginBottom: 4,
  },
  categoryStatusLabel: {
    fontSize: 11,
    color: TossColors.text,
    fontWeight: '500',
    marginBottom: 2,
    textAlign: 'center',
  },
  categoryStatusCount: {
    fontSize: 10,
    fontWeight: '600',
  },
  
  // 사진 업로드
  uploadButton: {
    backgroundColor: TossColors.secondary,
    borderRadius: 12,
    paddingVertical: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: TossColors.border,
    borderStyle: 'dashed',
    marginBottom: 20,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: TossColors.primary,
    marginTop: 8,
  },
  uploadButtonSubtext: {
    fontSize: 12,
    color: TossColors.textSecondary,
    marginTop: 4,
  },
  
  // 업로드된 사진들
  uploadedImagesContainer: {
    marginTop: 20,
  },
  uploadedImagesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: TossColors.text,
    marginBottom: 12,
  },
  uploadedImagesScroll: {
    marginHorizontal: -4,
  },
  uploadedImageItem: {
    position: 'relative',
    marginHorizontal: 4,
  },
  uploadedImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: TossColors.secondary,
  },
  uploadedImageCategory: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: TossColors.primary,
    borderRadius: 8,
    padding: 2,
  },
  uploadedImageCategoryText: {
    fontSize: 12,
    color: TossColors.background,
  },
  uploadedImageRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: TossColors.background,
    borderRadius: 10,
  },
  
  // 모달
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryModal: {
    backgroundColor: TossColors.background,
    borderRadius: 20,
    width: width * 0.9,
    maxHeight: height * 0.7,
    overflow: 'hidden',
  },
  categoryModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: TossColors.border,
  },
  categoryModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TossColors.text,
  },
  categoryModalClose: {
    padding: 4,
  },
  categoryModalSubtitle: {
    fontSize: 14,
    color: TossColors.textSecondary,
    padding: 20,
    paddingBottom: 0,
  },
  categoryList: {
    maxHeight: 400,
  },
  categoryItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: TossColors.border,
  },
  categoryItemDisabled: {
    opacity: 0.5,
  },
  categoryItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: TossColors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryItemIconText: {
    fontSize: 18,
  },
  categoryItemText: {
    flex: 1,
  },
  categoryItemLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: TossColors.text,
    marginBottom: 4,
  },
  categoryItemLabelDisabled: {
    color: TossColors.textSecondary,
  },
  categoryItemDescription: {
    fontSize: 13,
    color: TossColors.textSecondary,
    lineHeight: 18,
  },
  categoryItemDescriptionDisabled: {
    color: TossColors.textTertiary,
  },
  categoryItemDisabledText: {
    fontSize: 12,
    color: TossColors.error,
    marginTop: 4,
  },
  
  // 완성 화면
  completionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  completionContent: {
    alignItems: 'center',
  },
  completionIconContainer: {
    marginBottom: 24,
  },
  completionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: TossColors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  completionSubtitle: {
    fontSize: 16,
    color: TossColors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  completionAnimation: {
    marginTop: 20,
  },
  completionEmoji: {
    fontSize: 48,
  },
  
  // 하단 버튼
  bottomButtonContainer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: TossColors.background,
    borderTopWidth: 1,
    borderTopColor: TossColors.border,
    gap: 12,
  },
  backButton: {
    flex: 1,
    height: 54,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: TossColors.secondary,
    borderWidth: 1,
    borderColor: TossColors.border,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: TossColors.textSecondary,
  },
  nextButton: {
    flex: 2,
    backgroundColor: TossColors.primary,
    height: 54,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: TossColors.textTertiary,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: TossColors.background,
  },
  
  // 미리보기 모달
  previewModalContainer: {
    flex: 1,
    backgroundColor: TossColors.background,
  },
  previewModalClose: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  previewModalSelect: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 50 : 30,
    left: 20,
    right: 20,
    backgroundColor: TossColors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  previewModalSelectText: {
    fontSize: 16,
    fontWeight: '600',
    color: TossColors.background,
  },
});