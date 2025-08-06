// src/lib/supabaseHelper.js - 메시지 기능 및 이미지 업로드 포함 완전 업데이트 버전
import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * 통합 사용자 정보 가져오기 (AsyncStorage + Supabase Auth 지원)
 */
export const getCurrentUserInfo = async () => {
  try {
    console.log('🔍 getCurrentUserInfo 시작');
    
    // 1순위: AsyncStorage에서 폰 인증 사용자 확인
    const storedUserInfo = await AsyncStorage.getItem('userInfo');
    const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');
    
    if (isLoggedIn === 'true' && storedUserInfo) {
      const userInfo = JSON.parse(storedUserInfo);
      console.log('✅ AsyncStorage 사용자 확인:', {
        userId: userInfo.userId,
        userName: userInfo.userName,
        phone: userInfo.phone
      });
      
      return {
        success: true,
        user: {
          id: userInfo.userId,
          phone: userInfo.phone,
          name: userInfo.userName,
          email: `${userInfo.phone.replace(/\D/g, '')}@phone.temp`, // 임시 이메일
          auth_method: 'phone'
        },
        source: 'asyncstorage'
      };
    }
    
    // 2순위: Supabase Auth 세션 확인
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      console.log('❌ 인증된 사용자 없음');
      return {
        success: false,
        error: '로그인이 필요합니다.'
      };
    }
    
    console.log('✅ Supabase 사용자 확인:', {
      userId: user.id,
      email: user.email,
      phone: user.phone
    });
    
    return {
      success: true,
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        name: user.user_metadata?.name || user.email?.split('@')[0] || '사용자',
        auth_method: 'supabase'
      },
      source: 'supabase'
    };
    
  } catch (error) {
    console.error('❌ getCurrentUserInfo 오류:', error);
    return {
      success: false,
      error: '사용자 정보를 가져올 수 없습니다.'
    };
  }
};

/**
 * 🔥 임시 이미지들을 실제 eventId 폴더로 이동
 */
export const moveImagesToEventFolder = async (images, realEventId, tempEventId) => {
  try {
    console.log('🔍 이미지 이동 시작:', {
      imageCount: images.length,
      realEventId,
      tempEventId
    });

    const movePromises = images.map(async (image) => {
      try {
        if (!image.storagePath || !image.publicUrl) {
          console.log('⚠️ Storage 정보 없는 이미지 건너뛰기:', image.id);
          return {
            ...image,
            moveSuccess: false,
            error: 'Storage 정보 없음'
          };
        }

        // 기존 경로에서 파일 다운로드
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('event-images')
          .download(image.storagePath);

        if (downloadError) {
          throw new Error(`파일 다운로드 실패: ${downloadError.message}`);
        }

        // 새 경로 생성
        const pathParts = image.storagePath.split('/');
        const userId = pathParts[0];
        const fileName = pathParts[pathParts.length - 1];
        const newPath = `${userId}/${realEventId}/${fileName}`;

        // 새 위치에 업로드
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('event-images')
          .upload(newPath, fileData, {
            contentType: 'image/jpeg',
            upsert: true
          });

        if (uploadError) {
          throw new Error(`새 위치 업로드 실패: ${uploadError.message}`);
        }

        // 새 Public URL 생성
        const { data: { publicUrl: newPublicUrl } } = supabase.storage
          .from('event-images')
          .getPublicUrl(newPath);

        // 기존 파일 삭제
        try {
          await supabase.storage
            .from('event-images')
            .remove([image.storagePath]);
        } catch (deleteError) {
          console.warn('⚠️ 기존 파일 삭제 실패 (무시):', deleteError);
        }

        console.log('✅ 이미지 이동 성공:', {
          from: image.storagePath,
          to: newPath,
          newUrl: newPublicUrl
        });

        return {
          ...image,
          storagePath: newPath,
          publicUrl: newPublicUrl,
          eventId: realEventId,
          moveSuccess: true
        };

      } catch (error) {
        console.error('❌ 개별 이미지 이동 실패:', error);
        return {
          ...image,
          moveSuccess: false,
          error: error.message
        };
      }
    });

    const results = await Promise.all(movePromises);
    
    const successfulMoves = results.filter(result => result.moveSuccess);
    const failedMoves = results.filter(result => !result.moveSuccess);

    console.log('✅ 이미지 이동 완료:', {
      total: images.length,
      success: successfulMoves.length,
      failed: failedMoves.length
    });

    return {
      success: true,
      data: {
        updatedImages: successfulMoves,
        failedImages: failedMoves,
        totalSuccess: successfulMoves.length,
        totalFailed: failedMoves.length
      }
    };

  } catch (error) {
    console.error('❌ moveImagesToEventFolder error:', error);
    return {
      success: false,
      error: error.message || '이미지 이동에 실패했습니다.'
    };
  }
};

/**
 * 🔥 이벤트의 image_urls 필드 업데이트
 */
export const updateEventImages = async (eventId, updatedImages) => {
  try {
    console.log('🔍 이벤트 이미지 DB 업데이트 시작:', {
      eventId,
      imageCount: updatedImages.length
    });

    const imageUrls = updatedImages.map(img => ({
      uri: img.publicUrl,
      category: img.category,
      categoryLabel: img.categoryLabel,
      id: img.id,
      storagePath: img.storagePath,
      publicUrl: img.publicUrl,
      eventId: img.eventId
    }));

    const { data, error } = await supabase
      .from('events')
      .update({
        image_urls: imageUrls,
        updated_at: new Date().toISOString()
      })
      .eq('id', eventId)
      .select()
      .single();

    if (error) {
      console.error('❌ 이벤트 이미지 DB 업데이트 오류:', error);
      throw error;
    }

    console.log('✅ 이벤트 이미지 DB 업데이트 완료');
    
    return {
      success: true,
      data
    };

  } catch (error) {
    console.error('❌ updateEventImages error:', error);
    return {
      success: false,
      error: error.message || '이미지 DB 업데이트에 실패했습니다.'
    };
  }
};

/**
 * 🔥 특정 eventId의 Storage 이미지들 가져오기
 */
export const getEventStorageImages = async (userId, eventId) => {
  try {
    console.log('🔍 특정 이벤트 Storage 이미지 조회:', { userId, eventId });
    
    // eventId 폴더의 파일 목록 가져오기
    const { data: files, error } = await supabase.storage
      .from('event-images')
      .list(`${userId}/${eventId}`);

    if (error) {
      console.error('❌ Storage 파일 목록 조회 오류:', error);
      return { success: false, error: error.message };
    }

    if (!files || files.length === 0) {
      console.log('📭 해당 이벤트의 이미지가 없음');
      return { success: true, data: { files: [], count: 0 } };
    }

    console.log('✅ Storage 파일 목록:', files);
    
    // 각 파일의 public URL 생성
    const filesWithUrls = files.map(file => {
      const fullPath = `${userId}/${eventId}/${file.name}`;
      const { data: { publicUrl } } = supabase.storage
        .from('event-images')
        .getPublicUrl(fullPath);
      
      return {
        ...file,
        publicUrl,
        fullPath,
        eventId,
        category: determineImageCategory(file.name) // 파일명에서 카테고리 추정
      };
    });

    return {
      success: true,
      data: {
        files: filesWithUrls,
        count: files.length
      }
    };
    
  } catch (error) {
    console.error('❌ getEventStorageImages error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 🔥 파일명에서 이미지 카테고리 추정
 */
const determineImageCategory = (fileName) => {
  const lowerFileName = fileName.toLowerCase();
  
  if (lowerFileName.includes('main')) return 'main';
  if (lowerFileName.includes('gallery')) return 'gallery';
  if (lowerFileName.includes('groom')) return 'groom';
  if (lowerFileName.includes('bride')) return 'bride';
  
  // 기본값은 main
  return 'main';
};


/**
 * Storage에서 특정 이벤트의 모든 이미지 삭제
 */
export const deleteEventStorageImages = async (userId, eventId) => {
  try {
    console.log('🔍 이벤트 Storage 이미지 삭제 시작:', { userId, eventId });
    
    // 해당 이벤트 폴더의 모든 파일 목록 가져오기
    const { data: files, error: listError } = await supabase.storage
      .from('event-images')
      .list(`${userId}/${eventId}`);

    if (listError) {
      console.error('❌ 파일 목록 조회 오류:', listError);
      return { success: false, error: listError.message };
    }

    if (!files || files.length === 0) {
      console.log('📭 삭제할 파일이 없음');
      return { success: true, data: { deletedCount: 0 } };
    }

    // 파일 경로 생성
    const filePaths = files.map(file => `${userId}/${eventId}/${file.name}`);
    
    // 일괄 삭제
    const { data, error: deleteError } = await supabase.storage
      .from('event-images')
      .remove(filePaths);

    if (deleteError) {
      console.error('❌ 파일 삭제 오류:', deleteError);
      return { success: false, error: deleteError.message };
    }

    console.log('✅ 이벤트 Storage 이미지 삭제 완료:', filePaths.length, '개');
    
    return {
      success: true,
      data: {
        deletedCount: filePaths.length,
        deletedFiles: filePaths
      }
    };

  } catch (error) {
    console.error('❌ deleteEventStorageImages error:', error);
    return { success: false, error: error.message };
  }
};



export const uploadImageToStorage = async (imageUri, fileName, userId, eventId = null) => {
  try {
    console.log('🔍 이미지 업로드 시작:', { 
      fileName, 
      userId, 
      eventId,
      imageUri: imageUri?.slice(0, 50) + '...',
      supabaseUrl: supabase.supabaseUrl?.slice(0, 30) + '...' 
    });
    
    // 1. 파일 읽기 방식 개선 (ArrayBuffer 사용)
    let fileData;
    try {
      console.log('🔍 파일 읽기 시작...');
      const response = await fetch(imageUri);
      if (!response.ok) {
        throw new Error(`파일 읽기 실패: ${response.status} ${response.statusText}`);
      }
      
      // ArrayBuffer로 읽기 (더 안정적)
      fileData = await response.arrayBuffer();
      console.log('✅ 파일 읽기 완료, 크기:', fileData.byteLength, 'bytes');
      
      if (fileData.byteLength === 0) {
        throw new Error('파일이 비어있습니다.');
      }
    } catch (fileError) {
      console.error('❌ 파일 읽기 오류:', fileError);
      throw new Error(`파일 읽기 실패: ${fileError.message}`);
    }
    
    // 2. 파일 이름 정리 및 경로 생성 - eventId 포함
    const timestamp = new Date().getTime();
    const cleanFileName = fileName?.replace(/[^a-zA-Z0-9.-]/g, '_') || 'image.jpg';
    
    // 🔥 Storage 경로: userId/eventId/fileName 구조
    const storageEventId = eventId || `temp_${timestamp}`;
    const uniqueFileName = `${userId}/${storageEventId}/${timestamp}_${cleanFileName}`;
    
    console.log('🔍 업로드 경로:', uniqueFileName);
    
    // 3. Supabase Storage에 업로드
    const { data, error } = await supabase.storage
      .from('event-images')
      .upload(uniqueFileName, fileData, {
        contentType: 'image/jpeg',
        upsert: true, // 🔥 덮어쓰기 허용
        duplex: 'half'
      });

    if (error) {
      console.error('❌ Storage 업로드 오류:', {
        message: error.message,
        statusCode: error.statusCode,
        error: error
      });
      
      if (error.message?.includes('does not exist') || error.message?.includes('not found')) {
        throw new Error('event-images 버킷이 존재하지 않습니다. Supabase Dashboard에서 버킷을 생성해주세요.');
      }
      
      if (error.message?.includes('permission') || error.message?.includes('policy')) {
        throw new Error('Storage 업로드 권한이 없습니다. Supabase Dashboard에서 Storage 정책을 확인해주세요.');
      }
      
      throw new Error(`업로드 실패: ${error.message}`);
    }

    console.log('✅ Storage 업로드 성공:', data);

    // 4. Public URL 가져오기
    const { data: { publicUrl } } = supabase.storage
      .from('event-images')
      .getPublicUrl(uniqueFileName);

    if (!publicUrl) {
      throw new Error('Public URL 생성에 실패했습니다.');
    }

    console.log('✅ 이미지 업로드 완료:', publicUrl);
    
    return {
      success: true,
      data: {
        path: data.path,
        publicUrl: publicUrl,
        fileName: uniqueFileName,
        eventId: storageEventId
      }
    };

  } catch (error) {
    console.error('❌ uploadImageToStorage error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return {
      success: false,
      error: error.message || '이미지 업로드에 실패했습니다.'
    };
  }
};
/**
 * 여러 이미지를 일괄 업로드
 */
export const uploadMultipleImages = async (images, userId, onProgress = null) => {
  try {
    console.log('🔍 다중 이미지 업로드 시작:', images.length, '개');
    
    const uploadPromises = images.map(async (image, index) => {
      try {
        // 파일 이름 생성 (카테고리 포함)
        const fileName = `${image.category}_${index}.jpg`;
        
        const result = await uploadImageToStorage(image.uri, fileName, userId);
        
        if (onProgress) {
          onProgress(index + 1, images.length);
        }
        
        if (result.success) {
          return {
            ...image,
            publicUrl: result.data.publicUrl,
            storagePath: result.data.path,
            uploadSuccess: true
          };
        } else {
          console.error('❌ 개별 이미지 업로드 실패:', result.error);
          return {
            ...image,
            uploadSuccess: false,
            error: result.error
          };
        }
      } catch (error) {
        console.error('❌ 개별 이미지 처리 오류:', error);
        return {
          ...image,
          uploadSuccess: false,
          error: error.message
        };
      }
    });

    const results = await Promise.all(uploadPromises);
    
    const successfulUploads = results.filter(result => result.uploadSuccess);
    const failedUploads = results.filter(result => !result.uploadSuccess);
    
    console.log('✅ 다중 이미지 업로드 완료:', {
      total: images.length,
      success: successfulUploads.length,
      failed: failedUploads.length
    });
    
    return {
      success: true,
      data: {
        successful: successfulUploads,
        failed: failedUploads,
        totalSuccess: successfulUploads.length,
        totalFailed: failedUploads.length
      }
    };

  } catch (error) {
    console.error('❌ uploadMultipleImages error:', error);
    return {
      success: false,
      error: error.message || '다중 이미지 업로드에 실패했습니다.'
    };
  }
};

/**
 * Storage에서 이미지 삭제
 */
export const deleteImageFromStorage = async (storagePath) => {
  try {
    console.log('🔍 이미지 삭제 시작:', storagePath);
    
    const { error } = await supabase.storage
      .from('event-images')
      .remove([storagePath]);

    if (error) {
      console.error('❌ 이미지 삭제 오류:', error);
      throw error;
    }

    console.log('✅ 이미지 삭제 완료:', storagePath);
    
    return {
      success: true
    };

  } catch (error) {
    console.error('❌ deleteImageFromStorage error:', error);
    return {
      success: false,
      error: error.message || '이미지 삭제에 실패했습니다.'
    };
  }
};

/**
 * 이벤트의 모든 이미지 삭제
 */
export const deleteEventImages = async (imageUrls) => {
  try {
    console.log('🔍 이벤트 이미지 일괄 삭제 시작:', imageUrls.length);
    
    const deletePromises = imageUrls.map(async (imageData) => {
      if (imageData.storagePath) {
        return await deleteImageFromStorage(imageData.storagePath);
      }
      return { success: true }; // storagePath가 없으면 건너뛰기
    });

    const results = await Promise.allSettled(deletePromises);
    
    const successCount = results.filter(result => 
      result.status === 'fulfilled' && result.value.success
    ).length;
    
    console.log('✅ 이벤트 이미지 일괄 삭제 완료:', {
      total: imageUrls.length,
      success: successCount
    });
    
    return {
      success: true,
      data: {
        total: imageUrls.length,
        success: successCount
      }
    };

  } catch (error) {
    console.error('❌ deleteEventImages error:', error);
    return {
      success: false,
      error: error.message || '이벤트 이미지 삭제에 실패했습니다.'
    };
  }
};

/**
 * 사용자 이벤트 목록 가져오기 (통합 인증 지원 및 에러 수정)
 */
export const getUserEvents = async (passedUserInfo = null) => {
  try {
    console.log('🔍 getUserEvents 시작');
    
    let currentUser = null;
    
    if (passedUserInfo?.id) {
      console.log('✅ 전달받은 userInfo 사용:', {
        id: passedUserInfo.id,
        name: passedUserInfo.name
      });
      currentUser = passedUserInfo;
    } else {
      const userResult = await getCurrentUserInfo();
      if (!userResult.success) {
        throw new Error(userResult.error);
      }
      currentUser = userResult.user;
    }
    
    console.log('👤 이벤트 조회 대상 사용자:', {
      id: currentUser.id,
      name: currentUser.name,
      auth_method: currentUser.auth_method || 'unknown'
    });
    
    const { data, error } = await supabase
      .from('events')
      .select(`
        id,
        event_name,
        event_type,
        event_date,
        ceremony_time,
        main_person_name,
        groom_name,
        bride_name,
        location,
        template_style,
        status,
        created_at,
        updated_at,
        user_id,
        custom_message,
        allow_messages,
        message_placeholder,
        additional_info
      `)
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ 이벤트 조회 오류:', error);
      throw error;
    }

    console.log(`✅ 이벤트 조회 완료: ${data?.length || 0}개`);
    
    return {
      success: true,
      data: data || []
    };

  } catch (error) {
    console.error('❌ getUserEvents error:', error);
    return {
      success: false,
      error: error.message || '이벤트를 불러올 수 없습니다.'
    };
  }
};

/**
 * 새 이벤트 생성 (메시지 기능 및 이미지 업로드 포함) - 화이트리스트 방식
 */
export const createEvent = async (eventData) => {
  try {
    console.log('🔍 createEvent 시작');
    console.log('🔍 받은 eventData 키들:', Object.keys(eventData));
    
    const userResult = await getCurrentUserInfo();
    if (!userResult.success) {
      throw new Error(userResult.error);
    }

    const currentUser = userResult.user;
    console.log('👤 이벤트 생성 사용자:', {
      id: currentUser.id,
      name: currentUser.name,
      auth_method: currentUser.auth_method
    });

    // ✅ 허용된 컬럼들만 화이트리스트로 추출 (실제 DB 컬럼들만)
    const allowedColumns = [
      // 기본 컬럼들
      'event_type', 'event_name', 'main_person_name', 'family_relations', 
      'preset_amounts', 'status', 'event_date', 'is_finalized',
      'image_urls', 'location', 'detailed_address', 'template_style',
      
      // 결혼식 관련 컬럼들
      'bride_name', 'groom_name', 'bride_father_name', 'bride_mother_name', 
      'groom_father_name', 'groom_mother_name', 'bride_contact', 'groom_contact', 
      'ceremony_time', 'reception_time', 'custom_message', 'dress_code', 'parking_info',
      
      // 부고 관련 컬럼들 (실제 DB 컬럼들만)
      'deceased_age', 'death_date', 'deceased_gender', 'casket_date', 'casket_time',
      'burial_date', 'burial_time', 'burial_location', 'secondary_burial_location',
      'primary_contact', 'secondary_contact', 'funeral_director', 'funeral_home',
      
      // 메시지 관련 컬럼들
      'allow_messages', 'message_placeholder', 'additional_info'
    ];

    // 허용된 컬럼들만 추출
    let processedEventData = {};
    allowedColumns.forEach(column => {
      if (eventData[column] !== undefined) {
        processedEventData[column] = eventData[column];
      }
    });

    // 시스템 필드 추가
    processedEventData.user_id = currentUser.id;
    processedEventData.status = 'active';
    processedEventData.is_finalized = false;
    processedEventData.created_at = new Date().toISOString();
    processedEventData.allow_messages = eventData.allow_messages !== undefined ? eventData.allow_messages : true;
    processedEventData.message_placeholder = eventData.message_placeholder || getDefaultMessagePlaceholder(eventData.event_type);

    // 🔥 이미지 처리 - 이미 업로드된 이미지들의 publicUrl 저장
    if (eventData.image_urls && Array.isArray(eventData.image_urls)) {
      processedEventData.image_urls = eventData.image_urls.map(img => ({
        uri: img.publicUrl || img.uri, // publicUrl이 있으면 사용, 없으면 기존 uri
        category: img.category,
        categoryLabel: img.categoryLabel,
        id: img.id,
        storagePath: img.storagePath || null, // storage path 정보 보존
        publicUrl: img.publicUrl || null
      }));
    }

    if (eventData.event_type === 'wedding') {
      if (!eventData.groom_name || !eventData.bride_name) {
        throw new Error('신랑과 신부 이름은 필수입니다.');
      }
      if (!eventData.main_person_name) {
        processedEventData.main_person_name = `${eventData.groom_name}, ${eventData.bride_name}`;
      }
      if (!eventData.event_name) {
        processedEventData.event_name = `${eventData.groom_name} ♥ ${eventData.bride_name} 결혼식`;
      }
      processedEventData.additional_info = {
        ...eventData.additional_info,
        reception_time: eventData.reception_time,
        created_via: 'app_v2.3',
        version: '2.3'
      };
    } else if (eventData.event_type === 'funeral') {
      // 🔥 고인명 체크 - camelCase와 snake_case 모두 지원
      const deceasedName = eventData.deceasedName || eventData.deceased_name;
      if (!deceasedName || !deceasedName.trim()) {
        console.error('❌ 고인명 누락:', { 
          deceasedName: eventData.deceasedName, 
          deceased_name: eventData.deceased_name,
          eventDataKeys: Object.keys(eventData)
        });
        throw new Error('고인명은 필수입니다.');
      }
      
      // 🔥 상주 정보 처리 - familyMembers에서 family_members로 변환
      const familyMembers = eventData.familyMembers || eventData.family_members || [];
      const validFamilyMembers = Array.isArray(familyMembers) 
        ? familyMembers.filter(member => member.names && member.names.trim())
        : [];
      
      console.log('🔍 부고 데이터 처리:', {
        deceasedName: deceasedName,
        originalFamilyMembers: familyMembers.length,
        validFamilyMembers: validFamilyMembers.length,
        familyMemberDetails: validFamilyMembers.map(fm => ({ 
          relation: fm.relation, 
          names: fm.names 
        }))
      });
      
      // 🔥 고인명을 main_person_name으로 매핑 (deceased_name 컬럼은 DB에 없음)
      processedEventData.main_person_name = deceasedName.trim();
      if (!eventData.event_name) {
        processedEventData.event_name = `故 ${deceasedName.trim()} 부고`;
      }

      // 🔥 camelCase 필드들을 DB 컬럼으로 변환
      if (eventData.deceasedAge || eventData.deceased_age) {
        processedEventData.deceased_age = parseInt(eventData.deceasedAge || eventData.deceased_age);
      }
      
      if (eventData.deathDate || eventData.death_date) {
        const deathDate = eventData.deathDate || eventData.death_date;
        if (deathDate instanceof Date && !isNaN(deathDate.getTime())) {
          processedEventData.death_date = deathDate.toISOString().split('T')[0];
        } else if (typeof deathDate === 'string') {
          processedEventData.death_date = deathDate;
        }
      }
      
      processedEventData.deceased_gender = eventData.deceasedGender || eventData.deceased_gender || '남';
      
      // 장례 일정 변환
      if (eventData.casketDate || eventData.casket_date) {
        const casketDate = eventData.casketDate || eventData.casket_date;
        if (casketDate instanceof Date && !isNaN(casketDate.getTime())) {
          processedEventData.casket_date = casketDate.toISOString().split('T')[0];
        } else if (typeof casketDate === 'string') {
          processedEventData.casket_date = casketDate;
        }
      }
      
      if (eventData.casketTime || eventData.casket_time) {
        const casketTime = eventData.casketTime || eventData.casket_time;
        if (casketTime instanceof Date && !isNaN(casketTime.getTime())) {
          processedEventData.casket_time = casketTime.toTimeString().split(' ')[0];
        } else if (typeof casketTime === 'string') {
          processedEventData.casket_time = casketTime;
        }
      }
      
      if (eventData.burialDate || eventData.burial_date) {
        const burialDate = eventData.burialDate || eventData.burial_date;
        if (burialDate instanceof Date && !isNaN(burialDate.getTime())) {
          processedEventData.burial_date = burialDate.toISOString().split('T')[0];
        } else if (typeof burialDate === 'string') {
          processedEventData.burial_date = burialDate;
        }
      }
      
      if (eventData.burialTime || eventData.burial_time) {
        const burialTime = eventData.burialTime || eventData.burial_time;
        if (burialTime instanceof Date && !isNaN(burialTime.getTime())) {
          processedEventData.burial_time = burialTime.toTimeString().split(' ')[0];
        } else if (typeof burialTime === 'string') {
          processedEventData.burial_time = burialTime;
        }
      }
      
      // 나머지 부고 필드들
      processedEventData.burial_location = eventData.burialLocation || eventData.burial_location || null;
      processedEventData.secondary_burial_location = eventData.secondaryBurialLocation || eventData.secondary_burial_location || null;
      processedEventData.primary_contact = eventData.primaryContact || eventData.primary_contact || null;
      processedEventData.secondary_contact = eventData.secondaryContact || eventData.secondary_contact || null;
      processedEventData.funeral_director = eventData.funeralDirector || eventData.funeral_director || null;
      processedEventData.funeral_home = eventData.funeralHome || eventData.funeral_home || null;

      // 테이블에 없는 필드들과 family_members는 additional_info에 저장
      processedEventData.additional_info = {
        ...eventData.additional_info,
        family_members: validFamilyMembers, // 🔥 상주 정보를 family_members로 저장
        funeral_start_date: eventData.funeral_start_date,
        funeral_end_date: eventData.funeral_end_date,
        created_via: 'app_v2.3',
        version: '2.3'
      };
    }

    console.log('🔍 최종 전송할 데이터 키들:', Object.keys(processedEventData));
    console.log('🔍 생성할 이벤트 데이터 (요약):', {
      event_type: processedEventData.event_type,
      event_name: processedEventData.event_name,
      main_person_name: processedEventData.main_person_name,
      image_count: processedEventData.image_urls?.length || 0,
      images_have_publicUrl: processedEventData.image_urls?.every(img => img.publicUrl) || false
    });

    const { data, error } = await supabase
      .from('events')
      .insert([processedEventData])
      .select()
      .single();

    if (error) {
      console.error('❌ 이벤트 생성 오류:', error);
      throw error;
    }

    console.log('✅ 이벤트 생성 완료:', data.id);
    
    return {
      success: true,
      data
    };

  } catch (error) {
    console.error('❌ createEvent error:', error);
    return {
      success: false,
      error: error.message || '이벤트 생성에 실패했습니다.'
    };
  }
};

/**
 * 이벤트 수정 (메시지 기능 포함)
 */
export const updateEvent = async (eventId, updates) => {
  try {
    const userResult = await getCurrentUserInfo();
    if (!userResult.success) {
      throw new Error(userResult.error);
    }

    const currentUser = userResult.user;

    let processedUpdates = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    if (updates.event_type === 'wedding' || updates.groom_name || updates.bride_name) {
      if (updates.groom_name && updates.bride_name) {
        processedUpdates.main_person_name = `${updates.groom_name}, ${updates.bride_name}`;
      }
      if (updates.groom_name && updates.bride_name && !updates.event_name) {
        processedUpdates.event_name = `${updates.groom_name} ♥ ${updates.bride_name} 결혼식`;
      }
    }

    const { data, error } = await supabase
      .from('events')
      .update(processedUpdates)
      .eq('user_id', currentUser.id)
      .eq('id', eventId)
      .select()
      .single();

    if (error) {
      console.error('❌ 이벤트 수정 오류:', error);
      throw error;
    }

    console.log('✅ 이벤트 수정 완료:', eventId);
    
    return {
      success: true,
      data
    };

  } catch (error) {
    console.error('❌ updateEvent error:', error);
    return {
      success: false,
      error: error.message || '이벤트 수정에 실패했습니다.'
    };
  }
};

/**
 * 이벤트 삭제 (메시지와 이미지도 함께 삭제)
 */
export const deleteEvent = async (eventId) => {
  try {
    const userResult = await getCurrentUserInfo();
    if (!userResult.success) {
      throw new Error(userResult.error);
    }

    const currentUser = userResult.user;

    // 먼저 이벤트 정보 조회하여 이미지 정보 가져오기
    const { data: eventData } = await supabase
      .from('events')
      .select('image_urls')
      .eq('id', eventId)
      .eq('user_id', currentUser.id)
      .single();

    // 관련 이미지 삭제
    if (eventData?.image_urls && Array.isArray(eventData.image_urls)) {
      await deleteEventImages(eventData.image_urls);
    }

    // 관련 데이터 삭제
    try {
      await supabase
        .from('event_messages')
        .delete()
        .eq('event_id', eventId);
    } catch (messageError) {
      console.log('⚠️ 메시지 삭제 중 오류 (무시):', messageError);
    }

    try {
      await supabase
        .from('contributions')
        .delete()
        .eq('event_id', eventId);
    } catch (contribError) {
      console.log('⚠️ 부조금 삭제 중 오류 (무시):', contribError);
    }

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('user_id', currentUser.id)
      .eq('id', eventId);

    if (error) {
      console.error('❌ 이벤트 삭제 오류:', error);
      throw error;
    }

    console.log('✅ 이벤트 삭제 완료:', eventId);
    
    return {
      success: true
    };

  } catch (error) {
    console.error('❌ deleteEvent error:', error);
    return {
      success: false,
      error: error.message || '이벤트 삭제에 실패했습니다.'
    };
  }
};

/**
 * 특정 이벤트 상세 정보 조회 (메시지 포함)
 */
export const getEventDetail = async (eventId) => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        contributions (
          id,
          contributor_name,
          amount,
          relation_to,
          notes,
          is_confirmed,
          is_manual_entry,
          created_at,
          updated_at
        )
      `)
      .eq('id', eventId)
      .single();

    if (error) {
      console.error('❌ 이벤트 상세 조회 오류:', error);
      throw error;
    }

    console.log('✅ 이벤트 상세 조회 완료:', eventId);
    
    // 추가 정보 처리
    if (data.event_type === 'wedding') {
      if (data.additional_info?.reception_time) {
        data.reception_time = data.additional_info.reception_time;
      }
    } else if (data.event_type === 'funeral') {
      if (data.additional_info) {
        data.deceased_age = data.additional_info.deceased_age;
        data.deceased_gender = data.additional_info.deceased_gender;
        data.death_date = data.additional_info.death_date;
        data.burial_date = data.additional_info.burial_date;
        data.burial_time = data.additional_info.burial_time;
        data.burial_location = data.additional_info.burial_location;
        data.family_members = data.additional_info.family_members;
        data.funeral_home = data.additional_info.funeral_home;
        data.funeral_director = data.additional_info.funeral_director;
        data.primary_contact = data.additional_info.primary_contact;
        data.secondary_contact = data.additional_info.secondary_contact;
      }
    }
    
    return {
      success: true,
      data
    };

  } catch (error) {
    console.error('❌ getEventDetail error:', error);
    return {
      success: false,
      error: error.message || '이벤트 정보를 불러올 수 없습니다.'
    };
  }
};

// ===== 메시지 관련 함수들 =====

/**
 * 이벤트 메시지 생성
 */
export const createEventMessage = async (eventId, messageData) => {
  try {
    console.log('🔍 메시지 생성 시도:', { eventId, messageData });

    const { data, error } = await supabase
      .from('event_messages')
      .insert([
        {
          event_id: eventId,
          sender_name: messageData.sender_name,
          sender_phone: messageData.sender_phone,
          message: messageData.message,
          message_type: messageData.message_type,
          is_anonymous: messageData.is_anonymous || false,
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('❌ 메시지 생성 에러:', error);
      throw error;
    }

    console.log('✅ 메시지 생성 성공:', data.id);
    return { success: true, data };
  } catch (error) {
    console.error('❌ createEventMessage error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 이벤트 메시지 목록 조회
 */
export const getEventMessages = async (eventId, limit = 50) => {
  try {
    console.log('🔍 메시지 목록 조회 시도:', { eventId, limit });

    const { data, error } = await supabase
      .from('event_messages')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ 메시지 목록 조회 에러:', error);
      throw error;
    }

    console.log('✅ 메시지 목록 조회 성공:', data?.length || 0, '개');
    return { success: true, data: data || [] };
  } catch (error) {
    console.error('❌ getEventMessages error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 메시지 수정
 */
export const updateEventMessage = async (messageId, updateData) => {
  try {
    console.log('🔍 메시지 수정 시도:', { messageId, updateData });

    const { data, error } = await supabase
      .from('event_messages')
      .update({
        message: updateData.message,
        updated_at: new Date().toISOString(),
      })
      .eq('id', messageId)
      .select()
      .single();

    if (error) {
      console.error('❌ 메시지 수정 에러:', error);
      throw error;
    }

    console.log('✅ 메시지 수정 성공:', data.id);
    return { success: true, data };
  } catch (error) {
    console.error('❌ updateEventMessage error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 메시지 삭제
 */
export const deleteEventMessage = async (messageId) => {
  try {
    console.log('🔍 메시지 삭제 시도:', messageId);

    const { error } = await supabase
      .from('event_messages')
      .delete()
      .eq('id', messageId);

    if (error) {
      console.error('❌ 메시지 삭제 에러:', error);
      throw error;
    }

    console.log('✅ 메시지 삭제 성공');
    return { success: true };
  } catch (error) {
    console.error('❌ deleteEventMessage error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 메시지 통계 조회
 */
export const getEventMessageStats = async (eventId) => {
  try {
    console.log('🔍 메시지 통계 조회 시도:', eventId);

    const { data, error } = await supabase
      .from('event_messages')
      .select('message_type, is_anonymous')
      .eq('event_id', eventId);

    if (error) {
      console.error('❌ 메시지 통계 조회 에러:', error);
      throw error;
    }

    const stats = {
      total: data.length,
      anonymous: data.filter(msg => msg.is_anonymous).length,
      named: data.filter(msg => !msg.is_anonymous).length,
      byType: data.reduce((acc, msg) => {
        acc[msg.message_type] = (acc[msg.message_type] || 0) + 1;
        return acc;
      }, {})
    };

    console.log('✅ 메시지 통계 조회 성공:', stats);
    return { success: true, data: stats };
  } catch (error) {
    console.error('❌ getEventMessageStats error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 실시간 메시지 구독
 */
export const subscribeToEventMessages = (eventId, onMessage) => {
  console.log('🔍 메시지 실시간 구독 시작:', eventId);

  const subscription = supabase
    .channel(`event_messages:${eventId}`)
    .on('postgres_changes', 
      { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'event_messages',
        filter: `event_id=eq.${eventId}`
      }, 
      (payload) => {
        console.log('✅ 새 메시지 수신:', payload);
        if (onMessage) {
          onMessage(payload.new);
        }
      }
    )
    .subscribe();

  return {
    unsubscribe: () => {
      console.log('🔍 메시지 구독 해제');
      supabase.removeChannel(subscription);
    }
  };
};

/**
 * 이벤트 메시지 허용 설정 업데이트
 */
export const updateEventMessageSettings = async (eventId, allowMessages, placeholder) => {
  try {
    console.log('🔍 이벤트 메시지 설정 업데이트 시도:', { eventId, allowMessages, placeholder });

    const { data, error } = await supabase
      .from('events')
      .update({ 
        allow_messages: allowMessages,
        message_placeholder: placeholder,
        updated_at: new Date().toISOString() 
      })
      .eq('id', eventId)
      .select()
      .single();

    if (error) {
      console.error('❌ 이벤트 메시지 설정 업데이트 에러:', error);
      throw error;
    }

    console.log('✅ 이벤트 메시지 설정 업데이트 성공:', data.id);
    return { success: true, data };
  } catch (error) {
    console.error('❌ updateEventMessageSettings error:', error);
    return { success: false, error: error.message };
  }
};

// ===== 부조금 관련 함수들 =====

/**
 * 부조금 추가
 */
export const addContribution = async (contributionData) => {
  try {
    const userResult = await getCurrentUserInfo();
    if (!userResult.success) {
      throw new Error(userResult.error);
    }

    const { data, error } = await supabase
      .from('contributions')
      .insert([{
        ...contributionData,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('❌ 부조금 추가 오류:', error);
      throw error;
    }

    console.log('✅ 부조금 추가 완료:', data.id);
    
    return {
      success: true,
      data
    };

  } catch (error) {
    console.error('❌ addContribution error:', error);
    return {
      success: false,
      error: error.message || '부조금 추가에 실패했습니다.'
    };
  }
};

/**
 * 특정 이벤트의 부조금 목록 조회
 */
export const getEventContributions = async (eventId) => {
  try {
    const { data, error } = await supabase
      .from('contributions')
      .select(`
        id,
        contributor_name,
        amount,
        relation_to,
        notes,
        is_confirmed,
        is_manual_entry,
        created_at,
        updated_at
      `)
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ 부조금 목록 조회 오류:', error);
      throw error;
    }

    console.log('✅ 부조금 목록 조회 완료:', data?.length || 0);
    
    return {
      success: true,
      data: data || []
    };

  } catch (error) {
    console.error('❌ getEventContributions error:', error);
    return {
      success: false,
      error: error.message || '부조금 목록을 불러올 수 없습니다.'
    };
  }
};

/**
 * 부조금 수정
 */
export const updateContribution = async (contributionId, updateData) => {
  try {
    const { data, error } = await supabase
      .from('contributions')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', contributionId)
      .select()
      .single();

    if (error) {
      console.error('❌ 부조금 수정 오류:', error);
      throw error;
    }

    console.log('✅ 부조금 수정 완료:', contributionId);
    
    return {
      success: true,
      data
    };

  } catch (error) {
    console.error('❌ updateContribution error:', error);
    return {
      success: false,
      error: error.message || '부조금 수정에 실패했습니다.'
    };
  }
};

/**
 * 부조금 삭제
 */
export const deleteContribution = async (contributionId) => {
  try {
    const { error } = await supabase
      .from('contributions')
      .delete()
      .eq('id', contributionId);

    if (error) {
      console.error('❌ 부조금 삭제 오류:', error);
      throw error;
    }

    console.log('✅ 부조금 삭제 완료:', contributionId);
    
    return {
      success: true
    };

  } catch (error) {
    console.error('❌ deleteContribution error:', error);
    return {
      success: false,
      error: error.message || '부조금 삭제에 실패했습니다.'
    };
  }
};

/**
 * 이벤트 통계 조회
 */
export const getEventStatistics = async (eventId) => {
  try {
    const { data, error } = await supabase
      .from('contributions')
      .select('amount, is_confirmed, relation_to')
      .eq('event_id', eventId);

    if (error) {
      console.error('❌ 이벤트 통계 조회 오류:', error);
      throw error;
    }

    const totalContributions = data.length;
    const totalAmount = data.reduce((sum, contrib) => sum + (contrib.amount || 0), 0);
    const confirmedCount = data.filter(contrib => contrib.is_confirmed).length;
    const pendingCount = totalContributions - confirmedCount;
    
    const relationStats = data.reduce((acc, contrib) => {
      const relation = contrib.relation_to || '기타';
      if (!acc[relation]) {
        acc[relation] = { count: 0, amount: 0 };
      }
      acc[relation].count += 1;
      acc[relation].amount += contrib.amount || 0;
      return acc;
    }, {});

    console.log('✅ 이벤트 통계 조회 완료');
    
    return {
      success: true,
      data: {
        totalContributions,
        totalAmount,
        confirmedCount,
        pendingCount,
        averageAmount: totalContributions > 0 ? Math.round(totalAmount / totalContributions) : 0,
        relationStats
      }
    };

  } catch (error) {
    console.error('❌ getEventStatistics error:', error);
    return {
      success: false,
      error: error.message || '통계 조회에 실패했습니다.'
    };
  }
};

// ===== 기타 유틸리티 함수들 =====

/**
 * 이벤트 타입별 기본 메시지 플레이스홀더
 */
export const getDefaultMessagePlaceholder = (eventType) => {
  switch (eventType) {
    case 'wedding':
      return '결혼을 축하합니다.';
    case 'funeral':
      return '삼가 고인의 명복을 빕니다.';
    case 'birthday':
      return '첫 돌을 축하합니다.';
    default:
      return '축하합니다.';
  }
};

/**
 * 활성 이벤트만 조회 - 상주 정보 포함
 */
export const getActiveEvents = async () => {
  try {
    console.log('🔍 활성 이벤트 조회 시작');
    
    // 1. 현재 사용자 정보 가져오기
    const userResult = await getCurrentUserInfo();
    if (!userResult.success) {
      console.error('❌ 사용자 정보 없음:', userResult.error);
      return {
        success: false,
        error: userResult.error
      };
    }

    const currentUser = userResult.user;
    console.log('👤 활성 이벤트 조회 대상 사용자:', {
      id: currentUser.id,
      name: currentUser.name,
      auth_method: currentUser.auth_method || 'unknown',
      source: userResult.source
    });

    // 2. 🔥 중복 방지를 위한 DISTINCT 쿼리 사용
    const { data, error } = await supabase
      .from('events')
      .select(`
        id,
        event_name,
        event_type,
        event_date,
        ceremony_time,
        main_person_name,
        groom_name,
        bride_name,
        location,
        detailed_address,
        template_style,
        status,
        created_at,
        updated_at,
        user_id,
        custom_message,
        allow_messages,
        message_placeholder,
        additional_info,
        image_urls,
        deceased_age,
        death_date,
        deceased_gender,
        casket_date,
        casket_time,
        burial_date,
        burial_time,
        burial_location,
        secondary_burial_location,
        primary_contact,
        secondary_contact,
        funeral_director,
        funeral_home
      `)
      .eq('user_id', currentUser.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ 활성 이벤트 조회 오류:', error);
      return {
        success: false,
        error: error.message
      };
    }

    if (!data || data.length === 0) {
      // console.log('📭 활성 이벤트 없음');
      return {
        success: true,
        data: []
      };
    }

    // 3. 🔥 클라이언트 사이드에서도 중복 제거 (안전장치)
    const uniqueEvents = data.filter((event, index, self) => 
      index === self.findIndex(e => e.id === event.id)
    );

    // console.log(`✅ 활성 이벤트 조회 완료:`, {
    //   rawCount: data.length,
    //   uniqueCount: uniqueEvents.length,
    //   duplicatesRemoved: data.length - uniqueEvents.length,
    //   userId: currentUser.id
    // });

    // 4. 🔥 각 이벤트의 상세 디버깅 정보
    uniqueEvents.forEach((event, index) => {
      // console.log(`🎭 활성 이벤트 ${index + 1}:`, {
      //   id: event.id,
      //   name: event.event_name,
      //   type: event.event_type,
      //   status: event.status,
      //   user_id: event.user_id,
      //   created_at: event.created_at?.slice(0, 19) // 시간 부분만
      // });
    });

    // 5. 🔥 부고 데이터 후처리 - additional_info에서 정보 추출
    const processedData = uniqueEvents.map(event => {
      const processedEvent = { ...event };
      
      if (event.event_type === 'funeral' && event.additional_info) {
        // additional_info에서 부고 관련 정보 추출
        const additionalInfo = event.additional_info;
        
        // 가족 구성원 정보 추출
        if (additionalInfo.family_members) {
          processedEvent.family_members = additionalInfo.family_members;
        }
        
        // 기타 부고 정보들도 추출
        if (additionalInfo.funeral_start_date) {
          processedEvent.funeral_start_date = additionalInfo.funeral_start_date;
        }
        if (additionalInfo.funeral_end_date) {
          processedEvent.funeral_end_date = additionalInfo.funeral_end_date;
        }
        
        console.log(`🎭 부고 ${event.event_name} 가족 정보 추출:`, {
          familyMembersCount: processedEvent.family_members?.length || 0,
          familyMembers: processedEvent.family_members?.map(fm => ({ 
            relation: fm.relation, 
            names: fm.names 
          })) || []
        });
      }
      
      return processedEvent;
    });

    return {
      success: true,
      data: processedData
    };

  } catch (error) {
    console.error('❌ getActiveEvents error:', error);
    return {
      success: false,
      error: error.message || '활성 이벤트를 불러올 수 없습니다.'
    };
  }
};

/**
 * 이벤트 상태 업데이트
 */
export const updateEventStatus = async (eventId, status) => {
  try {
    console.log('🔍 이벤트 상태 업데이트 시도:', { eventId, status });

    const { data, error } = await supabase
      .from('events')
      .update({ 
        status, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', eventId)
      .select()
      .single();

    if (error) {
      console.error('❌ 이벤트 상태 업데이트 에러:', error);
      throw error;
    }

    console.log('✅ 이벤트 상태 업데이트 성공:', data.id);
    return { success: true, data };
  } catch (error) {
    console.error('❌ updateEventStatus error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 이벤트 완료 처리
 */
export const finalizeEvent = async (eventId) => {
  try {
    console.log('🔍 이벤트 완료 처리 시도:', eventId);

    const { data, error } = await supabase
      .from('events')
      .update({ 
        is_finalized: true,
        status: 'completed',
        updated_at: new Date().toISOString() 
      })
      .eq('id', eventId)
      .select()
      .single();

    if (error) {
      console.error('❌ 이벤트 완료 처리 에러:', error);
      throw error;
    }

    console.log('✅ 이벤트 완료 처리 성공:', data.id);
    return { success: true, data };
  } catch (error) {
    console.error('❌ finalizeEvent error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 유틸리티: 금액 포맷팅
 */
export const formatAmount = (amount) => {
  if (!amount || amount === 0) return '0원';
  return new Intl.NumberFormat('ko-KR').format(amount) + '원';
};

/**
 * 유틸리티: 날짜 포맷팅
 */
export const formatDate = (dateString) => {
  if (!dateString) return '날짜 미정';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * 유틸리티: 시간 포맷팅
 */
export const formatTime = (timeString) => {
  if (!timeString) return '시간 미정';
  
  if (typeof timeString === 'string' && timeString.includes(':')) {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const isPM = hour >= 12;
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${isPM ? '오후' : '오전'} ${displayHour}:${minutes}`;
  }
  
  const date = new Date(timeString);
  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * 유틸리티: 상대 시간 포맷팅
 */
export const formatRelativeTime = (dateString) => {
  if (!dateString) return '알 수 없음';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return '오늘';
  if (diffDays === 1) return '어제';
  if (diffDays < 7) return `${diffDays}일 전`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}개월 전`;
  return `${Math.floor(diffDays / 365)}년 전`;
};

/**
 * 유틸리티: D-Day 계산
 */
export const calculateDDay = (eventDateString) => {
  if (!eventDateString) return null;
  
  const eventDate = new Date(eventDateString);
  const today = new Date();
  
  eventDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  const diffTime = eventDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'D-Day';
  if (diffDays > 0) return `D-${diffDays}`;
  return `D+${Math.abs(diffDays)}`;
};

/**
 * 디버깅용: 사용자 정보 확인
 */
export const debugUserInfo = async () => {
  try {
    console.log('🔍 === 사용자 정보 디버깅 ===');
    
    const storedUserInfo = await AsyncStorage.getItem('userInfo');
    const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');
    console.log('📱 AsyncStorage:', {
      isLoggedIn,
      userInfo: storedUserInfo ? JSON.parse(storedUserInfo) : null
    });
    
    const { data: { user }, error } = await supabase.auth.getUser();
    console.log('🔐 Supabase Auth:', {
      user: user ? { id: user.id, email: user.email, phone: user.phone } : null,
      error: error?.message
    });
    
    const userResult = await getCurrentUserInfo();
    console.log('🔧 getCurrentUserInfo 결과:', userResult);
    
    console.log('🔍 === 디버깅 완료 ===');
  } catch (error) {
    console.error('❌ 디버깅 오류:', error);
  }
};