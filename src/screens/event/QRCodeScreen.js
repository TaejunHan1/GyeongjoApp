// src/screens/event/QRCodeScreen.js - 웹 링크 기반 QR 코드 생성
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Share,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import Toast from 'react-native-toast-message';
import QRCode from 'react-native-qrcode-svg';
import { Colors } from '../../styles/constants';
import { getEventDetail } from '../../lib/supabaseHelper';
import { getContributionUrl } from '../../lib/webLinks';

const { width } = Dimensions.get('window');
const QR_SIZE = Math.min(width - 80, 300);

export default function QRCodeScreen({ navigation, route }) {
  const { eventId } = route.params;
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qrValue, setQrValue] = useState('');

  useEffect(() => {
    loadEventData();
  }, [eventId]);

  const loadEventData = async () => {
    try {
      setLoading(true);
      const result = await getEventDetail(eventId);
      
      if (result.success) {
        setEvent(result.data);
        
        // 웹 링크 생성 (QR 코드로 접근할 수 있는 공개 URL)
        const webUrl = getContributionUrl(result.data);
        setQrValue(webUrl);
        
        // 헤더 제목 업데이트
        navigation.setOptions({
          title: `${result.data.event_name} QR 코드`,
        });
      } else {
        Alert.alert('오류', result.error || '경조사 정보를 불러올 수 없습니다.');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Event loading error:', error);
      Alert.alert('오류', '경조사 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
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

  const handleCopyLink = async () => {
    try {
      await Clipboard.setStringAsync(qrValue);
      Toast.show({
        type: 'success',
        text1: '링크 복사 완료',
        text2: '부조 참여 링크가 클립보드에 복사되었습니다.',
        position: 'top',
        visibilityTime: 1800,
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: '복사 실패',
        text2: '링크 복사에 실패했습니다.',
        position: 'top',
      });
    }
  };

  const handlePrint = () => {
    Alert.alert('인쇄 안내', 'QR 코드를 스크린샷으로 저장한 후 인쇄해주세요.');
  };

  const handleDisplayMode = () => {
    navigation.navigate('EventDisplay', { eventId });
  };

  const getEventIcon = () => {
    if (!event) return 'calendar';
    switch (event.event_type) {
      case 'wedding': return 'heart';
      case 'funeral': return 'flower';
      case 'birthday': return 'gift';
      default: return 'calendar';
    }
  };

  const getEventColor = () => {
    if (!event) return Colors.primary;
    switch (event.event_type) {
      case 'wedding': return Colors.wedding;
      case 'funeral': return Colors.funeral;
      case 'birthday': return Colors.celebration;
      default: return Colors.other;
    }
  };

  const getEventTypeText = () => {
    if (!event) return '경조사';
    switch (event.event_type) {
      case 'wedding': return '결혼식';
      case 'funeral': return '부고';
      case 'birthday': return '돌잔치';
      default: return '기타 행사';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '날짜 미정';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="qr-code" size={48} color={Colors.gray400} />
          <Text style={styles.loadingText}>QR 코드 생성 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={Colors.error} />
          <Text style={styles.errorTitle}>경조사를 찾을 수 없습니다</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>돌아가기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 경조사 정보 헤더 */}
        <View style={styles.eventHeader}>
          <View style={[styles.eventIcon, { backgroundColor: getEventColor() }]}>
            <Ionicons name={getEventIcon()} size={32} color={Colors.white} />
          </View>
          <View style={styles.eventInfo}>
            <Text style={styles.eventType}>{getEventTypeText()}</Text>
            <Text style={styles.eventTitle}>{event.event_name}</Text>
            <Text style={styles.eventDate}>{formatDate(event.event_date)}</Text>
            <Text style={styles.eventHost}>주최: {event.main_person_name}</Text>
          </View>
        </View>

        {/* QR 코드 섹션 */}
        <View style={styles.qrSection}>
          <Text style={styles.qrTitle}>부조 참여 QR 코드</Text>
          <Text style={styles.qrSubtitle}>
            카메라로 스캔하면 바로 부조 페이지로 이동해요{'\n'}
            앱 설치 없이도 이용 가능합니다
          </Text>
          
          <View style={styles.qrContainer}>
            <View style={styles.qrBackground}>
              {qrValue ? (
                <QRCode
                  value={qrValue}
                  size={QR_SIZE}
                  color={Colors.textPrimary}
                  backgroundColor={Colors.white}
                  logo={null}
                  logoSize={30}
                  logoBackgroundColor={Colors.white}
                  logoMargin={2}
                  logoBorderRadius={15}
                  quietZone={10}
                />
              ) : (
                <View style={[styles.qrPlaceholder, { width: QR_SIZE, height: QR_SIZE }]}>
                  <Ionicons name="qr-code" size={64} color={Colors.gray400} />
                  <Text style={styles.qrPlaceholderText}>QR 코드 생성 중...</Text>
                </View>
              )}
            </View>
            
            {/* QR 코드 하단 정보 */}
            <View style={styles.qrInfo}>
              <Text style={styles.qrInfoTitle}>{event.event_name}</Text>
              <Text style={styles.qrInfoSubtitle}>카메라로 스캔하여 부조하기</Text>
              <Text style={styles.qrInfoUrl}>{qrValue}</Text>
            </View>
          </View>
        </View>

        {/* 사용 안내 */}
        <View style={styles.instructionsSection}>
          <Text style={styles.instructionsTitle}>사용 방법</Text>
          <View style={styles.instructionsList}>
            <View style={styles.instructionItem}>
              <View style={styles.instructionNumber}>
                <Text style={styles.instructionNumberText}>1</Text>
              </View>
              <Text style={styles.instructionText}>
                QR 코드를 행사장 입구나 잘 보이는 곳에 게시하세요
              </Text>
            </View>
            
            <View style={styles.instructionItem}>
              <View style={styles.instructionNumber}>
                <Text style={styles.instructionNumberText}>2</Text>
              </View>
              <Text style={styles.instructionText}>
                손님들이 휴대폰 카메라로 QR 코드를 스캔합니다
              </Text>
            </View>
            
            <View style={styles.instructionItem}>
              <View style={styles.instructionNumber}>
                <Text style={styles.instructionNumberText}>3</Text>
              </View>
              <Text style={styles.instructionText}>
                웹 페이지에서 이름과 부조금을 입력할 수 있어요
              </Text>
            </View>
            
            <View style={styles.instructionItem}>
              <View style={styles.instructionNumber}>
                <Text style={styles.instructionNumberText}>4</Text>
              </View>
              <Text style={styles.instructionText}>
                부조 내역이 실시간으로 앱에서 확인됩니다
              </Text>
            </View>
          </View>
        </View>

        {/* 링크 정보 */}
        <View style={styles.linkSection}>
          <Text style={styles.linkTitle}>부조 링크</Text>
          <TouchableOpacity style={styles.linkContainer} onPress={handleCopyLink}>
            <Text style={styles.linkText} numberOfLines={2}>
              {qrValue}
            </Text>
            <Ionicons name="copy" size={20} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.linkHelper}>
            터치하면 링크가 복사됩니다
          </Text>
        </View>

        {/* 추가 기능들 */}
        <View style={styles.featuresSection}>
          <Text style={styles.featuresTitle}>추가 기능</Text>
          
          <TouchableOpacity style={styles.featureItem} onPress={handleDisplayMode}>
            <View style={[styles.featureIcon, { backgroundColor: Colors.primary }]}>
              <Ionicons name="tv" size={20} color={Colors.white} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>전시 모드</Text>
              <Text style={styles.featureSubtitle}>
                태블릿이나 큰 화면에서 사진과 함께 표시
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.gray400} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.featureItem} onPress={handlePrint}>
            <View style={[styles.featureIcon, { backgroundColor: Colors.success }]}>
              <Ionicons name="print" size={20} color={Colors.white} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>QR 코드 저장</Text>
              <Text style={styles.featureSubtitle}>
                스크린샷으로 저장하여 포스터로 인쇄
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.gray400} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* 하단 액션 버튼들 */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.copyButton} onPress={handleCopyLink}>
          <Ionicons name="copy" size={20} color={Colors.primary} />
          <Text style={styles.copyButtonText}>링크 복사</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Ionicons name="share" size={20} color={Colors.white} />
          <Text style={styles.shareButtonText}>공유하기</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray50,
  },
  content: {
    flex: 1,
  },
  
  // 로딩 및 에러
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  
  // 경조사 헤더
  eventHeader: {
    backgroundColor: Colors.white,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  eventIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  eventInfo: {
    flex: 1,
  },
  eventType: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  eventHost: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  
  // QR 코드 섹션
  qrSection: {
    backgroundColor: Colors.white,
    padding: 24,
    alignItems: 'center',
    marginBottom: 12,
  },
  qrTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  qrSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  qrContainer: {
    alignItems: 'center',
  },
  qrBackground: {
    backgroundColor: Colors.white,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: 20,
  },
  qrPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.gray50,
    borderRadius: 8,
    gap: 8,
  },
  qrPlaceholderText: {
    fontSize: 14,
    color: Colors.gray400,
  },
  qrInfo: {
    alignItems: 'center',
  },
  qrInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  qrInfoSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  qrInfoUrl: {
    fontSize: 12,
    color: Colors.gray400,
    textAlign: 'center',
  },
  
  // 링크 섹션
  linkSection: {
    backgroundColor: Colors.white,
    padding: 24,
    marginBottom: 12,
  },
  linkTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray50,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.gray200,
    gap: 12,
  },
  linkText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  linkHelper: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  
  // 사용 안내
  instructionsSection: {
    backgroundColor: Colors.white,
    padding: 24,
    marginBottom: 12,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 20,
  },
  instructionsList: {
    gap: 16,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
  },
  instructionText: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  
  // 추가 기능
  featuresSection: {
    backgroundColor: Colors.white,
    padding: 24,
    marginBottom: 12,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: Colors.gray50,
    borderRadius: 12,
    marginBottom: 12,
    gap: 16,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  featureSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  
  // 액션 버튼
  actionButtons: {
    backgroundColor: Colors.white,
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
    flexDirection: 'row',
    gap: 12,
  },
  copyButton: {
    flex: 1,
    backgroundColor: Colors.gray50,
    height: 56,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  copyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  shareButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});
