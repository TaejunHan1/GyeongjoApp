// src/screens/event/EditableTemplatePreview.js
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Modal,
  Image,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { createEvent } from '../../lib/supabaseHelper';
import WeddingTemplatePreview from './templates/WeddingTemplatePreview';

const { width, height } = Dimensions.get('window');

const TossColors = {
  primary: '#0064FF',
  secondary: '#F5F7FA',
  background: '#FFFFFF',
  text: '#191F28',
  textSecondary: '#6B7684',
  success: '#00C851',
  error: '#FF4747',
  border: '#E5E8EB',
  shadow: 'rgba(0, 0, 0, 0.06)',
};

export default function EditableTemplatePreview({ navigation, route }) {
  const { template, basicInfo, mode = 'edit' } = route.params;
  
  const [isEditing, setIsEditing] = useState(mode === 'edit');
  const [photos, setPhotos] = useState({});
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // 애니메이션
  const editPanelAnim = useRef(new Animated.Value(isEditing ? 1 : 0)).current;
  const fabAnim = useRef(new Animated.Value(1)).current;

  // 편집 모드 토글
  const toggleEditMode = () => {
    const newEditMode = !isEditing;
    setIsEditing(newEditMode);
    
    Animated.spring(editPanelAnim, {
      toValue: newEditMode ? 1 : 0,
      useNativeDriver: true,
      damping: 15,
      stiffness: 150,
    }).start();
  };

  // 사진 업로드 핸들러
  const handlePhotoUpload = async (categoryId) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한 필요', '사진 선택을 위해 갤러리 접근 권한이 필요해요.');
        return;
      }

      const category = template.photoCategories.find(c => c.id === categoryId);
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: category.type === 'multiple',
      });

      if (!result.canceled) {
        const newPhotos = result.assets.map(asset => ({
          uri: asset.uri,
          categoryId: categoryId,
          id: Date.now() + Math.random(),
        }));

        setPhotos(prev => {
          if (category.type === 'single') {
            return { ...prev, [categoryId]: [newPhotos[0]] };
          } else {
            const currentPhotos = prev[categoryId] || [];
            const updatedPhotos = [...currentPhotos, ...newPhotos];
            return { 
              ...prev, 
              [categoryId]: updatedPhotos.slice(0, category.maxCount) 
            };
          }
        });

        setShowUploadModal(false);
      }
    } catch (error) {
      Alert.alert('오류', '사진 업로드 중 문제가 발생했어요.');
    }
  };

  // 사진 삭제
  const handlePhotoRemove = (categoryId, photoIndex) => {
    setPhotos(prev => ({
      ...prev,
      [categoryId]: prev[categoryId]?.filter((_, i) => i !== photoIndex) || []
    }));
  };

  // 사진 순서 변경
  const handlePhotoReorder = (categoryId, fromIndex, toIndex) => {
    setPhotos(prev => {
      const categoryPhotos = [...(prev[categoryId] || [])];
      const [movedPhoto] = categoryPhotos.splice(fromIndex, 1);
      categoryPhotos.splice(toIndex, 0, movedPhoto);
      return { ...prev, [categoryId]: categoryPhotos };
    });
  };

  // 카테고리별 사진 개수 체크
  const getCategoryStatus = (category) => {
    const currentCount = photos[category.id]?.length || 0;
    const maxCount = category.maxCount;
    const isRequired = category.required;
    
    return {
      currentCount,
      maxCount,
      isFull: category.type === 'single' ? currentCount >= 1 : currentCount >= maxCount,
      isEmpty: currentCount === 0,
      isRequired,
      canAdd: !((category.type === 'single' && currentCount >= 1) || currentCount >= maxCount),
    };
  };

  // 저장하기
  const handleSave = async () => {
    setIsLoading(true);

    try {
      // 필수 사진 체크
      const requiredCategories = template.photoCategories.filter(cat => cat.required);
      const missingRequired = requiredCategories.filter(cat => {
        const status = getCategoryStatus(cat);
        return status.isEmpty;
      });

      if (missingRequired.length > 0) {
        Alert.alert(
          '필수 사진 업로드',
          `다음 사진들은 필수로 업로드해야 해요:\n${missingRequired.map(cat => `• ${cat.name}`).join('\n')}`
        );
        setIsLoading(false);
        return;
      }

      // 이벤트 데이터 생성
      const eventData = {
        event_type: basicInfo.type,
        event_name: basicInfo.type === 'wedding' 
          ? `${basicInfo.groomName} ♥ ${basicInfo.brideName} 결혼식`
          : basicInfo.title,
        main_person_name: basicInfo.type === 'wedding' 
          ? `${basicInfo.groomName}, ${basicInfo.brideName}`
          : basicInfo.title,
        event_date: basicInfo.date ? basicInfo.date.toISOString().split('T')[0] : null,
        location: basicInfo.location,
        detailed_address: basicInfo.detailedAddress,
        template_style: template.style,
        family_relations: ['신랑측', '신부측'], // 기본값
        preset_amounts: [100000, 200000, 300000], // 기본값
        
        ...(basicInfo.type === 'wedding' && {
          bride_name: basicInfo.brideName,
          groom_name: basicInfo.groomName,
          bride_contact: basicInfo.brideContact,
          groom_contact: basicInfo.groomContact,
          ceremony_time: basicInfo.ceremonyTime ? 
            basicInfo.ceremonyTime.toTimeString().split(' ')[0] : null,
          custom_message: basicInfo.customMessage,
        }),
        
        status: 'active',
        is_finalized: false,
        image_urls: [], // 실제 구현시 이미지 업로드 후 URL 저장
        photos: photos, // 임시로 photos 객체 저장 (실제로는 image_urls에 저장)
      };

      const result = await createEvent(eventData);

      if (result.success) {
        Alert.alert(
          '생성 완료!',
          '경조사가 성공적으로 생성되었어요.',
          [
            {
              text: '확인',
              onPress: () => {
                navigation.navigate('EventDisplay', { 
                  eventId: result.data.id,
                  templateStyle: template.style,
                  photos: photos,
                });
              }
            }
          ]
        );
      } else {
        Alert.alert('오류', '경조사 생성에 실패했어요. 다시 시도해 주세요.');
      }
    } catch (error) {
      Alert.alert('오류', '저장 중 문제가 발생했어요.');
    } finally {
      setIsLoading(false);
    }
  };

  // 카테고리 업로드 모달 열기
  const openUploadModal = (category) => {
    setSelectedCategory(category);
    setShowUploadModal(true);
  };

  // 템플릿 렌더링 (편집 오버레이 포함)
  const renderTemplateWithEditFeatures = () => {
    // WeddingTemplatePreview에 photos와 편집 모드 전달
    return (
      <View style={styles.templateContainer}>
        <WeddingTemplatePreview
          template={template}
          eventData={basicInfo}
          userImages={getAllImagesForTemplate()}
          isEditMode={isEditing}
          onPhotoPress={(categoryId) => {
            if (isEditing) {
              const category = template.photoCategories.find(c => c.id === categoryId);
              if (category) {
                openUploadModal(category);
              }
            }
          }}
        />
        
        {/* 편집 오버레이들 */}
        {isEditing && renderEditOverlays()}
      </View>
    );
  };

  // 모든 이미지를 템플릿에 맞게 변환
  const getAllImagesForTemplate = () => {
    const allImages = [];
    Object.entries(photos).forEach(([categoryId, categoryPhotos]) => {
      categoryPhotos.forEach(photo => {
        allImages.push({
          ...photo,
          categoryId,
        });
      });
    });
    return allImages;
  };

  // 편집 오버레이 렌더링
  const renderEditOverlays = () => {
    return template.photoCategories.map(category => {
      const status = getCategoryStatus(category);
      
      return (
        <View key={category.id} style={styles.editOverlay}>
          {status.isEmpty && (
            <TouchableOpacity
              style={[styles.uploadOverlay, category.required && styles.requiredOverlay]}
              onPress={() => openUploadModal(category)}
            >
              <Ionicons 
                name="camera" 
                size={32} 
                color={category.required ? TossColors.error : TossColors.primary} 
              />
              <Text style={[
                styles.uploadText,
                category.required && styles.requiredText
              ]}>
                {category.name} 업로드
                {category.required && ' (필수)'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      );
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor="#000" />
      
      {/* 상단 툴바 */}
      <View style={styles.toolbar}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        
        <Text style={styles.toolbarTitle}>{template.name}</Text>
        
        <View style={styles.toolbarActions}>
          <TouchableOpacity 
            style={styles.editToggle}
            onPress={toggleEditMode}
          >
            <Ionicons 
              name={isEditing ? "eye" : "create"} 
              size={20} 
              color="#ffffff" 
            />
            <Text style={styles.editToggleText}>
              {isEditing ? '미리보기' : '편집'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isLoading}
          >
            <Ionicons name="checkmark" size={20} color="#ffffff" />
            <Text style={styles.saveButtonText}>
              {isLoading ? '저장 중...' : '저장'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 템플릿 미리보기 */}
      <ScrollView style={styles.previewContainer} showsVerticalScrollIndicator={false}>
        {renderTemplateWithEditFeatures()}
      </ScrollView>

      {/* 편집 패널 */}
      <Animated.View 
        style={[
          styles.editPanel,
          {
            transform: [{
              translateY: editPanelAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [200, 0]
              })
            }],
            opacity: editPanelAnim
          }
        ]}
        pointerEvents={isEditing ? 'auto' : 'none'}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.9)', 'rgba(0,0,0,0.95)']}
          style={StyleSheet.absoluteFill}
        />
        
        <View style={styles.editPanelHeader}>
          <Text style={styles.editPanelTitle}>사진 편집</Text>
          <Text style={styles.editPanelSubtitle}>
            카테고리를 선택해서 사진을 업로드하세요
          </Text>
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryScrollContent}
        >
          {template.photoCategories.map(category => {
            const status = getCategoryStatus(category);
            
            return (
              <TouchableOpacity 
                key={category.id}
                style={[
                  styles.categoryCard,
                  status.isEmpty && category.required && styles.categoryCardRequired,
                  status.isFull && styles.categoryCardComplete,
                ]}
                onPress={() => status.canAdd && openUploadModal(category)}
                disabled={!status.canAdd}
              >
                <View style={styles.categoryIcon}>
                  <Text style={styles.categoryIconText}>{category.icon}</Text>
                  {status.isEmpty && category.required && (
                    <View style={styles.requiredBadge}>
                      <Text style={styles.requiredBadgeText}>!</Text>
                    </View>
                  )}
                </View>
                
                <Text style={[
                  styles.categoryName,
                  status.isEmpty && category.required && styles.categoryNameRequired
                ]}>
                  {category.name}
                </Text>
                
                <Text style={styles.categoryCount}>
                  {status.currentCount}/{category.type === 'single' ? '1' : status.maxCount}
                </Text>
                
                <Text style={styles.categoryDescription}>
                  {category.description}
                </Text>

                {/* 업로드된 사진 미리보기 */}
                {photos[category.id] && photos[category.id].length > 0 && (
                  <View style={styles.categoryPhotos}>
                    {photos[category.id].slice(0, 3).map((photo, index) => (
                      <View key={photo.id} style={styles.categoryPhotoItem}>
                        <Image source={{ uri: photo.uri }} style={styles.categoryPhoto} />
                        <TouchableOpacity
                          style={styles.photoRemoveButton}
                          onPress={() => handlePhotoRemove(category.id, index)}
                        >
                          <Ionicons name="close" size={12} color="#ffffff" />
                        </TouchableOpacity>
                      </View>
                    ))}
                    {photos[category.id].length > 3 && (
                      <View style={styles.morePhotosIndicator}>
                        <Text style={styles.morePhotosText}>
                          +{photos[category.id].length - 3}
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* 업로드 버튼 */}
                {status.canAdd && (
                  <View style={styles.uploadButton}>
                    <Ionicons 
                      name="add" 
                      size={16} 
                      color={status.isEmpty && category.required ? TossColors.error : TossColors.primary} 
                    />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </Animated.View>

      {/* 업로드 모달 */}
      <Modal
        visible={showUploadModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowUploadModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.uploadModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedCategory?.name} 업로드
              </Text>
              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => setShowUploadModal(false)}
              >
                <Ionicons name="close" size={24} color={TossColors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalDescription}>
              {selectedCategory?.description}
            </Text>
            
            <TouchableOpacity
              style={styles.modalUploadButton}
              onPress={() => selectedCategory && handlePhotoUpload(selectedCategory.id)}
            >
              <Ionicons name="camera" size={24} color="#ffffff" />
              <Text style={styles.modalUploadButtonText}>
                갤러리에서 선택
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  
  // 툴바
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    paddingBottom: 15,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  backButton: {
    padding: 8,
    marginRight: 15,
  },
  toolbarTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  toolbarActions: {
    flexDirection: 'row',
    gap: 12,
  },
  editToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    gap: 6,
  },
  editToggleText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: TossColors.primary,
    borderRadius: 20,
    gap: 6,
  },
  saveButtonDisabled: {
    backgroundColor: TossColors.textSecondary,
  },
  saveButtonText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
  
  // 미리보기
  previewContainer: {
    flex: 1,
  },
  templateContainer: {
    flex: 1,
    position: 'relative',
  },
  
  // 편집 오버레이
  editOverlay: {
    position: 'absolute',
    // 실제 위치는 템플릿에 따라 동적으로 계산
  },
  uploadOverlay: {
    backgroundColor: 'rgba(0,100,255,0.8)',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: TossColors.primary,
    borderStyle: 'dashed',
  },
  requiredOverlay: {
    backgroundColor: 'rgba(255,71,71,0.8)',
    borderColor: TossColors.error,
  },
  uploadText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  requiredText: {
    color: '#ffffff',
  },
  
  // 편집 패널
  editPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: 250,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  editPanelHeader: {
    padding: 20,
    paddingBottom: 15,
  },
  editPanelTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  editPanelSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  
  // 카테고리 스크롤
  categoryScroll: {
    paddingHorizontal: 15,
  },
  categoryScrollContent: {
    paddingHorizontal: 5,
    paddingBottom: 20,
  },
  
  // 카테고리 카드
  categoryCard: {
    width: 140,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
  },
  categoryCardRequired: {
    borderColor: TossColors.error,
    backgroundColor: 'rgba(255,71,71,0.1)',
  },
  categoryCardComplete: {
    borderColor: TossColors.success,
    backgroundColor: 'rgba(0,200,81,0.1)',
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  categoryIconText: {
    fontSize: 20,
  },
  requiredBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: TossColors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  requiredBadgeText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '700',
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
    textAlign: 'center',
  },
  categoryNameRequired: {
    color: TossColors.error,
  },
  categoryCount: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 8,
  },
  categoryDescription: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    lineHeight: 14,
    marginBottom: 12,
  },
  
  // 카테고리 사진들
  categoryPhotos: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 8,
  },
  categoryPhotoItem: {
    position: 'relative',
  },
  categoryPhoto: {
    width: 30,
    height: 30,
    borderRadius: 6,
  },
  photoRemoveButton: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: TossColors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  morePhotosIndicator: {
    width: 30,
    height: 30,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  morePhotosText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '600',
  },
  
  // 업로드 버튼
  uploadButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    borderStyle: 'dashed',
  },
  
  // 모달
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadModal: {
    backgroundColor: TossColors.background,
    borderRadius: 20,
    width: width * 0.9,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: TossColors.text,
  },
  modalClose: {
    padding: 4,
  },
  modalDescription: {
    fontSize: 14,
    color: TossColors.textSecondary,
    lineHeight: 20,
    marginBottom: 24,
  },
  modalUploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: TossColors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  modalUploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});