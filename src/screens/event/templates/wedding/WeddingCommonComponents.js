// src/screens/event/templates/wedding/WeddingCommonComponents.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Modal,
  Animated,
  Easing,
  PanResponder,
  ScrollView,
  Linking,
  Share,
  Platform,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  width, 
  height, 
  defaultImages, 
  KoreanColors, 
  getCalendarData,
  getSafeAnimValue 
} from './WeddingUtils';
import styles from './WeddingStyles';

// 꽃잎 컴포넌트
export const FallingPetals = () => {
  const petals = useRef([...Array(15)].map(() => ({
    anim: new Animated.Value(0),
    x: Math.random() * width,
    delay: Math.random() * 5000,
  }))).current;
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    
    const startPetals = () => {
      if (!isMountedRef.current) return;
      
      petals.forEach((petal, index) => {
        const animateLoop = () => {
          if (!isMountedRef.current) return;
          
          Animated.loop(
            Animated.timing(petal.anim, {
              toValue: 1,
              duration: 8000 + (index * 1000),
              delay: petal.delay,
              useNativeDriver: true,
              easing: Easing.linear,
            }),
            { iterations: -1 }
          ).start();
        };
        
        setTimeout(animateLoop, index * 100);
      });
    };
    
    startPetals();
    
    return () => {
      isMountedRef.current = false;
      petals.forEach(petal => {
        petal.anim.stopAnimation();
      });
    };
  }, []);

  return (
    <View style={styles.petalsContainer}>
      {petals.map((petal, index) => (
        <Animated.View
          key={index}
          style={[
            styles.petal,
            {
              left: petal.x,
              transform: [{
                translateY: petal.anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-50, height + 50]
                })
              }, {
                rotate: petal.anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg']
                })
              }],
              opacity: petal.anim.interpolate({
                inputRange: [0, 0.1, 0.9, 1],
                outputRange: [0, 0.8, 0.8, 0]
              })
            }
          ]}
        >
          <Text style={styles.petalText}>🌸</Text>
        </Animated.View>
      ))}
    </View>
  );
};

// 하트 효과 컴포넌트
export const FloatingHearts = () => {
  const hearts = useRef([...Array(12)].map(() => ({
    anim: new Animated.Value(0),
    x: Math.random() * width,
    delay: Math.random() * 3000,
  }))).current;
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    
    hearts.forEach((heart, index) => {
      const animateHeart = () => {
        if (!isMountedRef.current) return;
        
        Animated.loop(
          Animated.sequence([
            Animated.timing(heart.anim, {
              toValue: 1,
              duration: 6000 + (index * 500),
              delay: heart.delay,
              useNativeDriver: true,
              easing: Easing.inOut(Easing.ease),
            }),
            Animated.timing(heart.anim, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            })
          ]),
          { iterations: -1 }
        ).start();
      };
      
      setTimeout(animateHeart, index * 200);
    });
    
    return () => {
      isMountedRef.current = false;
      hearts.forEach(heart => {
        heart.anim.stopAnimation();
      });
    };
  }, []);

  return (
    <View style={styles.heartsContainer}>
      {hearts.map((heart, index) => (
        <Animated.Text
          key={index}
          style={[
            styles.floatingHeart,
            {
              left: heart.x,
              transform: [{
                translateY: heart.anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, -100]
                })
              }, {
                scale: heart.anim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0, 1.2, 0]
                })
              }],
              opacity: heart.anim.interpolate({
                inputRange: [0, 0.3, 0.7, 1],
                outputRange: [0, 1, 1, 0]
              })
            }
          ]}
        >
          {['💕', '💖', '💗', '❤️', '💓'][index % 5]}
        </Animated.Text>
      ))}
    </View>
  );
};

// 하트 펄스 컴포넌트
export const HeartPulse = ({ style, delay = 0 }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const isMountedRef = useRef(true);
  
  useEffect(() => {
    isMountedRef.current = true;
    
    const pulse = () => {
      if (!isMountedRef.current) return;
      
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.3,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.in(Easing.ease),
        }),
      ]).start((finished) => {
        if (finished && isMountedRef.current) {
          requestAnimationFrame(pulse);
        }
      });
    };
    
    const timer = setTimeout(() => {
      if (isMountedRef.current) {
        pulse();
      }
    }, delay);
    
    return () => {
      isMountedRef.current = false;
      clearTimeout(timer);
      scaleAnim.stopAnimation();
    };
  }, [delay, scaleAnim]);

  return (
    <Animated.View style={[style, { transform: [{ scale: scaleAnim }] }]}>
      <Text style={styles.heartIcon}>💖</Text>
    </Animated.View>
  );
};

// 카운트다운 디스플레이 컴포넌트
export const CountdownDisplay = ({ timeLeft, style, textStyle, labelStyle, isExpired = false }) => {
  if (isExpired) {
    return (
      <View style={[styles.countdownExpired, style]}>
        <Text style={[styles.countdownExpiredText, textStyle]}>
          D-Day! 축하합니다! 🎉
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.countdownContainer, style]}>
      <View style={styles.countdownItem}>
        <Text style={[styles.countdownNumber, textStyle]}>{timeLeft.days}</Text>
        <Text style={[styles.countdownLabel, labelStyle]}>일</Text>
      </View>
      <View style={styles.countdownItem}>
        <Text style={[styles.countdownNumber, textStyle]}>{timeLeft.hours}</Text>
        <Text style={[styles.countdownLabel, labelStyle]}>시간</Text>
      </View>
      <View style={styles.countdownItem}>
        <Text style={[styles.countdownNumber, textStyle]}>{timeLeft.minutes}</Text>
        <Text style={[styles.countdownLabel, labelStyle]}>분</Text>
      </View>
      <View style={styles.countdownItem}>
        <Text style={[styles.countdownNumber, textStyle]}>{timeLeft.seconds}</Text>
        <Text style={[styles.countdownLabel, labelStyle]}>초</Text>
      </View>
    </View>
  );
};

// 이미지 뷰어 컴포넌트
export const ImageViewer = ({ visible, images = [], currentIndex, onClose, onIndexChange }) => {
  const scrollX = useRef(new Animated.Value(0)).current;
  const [imageIndex, setImageIndex] = useState(currentIndex || 0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (isMountedRef.current && currentIndex !== undefined) {
      setImageIndex(currentIndex);
    }
  }, [currentIndex]);

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: () => true,
    onPanResponderRelease: (evt, gestureState) => {
      if (!isMountedRef.current) return;
      
      requestAnimationFrame(() => {
        if (!isMountedRef.current) return;
        
        if (gestureState.dx > 50 && imageIndex > 0) {
          const newIndex = imageIndex - 1;
          setImageIndex(newIndex);
          onIndexChange && onIndexChange(newIndex);
        } else if (gestureState.dx < -50 && imageIndex < images.length - 1) {
          const newIndex = imageIndex + 1;
          setImageIndex(newIndex);
          onIndexChange && onIndexChange(newIndex);
        }
      });
    },
  });

  if (!images || images.length === 0) {
    return null;
  }

  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <View style={styles.imageViewerContainer}>
        <TouchableOpacity style={styles.imageViewerClose} onPress={onClose}>
          <Ionicons name="close" size={30} color="#ffffff" />
        </TouchableOpacity>
        
        <View style={styles.imageViewerContent} {...panResponder.panHandlers}>
          <Image 
            source={(images[imageIndex] || images[0] || defaultImages[0])}
            style={styles.imageViewerImage}
            resizeMode="contain"
          />
        </View>
        
        <View style={styles.imageViewerIndicator}>
          <Text style={styles.imageViewerCounter}>
            {imageIndex + 1} / {images.length}
          </Text>
        </View>
      </View>
    </Modal>
  );
};

// 메인 슬라이드쇼 컴포넌트 (5장까지)
export const MainPhotoSlideshow = ({ images = [], style, onImagePress, template = 'modern' }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef(null);
  const isMountedRef = useRef(true);
  const isChangingRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // 메인사진은 최대 5장까지만 사용
  const mainImages = images && images.length > 0 ? images.slice(0, 5) : defaultImages.slice(0, 5);

  useEffect(() => {
    if (mainImages.length > 1) {
      intervalRef.current = setInterval(() => {
        if (!isMountedRef.current || isChangingRef.current) return;
        
        isChangingRef.current = true;
        
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start((finished) => {
          if (finished && isMountedRef.current) {
            requestAnimationFrame(() => {
              if (isMountedRef.current) {
                setCurrentIndex((prev) => (prev + 1) % mainImages.length);
                // 이미지 변경 후 바로 다시 페이드인
                setTimeout(() => {
                  if (isMountedRef.current) {
                    Animated.timing(fadeAnim, {
                      toValue: 1,
                      duration: 300,
                      useNativeDriver: true,
                    }).start(() => {
                      isChangingRef.current = false;
                    });
                  }
                }, 50);
              }
            });
          }
        });
      }, 3000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [mainImages.length, fadeAnim]);

  return (
    <TouchableOpacity 
      style={[styles.mainPhotoSlideshow, style]}
      onPress={() => onImagePress && onImagePress(currentIndex)}
    >
      <Animated.View style={{ opacity: fadeAnim }}>
        <Image 
          source={mainImages[currentIndex] || mainImages[0] || defaultImages[0]}
          style={styles.mainPhotoImage}
          resizeMode="cover"
        />
      </Animated.View>
      
      {/* 인디케이터 */}
      <View style={styles.mainPhotoIndicators}>
        {mainImages.map((_, index) => (
          <View 
            key={index}
            style={[
              styles.mainPhotoIndicator,
              { opacity: index === currentIndex ? 1 : 0.3 }
            ]}
          />
        ))}
      </View>
    </TouchableOpacity>
  );
};

// 사진 갤러리 컴포넌트
export const PhotoGallery = ({ images = [], style, onImagePress, autoSlide = false, template = 'modern' }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (autoSlide && images && images.length > 1) {
      const startSlideShow = () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        
        intervalRef.current = setInterval(() => {
          if (!isMountedRef.current) return;
          
          // 페이드아웃
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }).start((finished) => {
            if (finished && isMountedRef.current) {
              // requestAnimationFrame을 사용하여 안전하게 state 업데이트
              requestAnimationFrame(() => {
                if (isMountedRef.current) {
                  setCurrentIndex((prev) => (prev + 1) % images.length);
                  // 페이드인
                  Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                  }).start();
                }
              });
            }
          });
        }, 4000);
      };

      startSlideShow();

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }
  }, [images?.length, autoSlide, fadeAnim]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  if (!images || images.length === 0) {
    return (
      <View style={[styles.galleryAutoSlide, style]}>
        <View style={styles.galleryAutoSlideImage}>
          <Text style={{ textAlign: 'center', color: '#666', marginTop: 50 }}>
            사진이 없습니다
          </Text>
        </View>
      </View>
    );
  }

  if (autoSlide) {
    return (
      <TouchableOpacity 
        style={[styles.galleryAutoSlide, style]}
        onPress={() => onImagePress && onImagePress(currentIndex)}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          <Image 
            source={images[currentIndex] || images[0] || defaultImages[0]}
            style={styles.galleryAutoSlideImage}
            resizeMode="cover"
          />
        </Animated.View>
        <View style={styles.galleryAutoSlideIndicators}>
          {images.map((_, index) => (
            <View 
              key={index}
              style={[
                styles.galleryIndicator,
                { opacity: index === currentIndex ? 1 : 0.3 }
              ]}
            />
          ))}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <ScrollView
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      style={[styles.galleryScroll, style]}
      onScroll={Animated.event(
        [{ nativeEvent: { contentOffset: { x: slideAnim } } }],
        { useNativeDriver: false }
      )}
    >
      {images.map((image, index) => (
        <TouchableOpacity 
          key={index}
          style={styles.galleryItem}
          onPress={() => onImagePress(index)}
        >
          <Image 
            source={image}
            style={styles.galleryItemImage}
            resizeMode="cover"
          />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// 모던 다크 달력 컴포넌트
export const ModernDarkCalendar = ({ targetDate, style }) => {
  const calendarData = getCalendarData(targetDate);
  const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  
  const pulseAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
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
  }, []);
  
  return (
    <View style={[styles.modernCalendar, style]}>
      <LinearGradient
        colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
        style={styles.modernCalendarContainer}
      >
        <View style={styles.modernCalendarHeader}>
          <Text style={styles.modernCalendarTitle}>
            {calendarData.monthNameEn} {calendarData.year}
          </Text>
        </View>
        
        <View style={styles.modernCalendarWeekDays}>
          {weekDays.map((day, index) => (
            <Text key={index} style={[
              styles.modernCalendarWeekDay,
              (index === 0 || index === 6) && styles.modernCalendarWeekendDay
            ]}>
              {day}
            </Text>
          ))}
        </View>
        
        <View style={styles.modernCalendarGrid}>
          {calendarData.days.map((dayData, index) => (
            <View key={index} style={styles.modernCalendarDayContainer}>
              {dayData.isTargetDate ? (
                <Animated.View style={[
                  styles.modernCalendarDay,
                  styles.modernCalendarTargetDay,
                  {
                    transform: [{
                      scale: pulseAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.1]
                      })
                    }],
                    shadowOpacity: pulseAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.3, 0.7]
                    })
                  }
                ]}>
                  <Text style={styles.modernCalendarTargetDayText}>{dayData.day}</Text>
                  <Text style={styles.modernCalendarDDayText}>💖</Text>
                </Animated.View>
              ) : (
                <View style={[
                  styles.modernCalendarDay,
                  dayData.isToday && styles.modernCalendarToday,
                  !dayData.isCurrentMonth && styles.modernCalendarOtherMonth
                ]}>
                  <Text style={[
                    styles.modernCalendarDayText,
                    dayData.isToday && styles.modernCalendarTodayText,
                    !dayData.isCurrentMonth && styles.modernCalendarOtherMonthText,
                    (index % 7 === 0 || index % 7 === 6) && styles.modernCalendarWeekendText
                  ]}>
                    {dayData.day}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </LinearGradient>
    </View>
  );
};

// 한국 전통 달력 컴포넌트
export const KoreanElegantCalendar = ({ targetDate, style }) => {
  const calendarData = getCalendarData(targetDate);
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
  
  const glowAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: false,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: false,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    ).start();
  }, []);
  
  return (
    <View style={[styles.koreanCalendar, style]}>
      <LinearGradient
        colors={[KoreanColors.elegant.light, KoreanColors.elegant.secondary]}
        style={styles.koreanCalendarContainer}
      >
        <View style={styles.koreanCalendarHeader}>
          <View style={styles.koreanCalendarDecoLine} />
          <Text style={styles.koreanCalendarTitle}>
            {calendarData.year}년 {calendarData.monthName}
          </Text>
          <View style={styles.koreanCalendarDecoLine} />
        </View>
        
        <View style={styles.koreanCalendarWeekDays}>
          {weekDays.map((day, index) => (
            <Text key={index} style={[
              styles.koreanCalendarWeekDay,
              (index === 0 || index === 6) && styles.koreanCalendarWeekendDay
            ]}>
              {day}
            </Text>
          ))}
        </View>
        
        <View style={styles.koreanCalendarGrid}>
          {calendarData.days.map((dayData, index) => (
            <View key={index} style={styles.koreanCalendarDayContainer}>
              {dayData.isTargetDate ? (
                <Animated.View style={[
                  styles.koreanCalendarDay,
                  styles.koreanCalendarTargetDay,
                  {
                    shadowColor: glowAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [KoreanColors.elegant.accent, KoreanColors.elegant.primary]
                    }),
                    shadowOpacity: glowAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.3, 0.8]
                    })
                  }
                ]}>
                  <Text style={styles.koreanCalendarTargetDayText}>{dayData.day}</Text>
                  <Text style={styles.koreanCalendarDDayText}>💗</Text>
                </Animated.View>
              ) : (
                <View style={[
                  styles.koreanCalendarDay,
                  dayData.isToday && styles.koreanCalendarToday,
                  !dayData.isCurrentMonth && styles.koreanCalendarOtherMonth
                ]}>
                  <Text style={[
                    styles.koreanCalendarDayText,
                    dayData.isToday && styles.koreanCalendarTodayText,
                    !dayData.isCurrentMonth && styles.koreanCalendarOtherMonthText,
                    (index % 7 === 0) && styles.koreanCalendarSundayText,
                    (index % 7 === 6) && styles.koreanCalendarSaturdayText
                  ]}>
                    {dayData.day}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </LinearGradient>
    </View>
  );
};

// 빈티지 앱 달력 컴포넌트
export const VintageAppCalendar = ({ targetDate, style }) => {
  const calendarData = getCalendarData(targetDate);
  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.in(Easing.ease),
        }),
      ])
    ).start();
    
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 8000,
        useNativeDriver: true,
        easing: Easing.linear,
      })
    ).start();
  }, []);
  
  return (
    <View style={[styles.vintageCalendar, style]}>
      <View style={styles.vintageCalendarContainer}>
        <LinearGradient
          colors={['#6c5ce7', '#a29bfe']}
          style={styles.vintageCalendarHeader}
        >
          <Text style={styles.vintageCalendarTitle}>
            {calendarData.monthNameEn} {calendarData.year}
          </Text>
          <View style={styles.vintageCalendarHeaderDeco}>
            <Text style={styles.vintageCalendarEmojiLeft}>📅</Text>
            <Text style={styles.vintageCalendarEmojiRight}>💝</Text>
          </View>
        </LinearGradient>
        
        <View style={styles.vintageCalendarContent}>
          <View style={styles.vintageCalendarWeekDays}>
            {weekDays.map((day, index) => (
              <Text key={index} style={[
                styles.vintageCalendarWeekDay,
                (index === 0 || index === 6) && styles.vintageCalendarWeekendDay
              ]}>
                {day}
              </Text>
            ))}
          </View>
          
          <View style={styles.vintageCalendarGrid}>
            {calendarData.days.map((dayData, index) => (
              <View key={index} style={styles.vintageCalendarDayContainer}>
                {dayData.isTargetDate ? (
                  <Animated.View style={[
                    styles.vintageCalendarDay,
                    styles.vintageCalendarTargetDay,
                    {
                      transform: [{
                        translateY: bounceAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, -3]
                        })
                      }, {
                        rotate: rotateAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '360deg']
                        })
                      }]
                    }
                  ]}>
                    <Text style={styles.vintageCalendarTargetDayText}>{dayData.day}</Text>
                    <Text style={styles.vintageCalendarDDayText}>💕</Text>
                  </Animated.View>
                ) : (
                  <View style={[
                    styles.vintageCalendarDay,
                    dayData.isToday && styles.vintageCalendarToday,
                    !dayData.isCurrentMonth && styles.vintageCalendarOtherMonth
                  ]}>
                    <Text style={[
                      styles.vintageCalendarDayText,
                      dayData.isToday && styles.vintageCalendarTodayText,
                      !dayData.isCurrentMonth && styles.vintageCalendarOtherMonthText,
                      (index % 7 === 0 || index % 7 === 6) && styles.vintageCalendarWeekendText
                    ]}>
                      {dayData.day}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
};

// ========== 추가된 컴포넌트들 ==========

// RomanticPinkCalendar 컴포넌트 (로맨틱 핑크 달력)
export const RomanticPinkCalendar = ({ targetDate, style }) => {
  const calendarData = getCalendarData(targetDate);
  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  
  return (
    <View style={{
      backgroundColor: 'white',
      borderRadius: 15,
      padding: 30,
      marginVertical: 30,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.08,
      shadowRadius: 30,
      elevation: 5,
      ...style
    }}>
      <Text style={{
        fontSize: 18,
        color: '#333',
        marginBottom: 25,
        fontWeight: '500',
        textAlign: 'center'
      }}>
        {calendarData.monthNameEn} {calendarData.year}
      </Text>
      
      <View style={{ flexDirection: 'row', marginBottom: 15 }}>
        {weekDays.map((day, index) => (
          <Text key={index} style={{
            flex: 1,
            textAlign: 'center',
            fontSize: 12,
            color: index === 0 ? '#ff6b6b' : '#666',
            fontWeight: '500'
          }}>
            {day}
          </Text>
        ))}
      </View>
      
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {calendarData.days.map((dayData, index) => (
          <View key={index} style={{ 
            width: '14.28%', 
            aspectRatio: 1,
            padding: 5 
          }}>
            {dayData.isTargetDate ? (
              <View style={{
                flex: 1,
                backgroundColor: '#C2B0A2',
                borderRadius: 8,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#C2B0A2',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.4,
                shadowRadius: 15,
                elevation: 3
              }}>
                <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>
                  {dayData.day}
                </Text>
              </View>
            ) : (
              <View style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 8
              }}>
                <Text style={{
                  color: !dayData.isCurrentMonth ? '#ddd' : 
                         index % 7 === 0 ? '#ff6b6b' : '#666',
                  fontSize: 14
                }}>
                  {dayData.day || ''}
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
  );
};

// OpeningOverlay 컴포넌트 (오프닝 오버레이)
export const OpeningOverlay = ({ visible }) => {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const strokeAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    if (visible) {
      // 텍스트 쓰기 애니메이션
      Animated.timing(strokeAnim, {
        toValue: 1,
        duration: 2500,
        useNativeDriver: false,
        easing: Easing.ease,
      }).start();
      
      // 페이드아웃
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 1500,
        delay: 3500,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);
  
  if (!visible) return null;
  
  return (
    <Animated.View 
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        zIndex: 9999,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: fadeAnim
      }}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <Text style={{
        fontFamily: Platform.OS === 'ios' ? 'Snell Roundhand' : 'cursive',
        fontSize: 48,
        color: 'white',
        fontStyle: 'italic'
      }}>
        Happy Wedding
      </Text>
    </Animated.View>
  );
};

// GuestBookMessages 컴포넌트 (방명록 메시지)
export const GuestBookMessages = ({ messages = [], onAddMessage }) => {
  return (
    <View style={{ maxWidth: 400, alignSelf: 'center', width: '100%' }}>
      {messages.map((message, index) => (
        <View key={index} style={{
          backgroundColor: 'white',
          borderRadius: 15,
          padding: 25,
          marginBottom: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 5 },
          shadowOpacity: 0.05,
          shadowRadius: 15,
          elevation: 3
        }}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 15
          }}>
            <Text style={{ color: '#999', fontSize: 13 }}>
              From. {message.from}
            </Text>
            <Text style={{ color: '#DDD', fontSize: 12 }}>
              {message.date}
            </Text>
          </View>
          <Text style={{
            lineHeight: 24,
            color: '#555',
            fontSize: 14
          }}>
            {message.content}
          </Text>
        </View>
      ))}
      
      <TouchableOpacity 
        style={{
          width: '100%',
          padding: 18,
          borderRadius: 30,
          marginTop: 30,
          overflow: 'hidden'
        }}
        onPress={onAddMessage}
      >
        <LinearGradient
          colors={['#C2B0A2', '#9B8D82']}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            borderRadius: 30
          }}
        />
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Text style={{ fontSize: 16, marginRight: 8 }}>💌</Text>
          <Text style={{ color: 'white', fontSize: 15, fontWeight: '500' }}>
            축하 메시지 남기기
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

// AccountToggle 컴포넌트 (계좌번호 토글)
export const AccountToggle = ({ 
  groomAccount, 
  brideAccount, 
  activeToggle, 
  onToggle, 
  onCopy 
}) => {
  return (
    <View style={{ maxWidth: 400, alignSelf: 'center', width: '100%' }}>
      {/* 신랑 계좌 */}
      <View style={{
        marginBottom: 15,
        borderRadius: 15,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 3,
        backgroundColor: 'white'
      }}>
        <TouchableOpacity 
          onPress={() => onToggle('groom')}
        >
          <LinearGradient
            colors={['#C2B0A2', '#9B8D82']}
            style={{
              padding: 20,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <Text style={{ color: 'white', fontSize: 15, fontWeight: '500' }}>
              신랑측 계좌번호
            </Text>
            <Text style={{ 
              color: 'white', 
              fontSize: 18,
              transform: [{ rotate: activeToggle === 'groom' ? '180deg' : '0deg' }]
            }}>
              ▼
            </Text>
          </LinearGradient>
        </TouchableOpacity>
        
        {activeToggle === 'groom' && (
          <View style={{
            backgroundColor: 'white',
            padding: 25
          }}>
            <Text style={{ fontWeight: 'bold', fontSize: 14, marginBottom: 5 }}>
              {groomAccount.bank}
            </Text>
            <Text style={{ fontSize: 15, marginBottom: 5, color: '#333' }}>
              {groomAccount.number}
            </Text>
            <Text style={{ fontSize: 13, color: '#666', marginBottom: 15 }}>
              예금주: {groomAccount.name}
            </Text>
            <TouchableOpacity 
              style={{
                backgroundColor: '#FFE0EC',
                paddingVertical: 10,
                paddingHorizontal: 25,
                borderRadius: 20,
                alignSelf: 'flex-start'
              }}
              onPress={() => onCopy(groomAccount.number)}
            >
              <Text style={{ color: '#666', fontSize: 13 }}>
                계좌번호 복사
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      {/* 신부 계좌 */}
      <View style={{
        marginBottom: 15,
        borderRadius: 15,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 3,
        backgroundColor: 'white'
      }}>
        <TouchableOpacity 
          onPress={() => onToggle('bride')}
        >
          <LinearGradient
            colors={['#C2B0A2', '#9B8D82']}
            style={{
              padding: 20,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <Text style={{ color: 'white', fontSize: 15, fontWeight: '500' }}>
              신부측 계좌번호
            </Text>
            <Text style={{ 
              color: 'white', 
              fontSize: 18,
              transform: [{ rotate: activeToggle === 'bride' ? '180deg' : '0deg' }]
            }}>
              ▼
            </Text>
          </LinearGradient>
        </TouchableOpacity>
        
        {activeToggle === 'bride' && (
          <View style={{
            backgroundColor: 'white',
            padding: 25
          }}>
            <Text style={{ fontWeight: 'bold', fontSize: 14, marginBottom: 5 }}>
              {brideAccount.bank}
            </Text>
            <Text style={{ fontSize: 15, marginBottom: 5, color: '#333' }}>
              {brideAccount.number}
            </Text>
            <Text style={{ fontSize: 13, color: '#666', marginBottom: 15 }}>
              예금주: {brideAccount.name}
            </Text>
            <TouchableOpacity 
              style={{
                backgroundColor: '#FFE0EC',
                paddingVertical: 10,
                paddingHorizontal: 25,
                borderRadius: 20,
                alignSelf: 'flex-start'
              }}
              onPress={() => onCopy(brideAccount.number)}
            >
              <Text style={{ color: '#666', fontSize: 13 }}>
                계좌번호 복사
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};