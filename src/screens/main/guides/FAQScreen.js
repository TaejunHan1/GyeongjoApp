// src/screens/main/guides/FAQScreen.js
// 통합 FAQ 화면 — role 파라미터로 주최자/참여자 분기
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '../../../styles/constants';
import {
  HOST_FAQS,
  PARTICIPANT_FAQS,
  HOST_CATEGORIES,
  PARTICIPANT_CATEGORIES,
  shuffleFaqs,
} from './faqData';

const DISPLAY_COUNT = 15;

export default function FAQScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  // host | participant (기본값: host)
  const role = route?.params?.role === 'participant' ? 'participant' : 'host';
  const isHost = role === 'host';

  const allFaqs = isHost ? HOST_FAQS : PARTICIPANT_FAQS;
  const categories = isHost ? HOST_CATEGORIES : PARTICIPANT_CATEGORIES;

  const [expandedItems, setExpandedItems] = useState(new Set());
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [displayedFAQ, setDisplayedFAQ] = useState([]);

  useFocusEffect(
    React.useCallback(() => {
      setDisplayedFAQ(shuffleFaqs(allFaqs).slice(0, DISPLAY_COUNT));
      setExpandedItems(new Set());
    }, [role])
  );

  const filteredFAQ =
    selectedCategory === 'all'
      ? displayedFAQ
      : displayedFAQ.filter((item) => item.category === selectedCategory);

  const toggleItem = (id) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleRefresh = () => {
    setDisplayedFAQ(shuffleFaqs(allFaqs).slice(0, DISPLAY_COUNT));
    setExpandedItems(new Set());
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />

      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{isHost ? '주최자 FAQ' : '참여자 FAQ'}</Text>
          <Text style={styles.headerSubtitle}>
            {isHost ? '행사 준비 중 자주 묻는 질문들' : '하객·조문객이 궁금해하는 질문들'}
          </Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Ionicons name="refresh" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* 카테고리 탭 */}
      <View style={styles.categoryContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {categories.map((category) => {
            const active = selectedCategory === category.id;
            return (
              <TouchableOpacity
                key={category.id}
                style={[styles.categoryTab, active && styles.categoryTabActive]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Ionicons
                  name={category.icon}
                  size={18}
                  color={active ? Colors.white : Colors.textSecondary}
                />
                <Text style={[styles.categoryText, active && styles.categoryTextActive]}>
                  {category.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* FAQ 리스트 */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.faqContainer}>
          {/* 인기 질문 */}
          {selectedCategory === 'all' && displayedFAQ.filter((i) => i.popular).length > 0 && (
            <View style={styles.popularSection}>
              <Text style={styles.sectionTitle}>🔥 인기 질문</Text>
              {displayedFAQ
                .filter((i) => i.popular)
                .map((item) => {
                  const key = `popular-${item.id}`;
                  const expanded = expandedItems.has(key);
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[styles.faqItem, styles.popularItem]}
                      onPress={() => toggleItem(key)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.faqHeader}>
                        <View style={styles.faqIconContainer}>
                          <Ionicons name="flame" size={18} color={Colors.orange || '#FF6B35'} />
                        </View>
                        <Text style={styles.faqQuestion}>{item.question}</Text>
                        <Ionicons
                          name={expanded ? 'chevron-up' : 'chevron-down'}
                          size={20}
                          color={Colors.textSecondary}
                        />
                      </View>
                      {expanded && (
                        <View style={styles.faqAnswer}>
                          <Text style={styles.faqAnswerText}>{item.answer}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
            </View>
          )}

          {/* 전체 / 카테고리 */}
          <View style={styles.allSection}>
            <Text style={styles.sectionTitle}>
              {selectedCategory === 'all'
                ? '전체 질문'
                : `${categories.find((c) => c.id === selectedCategory)?.title || ''} 질문`}
            </Text>
            {filteredFAQ.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>해당 카테고리 질문이 없어요</Text>
              </View>
            ) : (
              filteredFAQ.map((item) => {
                const expanded = expandedItems.has(item.id);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.faqItem}
                    onPress={() => toggleItem(item.id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.faqHeader}>
                      <Text style={styles.faqQuestion}>{item.question}</Text>
                      <Ionicons
                        name={expanded ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color={Colors.textSecondary}
                      />
                    </View>
                    {expanded && (
                      <View style={styles.faqAnswer}>
                        <Text style={styles.faqAnswerText}>{item.answer}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </View>
        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },

  header: {
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: { marginRight: 8, padding: 4 },
  headerContent: { flex: 1, alignItems: 'center' },
  refreshButton: { padding: 8, borderRadius: 20, backgroundColor: Colors.gray50 },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  headerSubtitle: { fontSize: 12, color: Colors.textSecondary },

  categoryContainer: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  categoryScroll: { paddingHorizontal: 16, paddingVertical: 14, gap: 8 },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.gray50,
    gap: 6,
  },
  categoryTabActive: { backgroundColor: Colors.primary },
  categoryText: { fontSize: 13, fontWeight: '500', color: Colors.textSecondary },
  categoryTextActive: { color: Colors.white },

  content: { flex: 1 },
  faqContainer: { paddingHorizontal: 16 },

  popularSection: { marginTop: 20, marginBottom: 24 },
  allSection: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
  },

  faqItem: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.gray100,
    overflow: 'hidden',
  },
  popularItem: {
    borderColor: (Colors.orange || '#FF6B35') + '30',
    backgroundColor: (Colors.orange || '#FF6B35') + '06',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
  },
  faqIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: (Colors.orange || '#FF6B35') + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  faqQuestion: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  faqAnswer: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
    backgroundColor: Colors.gray50,
  },
  faqAnswerText: {
    fontSize: 13,
    lineHeight: 21,
    color: Colors.gray700,
    marginTop: 10,
  },

  emptyWrap: { padding: 30, alignItems: 'center' },
  emptyText: { fontSize: 13, color: Colors.textSecondary },
});
