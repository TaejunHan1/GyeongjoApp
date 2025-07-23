// // src/screens/event/ContributionScreen.js - QR 스캔 지원 수정
// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   SafeAreaView,
//   ScrollView,
//   Alert,
//   KeyboardAvoidingView,
//   Platform,
// } from 'react-native';
// import { StatusBar } from 'expo-status-bar';
// import { Ionicons } from '@expo/vector-icons';
// import { Colors } from '../../styles/constants';
// import { getEventDetail, addContribution } from '../../lib/supabaseHelper';

// export default function ContributionScreen({ navigation, route }) {
//   const { eventId, eventName, fromQR = false } = route.params;
  
//   const [event, setEvent] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
  
//   const [formData, setFormData] = useState({
//     contributorName: '',
//     amount: '',
//     customAmount: '',
//     relation: '',
//     message: '',
//     useCustomAmount: false,
//   });

//   useEffect(() => {
//     loadEventData();
//   }, [eventId]);

//   const loadEventData = async () => {
//     try {
//       setLoading(true);
//       const result = await getEventDetail(eventId);
      
//       if (result.success) {
//         setEvent(result.data);
        
//         // 첫 번째 관계를 기본값으로 설정
//         if (result.data.family_relations && result.data.family_relations.length > 0) {
//           setFormData(prev => ({
//             ...prev,
//             relation: result.data.family_relations[0]
//           }));
//         }
//       } else {
//         Alert.alert('오류', result.error || '경조사 정보를 불러올 수 없습니다.');
//         navigation.goBack();
//       }
//     } catch (error) {
//       console.error('Event loading error:', error);
//       Alert.alert('오류', '경조사 정보를 불러오는 중 오류가 발생했습니다.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const formatAmount = (amount) => {
//     if (!amount) return '';
//     return new Intl.NumberFormat('ko-KR').format(amount) + '원';
//   };

//   const parseAmount = (amountString) => {
//     return parseInt(amountString.replace(/[^\d]/g, '')) || 0;
//   };

//   const handleAmountSelect = (amount) => {
//     setFormData({
//       ...formData,
//       amount: amount.toString(),
//       customAmount: '',
//       useCustomAmount: false,
//     });
//   };

//   const handleCustomAmountChange = (text) => {
//     const numbers = text.replace(/[^\d]/g, '');
//     setFormData({
//       ...formData,
//       customAmount: numbers,
//       amount: '',
//       useCustomAmount: true,
//     });
//   };

//   const getSelectedAmount = () => {
//     if (formData.useCustomAmount) {
//       return parseAmount(formData.customAmount);
//     }
//     return parseAmount(formData.amount);
//   };

//   const validateForm = () => {
//     if (!formData.contributorName.trim()) {
//       Alert.alert('알림', '성함을 입력해주세요.');
//       return false;
//     }
    
//     const amount = getSelectedAmount();
//     if (!amount || amount < 1000) {
//       Alert.alert('알림', '부조금을 1,000원 이상 입력해주세요.');
//       return false;
//     }
    
//     return true;
//   };

//   const handleSubmit = async () => {
//     if (!validateForm()) return;
    
//     setSaving(true);
    
//     try {
//       // 데이터베이스 스키마에 맞게 매핑
//       const contributionData = {
//         event_id: eventId,
//         contributor_name: formData.contributorName.trim(),
//         amount: getSelectedAmount(),
//         relation_to: formData.relation || null, // 스키마에 맞는 컬럼명
//         notes: formData.message.trim() || null, // message -> notes로 변경
//         is_confirmed: false,
//         is_manual_entry: !fromQR, // QR로 온 경우 false, 수동 입력은 true
//       };
      
//       console.log('💰 부조금 데이터:', contributionData);
      
//       const result = await addContribution(contributionData);
      
//       if (result.success) {
//         const successMessage = fromQR 
//           ? `${formData.contributorName}님, 부조해주셔서 감사합니다.\n${formatAmount(getSelectedAmount())}`
//           : `${formData.contributorName}님의 부조가 등록되었습니다.\n${formatAmount(getSelectedAmount())}`;
          
//         Alert.alert(
//           '부조 완료',
//           successMessage,
//           [
//             {
//               text: '확인',
//               onPress: () => {
//                 if (fromQR) {
//                   // QR로 온 경우 특별한 안내 메시지
//                   Alert.alert(
//                     '감사합니다',
//                     '소중한 마음 잘 전달되었습니다.\n행사에 참석해주셔서 감사합니다.',
//                     [{ text: '확인', onPress: () => navigation.goBack() }]
//                   );
//                 } else {
//                   navigation.goBack();
//                 }
//               },
//             },
//           ]
//         );
//       } else {
//         Alert.alert('오류', result.error || '부조 등록에 실패했습니다.');
//       }
//     } catch (error) {
//       console.error('Contribution submit error:', error);
//       Alert.alert('오류', '부조 등록 중 오류가 발생했습니다.');
//     } finally {
//       setSaving(false);
//     }
//   };

//   if (loading) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <View style={styles.loadingContainer}>
//           <Ionicons name="heart" size={32} color={Colors.primary} />
//           <Text style={styles.loadingText}>불러오는 중...</Text>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   if (!event) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <View style={styles.errorContainer}>
//           <Ionicons name="alert-circle" size={48} color={Colors.error} />
//           <Text style={styles.errorTitle}>경조사를 찾을 수 없습니다</Text>
//           <TouchableOpacity 
//             style={styles.backButton}
//             onPress={() => navigation.goBack()}
//           >
//             <Text style={styles.backButtonText}>돌아가기</Text>
//           </TouchableOpacity>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar style="dark" />
      
//       <KeyboardAvoidingView 
//         style={styles.content}
//         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//       >
//         <ScrollView showsVerticalScrollIndicator={false}>
//           {/* QR 스캔 안내 (QR로 온 경우만) */}
//           {fromQR && (
//             <View style={styles.qrWelcomeSection}>
//               <View style={styles.qrIcon}>
//                 <Ionicons name="qr-code" size={32} color={Colors.primary} />
//               </View>
//               <Text style={styles.qrWelcomeTitle}>QR 코드로 참여해주셔서 감사합니다!</Text>
//               <Text style={styles.qrWelcomeSubtitle}>
//                 간편하게 부조금을 등록하실 수 있습니다
//               </Text>
//             </View>
//           )}

//           {/* 경조사 정보 헤더 */}
//           <View style={styles.eventHeader}>
//             <View style={styles.eventIcon}>
//               <Ionicons 
//                 name={event.event_type === 'wedding' ? 'heart' : 
//                       event.event_type === 'funeral' ? 'flower' :
//                       event.event_type === 'birthday' ? 'gift' : 'calendar'} 
//                 size={24} 
//                 color={event.event_type === 'wedding' ? Colors.wedding :
//                        event.event_type === 'funeral' ? Colors.funeral :
//                        event.event_type === 'birthday' ? Colors.celebration : Colors.other} 
//               />
//             </View>
//             <View style={styles.eventInfo}>
//               <Text style={styles.eventTitle}>{event.event_name}</Text>
//               <Text style={styles.eventDate}>
//                 {event.event_date ? 
//                   new Date(event.event_date).toLocaleDateString('ko-KR', {
//                     year: 'numeric',
//                     month: 'long',
//                     day: 'numeric',
//                   }) : 
//                   '날짜 미정'
//                 }
//               </Text>
//               {event.location && (
//                 <Text style={styles.eventLocation}>📍 {event.location}</Text>
//               )}
//             </View>
//           </View>

//           {/* 안내 메시지 */}
//           <View style={styles.welcomeSection}>
//             <Text style={styles.welcomeTitle}>
//               {event.event_type === 'funeral' ? '위로의 마음을 전해주세요' : '마음을 전해주세요'}
//             </Text>
//             <Text style={styles.welcomeSubtitle}>
//               {event.event_type === 'funeral' 
//                 ? '고인의 명복을 빌며 정성스러운 마음을 전해주세요' 
//                 : '정성스러운 마음이 가장 소중합니다'
//               }
//             </Text>
//           </View>

//           {/* 성함 입력 */}
//           <View style={styles.section}>
//             <Text style={styles.sectionTitle}>성함</Text>
//             <TextInput
//               style={styles.nameInput}
//               placeholder="성함을 입력해주세요"
//               value={formData.contributorName}
//               onChangeText={(text) => setFormData({ ...formData, contributorName: text })}
//               placeholderTextColor={Colors.gray400}
//             />
//           </View>

//           {/* 관계 선택 */}
//           {event.family_relations && event.family_relations.length > 0 && (
//             <View style={styles.section}>
//               <Text style={styles.sectionTitle}>관계</Text>
//               <Text style={styles.sectionSubtitle}>누구의 지인이신가요? (선택사항)</Text>
//               <View style={styles.relationGrid}>
//                 {event.family_relations.map((relation, index) => (
//                   <TouchableOpacity
//                     key={index}
//                     style={[
//                       styles.relationItem,
//                       formData.relation === relation && styles.relationItemSelected,
//                     ]}
//                     onPress={() => setFormData({ ...formData, relation })}
//                   >
//                     <Text style={[
//                       styles.relationText,
//                       formData.relation === relation && styles.relationTextSelected,
//                     ]}>
//                       {relation}
//                     </Text>
//                   </TouchableOpacity>
//                 ))}
//                 <TouchableOpacity
//                   style={[
//                     styles.relationItem,
//                     !formData.relation && styles.relationItemSelected,
//                   ]}
//                   onPress={() => setFormData({ ...formData, relation: '' })}
//                 >
//                   <Text style={[
//                     styles.relationText,
//                     !formData.relation && styles.relationTextSelected,
//                   ]}>
//                     선택 안함
//                   </Text>
//                 </TouchableOpacity>
//               </View>
//             </View>
//           )}

//           {/* 부조금 선택 */}
//           <View style={styles.section}>
//             <Text style={styles.sectionTitle}>
//               {event.event_type === 'funeral' ? '조의금' : '부조금'}
//             </Text>
//             <Text style={styles.sectionSubtitle}>금액을 선택하거나 직접 입력해주세요</Text>
            
//             {/* 미리 설정된 금액 */}
//             {event.preset_amounts && event.preset_amounts.length > 0 && (
//               <View style={styles.amountGrid}>
//                 {event.preset_amounts.map((amount, index) => (
//                   <TouchableOpacity
//                     key={index}
//                     style={[
//                       styles.amountItem,
//                       !formData.useCustomAmount && formData.amount === amount.toString() && 
//                         styles.amountItemSelected,
//                     ]}
//                     onPress={() => handleAmountSelect(amount)}
//                   >
//                     <Text style={[
//                       styles.amountText,
//                       !formData.useCustomAmount && formData.amount === amount.toString() && 
//                         styles.amountTextSelected,
//                     ]}>
//                       {formatAmount(amount)}
//                     </Text>
//                   </TouchableOpacity>
//                 ))}
//               </View>
//             )}

//             {/* 직접 입력 */}
//             <View style={styles.customAmountContainer}>
//               <Text style={styles.customAmountLabel}>직접 입력</Text>
//               <View style={styles.customAmountInput}>
//                 <TextInput
//                   style={[
//                     styles.amountTextInput,
//                     formData.useCustomAmount && styles.amountInputFocused,
//                   ]}
//                   placeholder="금액을 입력하세요"
//                   value={formData.customAmount ? formatAmount(parseAmount(formData.customAmount)) : ''}
//                   onChangeText={handleCustomAmountChange}
//                   onFocus={() => setFormData({ ...formData, useCustomAmount: true, amount: '' })}
//                   keyboardType="numeric"
//                   placeholderTextColor={Colors.gray400}
//                 />
//               </View>
//             </View>
//           </View>

//           {/* 메시지 (선택사항) */}
//           <View style={styles.section}>
//             <Text style={styles.sectionTitle}>메시지 (선택사항)</Text>
//             <TextInput
//               style={styles.messageInput}
//               placeholder={
//                 event.event_type === 'funeral' 
//                   ? "위로의 메시지를 남겨주세요" 
//                   : "축하 또는 응원의 메시지를 남겨주세요"
//               }
//               value={formData.message}
//               onChangeText={(text) => setFormData({ ...formData, message: text })}
//               multiline
//               numberOfLines={3}
//               textAlignVertical="top"
//               placeholderTextColor={Colors.gray400}
//             />
//           </View>

//           {/* 요약 */}
//           <View style={styles.summarySection}>
//             <Text style={styles.summaryTitle}>
//               {event.event_type === 'funeral' ? '조의 내역 확인' : '부조 내역 확인'}
//             </Text>
//             <View style={styles.summaryCard}>
//               <View style={styles.summaryRow}>
//                 <Text style={styles.summaryLabel}>성함</Text>
//                 <Text style={styles.summaryValue}>
//                   {formData.contributorName || '미입력'}
//                 </Text>
//               </View>
//               <View style={styles.summaryRow}>
//                 <Text style={styles.summaryLabel}>관계</Text>
//                 <Text style={styles.summaryValue}>
//                   {formData.relation || '선택 안함'}
//                 </Text>
//               </View>
//               <View style={styles.summaryRow}>
//                 <Text style={styles.summaryLabel}>
//                   {event.event_type === 'funeral' ? '조의금' : '부조금'}
//                 </Text>
//                 <Text style={[styles.summaryValue, styles.summaryAmount]}>
//                   {getSelectedAmount() > 0 ? formatAmount(getSelectedAmount()) : '미선택'}
//                 </Text>
//               </View>
//             </View>
//           </View>

//           <View style={{ height: 120 }} />
//         </ScrollView>

//         {/* 하단 버튼 */}
//         <View style={styles.buttonContainer}>
//           <TouchableOpacity
//             style={[
//               styles.submitButton,
//               { backgroundColor: event.event_type === 'funeral' ? Colors.funeral : Colors.primary },
//               (!formData.contributorName || getSelectedAmount() < 1000 || saving) && 
//                 styles.submitButtonDisabled
//             ]}
//             onPress={handleSubmit}
//             disabled={!formData.contributorName || getSelectedAmount() < 1000 || saving}
//           >
//             <Text style={[
//               styles.submitButtonText,
//               (!formData.contributorName || getSelectedAmount() < 1000 || saving) && 
//                 styles.submitButtonTextDisabled
//             ]}>
//               {saving ? '등록 중...' : (event.event_type === 'funeral' ? '조의 전하기' : '부조하기')}
//             </Text>
//           </TouchableOpacity>
//         </View>
//       </KeyboardAvoidingView>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: Colors.gray50,
//   },
//   content: {
//     flex: 1,
//   },
  
//   // 로딩 및 에러
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     gap: 16,
//   },
//   loadingText: {
//     fontSize: 16,
//     color: Colors.textSecondary,
//   },
//   errorContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     gap: 16,
//     paddingHorizontal: 40,
//   },
//   errorTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: Colors.textPrimary,
//     textAlign: 'center',
//   },
//   backButton: {
//     backgroundColor: Colors.primary,
//     paddingHorizontal: 24,
//     paddingVertical: 12,
//     borderRadius: 8,
//   },
//   backButtonText: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: Colors.white,
//   },
  
//   // QR 환영 섹션
//   qrWelcomeSection: {
//     backgroundColor: Colors.white,
//     padding: 20,
//     alignItems: 'center',
//     borderBottomWidth: 1,
//     borderBottomColor: Colors.gray100,
//   },
//   qrIcon: {
//     width: 56,
//     height: 56,
//     borderRadius: 28,
//     backgroundColor: Colors.gray50,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 16,
//   },
//   qrWelcomeTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: Colors.textPrimary,
//     textAlign: 'center',
//     marginBottom: 8,
//   },
//   qrWelcomeSubtitle: {
//     fontSize: 14,
//     color: Colors.textSecondary,
//     textAlign: 'center',
//   },
  
//   // 경조사 헤더
//   eventHeader: {
//     backgroundColor: Colors.white,
//     padding: 20,
//     flexDirection: 'row',
//     alignItems: 'center',
//     borderBottomWidth: 1,
//     borderBottomColor: Colors.gray100,
//   },
//   eventIcon: {
//     width: 48,
//     height: 48,
//     borderRadius: 24,
//     backgroundColor: Colors.gray50,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: 16,
//   },
//   eventInfo: {
//     flex: 1,
//   },
//   eventTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: Colors.textPrimary,
//     marginBottom: 4,
//   },
//   eventDate: {
//     fontSize: 14,
//     color: Colors.textSecondary,
//     marginBottom: 2,
//   },
//   eventLocation: {
//     fontSize: 14,
//     color: Colors.textSecondary,
//   },
  
//   // 환영 섹션
//   welcomeSection: {
//     backgroundColor: Colors.primary,
//     padding: 32,
//     alignItems: 'center',
//   },
//   welcomeTitle: {
//     fontSize: 24,
//     fontWeight: '700',
//     color: Colors.white,
//     marginBottom: 8,
//     textAlign: 'center',
//   },
//   welcomeSubtitle: {
//     fontSize: 16,
//     color: 'rgba(255, 255, 255, 0.9)',
//     textAlign: 'center',
//     lineHeight: 24,
//   },
  
//   // 섹션
//   section: {
//     backgroundColor: Colors.white,
//     padding: 20,
//     marginBottom: 12,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: Colors.textPrimary,
//     marginBottom: 8,
//   },
//   sectionSubtitle: {
//     fontSize: 14,
//     color: Colors.textSecondary,
//     marginBottom: 16,
//   },
  
//   // 이름 입력
//   nameInput: {
//     backgroundColor: Colors.gray50,
//     borderRadius: 12,
//     paddingHorizontal: 16,
//     paddingVertical: 16,
//     fontSize: 18,
//     color: Colors.textPrimary,
//     borderWidth: 1,
//     borderColor: Colors.gray200,
//     textAlign: 'center',
//     fontWeight: '500',
//   },
  
//   // 관계 선택
//   relationGrid: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 12,
//   },
//   relationItem: {
//     backgroundColor: Colors.gray50,
//     borderRadius: 8,
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     borderWidth: 1,
//     borderColor: Colors.gray200,
//     minWidth: '30%',
//     alignItems: 'center',
//   },
//   relationItemSelected: {
//     backgroundColor: Colors.primary,
//     borderColor: Colors.primary,
//   },
//   relationText: {
//     fontSize: 14,
//     fontWeight: '500',
//     color: Colors.textPrimary,
//   },
//   relationTextSelected: {
//     color: Colors.white,
//   },
  
//   // 부조금 선택
//   amountGrid: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 12,
//     marginBottom: 24,
//   },
//   amountItem: {
//     backgroundColor: Colors.gray50,
//     borderRadius: 12,
//     paddingHorizontal: 20,
//     paddingVertical: 16,
//     borderWidth: 2,
//     borderColor: Colors.gray200,
//     minWidth: '48%',
//     alignItems: 'center',
//   },
//   amountItemSelected: {
//     backgroundColor: Colors.primary,
//     borderColor: Colors.primary,
//   },
//   amountText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: Colors.textPrimary,
//   },
//   amountTextSelected: {
//     color: Colors.white,
//   },
  
//   // 커스텀 금액
//   customAmountContainer: {
//     marginTop: 16,
//   },
//   customAmountLabel: {
//     fontSize: 16,
//     fontWeight: '500',
//     color: Colors.textPrimary,
//     marginBottom: 12,
//   },
//   customAmountInput: {
//     backgroundColor: Colors.gray50,
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: Colors.gray200,
//   },
//   amountTextInput: {
//     paddingHorizontal: 16,
//     paddingVertical: 16,
//     fontSize: 18,
//     color: Colors.textPrimary,
//     textAlign: 'center',
//     fontWeight: '500',
//   },
//   amountInputFocused: {
//     backgroundColor: Colors.white,
//   },
  
//   // 메시지 입력
//   messageInput: {
//     backgroundColor: Colors.gray50,
//     borderRadius: 12,
//     paddingHorizontal: 16,
//     paddingVertical: 16,
//     fontSize: 16,
//     color: Colors.textPrimary,
//     borderWidth: 1,
//     borderColor: Colors.gray200,
//     minHeight: 80,
//     textAlignVertical: 'top',
//   },
  
//   // 요약 섹션
//   summarySection: {
//     backgroundColor: Colors.white,
//     padding: 20,
//     marginBottom: 12,
//   },
//   summaryTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: Colors.textPrimary,
//     marginBottom: 16,
//   },
//   summaryCard: {
//     backgroundColor: Colors.gray50,
//     borderRadius: 12,
//     padding: 16,
//     gap: 12,
//   },
//   summaryRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   summaryLabel: {
//     fontSize: 14,
//     color: Colors.textSecondary,
//   },
//   summaryValue: {
//     fontSize: 14,
//     fontWeight: '500',
//     color: Colors.textPrimary,
//   },
//   summaryAmount: {
//     fontSize: 16,
//     fontWeight: '700',
//     color: Colors.primary,
//   },
  
//   // 버튼
//   buttonContainer: {
//     backgroundColor: Colors.white,
//     padding: 20,
//     borderTopWidth: 1,
//     borderTopColor: Colors.gray100,
//   },
//   submitButton: {
//     backgroundColor: Colors.primary,
//     height: 56,
//     borderRadius: 12,
//     justifyContent: 'center',
//     alignItems: 'center',
//     shadowColor: Colors.primary,
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     elevation: 5,
//   },
//   submitButtonDisabled: {
//     backgroundColor: Colors.gray300,
//     shadowOpacity: 0,
//     elevation: 0,
//   },
//   submitButtonText: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: Colors.white,
//   },
//   submitButtonTextDisabled: {
//     color: Colors.gray500,
//   },
// });