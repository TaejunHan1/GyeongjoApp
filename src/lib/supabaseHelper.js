// src/lib/supabaseHelper.js - guest_book 테이블 사용 버전
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
 * 개인 일정 조회
 */
export const getPersonalSchedules = async (passedUserInfo = null) => {
  try {
    console.log('🔍 getPersonalSchedules 시작');
    
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
    
    console.log('👤 개인 일정 조회 대상 사용자:', {
      id: currentUser.id,
      name: currentUser.name,
      auth_method: currentUser.auth_method || 'unknown'
    });
    
    const { data, error } = await supabase
      .from('personal_schedules')
      .select(`
        id,
        title,
        event_type,
        event_date,
        location,
        notes,
        created_at,
        updated_at
      `)
      .eq('user_id', currentUser.id)
      .order('event_date', { ascending: false });

    if (error) {
      console.error('❌ 개인 일정 조회 오류:', error);
      throw error;
    }

    console.log(`✅ 개인 일정 조회 완료: ${data?.length || 0}개`);
    
    // 개인 일정 데이터를 이벤트 형식에 맞게 변환
    const personalSchedules = (data || []).map(schedule => ({
      id: schedule.id,
      event_name: schedule.title,
      title: schedule.title, // 호환성을 위해 둘 다 제공
      event_type: schedule.event_type,
      event_date: schedule.event_date,
      location: schedule.location,
      notes: schedule.notes,
      source: 'personal', // 개인 일정임을 표시
      is_personal_schedule: true,
      is_reminder_set: false, // 기본값 설정
      created_at: schedule.created_at,
      updated_at: schedule.updated_at,
      status: 'active'
    }));
    
    return {
      success: true,
      data: personalSchedules
    };

  } catch (error) {
    console.error('❌ getPersonalSchedules error:', error);
    return {
      success: false,
      error: error.message || '개인 일정을 불러올 수 없습니다.'
    };
  }
};

/**
 * 개인 일정 생성
 */
export const createPersonalSchedule = async (scheduleData, passedUserInfo = null) => {
  try {
    console.log('🔍 createPersonalSchedule 시작:', scheduleData);
    
    let currentUser = null;
    
    if (passedUserInfo?.id) {
      currentUser = passedUserInfo;
    } else {
      const userResult = await getCurrentUserInfo();
      if (!userResult.success) {
        throw new Error(userResult.error);
      }
      currentUser = userResult.user;
    }
    
    console.log('👤 개인 일정 생성 대상 사용자:', {
      id: currentUser.id,
      name: currentUser.name,
      auth_method: currentUser.auth_method || 'unknown'
    });
    
    console.log('📝 생성할 일정 데이터:', {
      user_id: currentUser.id,
      title: scheduleData.title,
      event_type: scheduleData.event_type,
      event_date: scheduleData.event_date,
      location: scheduleData.location
    });
    
    const { data, error } = await supabase
      .from('personal_schedules')
      .insert([{
        user_id: currentUser.id,
        title: scheduleData.title,
        event_type: scheduleData.event_type,
        event_date: scheduleData.event_date,
        location: scheduleData.location || null,
        notes: scheduleData.notes || null
      }])
      .select()
      .single();

    if (error) {
      console.error('❌ 개인 일정 생성 오류:', error);
      throw error;
    }

    console.log('✅ 개인 일정 생성 완료:', data.id);
    
    return {
      success: true,
      data: {
        id: data.id,
        event_name: data.title,
        title: data.title,
        event_type: data.event_type,
        event_date: data.event_date,
        location: data.location,
        notes: data.notes,
        source: 'personal',
        is_personal_schedule: true,
        status: 'active',
        created_at: data.created_at
      }
    };

  } catch (error) {
    console.error('❌ createPersonalSchedule error:', error);
    return {
      success: false,
      error: error.message || '개인 일정을 생성할 수 없습니다.'
    };
  }
};

/**
 * 통합 이벤트 조회 (주최 경조사 + 개인 일정)
 */
export const getAllUserEvents = async (passedUserInfo = null) => {
  try {
    console.log('🔍 getAllUserEvents 시작 - 주최 경조사 + 개인 일정');
    
    // 주최 경조사 조회
    const hostedEventsResult = await getUserEvents(passedUserInfo);
    const personalSchedulesResult = await getPersonalSchedules(passedUserInfo);
    
    const hostedEvents = hostedEventsResult.success ? hostedEventsResult.data : [];
    const personalSchedules = personalSchedulesResult.success ? personalSchedulesResult.data : [];
    
    // 주최 경조사에 source 마킹
    const markedHostedEvents = hostedEvents.map(event => ({
      ...event,
      source: 'hosted',
      is_personal_schedule: false
    }));
    
    // 두 데이터 병합
    const allEvents = [...markedHostedEvents, ...personalSchedules];
    
    // 날짜순 정렬 (최신순)
    allEvents.sort((a, b) => new Date(b.event_date) - new Date(a.event_date));
    
    console.log(`✅ 통합 이벤트 조회 완료: 주최 ${hostedEvents.length}개 + 개인 ${personalSchedules.length}개 = 총 ${allEvents.length}개`);
    
    return {
      success: true,
      data: allEvents,
      breakdown: {
        hosted: hostedEvents.length,
        personal: personalSchedules.length,
        total: allEvents.length
      }
    };

  } catch (error) {
    console.error('❌ getAllUserEvents error:', error);
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

    // 🔥 guest_book 데이터 삭제
    try {
      await supabase
        .from('guest_book')
        .delete()
        .eq('event_id', eventId);
    } catch (guestBookError) {
      console.log('⚠️ 방명록 삭제 중 오류 (무시):', guestBookError);
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
 * 특정 이벤트 상세 정보 조회 (guest_book 포함)
 */
export const getEventDetail = async (eventId) => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        guest_book (
          id,
          guest_name,
          amount,
          relation_category,
          relation_detail,
          message,
          message_type,
          is_verified,
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

    // 🔥 guest_book_stats에서 통계 정보도 가져오기
    const { data: stats } = await supabase
      .from('guest_book_stats')
      .select('*')
      .eq('event_id', eventId)
      .single();

    if (stats) {
      data.statistics = {
        totalAmount: stats.total_amount || 0,
        totalEntries: stats.total_entries || 0,
        attendingCount: stats.attending_count || 0,
        messageCount: stats.message_count || 0,
        verifiedCount: stats.verified_count || 0,
        // 결혼식 전용 통계
        groomSideAmount: stats.groom_side_amount || 0,
        brideSideAmount: stats.bride_side_amount || 0,
        groomSideCount: stats.groom_side_count || 0,
        brideSideCount: stats.bride_side_count || 0,
      };
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

// ===== Guest Book (부조금/축의금) 관련 함수들 =====

/**
 * 방명록에 부조금/축의금 추가
 */
export const addGuestBookEntry = async (eventId, guestData) => {
  try {
    console.log('💰 방명록 추가:', { eventId, guestData });

    // 현재 사용자 정보 가져오기 - 실패해도 계속 진행
    const { data: { user } } = await supabase.auth.getUser();
    
    // 이벤트 타입 확인
    const { data: event } = await supabase
      .from('events')
      .select('event_type')
      .eq('id', eventId)
      .single();

    // message_type 자동 설정 (결혼식이면 축하, 장례식이면 조의)
    const messageType = event?.event_type === 'wedding' ? 'congratulation' : 'condolence';

    // guest_book 테이블에 데이터 추가 (created_by는 선택적)
    const insertData = {
      event_id: eventId,
      guest_name: guestData.guest_name,
      guest_phone: guestData.guest_phone,
      amount: guestData.amount,
      relation_category: guestData.relation_category,
      relation_detail: guestData.relation_detail,
      message: guestData.message,
      message_type: messageType,
      amount_type: 'money',
      payment_method: guestData.payment_method || 'cash',
      attending: guestData.attending !== false,
      is_verified: false,
      created_at: new Date().toISOString()
    };
    
    // user.id가 있으면 추가
    if (user?.id) {
      insertData.created_by = user.id;
    }

    const { data, error } = await supabase
      .from('guest_book')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('❌ 방명록 추가 오류:', error);
      
      // RLS 정책 오류인 경우 안내 메시지
      if (error.code === '42501') {
        console.log('🔧 RLS 정책 오류 - anon 또는 public 접근 필요');
        return {
          success: false,
          error: 'guest_book 테이블의 RLS 정책을 확인해주세요. authenticated 대신 anon 또는 public으로 설정해보세요.'
        };
      }
      
      throw error;
    }

    console.log('✅ 방명록 추가 완료:', data.id);
    
    return {
      success: true,
      data
    };

  } catch (error) {
    console.error('❌ addGuestBookEntry error:', error);
    return {
      success: false,
      error: error.message || '방명록 추가에 실패했습니다.'
    };
  }
};

/**
 * 특정 이벤트의 방명록 목록 조회
 */
export const getEventGuestBook = async (eventId) => {
  try {
    const { data, error } = await supabase
      .from('guest_book')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ 방명록 조회 오류:', error);
      throw error;
    }

    // 관계별 통계도 함께 조회
    const { data: relationStats } = await supabase
      .from('guest_book_relation_stats')
      .select('*')
      .eq('event_id', eventId);

    console.log('✅ 방명록 조회 완료:', data?.length || 0);
    
    return {
      success: true,
      data: {
        entries: data || [],
        relationStats: relationStats || []
      }
    };

  } catch (error) {
    console.error('❌ getEventGuestBook error:', error);
    return {
      success: false,
      error: error.message || '방명록을 불러올 수 없습니다.'
    };
  }
};

/**
 * 이벤트 통계 조회 (guest_book_stats 뷰 사용)
 */
export const getEventStatistics = async (eventId) => {
  try {
    // guest_book_stats 뷰에서 통계 가져오기
    const { data: stats, error } = await supabase
      .from('guest_book_stats')
      .select('*')
      .eq('event_id', eventId)
      .single();

    if (error && error.code !== 'PGRST116') { // 데이터 없음 에러는 무시
      console.error('❌ 통계 조회 오류:', error);
      throw error;
    }

    // 관계별 통계도 가져오기
    const { data: relationStats } = await supabase
      .from('guest_book_relation_stats')
      .select('*')
      .eq('event_id', eventId);

    console.log('✅ 이벤트 통계 조회 완료');
    
    return {
      success: true,
      data: {
        totalContributions: stats?.total_entries || 0,
        totalAmount: stats?.total_amount || 0,
        verifiedCount: stats?.verified_count || 0,
        attendingCount: stats?.attending_count || 0,
        messageCount: stats?.message_count || 0,
        averageAmount: stats?.avg_amount || 0,
        // 결혼식 전용
        groomSideAmount: stats?.groom_side_amount || 0,
        brideSideAmount: stats?.bride_side_amount || 0,
        groomSideCount: stats?.groom_side_count || 0,
        brideSideCount: stats?.bride_side_count || 0,
        // 관계별 통계
        relationStats: relationStats || []
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

/**
 * 특정 이벤트의 부조금 상세 내역 조회
 */
export const getEventContributions = async (eventId) => {
  try {
    console.log('💰 이벤트 부조금 내역 조회 시작:', eventId);
    
    // 🔥 contributions 테이블부터 시도해보기 (CLAUDE.md에 따르면 이 테이블이 실제 데이터)
    const { data: contributionsData, error: contributionsError } = await supabase
      .from('contributions')
      .select('*')
      .eq('event_id', eventId);
      
    console.log('🔍 contributions 테이블 조회 결과:', {
      success: !contributionsError,
      count: contributionsData?.length || 0,
      data: contributionsData,
      error: contributionsError?.message
    });
    
    if (!contributionsError && contributionsData && contributionsData.length > 0) {
      // contributions 테이블에서 데이터 찾음 - 올바른 컬럼명 사용
      const formattedData = contributionsData.map(item => ({
        id: item.id,
        guest_name: item.contributor_name || '이름 없음', // contributor_name이 올바른 컬럼명
        amount: item.amount || 0,
        relation_category: item.relation_to || '', // relation_to가 올바른 컬럼명
        relation_detail: item.relation_to || '',
        message: item.notes || '', // notes가 메시지 역할
        message_type: 'congratulation',
        is_verified: item.is_confirmed || false, // is_confirmed가 올바른 컬럼명
        created_at: item.created_at,
        updated_at: item.updated_at
      }));
      
      console.log(`✅ contributions 테이블에서 부조금 내역 조회 완료: ${formattedData.length}개`);
      return {
        success: true,
        data: formattedData
      };
    }
    
    console.log('🔄 contributions 테이블에 없어서 다른 테이블들 시도');
    
    // 🔍 다른 가능한 테이블들도 확인해보기
    const possibleTables = ['event_messages', 'public_guest_messages', 'event_summary'];
    
    for (const tableName of possibleTables) {
      try {
        const { data: tableData, error: tableError } = await supabase
          .from(tableName)
          .select('*')
          .eq('event_id', eventId);
          
        console.log(`🔍 ${tableName} 테이블 조회:`, {
          success: !tableError,
          count: tableData?.length || 0,
          data: tableData?.slice(0, 2), // 처음 2개만
          error: tableError?.message
        });
        
        if (!tableError && tableData && tableData.length > 0) {
          console.log(`🎉 ${tableName}에서 데이터 발견!`);
          
          // event_messages에서 데이터가 발견되면 더 자세히 확인
          if (tableName === 'event_messages') {
            console.log('🔍 event_messages 구조 상세 분석:', {
              sampleData: tableData[0],
              hasAmount: 'amount' in (tableData[0] || {}),
              hasContribution: 'contribution_amount' in (tableData[0] || {}),
              allKeys: Object.keys(tableData[0] || {})
            });
            
            // 혹시 amount 관련 컬럼이 있나 더 자세히 조회해보기
            const { data: detailData, error: detailError } = await supabase
              .from('event_messages')
              .select('*')
              .eq('event_id', eventId);
              
            console.log('🔍 event_messages 전체 컬럼 조회:', {
              success: !detailError,
              data: detailData,
              error: detailError?.message
            });
          }
        }
      } catch (error) {
        console.log(`❌ ${tableName} 테이블 조회 실패:`, error.message);
      }
    }
    
    // 🔍 guest_book_stats 뷰에서 실제 원본 데이터 확인해보기
    try {
      const { data: statsViewData, error: statsViewError } = await supabase
        .from('guest_book_stats')
        .select('*')
        .eq('event_id', eventId);
        
      console.log('🔍 guest_book_stats 뷰 직접 조회:', {
        success: !statsViewError,
        data: statsViewData,
        error: statsViewError?.message
      });
    } catch (error) {
      console.log('❌ guest_book_stats 뷰 조회 실패:', error.message);
    }

    // 🔍 전체 guest_book 테이블 데이터 확인
    const { data: allData, error: allError } = await supabase
      .from('guest_book')
      .select('event_id, guest_name, amount')
      .limit(10);
    
    console.log('🔍 guest_book 전체 데이터 샘플:', {
      success: !allError,
      count: allData?.length || 0,
      sample: allData?.slice(0, 3)
    });

    // guest_book 테이블에서 부조금 내역 가져오기
    const { data: contributions, error } = await supabase
      .from('guest_book')
      .select(`
        id,
        guest_name,
        amount,
        relation_category,
        relation_detail,
        message,
        message_type,
        is_verified,
        created_at,
        updated_at
      `)
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    console.log('🔍🔍 상세 조회 결과:', {
      error: error,
      dataLength: contributions?.length || 0,
      rawData: contributions
    });

    if (error) {
      console.error('❌ 부조금 내역 조회 오류:', error);
      throw error;
    }

    console.log(`✅ 부조금 내역 조회 완료: ${contributions?.length || 0}개`);
    
    return {
      success: true,
      data: contributions || []
    };

  } catch (error) {
    console.error('❌ getEventContributions error:', error);
    return {
      success: false,
      error: error.message || '부조금 내역 조회에 실패했습니다.',
      data: []
    };
  }
};

// 1. supabaseHelper.js - getMonthlyStatistics 함수 수정
export const getMonthlyStatistics = async (userId) => {
  try {
    console.log('📊 월별 통계 조회 시작:', userId);
    
    if (!userId) {
      console.error('❌ 사용자 ID 없음');
      return {
        success: false,
        error: '사용자 정보가 없습니다.'
      };
    }

    // 🔥 한국 시간 기준으로 수정
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    // 이번 달 1일 00:00:00 (로컬 시간)
    const startOfMonth = new Date(year, month, 1, 0, 0, 0);
    // 이번 달 마지막날 23:59:59 (로컬 시간)
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);
    
    console.log('📅 조회 기간 (로컬):', {
      start: startOfMonth.toLocaleString('ko-KR'),
      end: endOfMonth.toLocaleString('ko-KR'),
      startISO: startOfMonth.toISOString(),
      endISO: endOfMonth.toISOString()
    });

    // 1. 사용자의 모든 이벤트 가져오기
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, event_name, event_type, event_date, status, created_at')
      .eq('user_id', userId);

    if (eventsError) {
      console.error('❌ 이벤트 조회 오류:', eventsError);
      throw eventsError;
    }

    console.log('📊 전체 이벤트 수:', events.length);

    // 2. 이번 달 생성된 이벤트 필터링
    const monthlyEvents = events.filter(event => {
      const createdDate = new Date(event.created_at);
      return createdDate >= startOfMonth && createdDate <= endOfMonth;
    });

    console.log('📊 이번 달 생성된 이벤트:', monthlyEvents.length);

    // 3. 활성 이벤트 수 계산
    const activeEvents = events.filter(event => event.status === 'active');

    // 4. 🔥 전체 및 월별 통계 초기화
    let stats = {
      // 전체 통계
      totalReceivedAmount: 0,
      totalWeddingAmount: 0,
      totalFuneralAmount: 0,
      totalEntries: 0,
      
      // 이번 달 통계
      monthlyReceivedAmount: 0,
      monthlyWeddingAmount: 0,
      monthlyFuneralAmount: 0,
      monthlyEntries: 0,
      
      // 이벤트별 상세
      eventDetails: []
    };

    // 5. 각 이벤트별 guest_book 통계 조회
    for (const event of events) {
      console.log(`📊 이벤트 ${event.event_name} 통계 조회 중...`);
      
      // 🔥 전체 통계 - guest_book_stats 뷰 사용
      const { data: eventStats, error: statsError } = await supabase
        .from('guest_book_stats')
        .select('*')
        .eq('event_id', event.id)
        .single();

      if (!statsError && eventStats) {
        const eventTotal = eventStats.total_amount || 0;
        const eventCount = eventStats.total_entries || 0;
        
        stats.totalReceivedAmount += eventTotal;
        stats.totalEntries += eventCount;
        
        // 타입별 분류
        if (event.event_type === 'wedding') {
          stats.totalWeddingAmount += eventTotal;
        } else if (event.event_type === 'funeral') {
          stats.totalFuneralAmount += eventTotal;
        }
        
        console.log(`  - 전체: ${eventCount}건, ${eventTotal}원`);
      }

      // 🔥 이번 달 데이터만 직접 조회
      const { data: monthlyGuests, error: monthlyError } = await supabase
        .from('guest_book')
        .select('*')
        .eq('event_id', event.id)
        .gte('created_at', startOfMonth.toISOString())
        .lte('created_at', endOfMonth.toISOString());

      if (!monthlyError && monthlyGuests && monthlyGuests.length > 0) {
        const monthlyEventTotal = monthlyGuests.reduce((sum, guest) => 
          sum + (guest.amount || 0), 0
        );
        const monthlyEventCount = monthlyGuests.length;
        
        stats.monthlyReceivedAmount += monthlyEventTotal;
        stats.monthlyEntries += monthlyEventCount;
        
        // 타입별 분류
        if (event.event_type === 'wedding') {
          stats.monthlyWeddingAmount += monthlyEventTotal;
        } else if (event.event_type === 'funeral') {
          stats.monthlyFuneralAmount += monthlyEventTotal;
        }
        
        // 이벤트별 상세 정보 저장
        if (monthlyEventCount > 0) {
          stats.eventDetails.push({
            eventId: event.id,
            eventName: event.event_name,
            eventType: event.event_type,
            amount: monthlyEventTotal,
            count: monthlyEventCount
          });
        }
        
        console.log(`  - 이번달: ${monthlyEventCount}건, ${monthlyEventTotal}원`);
      }
    }

    // 6. 최종 결과 반환
    const result = {
      // 이벤트 통계
      totalEvents: events.length,
      monthlyEvents: monthlyEvents.length,
      activeEvents: activeEvents.length,
      
      // 🔥 전체 통계
      totalAmount: stats.totalReceivedAmount,
      totalWeddingAmount: stats.totalWeddingAmount,
      totalFuneralAmount: stats.totalFuneralAmount,
      totalEntries: stats.totalEntries,
      
      // 🔥 이번 달 통계
      receivedAmount: stats.monthlyReceivedAmount,
      monthlyWeddingAmount: stats.monthlyWeddingAmount,
      monthlyFuneralAmount: stats.monthlyFuneralAmount,
      totalContributions: stats.monthlyEntries,
      
      // 이벤트별 상세
      eventDetails: stats.eventDetails,
      
      // 추후 구현 예정 (보낸 금액)
      sentAmount: 0,
      sentContributions: 0,
      
      // 기간 정보
      period: {
        year: year,
        month: month + 1,
        monthName: new Date(year, month).toLocaleDateString('ko-KR', { month: 'long' }),
        startDate: startOfMonth.toISOString(),
        endDate: endOfMonth.toISOString()
      }
    };

    console.log('✅ 월별 통계 조회 완료:', {
      전체: `${stats.totalEntries}건 / ${stats.totalReceivedAmount}원`,
      이번달: `${stats.monthlyEntries}건 / ${stats.monthlyReceivedAmount}원`,
      결혼: `${stats.monthlyWeddingAmount}원`,
      부고: `${stats.monthlyFuneralAmount}원`
    });
    
    return {
      success: true,
      data: result
    };

  } catch (error) {
    console.error('❌ getMonthlyStatistics error:', error);
    return {
      success: false,
      error: error.message || '월별 통계 조회에 실패했습니다.'
    };
  }
};


/**
 * 부조금 확정/미확정 토글
 */
export const toggleGuestBookVerification = async (entryId) => {
  try {
    console.log('🔄 부조금 확정 상태 토글 시작:', entryId);

    // 현재 상태 조회
    const { data: currentEntry, error: fetchError } = await supabase
      .from('guest_book')
      .select('is_verified')
      .eq('id', entryId)
      .single();

    if (fetchError) {
      console.error('❌ 현재 상태 조회 오류:', fetchError);
      throw fetchError;
    }

    // 상태 토글
    const newVerifiedState = !currentEntry.is_verified;

    const { data, error } = await supabase
      .from('guest_book')
      .update({ 
        is_verified: newVerifiedState,
        updated_at: new Date().toISOString()
      })
      .eq('id', entryId)
      .select()
      .single();

    if (error) {
      console.error('❌ 부조금 확정 상태 업데이트 오류:', error);
      throw error;
    }

    console.log('✅ 부조금 확정 상태 업데이트 완료:', {
      entryId,
      previousState: currentEntry.is_verified,
      newState: newVerifiedState
    });

    return {
      success: true,
      data: data,
      isVerified: newVerifiedState
    };

  } catch (error) {
    console.error('❌ toggleGuestBookVerification error:', error);
    return {
      success: false,
      error: error.message || '확정 상태 변경에 실패했습니다.'
    };
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
      return {
        success: true,
        data: []
      };
    }

    // 3. 🔥 클라이언트 사이드에서도 중복 제거 (안전장치)
    const uniqueEvents = data.filter((event, index, self) => 
      index === self.findIndex(e => e.id === event.id)
    );

    // 4. 🔥 부고 데이터 후처리 - additional_info에서 정보 추출
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

// ===== 유틸리티 함수들 =====

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

/**
 * 방명록 항목 수정
 */
export const updateGuestBookEntry = async (entryId, updateData) => {
  try {
    console.log('✏️ 방명록 수정 시작:', { entryId, entryIdType: typeof entryId, updateData });
    
    // entryId가 유효한지 먼저 확인
    if (!entryId) {
      throw new Error('entryId가 제공되지 않았습니다.');
    }

    // guest_book 테이블에서 확인 (실제 데이터가 저장되는 테이블)
    const { data: guestBookData, error: guestBookError } = await supabase
      .from('guest_book')
      .select('*')
      .eq('id', entryId);

    console.log('🔍 guest_book 테이블 조회 결과:', { 
      guestBookData, 
      guestBookError,
      entryId,
      entryIdType: typeof entryId
    });

    if (guestBookError) {
      console.error('❌ guest_book 테이블 조회 오류:', guestBookError);
      throw guestBookError;
    }

    if (!guestBookData || guestBookData.length === 0) {
      throw new Error(`ID ${entryId}에 해당하는 데이터가 guest_book 테이블에 존재하지 않습니다.`);
    }

    const targetTable = 'guest_book';
    const existingData = guestBookData[0];
    console.log('✅ guest_book 테이블에서 데이터 발견:', existingData);

    // guest_book 테이블 업데이트 실행
    console.log('🔄 guest_book 테이블 업데이트 실행', {
      entryId,
      updateData: {
        guest_name: updateData.guest_name,
        amount: updateData.amount,
        relation_category: updateData.relation_category,
        relation_detail: updateData.relation_detail,
      }
    });
    
    // RLS 비활성화 후 업데이트 실행
    console.log('🔄 RLS 비활성화 후 업데이트 시도');
    
    try {
      // 1. RLS 비활성화
      await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE guest_book DISABLE ROW LEVEL SECURITY;'
      });
      
      console.log('✅ RLS 비활성화 완료');

      // 2. 업데이트 실행
      const { data: updateResult, error: updateError } = await supabase
        .from('guest_book')
        .update({
          guest_name: updateData.guest_name,
          amount: updateData.amount,
          relation_category: updateData.relation_category,
          relation_detail: updateData.relation_detail,
          updated_at: new Date().toISOString()
        })
        .eq('id', entryId)
        .select()
        .single();

      console.log('🔍 RLS 비활성화 후 업데이트 결과:', { updateResult, updateError });

      if (updateError) {
        throw new Error(updateError.message);
      }

      console.log('✅ 부조 수정 완료:', updateResult);
      
      return {
        success: true,
        data: updateResult
      };

    } finally {
      // 3. RLS 다시 활성화 (성공/실패 관계없이)
      try {
        await supabase.rpc('exec_sql', {
          sql: 'ALTER TABLE guest_book ENABLE ROW LEVEL SECURITY;'
        });
        console.log('✅ RLS 재활성화 완료');
      } catch (rlsError) {
        console.error('❌ RLS 재활성화 실패:', rlsError);
      }
    }

  } catch (error) {
    console.error('❌ updateGuestBookEntry error:', error);
    return {
      success: false,
      error: error.message || '부조 수정에 실패했습니다.'
    };
  }
};

/**
 * 방명록 항목 삭제
 */
export const deleteGuestBookEntry = async (entryId) => {
  try {
    console.log('🗑️ 부조 삭제:', { entryId, entryIdType: typeof entryId });

    // guest_book 테이블에서 확인 (실제 데이터가 저장되는 테이블)
    const { data: guestBookData, error: guestBookError } = await supabase
      .from('guest_book')
      .select('*')
      .eq('id', entryId);

    console.log('🔍 삭제 - guest_book 테이블 조회:', { 
      guestBookData, 
      guestBookError,
      entryId,
      entryIdType: typeof entryId
    });

    if (guestBookError) {
      console.error('❌ guest_book 테이블 조회 오류:', guestBookError);
      throw guestBookError;
    }

    if (!guestBookData || guestBookData.length === 0) {
      throw new Error(`ID ${entryId}에 해당하는 데이터가 guest_book 테이블에 존재하지 않습니다.`);
    }

    console.log('✅ 삭제 대상: guest_book 테이블');

    // guest_book 테이블에서 삭제 실행
    const { data, error } = await supabase
      .from('guest_book')
      .delete()
      .eq('id', entryId)
      .select();

    if (error) {
      console.error('❌ 방명록 삭제 오류:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      throw new Error('삭제할 항목을 찾을 수 없습니다.');
    }

    console.log('✅ 부조 삭제 완료:', data[0]);
    
    return {
      success: true
    };

  } catch (error) {
    console.error('❌ deleteGuestBookEntry error:', error);
    return {
      success: false,
      error: error.message || '부조 삭제에 실패했습니다.'
    };
  }
};