// src/screens/event/templates/wedding/VintageAppTemplate.js
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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import {
  useCountdown,
  getCategorizedImagesSafe,
  formatDate,
  formatTime,
  getSafeAnimValue,
  height,
} from './WeddingUtils';
import {
  FallingPetals,
  FloatingHearts,
  CountdownDisplay,
  ImageViewer,
  MainPhotoSlideshow,
  PhotoGallery,
  VintageAppCalendar,
} from './WeddingCommonComponents';
import styles from './WeddingStyles';

const VintageAppTemplate = ({ eventData = {}, categorizedImages = {} }) => {
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const appLoadAnim = useRef(new Animated.Value(0)).current;
  const cardAnims = useRef([...Array(25)].map(() => new Animated.Value(0))).current;
  const sparkleAnims = useRef([...Array(15)].map(() => new Animated.Value(0))).current;
  const fadeAnims = useRef([...Array(30)].map(() => new Animated.Value(0))).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  // 실시간 카운트다운
  const timeLeft = useCountdown(
    eventData.date || eventData.event_date, 
    eventData.ceremonyTime || eventData.ceremony_time
  );

  // 카테고리별 이미지 안전하게 가져오기
  const safeImages = getCategorizedImagesSafe(categorizedImages);
  
  console.log('🔍 [VINTAGE TEMPLATE] 사용할 이미지들:', {
    main: safeImages.main.length,
    gallery: safeImages.gallery.length,
    groom: safeImages.groom.length,
    bride: safeImages.bride.length
  });

  useEffect(() => {
    // App loading animation
    Animated.timing(appLoadAnim, {
      toValue: 1,
      duration: 2500,
      useNativeDriver: true,
      easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
    }).start();

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    ).start();

    // Bounce animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.in(Easing.ease),
        }),
      ])
    ).start();

    // Sparkle animations
    sparkleAnims.forEach((anim, index) => {
      Animated.loop(
        Animated.timing(anim, {
          toValue: 1,
          duration: 3000 + (index * 200),
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        })
      ).start();
    });

    // Card animations
    cardAnims.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 800,
        delay: 1000 + (index * 150),
        useNativeDriver: true,
        easing: Easing.bezier(0.68, -0.55, 0.265, 1.55),
      }).start();
    });

    // Fade animations
    fadeAnims.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 1000,
        delay: 1500 + (index * 200),
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
    <View style={styles.app_container}>
      {/* Simplified Status Bar */}
      <View style={styles.app_statusBar}>
        <View style={styles.app_statusLeft} />
        <View style={styles.app_statusCenter}>
          <Text style={styles.app_statusTitle}>결혼식</Text>
        </View>
        <View style={styles.app_statusRight} />
      </View>

      <ScrollView style={styles.app_scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Hero Section with Main Photo */}
        <View style={styles.app_heroSection}>
          <MainPhotoSlideshow 
            images={safeImages.main}
            style={styles.app_mainPhotoContainer}
            onImagePress={handleImagePress}
            template="vintage"
          />
          
          <LinearGradient
            colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.6)']}
            style={StyleSheet.absoluteFill}
          />

          {/* Sparkle effects */}
          {sparkleAnims.map((anim, index) => (
            <Animated.Text
              key={index}
              style={[
                styles.app_sparkle,
                {
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  opacity: anim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.3, 1, 0.3]
                  }),
                  transform: [{
                    scale: anim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [1, 1.5, 1]
                    })
                  }, {
                    rotate: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg']
                    })
                  }]
                }
              ]}
            >
              ✨
            </Animated.Text>
          ))}

          <Animated.View 
            style={[
              styles.app_heroContent,
              {
                opacity: appLoadAnim,
                transform: [{
                  translateY: appLoadAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [100, 0]
                  })
                }, {
                  scale: appLoadAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.9, 1]
                  })
                }]
              }
            ]}
          >
            <Text style={styles.app_heroTitle}>Wedding</Text>
            <Text style={styles.app_heroSubtitle}>우리의 특별한 날에 함께해주세요</Text>
            <Text style={styles.app_heroNames}>
              {eventData.groomName || eventData.groom_name || '민수'} & {eventData.brideName || eventData.bride_name || '예은'}
            </Text>
            <Text style={styles.app_heroDate}>
              {formatDate(eventData.date || eventData.event_date, { 
                format: 'english',
                defaultDate: 'November 16, 2024'
              })} • Saturday {formatTime(eventData.ceremonyTime || eventData.ceremony_time, { defaultTime: '2:00 PM' })}
            </Text>
            
            <Animated.View
              style={[
                {
                  transform: [{
                    translateY: bounceAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -5]
                    })
                  }]
                }
              ]}
            >
            </Animated.View>
          </Animated.View>
          
          <Animated.Text 
            style={[
              styles.app_scrollHint,
              {
                opacity: pulseAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.6, 1]
                })
              }
            ]}
          >
            ↓ 아래로 스크롤해주세요
          </Animated.Text>
        </View>

        {/* 카운트다운 & 달력 섹션 추가 */}
        <LinearGradient 
          colors={['#6c5ce7', '#5f3dc4']} 
          style={styles.app_countdownSection}
        >
          <Animated.View 
            style={[
              styles.app_sectionContent,
              {
                opacity: cardAnims[0],
                transform: [{
                  translateY: cardAnims[0].interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0]
                  })
                }]
              }
            ]}
          >
            <Text style={styles.app_countdownTitle}>결혼식 D-Day</Text>
            <Text style={styles.app_countdownSubtitle}>특별한 날까지 남은 시간</Text>
            
            <CountdownDisplay 
              timeLeft={timeLeft}
              style={styles.app_countdownGrid}
              textStyle={styles.app_countdownNumber}
              labelStyle={styles.app_countdownLabel}
              isExpired={timeLeft.isExpired}
            />

            {/* 빈티지 앱 달력 추가 */}
            <VintageAppCalendar 
              targetDate={eventData.date || eventData.event_date}
              style={styles.app_calendarSection}
            />
          </Animated.View>
        </LinearGradient>

        {/* 갤러리 섹션 - 갤러리 전용 사진 사용 */}
        <View style={styles.app_gallerySection}>
          <Animated.View 
            style={[
              styles.app_sectionContent,
              {
                opacity: cardAnims[6],
                transform: [{
                  translateY: cardAnims[6].interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0]
                  })
                }]
              }
            ]}
          >
            <Text style={styles.app_sectionTitle}>사진 갤러리</Text>
            <Text style={styles.app_sectionSubtitle}>소중한 추억들을 모아두었습니다</Text>
            
            <PhotoGallery 
              images={safeImages.gallery.slice(0, 6)}
              style={styles.app_photoGallery}
              onImagePress={(index) => handleImagePress(safeImages.main.length + index)}
              autoSlide={false}
              template="vintage"
            />
            
            {/* 사진 마사지 레이아웃 */}
            <View style={styles.app_photoMasonry}>
              <View style={styles.app_photoColumn}>
                {safeImages.gallery && safeImages.gallery.length > 0 && safeImages.gallery.slice(0, Math.ceil(safeImages.gallery.length / 2)).map((image, index) => (
                  <Animated.View
                    key={index}
                    style={[
                      {
                        opacity: getSafeAnimValue(cardAnims, 7 + index),
                        transform: [{
                          scale: getSafeAnimValue(cardAnims, 7 + index).interpolate({
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
                        style={[
                          styles.app_photoMasonryItem,
                          { height: (index % 3 + 1) * 80 + 100 }
                        ]}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>
              <View style={styles.app_photoColumn}>
                {safeImages.gallery && safeImages.gallery.length > 0 && safeImages.gallery.slice(Math.ceil(safeImages.gallery.length / 2)).map((image, index) => (
                  <Animated.View
                    key={index}
                    style={[
                      {
                        opacity: getSafeAnimValue(cardAnims, 7 + Math.ceil(safeImages.gallery.length / 2) + index),
                        transform: [{
                          scale: getSafeAnimValue(cardAnims, 7 + Math.ceil(safeImages.gallery.length / 2) + index).interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.8, 1]
                          })
                        }]
                      }
                    ]}
                  >
                    <TouchableOpacity onPress={() => handleImagePress(safeImages.main.length + Math.ceil(safeImages.gallery.length / 2) + index)}>
                      <Image 
                        source={image}
                        style={[
                          styles.app_photoMasonryItem,
                          { height: ((index + 1) % 3 + 1) * 80 + 100 }
                        ]}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>
            </View>
          </Animated.View>
        </View>

        {/* 인포 카드 섹션 */}
        <LinearGradient 
          colors={['#f8f9fa', '#e9ecef']} 
          style={styles.app_cardsSection}
        >
          <Animated.View 
            style={[
              styles.app_sectionContent,
              {
                opacity: cardAnims[13],
                transform: [{
                  translateY: cardAnims[13].interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0]
                  })
                }]
              }
            ]}
          >
            <Text style={styles.app_sectionTitle}>결혼식 정보</Text>
            <Text style={styles.app_sectionSubtitle}>결혼식 세부 정보를 확인해주세요</Text>
            
            <View style={styles.app_infoCards}>
              {[
                {
                  icon: '📅',
                  title: '날짜 & 시간',
                  description: `${formatDate(eventData.date || eventData.event_date, { defaultDate: '2024년 11월 16일 토요일' })}\n${formatTime(eventData.ceremonyTime || eventData.ceremony_time, { defaultTime: '오후 2시' })} - 4시`,
                  accent: '#6c5ce7',
                  details: '가든 세레모니'
                },
                {
                  icon: '🏛️',
                  title: '장소',
                  description: `${eventData.location || '블루밍 가든 웨딩홀'}\n${eventData.detailedAddress || eventData.detailed_address || '야외 테라스'}`,
                  accent: '#00b894',
                  details: '서울 강남구 테헤란로 152'
                },
                {
                  icon: '🚗',
                  title: '주차 정보',
                  description: eventData.parkingInfo || eventData.parking_info || '무료 주차 가능\n100대 수용',
                  accent: '#0984e3',
                  details: '발렛 서비스 제공'
                }
              ].map((card, index) => (
                <Animated.View 
                  key={index}
                  style={[
                    styles.app_infoCard,
                    {
                      opacity: cardAnims[14 + index],
                      transform: [{
                        translateY: cardAnims[14 + index].interpolate({
                          inputRange: [0, 1],
                          outputRange: [30, 0]
                        })
                      }, {
                        scale: cardAnims[14 + index].interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange: [0.95, 1.02, 1]
                        })
                      }]
                    }
                  ]}
                >
                  <View style={[styles.app_cardIcon, { backgroundColor: card.accent + '20' }]}>
                    <Text style={styles.app_cardIconText}>{card.icon}</Text>
                  </View>
                  <Text style={styles.app_cardTitle}>{card.title}</Text>
                  <Text style={styles.app_cardDescription}>{card.description}</Text>
                  <Text style={[styles.app_cardDetails, { color: card.accent }]}>{card.details}</Text>
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        </LinearGradient>

        {/* 커플 소개 섹션 - 신랑/신부 전용 사진 사용 */}
        <View style={styles.app_coupleSection}>
          <Animated.View 
            style={[
              styles.app_sectionContent,
              {
                opacity: cardAnims[18],
                transform: [{
                  translateY: cardAnims[18].interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0]
                  })
                }]
              }
            ]}
          >
            <Text style={styles.app_sectionTitle}>신랑 & 신부</Text>
            <Text style={styles.app_sectionSubtitle}>두 사람을 소개합니다</Text>
            
            <View style={styles.app_coupleCards}>
              {[
                {
                  image: safeImages.groom[0], // 신랑 전용 사진
                  name: eventData.groomName || eventData.groom_name || '김민수',
                  role: '신랑',
                  parents: `${eventData.groomFatherName || eventData.groom_father_name || '김○○'} · ${eventData.groomMotherName || eventData.groom_mother_name || '이○○'}의 장남`,
                },
                {
                  image: safeImages.bride[0], // 신부 전용 사진
                  name: eventData.brideName || eventData.bride_name || '박예은',
                  role: '신부',
                  parents: `${eventData.brideFatherName || eventData.bride_father_name || '박○○'} · ${eventData.brideMotherName || eventData.bride_mother_name || '최○○'}의 장녀`,
                }
              ].map((person, index) => (
                <Animated.View 
                  key={index}
                  style={[
                    styles.app_coupleCard,
                    {
                      opacity: cardAnims[19 + index],
                      transform: [{
                        translateY: cardAnims[19 + index].interpolate({
                          inputRange: [0, 1],
                          outputRange: [40, 0]
                        })
                      }, {
                        scale: cardAnims[19 + index].interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange: [0.95, 1.03, 1]
                        })
                      }]
                    }
                  ]}
                >
                  <View style={styles.app_couplePhotoContainer}>
                    <Image 
                      source={person.image}
                      style={styles.app_couplePhoto}
                      resizeMode="cover"
                    />
                  </View>
                  <Text style={styles.app_coupleName}>{person.name}</Text>
                  <Text style={styles.app_coupleRole}>{person.role}</Text>
                  <Text style={styles.app_coupleParents}>{person.parents}</Text>
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        </View>

        {/* 연락처 섹션 */}
        <LinearGradient 
          colors={['#ffffff', '#f8f9fa']} 
          style={styles.app_contactSection}
        >
          <Animated.View 
            style={[
              styles.app_sectionContent,
              {
                opacity: getSafeAnimValue(fadeAnims, 21),
                transform: [{
                  translateY: getSafeAnimValue(fadeAnims, 21, 0).interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0]
                  })
                }]
              }
            ]}
          >
            <Text style={styles.app_sectionTitle}>연락처</Text>
            <Text style={styles.app_sectionSubtitle}>문의사항이 있으시면 연락해주세요</Text>
            
            <View style={styles.app_contactCards}>
              {[
                { name: `신랑 ${eventData.groomName || eventData.groom_name || '민수'}`, role: '신랑', color: '#6c5ce7', phone: eventData.groomContact || eventData.groom_contact || '010-1234-5678' },
                { name: `신부 ${eventData.brideName || eventData.bride_name || '예은'}`, role: '신부', color: '#fd79a8', phone: eventData.brideContact || eventData.bride_contact || '010-9876-5432' }
              ].map((contact, index) => (
                <Animated.View
                  key={index}
                  style={[
                    {
                      opacity: getSafeAnimValue(fadeAnims, 22 + index),
                      transform: [{
                        scale: getSafeAnimValue(fadeAnims, 22 + index).interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.9, 1]
                        })
                      }]
                    }
                  ]}
                >
                  <TouchableOpacity 
                    style={styles.app_contactCard}
                    onPress={() => {
                      if (contact.phone) {
                        Linking.openURL(`tel:${contact.phone}`);
                      }
                    }}
                  >
                    <View style={[styles.app_contactAvatar, { backgroundColor: contact.color + '20' }]}>
                      <Text style={styles.app_contactAvatarText}>
                        {contact.role === '신랑' ? '👨' : '👩'}
                      </Text>
                    </View>
                    <View style={styles.app_contactInfo}>
                      <Text style={styles.app_contactName}>{contact.name}</Text>
                      <Text style={styles.app_contactPhone}>{contact.phone}</Text>
                      <Text style={styles.app_contactRole}>{contact.role}</Text>
                    </View>
                    <View style={[styles.app_contactButton, { backgroundColor: contact.color }]}>
                      <Ionicons name="call" size={16} color="#ffffff" />
                      <Text style={styles.app_contactButtonText}>전화</Text>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        </LinearGradient>

        {/* 부조하기 & 공유 섹션 */}
        <LinearGradient 
          colors={['#6c5ce7', '#5f3dc4']} 
          style={styles.app_shareSection}
        >
          <Animated.View 
            style={[
              styles.app_sectionContent,
              {
                opacity: getSafeAnimValue(fadeAnims, 24),
                transform: [{
                  translateY: getSafeAnimValue(fadeAnims, 24, 0).interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0]
                  })
                }, {
                  scale: getSafeAnimValue(fadeAnims, 24).interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.9, 1.05, 1]
                  })
                }]
              }
            ]}
          >
            <Text style={styles.app_shareTitle}>마음을 전해주세요</Text>
            <Text style={styles.app_shareSubtitle}>
              소중한 분들의 축복과 마음이 큰 힘이 됩니다
            </Text>
            
            {/* 부조하기 버튼 */}
            <Animated.View
              style={[
                {
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
                style={styles.app_donationButton}
                onPress={() => {
                  // 부조하기 기능 구현 예정
                  console.log('부조하기 버튼 클릭됨');
                }}
              >
                <Ionicons name="gift" size={20} color="#6c5ce7" style={{ marginRight: 8 }} />
                <Text style={styles.app_donationButtonText}>부조하기</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* 공유하기 버튼 */}
            <Animated.View
              style={[
                {
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
                style={styles.app_shareButton}
                onPress={async () => {
                  try {
                    const dateStr = formatDate(eventData.date || eventData.event_date, { defaultDate: '2024년 11월 16일' });
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
                <Ionicons name="heart" size={20} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.app_shareButtonText}>청첩장 공유하기</Text>
              </TouchableOpacity>
            </Animated.View>
            
            <View style={styles.app_socialButtons}>
              {[
                { name: 'logo-instagram', label: 'Instagram', color: '#E4405F' },
                { name: 'logo-facebook', label: 'Facebook', color: '#1877F2' },
                { name: 'chatbubble-ellipses', label: 'KakaoTalk', color: '#FEE500' }
              ].map((social, index) => (
                <Animated.View
                  key={social.name}
                  style={[
                    {
                      opacity: getSafeAnimValue(fadeAnims, 25 + index),
                      transform: [{
                        translateY: getSafeAnimValue(fadeAnims, 25 + index, 0).interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 0]
                        })
                      }]
                    }
                  ]}
                >
                  <TouchableOpacity 
                    style={[styles.app_socialButton, { backgroundColor: social.color }]}
                  >
                    <Ionicons name={social.name} size={18} color="#ffffff" />
                    <Text style={styles.app_socialButtonText}>{social.label}</Text>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
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

export default VintageAppTemplate;