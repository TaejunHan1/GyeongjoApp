// src/screens/main/ProfileScreen.js
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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../styles/constants';
import { supabase } from '../../lib/supabase';

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // 현재 사용자 정보 가져오기
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('User data error:', userError);
        return;
      }

      setUser(user);

      // 사용자 프로필 정보 가져오기
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Profile data error:', profileError);
      } else if (profileData) {
        setProfile(profileData);
      }

    } catch (error) {
      console.error('Load user data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃하시겠어요?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '로그아웃',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.auth.signOut();
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('오류', '로그아웃 중 오류가 발생했습니다.');
            }
          },
        },
      ]
    );
  };

  const handleShareApp = async () => {
    try {
      await Share.share({
        message: '정담 - 마음을 나누는 가장 쉬운 방법\n경조사 관리를 쉽고 체계적으로 해보세요!',
        title: '정담 앱 공유',
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const showComingSoon = (feature) => {
    Alert.alert('준비중', `${feature} 기능을 준비 중입니다.`);
  };

  const userName = profile?.name || user?.user_metadata?.name || '사용자';
  const userPhone = profile?.phone || user?.phone?.replace('+82', '0') || user?.email;
  const userCarrier = profile?.carrier || '미설정';
  const joinDate = user?.created_at ? new Date(user.created_at).toLocaleDateString('ko-KR') : '알 수 없음';

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="person-circle" size={64} color={Colors.gray300} />
          <Text style={styles.loadingText}>프로필을 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>프로필</Text>
        <TouchableOpacity onPress={() => showComingSoon('설정')}>
          <Ionicons name="settings-outline" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 사용자 정보 카드 */}
        <View style={styles.userCard}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={32} color={Colors.primary} />
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{userName}</Text>
              <Text style={styles.userContact}>{userPhone}</Text>
              <Text style={styles.userMeta}>
                {userCarrier} • {joinDate} 가입
              </Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => showComingSoon('프로필 편집')}
          >
            <Text style={styles.editButtonText}>편집</Text>
          </TouchableOpacity>
        </View>

        {/* 활동 통계 */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>나의 활동</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>총 경조사</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>0원</Text>
              <Text style={styles.statLabel}>총 부조금</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>0명</Text>
              <Text style={styles.statLabel}>총 참석자</Text>
            </View>
          </View>
        </View>

        {/* 메뉴 섹션 */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>관리</Text>
          
          <MenuItem
            icon="heart-outline"
            title="내 경조사"
            subtitle="등록한 경조사 관리"
            onPress={() => navigation.navigate('MyEvents')}
          />
          
          <MenuItem
            icon="receipt-outline"
            title="부조 기록"
            subtitle="축의금, 조의금 내역"
            onPress={() => showComingSoon('부조 기록')}
          />
          
          <MenuItem
            icon="notifications-outline"
            title="알림 설정"
            subtitle="기일 알림, 푸시 알림"
            onPress={() => showComingSoon('알림 설정')}
          />
          
          <MenuItem
            icon="bar-chart-outline"
            title="통계 보기"
            subtitle="연도별 부조 현황"
            onPress={() => showComingSoon('통계 보기')}
          />
        </View>

        {/* 도구 섹션 */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>도구</Text>
          
          <MenuItem
            icon="qr-code-outline"
            title="QR 코드"
            subtitle="경조사 참석용 QR 생성"
            onPress={() => showComingSoon('QR 코드')}
          />
          
          <MenuItem
            icon="download-outline"
            title="데이터 내보내기"
            subtitle="Excel, PDF로 내보내기"
            onPress={() => showComingSoon('데이터 내보내기')}
          />
          
          <MenuItem
            icon="cloud-upload-outline"
            title="백업 및 복원"
            subtitle="데이터 백업 관리"
            onPress={() => showComingSoon('백업 및 복원')}
          />
        </View>

        {/* 기타 섹션 */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>기타</Text>
          
          <MenuItem
            icon="share-outline"
            title="앱 공유하기"
            subtitle="친구에게 정담 추천"
            onPress={handleShareApp}
          />
          
          <MenuItem
            icon="help-circle-outline"
            title="도움말"
            subtitle="사용법, FAQ"
            onPress={() => showComingSoon('도움말')}
          />
          
          <MenuItem
            icon="document-text-outline"
            title="약관 및 정책"
            subtitle="이용약관, 개인정보처리방침"
            onPress={() => showComingSoon('약관 및 정책')}
          />
          
          <MenuItem
            icon="mail-outline"
            title="문의하기"
            subtitle="건의사항, 버그 신고"
            onPress={() => showComingSoon('문의하기')}
          />
        </View>

        {/* 계정 관리 */}
        <View style={styles.accountSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color={Colors.error} />
            <Text style={styles.logoutText}>로그아웃</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.deleteButton} 
            onPress={() => showComingSoon('계정 삭제')}
          >
            <Text style={styles.deleteText}>계정 삭제</Text>
          </TouchableOpacity>
        </View>

        {/* 앱 정보 */}
        <View style={styles.appInfo}>
          <Text style={styles.appVersion}>정담 v1.0.0</Text>
          <Text style={styles.copyright}>© 2024 정담. All rights reserved.</Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// 메뉴 아이템 컴포넌트
const MenuItem = ({ icon, title, subtitle, onPress, showChevron = true }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={styles.menuIcon}>
      <Ionicons name={icon} size={20} color={Colors.primary} />
    </View>
    <View style={styles.menuContent}>
      <Text style={styles.menuTitle}>{title}</Text>
      <Text style={styles.menuSubtitle}>{subtitle}</Text>
    </View>
    {showChevron && (
      <Ionicons name="chevron-forward" size={16} color={Colors.gray400} />
    )}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray50,
  },
  
  // 헤더
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  
  // 콘텐츠
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  
  // 사용자 카드
  userCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.gray50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  userContact: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  userMeta: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  editButton: {
    backgroundColor: Colors.gray100,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  
  // 통계 카드
  statsCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  
  // 메뉴 섹션
  menuSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
    paddingLeft: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  
  // 계정 관리
  accountSection: {
    marginBottom: 32,
    gap: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.error,
  },
  deleteButton: {
    alignItems: 'center',
    padding: 12,
  },
  deleteText: {
    fontSize: 14,
    color: Colors.gray400,
    textDecorationLine: 'underline',
  },
  
  // 앱 정보
  appInfo: {
    alignItems: 'center',
    marginBottom: 40,
    gap: 4,
  },
  appVersion: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  copyright: {
    fontSize: 12,
    color: Colors.gray400,
  },
  
  // 로딩
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
});