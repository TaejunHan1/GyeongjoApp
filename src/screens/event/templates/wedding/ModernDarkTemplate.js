// src/screens/event/templates/wedding/ModernDarkTemplate.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Animated,
  Easing,
  TouchableOpacity,
  Image,
  Linking,
  Share,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  useCountdown,
  getCategorizedImagesSafe,
  formatDate,
  formatTime,
  getSafeAnimValue,
} from './WeddingUtils';
import {
  FallingPetals,
  FloatingHearts,
  CountdownDisplay,
  ImageViewer,
  MainPhotoSlideshow,
  PhotoGallery,
  ModernDarkCalendar,
} from './WeddingCommonComponents';
import styles from './WeddingStyles';

const ModernDarkTemplate = ({ eventData = {}, categorizedImages = {} }) => {
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const heroAnim = useRef(new Animated.Value(0)).current;
  const particleAnims = useRef([...Array(25)].map(() => new Animated.Value(0))).current;
  const fadeAnims = useRef([...Array(25)].map(() => new Animated.Value(0))).current;
  const breatheAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const titleGlowAnim = useRef(new Animated.Value(0)).current;

  // 실시간 카운트다운
  const timeLeft = useCountdown(
    eventData.date || eventData.event_date, 
    eventData.ceremonyTime || eventData.ceremony_time
  );

  // 카테고리별 이미지 안전하게 가져오기
  const safeImages = getCategorizedImagesSafe(categorizedImages);

  useEffect(() => {
    // Hero entrance animation
    Animated.sequence([
      Animated.timing(heroAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
      }),
    ]).start();

    // Title glow effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(titleGlowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(titleGlowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    ).start();

    // Breathing background animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(breatheAnim, {
          toValue: 0,
          duration: 4000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    ).start();

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    ).start();

    // Rotation animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
        easing: Easing.linear,
      })
    ).start();

    // Particle animations
    particleAnims.forEach((anim, index) => {
      Animated.loop(
        Animated.timing(anim, {
          toValue: 1,
          duration: 8000 + (index * 200),
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        })
      ).start();
    });

    // Staggered fade-ins
    fadeAnims.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 1200,
        delay: 2000 + (index * 300),
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }).start();
    });
  }, []);

  const handleImagePress = (index) => {
    setCurrentImageIndex(index);
    setShowImageViewer(true);
  };

  return (
    <View style={styles.modern_container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
      <FallingPetals />
      <FloatingHearts />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Section with Main Photo */}
        <View style={styles.modern_heroSection}>
          {/* 메인 사진 슬라이드쇼 */}
          <MainPhotoSlideshow 
            images={safeImages.main}
            style={styles.modern_mainPhotoContainer}
            onImagePress={handleImagePress}
            template="modern"
          />
          
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)']}
            style={styles.modern_heroOverlay}
          />

          {/* Animated background elements */}
          <Animated.View 
            style={[
              styles.modern_bgCircle1,
              {
                opacity: breatheAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.1, 0.3]
                }),
                transform: [{
                  scale: breatheAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.2]
                  })
                }, {
                  rotate: rotateAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg']
                  })
                }]
              }
            ]}
          />

          {/* Floating particles */}
          {particleAnims.map((anim, index) => (
            <Animated.View
              key={index}
              style={[
                styles.modern_particle,
                {
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  opacity: anim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.3, 0.8, 0.3]
                  }),
                  transform: [{
                    translateY: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -50]
                    })
                  }, {
                    scale: anim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [1, 1.5, 1]
                    })
                  }]
                }
              ]}
            />
          ))}

          <Animated.View 
            style={[
              styles.modern_heroContent,
              {
                opacity: heroAnim,
                transform: [{
                  translateY: heroAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [100, 0]
                  })
                }]
              }
            ]}
          >
            <Animated.Text 
              style={[
                styles.modern_heroTitle,
                {
                  textShadowRadius: titleGlowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 35]
                  })
                }
              ]}
            >
              Forever Love
            </Animated.Text>
            
            <View style={styles.modern_heroNamesContainer}>
              <Animated.Text 
                style={[
                  styles.modern_heroNames,
                  {
                    transform: [{
                      scale: pulseAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.02]
                      })
                    }]
                  }
                ]}
              >
                {eventData.groomName || eventData.groom_name || '재현'} & {eventData.brideName || eventData.bride_name || '민지'}
              </Animated.Text>
            </View>
            
            <Text style={styles.modern_heroDate}>
              {formatDate(eventData.date || eventData.event_date, { 
                defaultDate: '2024년 11월 23일 토요일'
              })}
            </Text>
            
            <Text style={styles.modern_heroTime}>
              {formatTime(eventData.ceremonyTime || eventData.ceremony_time, { defaultTime: '오후 2시' })}
            </Text>
          </Animated.View>
        </View>

        {/* 실시간 카운트다운 & 달력 섹션 */}
        <LinearGradient 
          colors={['#16213e', '#1a1a2e']} 
          style={styles.modern_countdownSection}
        >
          <Animated.View 
            style={[
              styles.modern_sectionContent,
              {
                opacity: fadeAnims[0],
                transform: [{
                  translateY: fadeAnims[0].interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0]
                  })
                }]
              }
            ]}
          >
            <Animated.Text 
              style={[
                styles.modern_countdownTitle,
                {
                  textShadowRadius: titleGlowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [10, 20]
                  })
                }
              ]}
            >
              우리의 결혼식
            </Animated.Text>
            
            <CountdownDisplay 
              timeLeft={timeLeft} 
              style={styles.modern_countdownGrid}
              textStyle={styles.modern_countdownNumber}
              labelStyle={styles.modern_countdownLabel}
              isExpired={timeLeft.isExpired}
            />

            {/* 모던 다크 달력 추가 */}
            <ModernDarkCalendar 
              targetDate={eventData.date || eventData.event_date}
              style={styles.modern_calendarSection}
            />
          </Animated.View>
        </LinearGradient>

        {/* 갤러리 사진 섹션 (신랑/신부 사진 제외) */}
        <View style={styles.modern_gallerySection}>
          <Animated.View 
            style={[
              styles.modern_sectionContent,
              {
                opacity: fadeAnims[1],
                transform: [{
                  translateY: fadeAnims[1].interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0]
                  })
                }]
              }
            ]}
          >
            <Animated.Text 
              style={[
                styles.modern_sectionTitle,
                {
                  textShadowRadius: titleGlowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [5, 15]
                  })
                }
              ]}
            >
              갤러리
            </Animated.Text>
            <Animated.Text 
              style={[
                styles.modern_sectionSubtitle,
                {
                  opacity: pulseAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.7, 1]
                  })
                }
              ]}
            >
              소중한 추억들을 모아두었습니다
            </Animated.Text>
            
            <PhotoGallery 
              images={safeImages.gallery}
              style={styles.modern_photoGallery}
              onImagePress={(index) => handleImagePress(safeImages.main.length + index)}
              autoSlide={true}
              template="modern"
            />
            
            {/* 갤러리 사진들 그리드 */}
            <View style={styles.modern_photoGrid}>
              {safeImages.gallery && safeImages.gallery.length > 0 && safeImages.gallery.map((image, index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.modern_photoGridItem,
                    {
                      opacity: getSafeAnimValue(fadeAnims, 2 + index),
                      transform: [{
                        scale: getSafeAnimValue(fadeAnims, 2 + index).interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1]
                        })
                      }]
                    }
                  ]}
                >
                  <TouchableOpacity onPress={() => handleImagePress(safeImages.main.length + index)}>
                    <Image 
                      source={image}
                      style={styles.modern_photoGridImage}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        </View>

        {/* 사랑의 명언 섹션 */}
        <LinearGradient 
          colors={['#0a0a0a', '#111111']} 
          style={styles.modern_quoteSection}
        >
          <Animated.View 
            style={[
              styles.modern_sectionContent,
              {
                opacity: fadeAnims[8],
                transform: [{
                  translateY: fadeAnims[8].interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0]
                  })
                }]
              }
            ]}
          >
            <Animated.Text 
              style={[
                styles.modern_quoteText,
                {
                  opacity: pulseAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.9, 1]
                  })
                }
              ]}
            >
              {eventData.customMessage || eventData.custom_message || 
               '"진정한 사랑은 떨어져 있어도\n변하지 않는 마음입니다."'
              }
            </Animated.Text>
            <Text style={styles.modern_quoteAuthor}>- {eventData.groomName || '신랑'} & {eventData.brideName || '신부'}</Text>
          </Animated.View>
        </LinearGradient>

        {/* 웨딩 디테일 */}
        <LinearGradient 
          colors={['#1a1a2e', '#16213e']} 
          style={styles.modern_detailsSection}
        >
          <Animated.View 
            style={[
              styles.modern_sectionContent,
              {
                opacity: fadeAnims[9],
                transform: [{
                  translateY: fadeAnims[9].interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0]
                  })
                }]
              }
            ]}
          >
            <Animated.Text 
              style={[
                styles.modern_sectionTitle,
                {
                  textShadowRadius: titleGlowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [5, 15]
                  })
                }
              ]}
            >
              결혼식 안내
            </Animated.Text>
            
            <View style={styles.modern_detailsCards}>
              {[
                {
                  icon: '📅',
                  title: '날짜 & 시간',
                  main: formatDate(eventData.date || eventData.event_date, { defaultDate: '2024년 11월 23일' }),
                  sub: `토요일 ${formatTime(eventData.ceremonyTime || eventData.ceremony_time, { defaultTime: '오후 2시' })}`
                },
                {
                  icon: '🏛️',
                  title: '예식장소',
                  main: eventData.location || '더 플라자 호텔',
                  sub: eventData.detailedAddress || eventData.detailed_address || '그랜드볼룸 (5층)'
                },
                {
                  icon: '🚗',
                  title: '주차 안내',
                  main: eventData.parkingInfo || eventData.parking_info || '주차 가능',
                  sub: '자세한 사항은 연락처로 문의해주세요'
                }
              ].map((detail, index) => (
                <Animated.View 
                  key={index}
                  style={[
                    styles.modern_detailCard,
                    {
                      opacity: fadeAnims[10 + index],
                      transform: [{
                        translateY: fadeAnims[10 + index].interpolate({
                          inputRange: [0, 1],
                          outputRange: [30, 0]
                        })
                      }, {
                        scale: pulseAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.02]
                        })
                      }]
                    }
                  ]}
                >
                  <Text style={styles.modern_detailIcon}>{detail.icon}</Text>
                  <Text style={styles.modern_detailTitle}>{detail.title}</Text>
                  <Text style={styles.modern_detailMain}>{detail.main}</Text>
                  <Text style={styles.modern_detailSub}>{detail.sub}</Text>
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        </LinearGradient>

        {/* 커플 소개 - 신랑/신부 전용 사진 사용 */}
        <View style={styles.modern_coupleSection}>
          <Animated.View 
            style={[
              styles.modern_sectionContent,
              {
                opacity: fadeAnims[13],
                transform: [{
                  translateY: fadeAnims[13].interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0]
                  })
                }]
              }
            ]}
          >
            <Animated.Text 
              style={[
                styles.modern_sectionTitle,
                {
                  textShadowRadius: titleGlowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [5, 15]
                  })
                }
              ]}
            >
              신랑 & 신부
            </Animated.Text>
            
            <View style={styles.modern_coupleGrid}>
              {[
                {
                  image: safeImages.groom[0], // 신랑 전용 사진
                  name: eventData.groomName || eventData.groom_name || '재현',
                  role: '신랑',
                  parents: `${eventData.groomFatherName || eventData.groom_father_name || '김○○'} · ${eventData.groomMotherName || eventData.groom_mother_name || '이○○'}의 장남`,
                },
                {
                  image: safeImages.bride[0], // 신부 전용 사진
                  name: eventData.brideName || eventData.bride_name || '민지',
                  role: '신부',
                  parents: `${eventData.brideFatherName || eventData.bride_father_name || '박○○'} · ${eventData.brideMotherName || eventData.bride_mother_name || '최○○'}의 차녀`,
                }
              ].map((person, index) => (
                <Animated.View 
                  key={index}
                  style={[
                    styles.modern_coupleCard,
                    {
                      opacity: fadeAnims[14 + index],
                      transform: [{
                        translateY: fadeAnims[14 + index].interpolate({
                          inputRange: [0, 1],
                          outputRange: [50, 0]
                        })
                      }, {
                        scale: pulseAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.02]
                        })
                      }]
                    }
                  ]}
                >
                  <View style={styles.modern_couplePhotoContainer}>
                    <Image 
                      source={person.image}
                      style={styles.modern_couplePhoto}
                      resizeMode="cover"
                    />
                    <View style={styles.modern_couplePhotoOverlay} />
                  </View>
                  <Text style={styles.modern_coupleName}>{person.name}</Text>
                  <Text style={styles.modern_coupleRole}>{person.role}</Text>
                  <Text style={styles.modern_coupleParents}>{person.parents}</Text>
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        </View>

        {/* 연락처 & 공유 섹션 */}
        <LinearGradient 
          colors={['#16213e', '#0a0a0a']} 
          style={styles.modern_contactSection}
        >
          <Animated.View 
            style={[
              styles.modern_sectionContent,
              {
                opacity: getSafeAnimValue(fadeAnims, 16),
                transform: [{
                  translateY: getSafeAnimValue(fadeAnims, 16, 0).interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0]
                  })
                }]
              }
            ]}
          >
            <Animated.Text 
              style={[
                styles.modern_sectionTitle,
                {
                  textShadowRadius: (titleGlowAnim || new Animated.Value(0)).interpolate({
                    inputRange: [0, 1],
                    outputRange: [5, 15]
                  })
                }
              ]}
            >
              연락처
            </Animated.Text>
            
            <View style={styles.modern_contactGrid}>
              {[
                { name: `신랑 ${eventData.groomName || eventData.groom_name || '재현'}`, role: '신랑', color: '#667eea', phone: eventData.groomContact || eventData.groom_contact },
                { name: `신부 ${eventData.brideName || eventData.bride_name || '민지'}`, role: '신부', color: '#764ba2', phone: eventData.brideContact || eventData.bride_contact }
              ].map((contact, index) => (
                <Animated.View 
                  key={index}
                  style={[
                    styles.modern_contactCard,
                    {
                      opacity: getSafeAnimValue(fadeAnims, 17 + index),
                      transform: [{
                        scale: getSafeAnimValue(fadeAnims, 17 + index).interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.9, 1]
                        })
                      }]
                    }
                  ]}
                >
                  <TouchableOpacity 
                    style={styles.modern_contactButton}
                    onPress={() => {
                      if (contact.phone) {
                        Linking.openURL(`tel:${contact.phone}`);
                      }
                    }}
                  >
                    <Text style={styles.modern_contactName}>{contact.name}</Text>
                    <View style={[styles.modern_contactBtnContainer, { backgroundColor: contact.color }]}>
                      <Ionicons name="call" size={16} color="#ffffff" />
                      <Text style={styles.modern_contactBtnText}>전화하기</Text>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
            
            <View style={styles.modern_shareButtonContainer}>
              <Animated.View
                style={[
                  {
                    opacity: getSafeAnimValue(fadeAnims, 19),
                    transform: [{
                      scale: (pulseAnim || new Animated.Value(1)).interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.05]
                      })
                    }]
                  }
                ]}
              >
                <TouchableOpacity 
                  style={styles.modern_shareButton}
                  onPress={async () => {
                    try {
                      const dateStr = formatDate(eventData.date || eventData.event_date, { defaultDate: '2024년 11월 23일' });
                      const timeStr = formatTime(eventData.ceremonyTime || eventData.ceremony_time, { defaultTime: '오후 2시' });
                      const location = eventData.location || '웨딩홀';
                      const groomName = eventData.groomName || eventData.groom_name || '신랑';
                      const brideName = eventData.brideName || eventData.bride_name || '신부';
                      
                      await Share.share({
                        message: `${groomName} ♥ ${brideName} 결혼식에 초대합니다!\n${dateStr} ${timeStr}\n${location}`,
                        title: '모바일 청첩장',
                      });
                    } catch (error) {
                      console.log('Share error:', error);
                    }
                  }}
                >
                  <Ionicons name="heart" size={20} color="#ffffff" style={{ marginRight: 10 }} />
                  <Text style={styles.modern_shareButtonText}>청첩장 공유하기</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </Animated.View>
        </LinearGradient>

        {/* 부조하기 버튼 섹션 추가 */}
        <LinearGradient 
          colors={['#0a0a0a', '#16213e']} 
          style={styles.modern_donationSection}
        >
          <Animated.View 
            style={[
              styles.modern_sectionContent,
              {
                opacity: getSafeAnimValue(fadeAnims, 20),
                transform: [{
                  translateY: getSafeAnimValue(fadeAnims, 20, 0).interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0]
                  })
                }]
              }
            ]}
          >
            <Animated.Text 
              style={[
                styles.modern_donationTitle,
                {
                  textShadowRadius: (titleGlowAnim || new Animated.Value(0)).interpolate({
                    inputRange: [0, 1],
                    outputRange: [5, 15]
                  })
                }
              ]}
            >
              마음을 전하세요
            </Animated.Text>
            
            <Text style={styles.modern_donationSubtitle}>
              소중한 분들의 축복이 큰 힘이 됩니다
            </Text>

            <Animated.View
              style={[
                {
                  transform: [{
                    scale: (pulseAnim || new Animated.Value(1)).interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.03]
                    })
                  }]
                }
              ]}
            >
              <TouchableOpacity 
                style={styles.modern_donationButton}
                onPress={() => {
                  // 부조하기 기능 구현 예정
                  console.log('부조하기 버튼 클릭됨');
                }}
              >
                <Ionicons name="gift" size={24} color="#ffffff" style={{ marginRight: 12 }} />
                <Text style={styles.modern_donationButtonText}>부조하기</Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </LinearGradient>
      </ScrollView>

      <ImageViewer 
        visible={showImageViewer}
        images={[...safeImages.main, ...safeImages.gallery]}
        currentIndex={currentImageIndex}
        onClose={() => setShowImageViewer(false)}
        onIndexChange={setCurrentImageIndex}
      />
    </View>
  );
};

export default ModernDarkTemplate;