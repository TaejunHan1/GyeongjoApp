import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../styles/constants';

const GUIDE_CARDS = [
  {
    id: 'wedding',
    title: '결혼식 준비',
    subtitle: '예식 전 체크리스트와 준비 흐름',
    icon: 'heart-outline',
    color: '#EC4899',
    bg: '#FDF2F8',
    screen: 'WeddingPrepGuide',
  },
  {
    id: 'funeral',
    title: '장례식 준비',
    subtitle: '장례 절차와 놓치기 쉬운 준비사항',
    icon: 'flower-outline',
    color: '#64748B',
    bg: '#F1F5F9',
    screen: 'FuneralPrepGuide',
  },
  {
    id: 'manner',
    title: '복장 가이드',
    subtitle: '결혼식·장례식 상황별 복장 기준',
    icon: 'shirt-outline',
    color: '#2563EB',
    bg: '#EFF6FF',
    screen: 'MannerGuide',
  },
  {
    id: 'etiquette',
    title: '예절·매너',
    subtitle: '참석 전 알아두면 좋은 기본 예절',
    icon: 'book-outline',
    color: '#0F766E',
    bg: '#ECFDF5',
    screen: 'EtiquetteGuide',
  },
];

const MONEY_GUIDE = [
  { label: '가까운 친구·친척', value: '10만-20만원' },
  { label: '직장 동료·지인', value: '5만-10만원' },
  { label: '가벼운 참석', value: '3만-5만원' },
  { label: '조문 기본', value: '5만-10만원' },
];

export default function GuestGuideScreen({ navigation }) {
  const goToAuth = () => {
    navigation.navigate('PhoneAuth', { isSignUp: false });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.75}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>가이드 먼저 보기</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name="book" size={30} color={Colors.primary} />
          </View>
          <Text style={styles.heroTitle}>경조사 기본 정보는{'\n'}바로 확인할 수 있어요</Text>
          <Text style={styles.heroSub}>
            행사를 준비하거나 참석하기 전에 필요한 가이드를 먼저 살펴보세요.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>상황별 가이드</Text>
          {GUIDE_CARDS.map((card) => (
            <TouchableOpacity
              key={card.id}
              style={styles.guideCard}
              onPress={() => navigation.navigate(card.screen)}
              activeOpacity={0.84}
            >
              <View style={[styles.cardIcon, { backgroundColor: card.bg }]}>
                <Ionicons name={card.icon} size={22} color={card.color} />
              </View>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>{card.title}</Text>
                <Text style={styles.cardSub}>{card.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.gray400} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>부조금 기본 기준</Text>
          <View style={styles.moneyBox}>
            {MONEY_GUIDE.map((item, index) => (
              <View
                key={item.label}
                style={[
                  styles.moneyRow,
                  index === MONEY_GUIDE.length - 1 && styles.moneyRowLast,
                ]}
              >
                <Text style={styles.moneyLabel}>{item.label}</Text>
                <Text style={styles.moneyValue}>{item.value}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.notice}>
            실제 금액은 관계, 지역, 참석 여부에 따라 달라질 수 있습니다.
          </Text>
        </View>

        <TouchableOpacity style={styles.cta} onPress={goToAuth} activeOpacity={0.86}>
          <Text style={styles.ctaText}>정담 시작하기</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 8 : 44,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 0,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 36,
  },
  hero: {
    paddingTop: 32,
    paddingBottom: 28,
  },
  heroIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    marginBottom: 18,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 38,
    color: Colors.textPrimary,
    letterSpacing: 0,
  },
  heroSub: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 23,
    color: Colors.textSecondary,
    fontWeight: '500',
    letterSpacing: 0,
  },
  section: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 12,
    letterSpacing: 0,
  },
  guideCard: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 76,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: Colors.gray50,
    marginBottom: 10,
  },
  cardIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },
  cardText: {
    flex: 1,
    paddingRight: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 0,
  },
  cardSub: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.textSecondary,
    fontWeight: '500',
    letterSpacing: 0,
  },
  moneyBox: {
    borderRadius: 16,
    backgroundColor: Colors.gray50,
    overflow: 'hidden',
  },
  moneyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  moneyRowLast: {
    borderBottomWidth: 0,
  },
  moneyLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 0,
  },
  moneyValue: {
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0,
  },
  notice: {
    marginTop: 10,
    fontSize: 12,
    lineHeight: 18,
    color: Colors.textSecondary,
    fontWeight: '500',
    letterSpacing: 0,
  },
  cta: {
    marginTop: 28,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 0,
  },
});
