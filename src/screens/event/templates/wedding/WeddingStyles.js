// src/screens/event/templates/wedding/WeddingStyles.js
import { StyleSheet, Platform } from 'react-native';
import { width, height, KoreanColors } from './WeddingUtils';

const styles = StyleSheet.create({
  // =================================================================
  // 공통 컴포넌트 스타일
  // =================================================================
  petalsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 1000,
    pointerEvents: 'none',
  },
  petal: {
    position: 'absolute',
    zIndex: 1,
  },
  petalText: {
    fontSize: 16,
    opacity: 0.7,
  },
  heartsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 999,
    pointerEvents: 'none',
  },
  floatingHeart: {
    position: 'absolute',
    fontSize: 20,
    bottom: height - 100,
  },
  heartIcon: {
    fontSize: 24,
  },
  
  // 카운트다운 공통 스타일
  countdownContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 15,
  },
  countdownItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    padding: 15,
    minWidth: 60,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  countdownNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 5,
  },
  countdownLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  countdownExpired: {
    alignItems: 'center',
    padding: 20,
  },
  countdownExpiredText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  
  // 이미지 뷰어
  imageViewerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  imageViewerContent: {
    width: '100%',
    height: '70%',
  },
  imageViewerImage: {
    width: '100%',
    height: '100%',
  },
  imageViewerIndicator: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  imageViewerCounter: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },

  // 메인 포토 슬라이드쇼
  mainPhotoSlideshow: {
    width: '100%',
    height: height * 0.6,
    position: 'relative',
  },
  mainPhotoImage: {
    width: '100%',
    height: '100%',
  },
  mainPhotoIndicators: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  mainPhotoIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },

  // 갤러리
  galleryAutoSlide: {
    width: '100%',
    height: 300,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  galleryAutoSlideImage: {
    width: '100%',
    height: '100%',
  },
  galleryAutoSlideIndicators: {
    position: 'absolute',
    bottom: 15,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  galleryIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  galleryScroll: {
    width: '100%',
    height: 300,
  },
  galleryItem: {
    width: width - 60,
    height: 300,
    marginHorizontal: 15,
    borderRadius: 20,
    overflow: 'hidden',
  },
  galleryItemImage: {
    width: '100%',
    height: '100%',
  },

  // =================================================================
  // 달력 스타일
  // =================================================================
  
  // 모던 다크 달력 스타일
  modernCalendar: {
    marginTop: 30,
    width: '100%',
  },
  modernCalendarContainer: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modernCalendarHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modernCalendarTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#667eea',
    letterSpacing: 1,
  },
  modernCalendarWeekDays: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  modernCalendarWeekDay: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    width: 35,
    textAlign: 'center',
  },
  modernCalendarWeekendDay: {
    color: '#667eea',
  },
  modernCalendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  modernCalendarDayContainer: {
    width: '14.28%',
    aspectRatio: 1,
    padding: 2,
  },
  modernCalendarDay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  modernCalendarTargetDay: {
    backgroundColor: '#667eea',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 8,
  },
  modernCalendarToday: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  modernCalendarOtherMonth: {
    opacity: 0.3,
  },
  modernCalendarDayText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
  },
  modernCalendarTargetDayText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '700',
  },
  modernCalendarTodayText: {
    color: '#667eea',
    fontWeight: '600',
  },
  modernCalendarOtherMonthText: {
    color: 'rgba(255,255,255,0.3)',
  },
  modernCalendarWeekendText: {
    color: '#667eea',
  },
  modernCalendarDDayText: {
    fontSize: 8,
    marginTop: 2,
  },
  
  // 한국 전통 달력 스타일
  koreanCalendar: {
    marginTop: 30,
    width: '100%',
  },
  koreanCalendarContainer: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
  },
  koreanCalendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  koreanCalendarTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: KoreanColors.elegant.text,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    paddingHorizontal: 15,
  },
  koreanCalendarDecoLine: {
    flex: 1,
    height: 1,
    backgroundColor: KoreanColors.elegant.accent,
    opacity: 0.5,
  },
  koreanCalendarWeekDays: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  koreanCalendarWeekDay: {
    fontSize: 12,
    fontWeight: '600',
    color: KoreanColors.elegant.text,
    width: 35,
    textAlign: 'center',
  },
  koreanCalendarWeekendDay: {
    color: KoreanColors.elegant.primary,
  },
  koreanCalendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  koreanCalendarDayContainer: {
    width: '14.28%',
    aspectRatio: 1,
    padding: 2,
  },
  koreanCalendarDay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  koreanCalendarTargetDay: {
    backgroundColor: KoreanColors.elegant.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 8,
  },
  koreanCalendarToday: {
    backgroundColor: KoreanColors.elegant.secondary,
    borderWidth: 1,
    borderColor: KoreanColors.elegant.primary,
  },
  koreanCalendarOtherMonth: {
    opacity: 0.3,
  },
  koreanCalendarDayText: {
    fontSize: 13,
    color: KoreanColors.elegant.text,
    fontWeight: '500',
  },
  koreanCalendarTargetDayText: {
    fontSize: 13,
    color: '#ffffff',
    fontWeight: '700',
  },
  koreanCalendarTodayText: {
    color: KoreanColors.elegant.primary,
    fontWeight: '600',
  },
  koreanCalendarOtherMonthText: {
    color: 'rgba(26, 32, 44, 0.3)',
  },
  koreanCalendarSundayText: {
    color: '#E53E3E',
  },
  koreanCalendarSaturdayText: {
    color: '#3182CE',
  },
  koreanCalendarDDayText: {
    fontSize: 8,
    marginTop: 2,
  },
  
  // 빈티지 앱 달력 스타일
  vintageCalendar: {
    marginTop: 30,
    width: '100%',
  },
  vintageCalendarContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
  },
  vintageCalendarHeader: {
    padding: 20,
    alignItems: 'center',
    position: 'relative',
  },
  vintageCalendarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 1,
  },
  vintageCalendarHeaderDeco: {
    position: 'absolute',
    left: 15,
    right: 15,
    top: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vintageCalendarEmojiLeft: {
    fontSize: 16,
  },
  vintageCalendarEmojiRight: {
    fontSize: 16,
  },
  vintageCalendarContent: {
    backgroundColor: '#ffffff',
    padding: 20,
  },
  vintageCalendarWeekDays: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  vintageCalendarWeekDay: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2d3436',
    width: 35,
    textAlign: 'center',
  },
  vintageCalendarWeekendDay: {
    color: '#6c5ce7',
  },
  vintageCalendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  vintageCalendarDayContainer: {
    width: '14.28%',
    aspectRatio: 1,
    padding: 2,
  },
  vintageCalendarDay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  vintageCalendarTargetDay: {
    backgroundColor: '#fd79a8',
    shadowColor: '#fd79a8',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 8,
  },
  vintageCalendarToday: {
    backgroundColor: '#f1f2f6',
    borderWidth: 2,
    borderColor: '#6c5ce7',
  },
  vintageCalendarOtherMonth: {
    opacity: 0.3,
  },
  vintageCalendarDayText: {
    fontSize: 13,
    color: '#2d3436',
    fontWeight: '500',
  },
  vintageCalendarTargetDayText: {
    fontSize: 13,
    color: '#ffffff',
    fontWeight: '700',
  },
  vintageCalendarTodayText: {
    color: '#6c5ce7',
    fontWeight: '600',
  },
  vintageCalendarOtherMonthText: {
    color: 'rgba(45, 52, 54, 0.3)',
  },
  vintageCalendarWeekendText: {
    color: '#6c5ce7',
  },
  vintageCalendarDDayText: {
    fontSize: 8,
    marginTop: 2,
  },

  // =================================================================
  // Modern Dark Template Styles
  // =================================================================
  modern_container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  modern_heroSection: {
    height: height,
    position: 'relative',
    overflow: 'hidden',
  },
  modern_mainPhotoContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modern_heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  modern_bgCircle1: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: '#667eea',
    top: -200,
    left: -100,
  },
  modern_particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 2,
  },
  modern_heroContent: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
    paddingHorizontal: 40,
  },
  modern_heroSubtitle: {
    fontFamily: Platform.OS === 'ios' ? 'Allura' : 'serif',
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 2,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  modern_heroTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Great Vibes' : 'serif',
    fontSize: 72,
    color: '#ffffff',
    marginBottom: 30,
    fontStyle: 'italic',
    textShadowColor: 'rgba(102, 126, 234, 0.5)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 20,
  },
  modern_heroNamesContainer: {
    marginBottom: 30,
  },
  modern_heroNames: {
    fontFamily: Platform.OS === 'ios' ? 'Playfair Display' : 'serif',
    fontSize: 32,
    color: '#ffffff',
    fontWeight: '400',
    letterSpacing: 2,
    textAlign: 'center',
  },
  modern_heroDate: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 10,
  },
  modern_heroTime: {
    fontFamily: 'Inter',
    fontSize: 18,
    color: '#667eea',
    fontWeight: '600',
    textAlign: 'center',
  },
  modern_countdownSection: {
    paddingVertical: 80,
    paddingHorizontal: 30,
  },
  modern_sectionContent: {
    alignItems: 'center',
  },
  modern_countdownTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Great Vibes' : 'serif',
    fontSize: 48,
    color: '#ffffff',
    marginBottom: 40,
    fontStyle: 'italic',
    textShadowColor: 'rgba(102, 126, 234, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  modern_countdownGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 15,
  },
  modern_countdownNumber: {
    fontSize: 32,
    color: '#667eea',
    fontWeight: '700',
    marginBottom: 5,
  },
  modern_countdownLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  modern_calendarSection: {
    marginTop: 30,
  },
  modern_gallerySection: {
    backgroundColor: '#111111',
    paddingVertical: 80,
    paddingHorizontal: 30,
  },
  modern_sectionTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Great Vibes' : 'serif',
    fontSize: 48,
    color: '#ffffff',
    marginBottom: 20,
    fontStyle: 'italic',
    textAlign: 'center',
    textShadowColor: 'rgba(102, 126, 234, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  modern_sectionSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 50,
    textAlign: 'center',
  },
  modern_photoGallery: {
    marginBottom: 40,
  },
  modern_photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  modern_photoGridItem: {
    width: (width - 80) / 3,
    aspectRatio: 1,
  },
  modern_photoGridImage: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
  },
  modern_quoteSection: {
    paddingVertical: 100,
    paddingHorizontal: 40,
  },
  modern_quoteText: {
    fontFamily: Platform.OS === 'ios' ? 'Cormorant Garamond' : 'serif',
    fontSize: 24,
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 30,
    fontStyle: 'italic',
  },
  modern_quoteAuthor: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    letterSpacing: 2,
  },
  modern_detailsSection: {
    paddingVertical: 80,
    paddingHorizontal: 30,
  },
  modern_detailsCards: {
    gap: 20,
  },
  modern_detailCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.2)',
  },
  modern_detailIcon: {
    fontSize: 32,
    marginBottom: 15,
  },
  modern_detailTitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  modern_detailMain: {
    fontSize: 18,
    color: '#667eea',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 5,
  },
  modern_detailSub: {
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 20,
  },
  modern_coupleSection: {
    backgroundColor: '#0a0a0a',
    paddingVertical: 80,
    paddingHorizontal: 30,
  },
  modern_coupleGrid: {
    gap: 40,
  },
  modern_coupleCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 25,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.2)',
  },
  modern_couplePhotoContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    overflow: 'hidden',
    marginBottom: 25,
    borderWidth: 3,
    borderColor: 'rgba(102, 126, 234, 0.3)',
    position: 'relative',
  },
  modern_couplePhoto: {
    width: '100%',
    height: '100%',
  },
  modern_couplePhotoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
  },
  modern_coupleName: {
    fontFamily: Platform.OS === 'ios' ? 'Playfair Display' : 'serif',
    fontSize: 28,
    color: '#ffffff',
    marginBottom: 10,
    fontWeight: '400',
  },
  modern_coupleRole: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 15,
  },
  modern_coupleParents: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 15,
  },
  modern_contactSection: {
    paddingVertical: 80,
    paddingHorizontal: 30,
  },
  modern_contactGrid: {
    gap: 25,
    marginBottom: 50,
    width: '100%',
  },
  modern_contactCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.2)',
    overflow: 'hidden',
    marginBottom: 10,
  },
  modern_contactButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 25,
    width: '100%',
  },
  modern_contactName: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
    flex: 1,
  },
  modern_contactBtnContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 10,
  },
  modern_contactBtnText: {
    fontSize: 12,
    color: '#ffffff',
    marginLeft: 5,
    fontWeight: '500',
  },
  modern_shareButtonContainer: {
    alignItems: 'center',
    width: '100%',
    marginTop: 20,
  },
  modern_shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#667eea',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    shadowColor: '#667eea',
    shadowOpacity: 0.3,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  modern_shareButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },

  // 부조하기 섹션 추가
  modern_donationSection: {
    paddingVertical: 80,
    paddingHorizontal: 30,
  },
  modern_donationTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Great Vibes' : 'serif',
    fontSize: 48,
    color: '#ffffff',
    marginBottom: 20,
    fontStyle: 'italic',
    textAlign: 'center',
    textShadowColor: 'rgba(102, 126, 234, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  modern_donationSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  modern_donationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderRadius: 30,
    shadowColor: '#667eea',
    shadowOpacity: 0.3,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  modern_donationButtonText: {
    fontSize: 18,
    color: '#667eea',
    fontWeight: '700',
  },

  // =================================================================
  // Korean Elegant Template Styles
  // =================================================================
  korean_container: {
    flex: 1,
    backgroundColor: KoreanColors.elegant.light,
  },
  korean_scrollView: {
    flex: 1,
  },
  
  // 헤로 섹션
  korean_heroSection: {
    minHeight: height,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    position: 'relative',
  },
  korean_heroContent: {
    alignItems: 'center',
    zIndex: 2,
  },
  korean_mainPhotoContainer: {
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  
  // 이름 섹션
  korean_namesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  korean_groomName: {
    fontSize: 28,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    color: KoreanColors.elegant.text,
    fontWeight: '600',
  },
  korean_brideName: {
    fontSize: 28,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    color: KoreanColors.elegant.text,
    fontWeight: '600',
  },
  korean_heartContainer: {
    marginHorizontal: 15,
  },
  
  // 날짜 섹션
  korean_dateContainer: {
    alignItems: 'center',
  },
  korean_dateYear: {
    fontSize: 16,
    color: KoreanColors.elegant.primary,
    marginBottom: 5,
  },
  korean_dateMonthDay: {
    fontSize: 48,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    color: KoreanColors.elegant.text,
    fontWeight: '300',
    lineHeight: 48,
  },
  korean_dateDayOfWeek: {
    fontSize: 18,
    color: KoreanColors.elegant.primary,
    marginBottom: 10,
  },
  korean_dateTime: {
    fontSize: 16,
    color: KoreanColors.elegant.text,
    fontWeight: '500',
    textAlign: 'center',
  },
  
  // 카운트다운 섹션 추가
  korean_countdownSection: {
    paddingVertical: 50,
    paddingHorizontal: 20,
    position: 'relative',
  },
  korean_countdownGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
  },
  korean_countdownNumber: {
    fontSize: 28,
    color: KoreanColors.elegant.primary,
    fontWeight: '700',
  },
  korean_countdownLabel: {
    fontSize: 12,
    color: KoreanColors.elegant.text,
    fontWeight: '600',
  },
  korean_calendarSection: {
    marginTop: 30,
  },
  
  // 공통 섹션 스타일
  korean_messageSection: {
    paddingHorizontal: 30,
    paddingVertical: 50,
    alignItems: 'center',
  },
  korean_coupleSection: {
    paddingHorizontal: 20,
    paddingVertical: 50,
  },
  korean_weddingInfoSection: {
    paddingHorizontal: 20,
    paddingVertical: 50,
    position: 'relative',
  },
  korean_gallerySection: {
    paddingVertical: 50,
  },
  korean_locationSection: {
    paddingHorizontal: 20,
    paddingVertical: 50,
  },
  korean_contributionSection: {
    paddingHorizontal: 20,
    paddingVertical: 50,
    position: 'relative',
  },
  korean_shareSection: {
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  korean_footerSection: {
    paddingHorizontal: 30,
    paddingVertical: 50,
    alignItems: 'center',
  },
  
  // 섹션 헤더
  korean_sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  korean_sectionTitle: {
    fontSize: 20,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    color: KoreanColors.elegant.text,
    fontWeight: '600',
    paddingHorizontal: 20,
  },
  korean_decorativeLine: {
    flex: 1,
    height: 1,
    backgroundColor: KoreanColors.elegant.accent,
    opacity: 0.5,
  },
  
  // 메시지
  korean_customMessage: {
    fontSize: 16,
    lineHeight: 28,
    color: KoreanColors.elegant.text,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  
  // 커플 정보
  korean_coupleGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  korean_personCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
  },
  korean_personPhotoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    marginBottom: 15,
  },
  korean_personPhoto: {
    width: '100%',
    height: '100%',
  },
  korean_personName: {
    fontSize: 18,
    fontWeight: '600',
    color: KoreanColors.elegant.text,
    marginBottom: 5,
  },
  korean_personRole: {
    fontSize: 12,
    color: KoreanColors.elegant.primary,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  korean_parentNames: {
    fontSize: 12,
    color: KoreanColors.elegant.text,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 15,
  },
  korean_contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: KoreanColors.elegant.light,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: KoreanColors.elegant.primary,
  },
  korean_contactButtonText: {
    fontSize: 12,
    color: KoreanColors.elegant.primary,
    marginLeft: 5,
    fontWeight: '500',
  },
  
  // 정보 카드
  korean_infoCard: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
  },
  korean_infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  korean_infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: KoreanColors.elegant.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  korean_infoContent: {
    flex: 1,
  },
  korean_infoLabel: {
    fontSize: 12,
    color: KoreanColors.elegant.primary,
    marginBottom: 5,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  korean_infoValue: {
    fontSize: 16,
    color: KoreanColors.elegant.text,
    fontWeight: '600',
    marginBottom: 3,
  },
  korean_infoSubValue: {
    fontSize: 14,
    color: KoreanColors.elegant.text,
    opacity: 0.7,
  },
  
  // 갤러리
  korean_galleryScroll: {
    paddingLeft: 20,
  },
  korean_galleryItem: {
    width: width * 0.7,
    height: width * 0.7,
    marginRight: 15,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  korean_galleryImage: {
    width: '100%',
    height: '100%',
  },
  
  // 지도 및 위치
  korean_mapContainer: {
    height: 200,
    backgroundColor: KoreanColors.elegant.secondary,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  korean_mapPlaceholder: {
    fontSize: 48,
    marginBottom: 10,
  },
  korean_mapText: {
    fontSize: 14,
    color: KoreanColors.elegant.text,
    opacity: 0.7,
  },
  korean_locationButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  korean_locationButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: KoreanColors.elegant.primary,
    paddingVertical: 15,
    borderRadius: 15,
  },
  korean_locationButtonSecondary: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: KoreanColors.elegant.primary,
  },
  korean_locationButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  korean_locationButtonTextSecondary: {
    color: KoreanColors.elegant.primary,
  },
  
  // 축의금
  korean_contributionCard: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
  },
  korean_contributionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: KoreanColors.elegant.text,
    marginBottom: 15,
  },
  korean_contributionDescription: {
    fontSize: 14,
    color: KoreanColors.elegant.text,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 25,
  },
  korean_contributionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: KoreanColors.elegant.light,
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: KoreanColors.elegant.primary,
  },
  korean_contributionButtonText: {
    color: KoreanColors.elegant.primary,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  
  // 공유 버튼
  korean_shareButton: {
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  korean_shareButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  korean_shareButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  
  // 푸터
  korean_footerMessage: {
    fontSize: 16,
    color: KoreanColors.elegant.text,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 20,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  korean_footerNames: {
    fontSize: 20,
    fontWeight: '600',
    color: KoreanColors.elegant.primary,
    marginBottom: 10,
  },
  korean_footerDate: {
    fontSize: 14,
    color: KoreanColors.elegant.text,
    opacity: 0.7,
  },

  // =================================================================
  // Vintage App Template Styles
  // =================================================================
  app_container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  app_statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 25,
    paddingBottom: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  app_statusLeft: {
    flex: 1,
  },
  app_statusCenter: {
    flex: 1,
    alignItems: 'center',
  },
  app_statusTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#6c5ce7',
  },
  app_statusRight: {
    flex: 1,
  },
  app_scrollContainer: {
    flex: 1,
  },
  app_heroSection: {
    height: height * 0.85,
    position: 'relative',
    overflow: 'hidden',
  },
  app_mainPhotoContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  app_sparkle: {
    position: 'absolute',
    fontSize: 18,
  },
  app_heroContent: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
    paddingHorizontal: 40,
  },
  app_heroTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Great Vibes' : 'serif',
    fontSize: 64,
    color: '#ffffff',
    marginBottom: 20,
    fontStyle: 'italic',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 20,
  },
  app_heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 20,
  },
  app_heroNames: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: '600',
    letterSpacing: 2,
    marginBottom: 20,
  },
  app_heroDate: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 18,
  },
  app_scrollHint: {
    position: 'absolute',
    bottom: 30,
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    letterSpacing: 1,
  },
  
  // 카운트다운 섹션
  app_countdownSection: {
    paddingVertical: 60,
    paddingHorizontal: 25,
  },
  app_countdownTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 10,
    textAlign: 'center',
  },
  app_countdownSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 30,
  },
  app_countdownGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
  },
  app_countdownNumber: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: '700',
  },
  app_countdownLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  app_calendarSection: {
    marginTop: 30,
  },
  
  app_sectionContent: {
    alignItems: 'center',
  },
  app_sectionTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2d3436',
    marginBottom: 8,
    textAlign: 'center',
  },
  app_sectionSubtitle: {
    fontSize: 14,
    color: '#636e72',
    textAlign: 'center',
    marginBottom: 40,
  },
  app_gallerySection: {
    backgroundColor: '#ffffff',
    paddingVertical: 80,
    paddingHorizontal: 25,
  },
  app_photoGallery: {
    marginBottom: 30,
  },
  app_photoMasonry: {
    flexDirection: 'row',
    gap: 10,
  },
  app_photoColumn: {
    flex: 1,
    gap: 10,
  },
  app_photoMasonryItem: {
    width: '100%',
    borderRadius: 15,
    backgroundColor: '#f1f2f6',
  },
  app_cardsSection: {
    paddingVertical: 80,
    paddingHorizontal: 25,
  },
  app_infoCards: {
    gap: 20,
  },
  app_infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(108,92,231,0.1)',
  },
  app_cardIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  app_cardIconText: {
    fontSize: 24,
  },
  app_cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2d3436',
    marginBottom: 10,
  },
  app_cardDescription: {
    fontSize: 14,
    color: '#636e72',
    lineHeight: 22,
    marginBottom: 8,
  },
  app_cardDetails: {
    fontSize: 12,
    fontWeight: '500',
  },
  app_coupleSection: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 80,
    paddingHorizontal: 25,
  },
  app_coupleCards: {
    gap: 30,
  },
  app_coupleCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  app_couplePhotoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 3,
    borderColor: '#f1f2f6',
  },
  app_couplePhoto: {
    width: '100%',
    height: '100%',
  },
  app_coupleName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2d3436',
    marginBottom: 8,
    textAlign: 'center',
  },
  app_coupleRole: {
    fontSize: 12,
    color: '#6c5ce7',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 15,
  },
  app_coupleParents: {
    fontSize: 14,
    color: '#636e72',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 20,
  },
  app_contactSection: {
    paddingVertical: 80,
    paddingHorizontal: 25,
  },
  app_contactCards: {
    gap: 20,
    marginBottom: 40,
    width: '100%',
  },
  app_contactCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 15,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    marginBottom: 10,
    width: '100%',
  },
  app_contactAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  app_contactAvatarText: {
    fontSize: 28,
  },
  app_contactInfo: {
    flex: 1,
  },
  app_contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3436',
    marginBottom: 3,
  },
  app_contactPhone: {
    fontSize: 13,
    color: '#636e72',
    marginBottom: 3,
  },
  app_contactRole: {
    fontSize: 12,
    color: '#636e72',
  },
  app_contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    marginLeft: 10,
  },
  app_contactButtonText: {
    fontSize: 12,
    color: '#ffffff',
    marginLeft: 5,
    fontWeight: '500',
  },
  app_shareSection: {
    paddingVertical: 80,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  app_shareTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 10,
    textAlign: 'center',
  },
  app_shareSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 30,
  },
  
  // 부조하기 버튼 추가
  app_donationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 30,
    paddingVertical: 16,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
    marginBottom: 20,
  },
  app_donationButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6c5ce7',
  },
  
  app_shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
    marginBottom: 30,
  },
  app_shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  app_socialButtons: {
    flexDirection: 'row',
    gap: 15,
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
  },
  app_socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  app_socialButtonText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default styles;