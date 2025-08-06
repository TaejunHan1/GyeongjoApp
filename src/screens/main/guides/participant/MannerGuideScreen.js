// src/screens/main/guides/MannerGuideScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../styles/constants';

const { width } = Dimensions.get('window');

export default function MannerGuideScreen({ navigation }) {
  const [selectedTab, setSelectedTab] = useState('wedding');
  const [selectedGender, setSelectedGender] = useState('male');

  // 결혼식 복장 가이드
  const weddingDressCode = {
    male: {
      recommended: [
        { item: '정장 (다크 네이비, 차콜)', icon: '👔', tip: '밝은 색상은 피해주세요' },
        { item: '화이트/라이트 블루 셔츠', icon: '👕', tip: '깔끔하게 다림질된 셔츠' },
        { item: '넥타이 (실버, 골드, 파스텔)', icon: '👔', tip: '너무 화려하지 않게' },
        { item: '가죽 구두 (검은색, 갈색)', icon: '👞', tip: '광택이 나도록 관리' },
      ],
      avoid: [
        { item: '흰색 정장', reason: '신랑과 구분이 안됨' },
        { item: '빨간색 넥타이', reason: '너무 튀는 색상' },
        { item: '운동화, 샌들', reason: '격식에 맞지 않음' },
        { item: '짧은 바지', reason: '정식 행사에 부적절' },
      ]
    },
    female: {
      recommended: [
        { item: '원피스 (파스텔, 네이비)', icon: '👗', tip: '무릎 아래 길이가 적당' },
        { item: '블라우스 + 치마/바지', icon: '👚', tip: '깔끔한 조합' },
        { item: '미디힐 (3-5cm)', icon: '👠', tip: '너무 높지 않게' },
        { item: '가벼운 액세서리', icon: '💍', tip: '과하지 않게 포인트만' },
      ],
      avoid: [
        { item: '흰색, 아이보리 옷', reason: '신부와 구분이 안됨' },
        { item: '검은색 옷', reason: '경사스러운 날에 부적절' },
        { item: '너무 짧은 스커트', reason: '노출이 과함' },
        { item: '큰 꽃무늬', reason: '신부보다 화려함' },
      ]
    }
  };

  // 장례식 복장 가이드
  const funeralDressCode = {
    male: {
      recommended: [
        { item: '검은색 정장', icon: '🖤', tip: '가장 무난하고 적절함' },
        { item: '흰색 셔츠', icon: '👕', tip: '깔끔한 흰색만' },
        { item: '검은색 넥타이', icon: '🖤', tip: '무광 소재가 좋음' },
        { item: '검은색 구두', icon: '👞', tip: '광택이 없는 것이 좋음' },
      ],
      avoid: [
        { item: '밝은 색상 옷', reason: '분위기에 맞지 않음' },
        { item: '화려한 액세서리', reason: '조용한 분위기 저해' },
        { item: '캐주얼 복장', reason: '격식에 맞지 않음' },
        { item: '향수', reason: '강한 냄새는 삼가' },
      ]
    },
    female: {
      recommended: [
        { item: '검은색 원피스/정장', icon: '🖤', tip: '단정하고 깔끔하게' },
        { item: '검은색 스타킹', icon: '🦵', tip: '얇은 재질로' },
        { item: '낮은 힐 또는 플랫', icon: '👠', tip: '소리가 나지 않게' },
        { item: '간단한 액세서리', icon: '💍', tip: '진주 등 단순한 것' },
      ],
      avoid: [
        { item: '밝은 색상, 화려한 옷', reason: '분위기에 맞지 않음' },
        { item: '미니스커트, 노출 옷', reason: '예의에 어긋남' },
        { item: '큰 액세서리', reason: '소음 발생 우려' },
        { item: '진한 화장', reason: '차분한 화장이 좋음' },
      ]
    }
  };

  // 매너 가이드
  const mannerGuides = {
    wedding: [
      {
        category: '시간 매너',
        icon: '⏰',
        tips: [
          '식 시작 30분 전에 도착',
          '축의금은 접수처에서 전달',
          '식사 후 바로 떠나지 말고 잠시 대화',
          '뒤늦게 도착하면 조용히 뒷자리에',
        ]
      },
      {
        category: '사진 매너',
        icon: '📸',
        tips: [
          '플래시는 끄고 촬영',
          '신랑신부가 입장할 때는 통로 막지 않기',
          '식 진행 중에는 자리에서 일어나지 않기',
          '전문 촬영기사 방해하지 않기',
        ]
      },
      {
        category: '대화 매너',
        icon: '💬',
        tips: [
          '"축하합니다" 간단하고 진심 있게',
          '신랑신부에게 오래 붙잡고 있지 않기',
          '부모님께도 축하 인사',
          '개인적인 이야기는 피하기',
        ]
      },
    ],
    funeral: [
      {
        category: '조문 예절',
        icon: '🙏',
        tips: [
          '조용히 입장하여 분향',
          '"삼가 고인의 명복을 빕니다"',
          '상주에게 긴 위로보다 짧은 인사',
          '조의금은 조의금함에 넣거나 접수처에',
        ]
      },
      {
        category: '행동 매너',
        icon: '🤫',
        tips: [
          '휴대폰은 무음으로 설정',
          '큰 소리로 대화하지 않기',
          '오래 머물지 않기 (10-15분 정도)',
          '음식 권유받아도 정중히 거절',
        ]
      },
      {
        category: '금기 사항',
        icon: '❌',
        tips: [
          '고인의 사인에 대해 묻지 않기',
          '"힘내세요" 보다는 "함께하겠습니다"',
          '웃음소리나 떠들지 않기',
          '사진 촬영은 절대 금지',
        ]
      },
    ]
  };

  const renderDressGuide = () => {
    const currentGuide = selectedTab === 'wedding' ? weddingDressCode : funeralDressCode;
    const genderGuide = currentGuide[selectedGender];

    return (
      <View style={styles.dressSection}>
        {/* 성별 선택 */}
        <View style={styles.genderSelector}>
          <TouchableOpacity
            style={[styles.genderTab, selectedGender === 'male' && styles.genderTabActive]}
            onPress={() => setSelectedGender('male')}
          >
            <Text style={[styles.genderTabText, selectedGender === 'male' && styles.genderTabTextActive]}>
              남성
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.genderTab, selectedGender === 'female' && styles.genderTabActive]}
            onPress={() => setSelectedGender('female')}
          >
            <Text style={[styles.genderTabText, selectedGender === 'female' && styles.genderTabTextActive]}>
              여성
            </Text>
          </TouchableOpacity>
        </View>

        {/* 추천 복장 */}
        <View style={styles.dressCategory}>
          <Text style={styles.dressCategoryTitle}>✅ 이런 복장이 좋아요</Text>
          <View style={styles.dressItems}>
            {genderGuide.recommended.map((item, index) => (
              <View key={index} style={styles.dressItem}>
                <Text style={styles.dressIcon}>{item.icon}</Text>
                <View style={styles.dressContent}>
                  <Text style={styles.dressItemText}>{item.item}</Text>
                  <Text style={styles.dressItemTip}>{item.tip}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 피해야 할 복장 */}
        <View style={styles.dressCategory}>
          <Text style={styles.dressCategoryTitle}>❌ 이런 복장은 피해주세요</Text>
          <View style={styles.dressItems}>
            {genderGuide.avoid.map((item, index) => (
              <View key={index} style={[styles.dressItem, styles.avoidItem]}>
                <Text style={styles.avoidIcon}>🚫</Text>
                <View style={styles.dressContent}>
                  <Text style={styles.avoidItemText}>{item.item}</Text>
                  <Text style={styles.avoidItemReason}>{item.reason}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const renderMannerGuide = () => {
    const currentManner = mannerGuides[selectedTab];

    return (
      <View style={styles.mannerSection}>
        {currentManner.map((guide, index) => (
          <View key={index} style={styles.mannerCategory}>
            <View style={styles.mannerCategoryHeader}>
              <Text style={styles.mannerIcon}>{guide.icon}</Text>
              <Text style={styles.mannerCategoryTitle}>{guide.category}</Text>
            </View>
            <View style={styles.mannerTips}>
              {guide.tips.map((tip, tipIndex) => (
                <View key={tipIndex} style={styles.mannerTip}>
                  <View style={styles.tipBullet} />
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>복장 & 매너 가이드</Text>
          <Text style={styles.headerSubtitle}>
            경조사에 맞는 올바른 복장과 매너를 알아보세요
          </Text>
        </View>

        {/* 경조사 타입 탭 */}
        <View style={styles.eventTabs}>
          <TouchableOpacity
            style={[styles.eventTab, selectedTab === 'wedding' && styles.eventTabActive]}
            onPress={() => setSelectedTab('wedding')}
          >
            <Text style={styles.eventTabEmoji}>💒</Text>
            <Text style={[styles.eventTabText, selectedTab === 'wedding' && styles.eventTabTextActive]}>
              결혼식
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.eventTab, selectedTab === 'funeral' && styles.eventTabActive]}
            onPress={() => setSelectedTab('funeral')}
          >
            <Text style={styles.eventTabEmoji}>🕯️</Text>
            <Text style={[styles.eventTabText, selectedTab === 'funeral' && styles.eventTabTextActive]}>
              장례식
            </Text>
          </TouchableOpacity>
        </View>

        {/* 복장 가이드 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>복장 가이드</Text>
          {renderDressGuide()}
        </View>

        {/* 매너 가이드 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>매너 가이드</Text>
          {renderMannerGuide()}
        </View>

        {/* 계절별 팁 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>계절별 추가 팁</Text>
          <View style={styles.seasonTips}>
            <View style={styles.seasonTip}>
              <Text style={styles.seasonEmoji}>🌸</Text>
              <View style={styles.seasonContent}>
                <Text style={styles.seasonTitle}>봄/가을</Text>
                <Text style={styles.seasonText}>얇은 자켓이나 가디건 준비</Text>
              </View>
            </View>
            <View style={styles.seasonTip}>
              <Text style={styles.seasonEmoji}>☀️</Text>
              <View style={styles.seasonContent}>
                <Text style={styles.seasonTitle}>여름</Text>
                <Text style={styles.seasonText}>통풍이 잘 되는 소재, 선글라스 준비</Text>
              </View>
            </View>
            <View style={styles.seasonTip}>
              <Text style={styles.seasonEmoji}>❄️</Text>
              <View style={styles.seasonContent}>
                <Text style={styles.seasonTitle}>겨울</Text>
                <Text style={styles.seasonText}>따뜻한 코트, 실내용 신발 준비</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  
  // 헤더
  header: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // 이벤트 탭
  eventTabs: {
    flexDirection: 'row',
    backgroundColor: Colors.gray50,
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  eventTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  eventTabActive: {
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  eventTabEmoji: {
    fontSize: 16,
  },
  eventTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  eventTabTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  
  // 섹션
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  
  // 복장 가이드
  dressSection: {
    gap: 24,
  },
  genderSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.gray50,
    borderRadius: 8,
    padding: 2,
  },
  genderTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  genderTabActive: {
    backgroundColor: Colors.white,
  },
  genderTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  genderTabTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  
  dressCategory: {
    backgroundColor: Colors.gray50,
    borderRadius: 12,
    padding: 16,
  },
  dressCategoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  dressItems: {
    gap: 12,
  },
  dressItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 12,
  },
  avoidItem: {
    backgroundColor: '#FFF5F5',
  },
  dressIcon: {
    fontSize: 18,
    marginRight: 12,
    marginTop: 2,
  },
  avoidIcon: {
    fontSize: 16,
    marginRight: 12,
    marginTop: 2,
  },
  dressContent: {
    flex: 1,
  },
  dressItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  dressItemTip: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  avoidItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 2,
  },
  avoidItemReason: {
    fontSize: 12,
    color: '#DC2626',
    opacity: 0.7,
  },
  
  // 매너 가이드
  mannerSection: {
    gap: 20,
  },
  mannerCategory: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.gray100,
  },
  mannerCategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  mannerIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  mannerCategoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  mannerTips: {
    gap: 8,
  },
  mannerTip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipBullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary,
    marginTop: 8,
    marginRight: 12,
  },
  tipText: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  
  // 계절별 팁
  seasonTips: {
    gap: 12,
  },
  seasonTip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray50,
    borderRadius: 12,
    padding: 16,
  },
  seasonEmoji: {
    fontSize: 24,
    marginRight: 16,
  },
  seasonContent: {
    flex: 1,
  },
  seasonTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  seasonText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
});