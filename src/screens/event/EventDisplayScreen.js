// src/screens/event/EventDisplayScreen.js - 부조하기 버튼 QR코드 연결 및 메시지 기능
import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Modal,
  Share,
  Clipboard,
  ScrollView,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import QRCode from 'react-native-qrcode-svg';
import { Colors } from '../../styles/constants';
import { getEventDetail, getEventMessages, createEventMessage, updateEvent } from '../../lib/supabaseHelper';
import { supabase } from '../../lib/supabase';
import { syncEventToWeb } from '../../lib/webSync';
import WeddingTemplatePreview from './templates/WeddingTemplatePreview';
import FuneralTemplatePreview from './templates/FuneralTemplatePreview';
import { GlobalFallingEffect } from './templates/wedding/WeddingCommonComponents';
import { INTRO_OVERLAYS } from './wedding/WeddingIntroSelectModal';

const MUSIC_TRACKS = [
  { id: 'none', name: '음악 없음', emoji: '🔇', file: null },
  { id: 'track1', name: '웨딩 트레일러', emoji: '🎺', file: require('../../../assets/music/hitslab-wedding-wedding-trailer-music-269139.mp3') },
  { id: 'track2', name: '로맨틱 웨딩', emoji: '🌹', file: require('../../../assets/music/krasnoshchok-wedding-romantic-love-music-409293.mp3') },
  { id: 'track3', name: '웨딩 피아노 I', emoji: '🎹', file: require('../../../assets/music/paulyudin-wedding-485932.mp3') },
  { id: 'track4', name: '웨딩 피아노 II', emoji: '🎹', file: require('../../../assets/music/paulyudin-wedding-music-valentines-day-182505.mp3') },
  { id: 'track5', name: '웨딩 왈츠', emoji: '💃', file: require('../../../assets/music/prettyjohn1-wedding-487335.mp3') },
  { id: 'track6', name: '클래식 웨딩', emoji: '🎻', file: require('../../../assets/music/starostin-wedding-wedding-music-345462.mp3') },
  { id: 'track7', name: '마운틴 웨딩 I', emoji: '🏔️', file: require('../../../assets/music/the_mountain-wedding-455512.mp3') },
  { id: 'track8', name: '마운틴 웨딩 II', emoji: '🏔️', file: require('../../../assets/music/the_mountain-wedding-487025.mp3') },
  { id: 'track9', name: '벨벳 펀치', emoji: '🎷', file: require('../../../assets/music/The_Velvet_Punch.mp3') },
  { id: 'track10', name: '웨딩 조이', emoji: '🎊', file: require('../../../assets/music/u_3m10w313je-wedding-joy-189888.mp3') },
  { id: 'track11', name: '로맨틱 배경음악', emoji: '🎵', file: require('../../../assets/music/viacheslavstarostin-romantic-wedding-background-music-357203.mp3') },
];

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
  const [eventMessages, setEventMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [signedCategorizedImages, setSignedCategorizedImages] = useState(null);

  // 🎬 인트로 관련 state
  const [showIntro, setShowIntro] = useState(true);
  const [introKey, setIntroKey] = useState(0);

  // 🎵 음악 관련 state
  const [showMusicModal, setShowMusicModal] = useState(false);
  const [selectedMusicId, setSelectedMusicId] = useState('none');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [previewingId, setPreviewingId] = useState(null);
  const soundRef = useRef(null);
  const previewSoundRef = useRef(null);
  const progressIntervalRef = useRef(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;


  useEffect(() => {
    if (eventId === 'preview' && passedEventData) {
      setIsPreviewMode(true);
      setEvent(passedEventData);
      setLoading(false);
      // 미리보기: 저장된 음악 있으면 자동재생
      const savedMusic = passedEventData?.additional_info?.background_music;
      if (savedMusic?.id && savedMusic.id !== 'none') {
        setSelectedMusicId(savedMusic.id);
        setTimeout(() => playMusic(savedMusic.id), 1000);
      }
    } else {
      loadEventData();
      loadEventMessages();
    }

    startAnimations();

    const exitTimer = setTimeout(() => {
      setShowExitButton(true);
    }, 8000);

    return () => {
      clearTimeout(exitTimer);
      stopProgressTracking();
      stopAllSounds();
    };
  }, [eventId, passedEventData]);

  // 이벤트 로드 완료 후 저장된 음악 자동재생
  useEffect(() => {
    if (event && !isPreviewMode) {
      const savedMusic = event?.additional_info?.background_music;
      if (savedMusic?.id && savedMusic.id !== 'none') {
        setSelectedMusicId(savedMusic.id);
        setTimeout(() => playMusic(savedMusic.id), 1500);
      }
    }
  }, [event]);

  const startProgressTracking = () => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    progressIntervalRef.current = setInterval(async () => {
      if (!soundRef.current) return;
      try {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded && status.durationMillis > 0) {
          setPlaybackProgress(status.positionMillis / status.durationMillis);
        }
      } catch {}
    }, 500);
  };

  const stopProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  const stopAllSounds = async () => {
    stopProgressTracking();
    if (soundRef.current) {
      try { await soundRef.current.stopAsync(); await soundRef.current.unloadAsync(); } catch {}
      soundRef.current = null;
    }
    if (previewSoundRef.current) {
      try { await previewSoundRef.current.stopAsync(); await previewSoundRef.current.unloadAsync(); } catch {}
      previewSoundRef.current = null;
    }
    setIsPlaying(false);
    setPlaybackProgress(0);
    setPreviewingId(null);
  };

  const playMusic = async (trackId) => {
    const track = MUSIC_TRACKS.find(t => t.id === trackId);
    if (!track || !track.file) return;

    await stopAllSounds();

    try {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: false });
      const { sound } = await Audio.Sound.createAsync(track.file, { isLooping: true, volume: 0.6 });
      soundRef.current = sound;
      await sound.playAsync();
      setIsPlaying(true);
      setSelectedMusicId(trackId);
      startProgressTracking();
    } catch (e) {
      console.warn('음악 재생 오류:', e);
    }
  };

  const togglePlayPause = async () => {
    if (!soundRef.current) {
      if (selectedMusicId && selectedMusicId !== 'none') {
        await playMusic(selectedMusicId);
      }
      return;
    }
    if (isPlaying) {
      await soundRef.current.pauseAsync();
      setIsPlaying(false);
      stopProgressTracking();
    } else {
      await soundRef.current.playAsync();
      setIsPlaying(true);
      startProgressTracking();
    }
  };

  const previewTrack = async (trackId) => {
    const track = MUSIC_TRACKS.find(t => t.id === trackId);
    if (!track || !track.file) return;

    if (previewingId === trackId) {
      // 같은 트랙 미리듣기 중이면 정지
      if (previewSoundRef.current) {
        try { await previewSoundRef.current.stopAsync(); await previewSoundRef.current.unloadAsync(); } catch {}
        previewSoundRef.current = null;
      }
      setPreviewingId(null);
      return;
    }

    if (previewSoundRef.current) {
      try { await previewSoundRef.current.stopAsync(); await previewSoundRef.current.unloadAsync(); } catch {}
      previewSoundRef.current = null;
    }

    try {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: false });
      const { sound } = await Audio.Sound.createAsync(track.file, { volume: 0.8 });
      previewSoundRef.current = sound;
      await sound.playAsync();
      setPreviewingId(trackId);
      // 10초 후 자동 정지
      setTimeout(async () => {
        if (previewSoundRef.current) {
          try { await previewSoundRef.current.stopAsync(); await previewSoundRef.current.unloadAsync(); } catch {}
          previewSoundRef.current = null;
        }
        setPreviewingId(null);
      }, 10000);
    } catch (e) {
      console.warn('미리듣기 오류:', e);
    }
  };

  const handleSelectMusic = async (trackId) => {
    // 기존 미리듣기 정지
    if (previewSoundRef.current) {
      try { await previewSoundRef.current.stopAsync(); await previewSoundRef.current.unloadAsync(); } catch {}
      previewSoundRef.current = null;
      setPreviewingId(null);
    }

    setSelectedMusicId(trackId);

    if (trackId === 'none') {
      await stopAllSounds();
    } else {
      await playMusic(trackId);
    }

    // DB 저장 (비미리보기 모드)
    if (!isPreviewMode && eventId && eventId !== 'preview') {
      try {
        const track = MUSIC_TRACKS.find(t => t.id === trackId);
        const currentAdditionalInfo = event?.additional_info || {};
        await updateEvent(eventId, {
          additional_info: {
            ...currentAdditionalInfo,
            background_music: trackId === 'none' ? null : { id: trackId, name: track?.name },
          }
        });
      } catch (e) {
        console.warn('음악 저장 오류:', e);
      }
    }

    setShowMusicModal(false);
  };

  const loadEventData = async () => {
    try {
      setLoading(true);
      const result = await getEventDetail(eventId);
      
      if (result.success) {
        setEvent(result.data);

        // Supabase URL → base64 변환 (React Native Image가 직접 못 불러오는 문제 해결)
        const rawCI = result.data?.additional_info?.categorized_images;
        if (rawCI) {
          convertToBase64Uris(rawCI).then(converted => {
            setSignedCategorizedImages(converted);
          }).catch(() => {});
        }

        // 웹 데이터베이스에 동기화 (백그라운드에서 실행)
        syncEventToWeb(result.data).catch((err) => {
          console.log('⚠️ 웹 동기화 실패 (무시됨):', err?.message);
        });
      } else {
        Alert.alert('오류', '경조사를 불러올 수 없습니다.');
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('오류', '경조사를 불러오는 중 문제가 발생했습니다.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  // Supabase Storage URL → FileSystem 다운로드 → base64 data URI 변환
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mc2hxdnJsZGNlc3ZqdHJlZHhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNDI1MTQsImV4cCI6MjA2NDYxODUxNH0.uIfuqMP7SFvQfQXSESS9xKHWlBYeWmZwf1j_4eveZ6Q';

  const fetchImageAsBase64 = async (url) => {
    try {
      const fileName = `img_${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
      const tempPath = `${FileSystem.cacheDirectory}${fileName}`;

      const downloadResult = await FileSystem.downloadAsync(url, tempPath, {
        headers: { 'apikey': SUPABASE_ANON_KEY },
      });

      if (downloadResult.status !== 200) {
        await FileSystem.deleteAsync(tempPath, { idempotent: true });
        return null;
      }

      const base64 = await FileSystem.readAsStringAsync(downloadResult.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      await FileSystem.deleteAsync(downloadResult.uri, { idempotent: true });

      if (!base64) return null;
      return `data:image/jpeg;base64,${base64}`;
    } catch (e) {
      return null;
    }
  };

  const convertToBase64Uris = async (ci) => {
    if (!ci || typeof ci !== 'object') return ci;
    const result = {};
    for (const key of Object.keys(ci)) {
      if (!Array.isArray(ci[key])) { result[key] = ci[key]; continue; }
      result[key] = await Promise.all(ci[key].map(async (img) => {
        if (!img || typeof img !== 'object') return img;
        const isLocal = img.uri && (img.uri.startsWith('file://') || img.uri.startsWith('ph://') || img.uri.startsWith('data:'));
        if (isLocal) return img;
        const supabaseUrl = img.publicUrl || img.uri;
        if (!supabaseUrl || !supabaseUrl.startsWith('http')) return img;
        const base64 = await fetchImageAsBase64(supabaseUrl);
        if (!base64) return img;
        return { ...img, uri: base64 };
      }));
    }
    return result;
  };

  // 🔥 메시지 로드 함수 추가
  const loadEventMessages = async () => {
    if (!eventId || eventId === 'preview') return;
    
    try {
      setLoadingMessages(true);
      
      const result = await getEventMessages(eventId);
      
      if (result.success) {
        setEventMessages(result.data || []);
      } else {
        setEventMessages([]);
      }
    } catch (error) {
      console.error('❌ 메시지 로드 예외:', error);
      setEventMessages([]);
    } finally {
      setLoadingMessages(false);
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
      return {
        ...passedEventData,
        id: eventId,
        event_id: eventId,
        guestMessages: eventMessages
      };
    }

    if (event) {
      const eventType = event.event_type;
      
      if (eventType === 'funeral') {
        const funeralData = {
          id: event.id || eventId, // 🔥 이벤트 ID 추가
          event_id: event.id || eventId, // 🔥 이벤트 ID 추가
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
          guestMessages: eventMessages // 🔥 메시지 추가
        };

        if (event.additional_info) {
          Object.assign(funeralData, event.additional_info);
        }

        return funeralData;
      } else {
        const weddingData = {
          id: event.id || eventId,
          event_id: event.id || eventId,
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
          guestMessages: eventMessages,
          additional_info: event.additional_info
        };

        return weddingData;
      }
    }

    return {
      id: eventId, // 🔥 이벤트 ID 추가
      event_id: eventId, // 🔥 이벤트 ID 추가
      guestMessages: eventMessages // 🔥 기본값에도 메시지 추가
    };
  };

  const getFinalCategorizedImages = () => {
    // Signed URL로 변환된 이미지가 있으면 우선 사용
    if (signedCategorizedImages) return signedCategorizedImages;

    // 실제 이미지가 있는지 확인하는 헬퍼
    const hasImages = (ci) => ci && typeof ci === 'object' &&
      ['main','gallery','groom','bride','all'].some(k => Array.isArray(ci[k]) && ci[k].length > 0);

    if (hasImages(categorizedImages)) {
      return categorizedImages;
    }

    if (event) {
      if (hasImages(event.additional_info?.categorized_images)) {
        return event.additional_info.categorized_images;
      }

      if (event.image_urls && event.image_urls.length > 0) {
        // uri 또는 publicUrl을 실제 URL로 변환
        const normalizedImages = event.image_urls.map(img => {
          if (typeof img === 'string') {
            return { uri: img, category: 'all' };
          }
          return {
            uri: img.publicUrl || img.uri || img,
            category: img.category || 'all'
          };
        });
        
        const processedImages = {
          main: normalizedImages.filter(img => img.category === 'main'),
          gallery: normalizedImages.filter(img => img.category === 'gallery'),
          groom: normalizedImages.filter(img => img.category === 'groom'),
          bride: normalizedImages.filter(img => img.category === 'bride'),
          all: normalizedImages
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

  // 🔥 부조하기 버튼 핸들러 - QR코드 모달 표시
  const handleContribute = () => {
    if (isPreviewMode) {
      Alert.alert('알림', '미리보기 모드입니다. 실제 부조는 완성된 경조사에서 가능합니다.');
      return;
    }
    
    // QR코드 모달 표시
    setShowQRModal(true);
  };

  // 🔥 QR 코드 관련 함수들
  const getQRValue = () => {
    if (!event) return '';
    const WEB_BASE_URL = __DEV__
      ? 'http://192.168.219.46:3000'
      : 'https://contribution-web-srgt.vercel.app';
    const templateStyle = getFinalTemplateStyle();
    return `${WEB_BASE_URL}/template/${event.id}?template=${templateStyle}`;
  };

  const handleQRShare = async () => {
    try {
      const qrValue = getQRValue();
      const shareContent = {
        message: `${event?.event_name} 부조하기\n\n아래 링크를 클릭하거나 QR 코드를 스캔해서 간편하게 부조하세요!\n\n${qrValue}`,
        title: `${event?.event_name} 부조하기`,
        url: qrValue,
      };
      
      await Share.share(shareContent);
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleQRCopyLink = async () => {
    try {
      const qrValue = getQRValue();
      await Clipboard.setString(qrValue);
      Alert.alert('복사 완료', '링크가 클립보드에 복사되었습니다.');
    } catch (error) {
      Alert.alert('오류', '링크 복사에 실패했습니다.');
    }
  };

  // 🔥 메시지 제출 핸들러 수정 - 실제 DB 저장
  const handleMessageSubmit = async (messageData) => {
;
    
    if (isPreviewMode) {
      Alert.alert('알림', '미리보기 모드에서는 메시지를 저장할 수 없습니다.');
      return;
    }
    
    try {
      // DB에 메시지 저장
      const result = await createEventMessage(eventId || event.id, {
        sender_name: messageData.name || '익명',
        sender_phone: messageData.phone || '',
        message: messageData.message,
        message_type: getEventType() === 'funeral' ? 'condolence' : 'congratulation',
        is_anonymous: messageData.isAnonymous || false
      });
      
      if (result.success) {
        Alert.alert('감사합니다', '메시지가 전달되었습니다.');
        
        // 메시지 목록 새로고침
        await loadEventMessages();
      } else {
        Alert.alert('오류', '메시지 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('❌ 메시지 저장 오류:', error);
      Alert.alert('오류', '메시지 저장 중 문제가 발생했습니다.');
    }
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

  const petalEffect = event?.additional_info?.background_petal || null;
  const introEffect   = event?.additional_info?.intro_effect || null;
  const introEffectId = introEffect?.id || null;
  const introTapToOpen = introEffect?.tapToOpen || false;
  const IntroOverlay = introEffectId ? INTRO_OVERLAYS[introEffectId] : null;

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
            loadingMessages={loadingMessages}
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
            loadingMessages={loadingMessages}
            isPlaying={isPlaying}
            onTogglePlay={togglePlayPause}
            playbackProgress={playbackProgress}
          />
        )}
      </Animated.View>
      
      {/* 🎬 인트로 오버레이 */}
      {showIntro && IntroOverlay && (
        <IntroOverlay
          key={introKey}
          containerW={Dimensions.get('window').width}
          containerH={Dimensions.get('window').height}
          tapToOpen={introTapToOpen}
          coupleNames={event?.groom_name && event?.bride_name ? `${event.groom_name} · ${event.bride_name}` : undefined}
          onEnd={() => setShowIntro(false)}
        />
      )}

      {/* 🌸 꽃잎 효과 — 인트로(zIndex:10) 위에 렌더 */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }} pointerEvents="none">
        <GlobalFallingEffect
          type={petalEffect?.id || petalEffect}
          speed={petalEffect?.speed}
          qty={petalEffect?.qty}
          color={petalEffect?.color}
        />
      </View>

      {/* 🎵 음악 플로팅 버튼 */}
      <TouchableOpacity
        style={[styles.musicFloatingButton, isPlaying && styles.musicFloatingButtonActive]}
        onPress={togglePlayPause}
      >
        <Ionicons name={isPlaying ? 'musical-notes' : 'musical-note'} size={20} color={Colors.white} />
      </TouchableOpacity>

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
      
      {/* 🔥 QR 코드 모달 */}
      <Modal
        visible={showQRModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowQRModal(false)}
      >
        <View style={styles.qrModalContainer}>
          <View style={styles.qrModalContent}>
            {/* 모달 헤더 */}
            <View style={styles.qrModalHeader}>
              <Text style={styles.qrModalTitle}>부조 참여 QR</Text>
              <TouchableOpacity 
                style={styles.qrModalCloseButton}
                onPress={() => setShowQRModal(false)}
              >
                <Ionicons name="close" size={24} color={Colors.gray400} />
              </TouchableOpacity>
            </View>
            
            {/* 이벤트 정보 */}
            <View style={styles.qrEventInfo}>
              <Ionicons 
                name={getEventType() === 'funeral' ? 'flower' : 'heart'} 
                size={20} 
                color={getEventType() === 'funeral' ? Colors.gray600 : Colors.primary} 
              />
              <Text style={styles.qrEventName}>
                {event?.event_name || '경조사'}
              </Text>
            </View>
            
            {/* QR 코드 */}
            <View style={styles.qrCodeContainer}>
              <QRCode
                value={getQRValue()}
                size={Math.min(width - 180, 180)}
                backgroundColor="white"
                color="black"
                logo={undefined}
              />
            </View>
            
            {/* 안내 텍스트 */}
            <Text style={styles.qrInstructionText}>
              QR 코드를 스캔하거나 링크를 공유하여{'\n'}
              손님들이 간편하게 부조할 수 있습니다
            </Text>
            
            {/* 액션 버튼들 */}
            <View style={styles.qrActionButtons}>
              <TouchableOpacity 
                style={styles.qrActionButton}
                onPress={handleQRCopyLink}
              >
                <Ionicons name="copy" size={20} color={Colors.primary} />
                <Text style={styles.qrActionButtonText}>링크 복사</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.qrActionButton}
                onPress={handleQRShare}
              >
                <Ionicons name="share" size={20} color={Colors.primary} />
                <Text style={styles.qrActionButtonText}>공유하기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {(showExitButton || isPreviewMode) && (
        <TouchableOpacity
          style={styles.exitButton}
          onPress={() => {
            if (isPreviewMode) {
              navigation.goBack();
            } else {
              navigation.navigate('MainTabs', { screen: 'Home' });
            }
          }}
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
  
  // 🎵 음악 플로팅 버튼
  musicFloatingButton: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
    zIndex: 1000,
  },
  musicFloatingButtonActive: {
    backgroundColor: Colors.primary,
  },

  // 🎵 음악 모달
  musicModalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  musicModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: height * 0.8,
  },
  musicModalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  musicModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: 8,
  },
  musicModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  musicCurrentPlaying: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f0f4ff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  musicCurrentLabel: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  musicCurrentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  musicPlayPauseBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  musicPlayPauseBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  musicTrackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  musicTrackItemSelected: {
    backgroundColor: '#f0f4ff',
    borderRadius: 10,
    paddingHorizontal: 10,
    marginHorizontal: -6,
  },
  musicTrackEmoji: {
    fontSize: 22,
    width: 32,
    textAlign: 'center',
  },
  musicTrackName: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  musicTrackNameSelected: {
    fontWeight: '700',
    color: Colors.primary,
  },
  previewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  previewBtnText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
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
  
  // 🔥 QR 코드 모달 스타일
  qrModalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  qrModalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    paddingHorizontal: 24,
    paddingBottom: 40,
    maxHeight: height * 0.85,
  },
  qrModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
    marginBottom: 20,
  },
  qrModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  qrModalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.gray50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrEventInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 30,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.gray50,
    borderRadius: 12,
  },
  qrEventName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  qrCodeContainer: {
    alignItems: 'center',
    marginBottom: 30,
    paddingVertical: 24,
    backgroundColor: Colors.white,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  qrInstructionText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
    paddingHorizontal: 16,
  },
  qrActionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  qrActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: Colors.gray50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  qrActionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
});