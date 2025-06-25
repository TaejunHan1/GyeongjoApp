// src/screens/event/CreateEventScreen.js - 템플릿 선택 & 이미지 업로드 기능 추가
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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../styles/constants';
import { createEvent } from '../../lib/supabaseHelper';

const { width } = Dimensions.get('window');

export default function CreateEventScreen({ navigation, route }) {
  const { eventType = 'wedding' } = route.params || {};
  
  const [currentStep, setCurrentStep] = useState(1); // 1: 기본정보, 2: 템플릿선택, 3: 완료
  const [eventData, setEventData] = useState({
    type: eventType,
    title: '',
    date: null,
    location: '',
    hostName: '',
    familyRelations: ['신랑측', '신부측'],
    presetAmounts: [50000, 100000, 200000, 300000],
    selectedTemplate: null,
    images: [],
  });
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 경조사 유형
  const eventTypes = [
    { key: 'wedding', label: '결혼식', icon: 'heart', color: Colors.wedding },
    { key: 'funeral', label: '부고', icon: 'flower', color: Colors.funeral },
    { key: 'birthday', label: '돌잔치', icon: 'gift', color: Colors.celebration },
    { key: 'other', label: '기타', icon: 'add-circle', color: Colors.other },
  ];

  // 템플릿 예제들
  const templates = {
    wedding: [
      {
        id: 'wedding-1',
        name: '클래식 로맨틱',
        description: '우아하고 전통적인 결혼식 템플릿',
        preview: require('../../../assets/images/aa1.png'),
        colors: ['#F7F3F0', '#D4AF8C'],
        style: 'classic'
      },
      {
        id: 'wedding-2', 
        name: '모던 미니멀',
        description: '깔끔하고 현대적인 디자인',
        preview: require('../../../assets/images/aa2.png'),
        colors: ['#FFFFFF', '#EC4899'],
        style: 'modern'
      },
      {
        id: 'wedding-3',
        name: '가든 웨딩',
        description: '자연스럽고 따뜻한 분위기',
        preview: require('../../../assets/images/aa3.png'),
        colors: ['#F0F9FF', '#10B981'],
        style: 'garden'
      },
      {
        id: 'wedding-4',
        name: '럭셔리 골드',
        description: '고급스럽고 화려한 스타일',
        preview: require('../../../assets/images/aa4.png'),
        colors: ['#FEF3C7', '#F59E0B'],
        style: 'luxury'
      },
    ],
    funeral: [
      {
        id: 'funeral-1',
        name: '차분한 추모',
        description: '정중하고 엄숙한 분위기',
        preview: require('../../../assets/images/aa1.png'),
        colors: ['#F8F9FA', '#64748B'],
        style: 'solemn'
      },
      {
        id: 'funeral-2',
        name: '위로의 꽃',
        description: '꽃과 함께하는 따뜻한 추모',
        preview: require('../../../assets/images/aa2.png'),
        colors: ['#F1F5F9', '#475569'],
        style: 'floral'
      },
    ],
    birthday: [
      {
        id: 'birthday-1',
        name: '행복한 돌잔치',
        description: '밝고 즐거운 첫 번째 생일',
        preview: require('../../../assets/images/aa3.png'),
        colors: ['#FFFBF0', '#F59E0B'],
        style: 'happy'
      },
      {
        id: 'birthday-2',
        name: '파스텔 드림',
        description: '부드럽고 사랑스러운 분위기',
        preview: require('../../../assets/images/aa4.png'),
        colors: ['#FDF2F8', '#EC4899'],
        style: 'pastel'
      },
    ],
    other: [
      {
        id: 'other-1',
        name: '기념일 축하',
        description: '특별한 순간을 위한 디자인',
        preview: require('../../../assets/images/aa1.png'),
        colors: ['#EBF8FF', '#3B82F6'],
        style: 'celebration'
      },
    ],
  };

  // 미리 설정 금액 옵션
  const presetAmountOptions = [
    { 
      label: '소규모 (3-5만원)', 
      amounts: [30000, 50000, 70000], 
      description: '가까운 지인들과의 소규모 행사' 
    },
    { 
      label: '일반적 (5-20만원)', 
      amounts: [50000, 100000, 200000], 
      description: '일반적인 경조사 금액' 
    },
    { 
      label: '정식 (10-30만원)', 
      amounts: [100000, 200000, 300000], 
      description: '정식 경조사 행사' 
    },
    { 
      label: '고액 (20-50만원)', 
      amounts: [200000, 300000, 500000], 
      description: '격식있는 대규모 행사' 
    },
  ];

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setEventData({ ...eventData, date: selectedDate });
    }
  };

  const formatDate = (date) => {
    if (!date) return '날짜 선택';
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('ko-KR').format(amount) + '원';
  };

  // 이미지 선택
  const pickImages = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한 필요', '갤러리 접근 권한이 필요합니다.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: true,
      });

      if (!result.canceled) {
        const newImages = result.assets || [result];
        setEventData({
          ...eventData,
          images: [...eventData.images, ...newImages].slice(0, 10), // 최대 10개
        });
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('오류', '이미지 선택 중 오류가 발생했습니다.');
    }
  };

  // 이미지 제거
  const removeImage = (index) => {
    const newImages = eventData.images.filter((_, i) => i !== index);
    setEventData({ ...eventData, images: newImages });
  };

  const validateStep1 = () => {
    if (!eventData.title.trim()) {
      Alert.alert('알림', '행사명을 입력해주세요.');
      return false;
    }
    
    if (!eventData.hostName.trim()) {
      Alert.alert('알림', '주최자 이름을 입력해주세요.');
      return false;
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
        Alert.alert('알림', '템플릿을 선택해주세요.');
        return;
      }
      handleSave();
    }
  };

  const handleSave = async () => {
    setIsLoading(true);

    try {
      const formattedEventData = {
        event_type: eventData.type,
        event_name: eventData.title.trim(),
        main_person_name: eventData.hostName.trim(),
        event_date: eventData.date ? eventData.date.toISOString().split('T')[0] : null,
        location: eventData.location.trim() || null,
        family_relations: eventData.familyRelations,
        preset_amounts: eventData.presetAmounts,
        status: 'active',
        is_finalized: false,
        // 이미지는 추후 Supabase Storage 연동 시 업로드
        // template_id: eventData.selectedTemplate?.id,
      };

      console.log('🔍 생성할 이벤트 데이터:', formattedEventData);

      const result = await createEvent(formattedEventData);

      if (result.success) {
        setCurrentStep(3);
        setTimeout(() => {
          navigation.navigate('EventDisplay', { eventId: result.data.id });
        }, 2000);
      } else {
        Alert.alert('오류', result.error || '경조사 등록에 실패했습니다.');
      }
    } catch (error) {
      console.error('Save event error:', error);
      Alert.alert('오류', '경조사 등록 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep1 = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* 경조사 유형 선택 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>어떤 경조사인가요?</Text>
        <View style={styles.typeGrid}>
          {eventTypes.map((type) => (
            <TouchableOpacity
              key={type.key}
              style={[
                styles.typeItem,
                eventData.type === type.key && {
                  backgroundColor: type.color,
                  borderColor: type.color,
                  transform: [{ scale: 1.05 }],
                },
              ]}
              onPress={() => setEventData({ ...eventData, type: type.key })}
            >
              <Ionicons
                name={type.icon}
                size={28}
                color={eventData.type === type.key ? Colors.white : type.color}
              />
              <Text
                style={[
                  styles.typeText,
                  eventData.type === type.key && { color: Colors.white },
                ]}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 기본 정보 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>기본 정보</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>행사명 *</Text>
          <TextInput
            style={styles.textInput}
            placeholder={`예: ${eventData.type === 'wedding' ? '김철수♥이영희 결혼식' : 
                              eventData.type === 'funeral' ? '故 김영희 장례식' :
                              eventData.type === 'birthday' ? '김민수 첫 돌잔치' : '특별한 기념일'}`}
            value={eventData.title}
            onChangeText={(text) => setEventData({ ...eventData, title: text })}
            placeholderTextColor={Colors.gray400}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>날짜</Text>
          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={[
              styles.dateText,
              !eventData.date && { color: Colors.gray400 }
            ]}>
              {formatDate(eventData.date)}
            </Text>
            <Ionicons name="calendar-outline" size={20} color={Colors.gray400} />
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>장소</Text>
          <TextInput
            style={styles.textInput}
            placeholder="예: 강남구 역삼동 웨딩홀"
            value={eventData.location}
            onChangeText={(text) => setEventData({ ...eventData, location: text })}
            placeholderTextColor={Colors.gray400}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>주최자 이름 *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="주최자 이름"
            value={eventData.hostName}
            onChangeText={(text) => setEventData({ ...eventData, hostName: text })}
            placeholderTextColor={Colors.gray400}
          />
        </View>
      </View>

      {/* 이미지 업로드 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>사진 업로드</Text>
        <Text style={styles.sectionSubtitle}>
          경조사에 사용할 사진들을 업로드하세요 (최대 10장)
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageContainer}>
          <TouchableOpacity style={styles.imageUploadButton} onPress={pickImages}>
            <Ionicons name="camera" size={32} color={Colors.gray400} />
            <Text style={styles.imageUploadText}>사진 추가</Text>
          </TouchableOpacity>

          {eventData.images.map((image, index) => (
            <View key={index} style={styles.imageItem}>
              <Image source={{ uri: image.uri }} style={styles.uploadedImage} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => removeImage(index)}
              >
                <Ionicons name="close-circle" size={20} color={Colors.error} />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* 미리 설정 금액 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>부조금 설정</Text>
        <Text style={styles.sectionSubtitle}>
          손님들이 선택할 수 있는 부조금 금액을 설정하세요
        </Text>
        
        <View style={styles.presetContainer}>
          {presetAmountOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.presetOption,
                JSON.stringify(eventData.presetAmounts) === JSON.stringify(option.amounts) &&
                  styles.presetOptionSelected,
              ]}
              onPress={() => setEventData({ ...eventData, presetAmounts: option.amounts })}
            >
              <View style={styles.presetHeader}>
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
              </View>
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
      </View>
    </ScrollView>
  );

  const renderStep2 = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>디자인 템플릿 선택</Text>
        <Text style={styles.sectionSubtitle}>
          {eventData.title}에 어울리는 템플릿을 선택하세요
        </Text>

        <View style={styles.templateGrid}>
          {templates[eventData.type]?.map((template) => (
            <TouchableOpacity
              key={template.id}
              style={[
                styles.templateItem,
                eventData.selectedTemplate?.id === template.id && styles.templateItemSelected,
              ]}
              onPress={() => setEventData({ ...eventData, selectedTemplate: template })}
            >
              <Image source={template.preview} style={styles.templatePreview} />
              <View style={styles.templateInfo}>
                <Text style={styles.templateName}>{template.name}</Text>
                <Text style={styles.templateDescription}>{template.description}</Text>
                <View style={styles.colorPalette}>
                  {template.colors.map((color, index) => (
                    <View
                      key={index}
                      style={[styles.colorDot, { backgroundColor: color }]}
                    />
                  ))}
                </View>
              </View>
              {eventData.selectedTemplate?.id === template.id && (
                <View style={styles.selectedBadge}>
                  <Ionicons name="checkmark" size={16} color={Colors.white} />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  const renderStep3 = () => (
    <View style={styles.completionContainer}>
      <Ionicons name="checkmark-circle" size={80} color={Colors.success} />
      <Text style={styles.completionTitle}>경조사가 생성되었습니다!</Text>
      <Text style={styles.completionSubtitle}>
        곧 전시모드로 이동합니다...
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* 진행 단계 */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(currentStep / 3) * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {currentStep === 1 ? '기본 정보' : currentStep === 2 ? '템플릿 선택' : '완료'}
        </Text>
      </View>

      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}

        {currentStep < 3 && (
          <View style={styles.buttonContainer}>
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
                {isLoading ? '생성 중...' : currentStep === 1 ? '다음 단계' : '경조사 만들기'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 날짜 피커 */}
        {showDatePicker && (
          <DateTimePicker
            value={eventData.date || new Date()}
            mode="date"
            display="default"
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray50,
  },
  
  // 진행 단계
  progressContainer: {
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.gray200,
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  
  content: {
    flex: 1,
  },
  
  // 섹션
  section: {
    backgroundColor: Colors.white,
    marginBottom: 12,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  
  // 유형 선택
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeItem: {
    width: (width - 64) / 2,
    backgroundColor: Colors.gray50,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.gray200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  typeText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 12,
  },
  
  // 입력 필드
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: Colors.gray50,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  
  // 날짜 입력
  dateInput: {
    backgroundColor: Colors.gray50,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: Colors.gray200,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    color: Colors.textPrimary,
  },
  
  // 이미지 업로드
  imageContainer: {
    flexDirection: 'row',
  },
  imageUploadButton: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.gray300,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  imageUploadText: {
    fontSize: 12,
    color: Colors.gray400,
    marginTop: 4,
  },
  imageItem: {
    position: 'relative',
    marginRight: 12,
  },
  uploadedImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: Colors.white,
    borderRadius: 10,
  },
  
  // 미리 설정 금액
  presetContainer: {
    gap: 12,
  },
  presetOption: {
    backgroundColor: Colors.gray50,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.gray200,
  },
  presetOptionSelected: {
    backgroundColor: Colors.primary + '15',
    borderColor: Colors.primary,
  },
  presetHeader: {
    marginBottom: 12,
  },
  presetLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  presetLabelSelected: {
    color: Colors.primary,
  },
  presetDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  presetDescriptionSelected: {
    color: Colors.primary,
  },
  presetAmounts: {
    flexDirection: 'row',
    gap: 8,
  },
  presetAmount: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  presetAmountSelected: {
    color: Colors.primary,
    backgroundColor: Colors.white,
  },
  
  // 템플릿 선택
  templateGrid: {
    gap: 16,
  },
  templateItem: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.gray200,
    position: 'relative',
  },
  templateItemSelected: {
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  templatePreview: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  templateInfo: {
    padding: 16,
  },
  templateName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  templateDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  colorPalette: {
    flexDirection: 'row',
    gap: 6,
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  selectedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // 완료 화면
  completionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  completionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
  completionSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  
  // 버튼
  buttonContainer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
    gap: 12,
  },
  backButton: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  nextButton: {
    flex: 2,
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  nextButtonDisabled: {
    backgroundColor: Colors.gray300,
    shadowOpacity: 0,
    elevation: 0,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
  },
});