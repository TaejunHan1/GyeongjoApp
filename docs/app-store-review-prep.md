# App Store 심사 준비 메모

## 1. 계정 삭제 기능

상태: 앱 코드 연결 완료, 테스트 완료

관련 파일:
- `database-account-deletion.sql`
- `src/lib/accountDeletion.js`
- `src/screens/main/ProfileScreen.js`
- `src/screens/main/SettingsScreen.js`

처리 방식:
- 앱의 `계정 삭제` 버튼을 누르면 `delete_jeongdam_account_v2(p_user_id, p_phone)` RPC를 호출한다.
- RPC는 `users.id`와 휴대폰 번호를 검증한 뒤 사용자 관련 데이터를 삭제한다.
- Storage 파일은 SQL에서 직접 삭제할 수 없으므로 앱에서 Supabase Storage API로 먼저 삭제한다.
- 삭제 후 앱의 로컬 로그인 정보(`AsyncStorage`)를 제거하고 로그아웃 처리한다.

Supabase에서 해야 할 일:
1. Supabase SQL Editor에 `database-account-deletion.sql` 전체를 실행한다.
2. 앱에서 테스트 계정으로 로그인한다.
3. `프로필 > 계정 삭제` 또는 `설정 > 계정 삭제`를 눌러 삭제가 되는지 확인한다.
4. 삭제 후 같은 번호로 로그인 시 기존 데이터가 남아있지 않은지 확인한다.

심사 설명 문구 예시:
> 앱 내 프로필 화면 하단의 `계정 삭제` 버튼을 통해 계정과 관련 데이터를 삭제할 수 있습니다.

## 2. 심사용 로그인 방법

상태: 앱 코드 연결 완료

관련 파일:
- `src/lib/reviewAccess.js`
- `src/screens/auth/PhoneAuthScreen.js`

심사용 계정:
- 전화번호: `010-0000-0000`
- 인증번호: `000000`
- 계정 이름: `정담 심사 계정`

처리 방식:
- 앱의 일반 휴대폰 인증 화면에서 위 전화번호를 입력하면 실제 SMS를 발송하지 않고 인증번호 입력 화면으로 이동한다.
- 인증번호 `000000`을 입력하면 Supabase `users` 테이블에 심사용 계정이 없을 경우 자동 생성하고 로그인 처리한다.
- 별도 심사용 버튼은 노출하지 않는다.

App Store Connect 심사 메모 예시:
> 심사용 로그인은 휴대폰 인증 화면에서 전화번호 `010-0000-0000`, 인증번호 `000000`을 입력해 진행할 수 있습니다. 실제 SMS 수신 없이 테스트 계정으로 로그인됩니다.

확인할 일:
1. 앱에서 `로그인`을 누른다.
2. 전화번호 `010-0000-0000`을 입력한다.
3. 인증번호 화면에서 `000000`을 입력한다.
4. 홈 화면으로 정상 진입하는지 확인한다.

## 3. iOS 권한 문구

상태: 앱 설정 반영 완료

관련 파일:
- `app.json`
- `src/screens/event/wedding/CreateWeddingScreen.js`
- `src/screens/event/funeral/CreateFuneralScreen.js`
- `src/screens/main/studio/PaperInvitationFormScreen.js`

처리 방식:
- 청첩장/부고장/종이 청첩장 사진 선택을 위해 `expo-image-picker`가 사진 보관함 권한을 요청한다.
- App Store 심사에서 권한 사용 목적이 명확히 보이도록 `ios.infoPlist`에 사진 접근/저장 권한 설명을 추가했다.

추가한 권한 문구:
- `NSPhotoLibraryUsageDescription`: 청첩장, 부고장, 종이 청첩장에 사용할 사진을 선택하기 위해 사진 보관함 접근 권한이 필요합니다.
- `NSPhotoLibraryAddUsageDescription`: 완성된 청첩장 이미지나 QR 코드 자료를 기기에 저장하기 위해 사진 보관함 저장 권한이 필요합니다.

확인할 일:
1. iOS 기기에서 청첩장 만들기 또는 종이 청첩장 만들기로 이동한다.
2. 사진 선택 버튼을 누른다.
3. iOS 권한 팝업에 위 목적 문구가 자연스럽게 표시되는지 확인한다.

## 4. 준비중 메뉴 정리

상태: 앱 코드 정리 완료

관련 파일:
- `src/screens/main/SettingsScreen.js`
- `src/screens/main/GuideScreenToss.js`
- `src/screens/main/guides/host/WeddingPrepGuideScreen.js`
- `src/screens/main/guides/host/FuneralPrepGuideScreen.js`
- `src/navigation/AppNavigator.js`

처리 방식:
- 설정 화면에서 실제 제공하지 않을 `데이터 내보내기`, `백업 및 복원`, `도움말`, `문의하기` 메뉴를 숨겼다.
- 설정 화면의 `이용약관`, `개인정보 처리방침`은 실제 법적 고지 화면으로 연결했다.
- 설정 화면의 가짜 `프로필 편집` 버튼은 제거했다. 프로필 이름 편집은 `프로필` 탭의 실제 편집 기능에서 처리한다.
- 가이드 화면에서 제공하지 않을 `예산 계산기`, `업체 리스트`, `장례비용 계산기`, `장례 업체 리스트` 노출을 제거했다.
- 사용하지 않는 `추천 서비스`, `예산 계산기`, `업체 리스트`, 장소 목록 라우트는 앱 네비게이션에서 제거했다.

제출 전 확인할 일:
1. 설정 화면에서 `준비중` 알림만 뜨는 메뉴가 보이지 않는지 확인한다.
2. 설정 화면의 `이용약관`, `개인정보 처리방침`이 각각 실제 화면으로 이동하는지 확인한다.
3. 가이드 화면에서 예산/업체/추천서비스 메뉴가 보이지 않는지 확인한다.

## 5. 알림톡 크레딧/IAP 흐름

상태: 앱 코드 점검 완료, 외부 콘솔 설정 필요

관련 파일:
- `docs/credit-iap-setup.md`
- `src/screens/main/CreditScreen.js`
- `src/lib/revenueCatCredits.js`
- `database-alimtalk-credits.sql`
- `supabase/functions/revenuecat-credit-webhook/index.ts`
- `app.json`
- `.env.example`

처리 방식:
- 앱 결제는 Apple/Google 스토어 인앱결제를 RevenueCat SDK로 실행한다.
- 앱에서 직접 크레딧 잔액을 올리지 않는다.
- RevenueCat Webhook이 Supabase Edge Function을 호출하고, Edge Function만 `charge_alimtalk_credits` RPC로 충전 거래를 만든다.
- 결제 완료 후 앱은 새 충전 거래가 생겼는지 여러 번 확인해서 웹훅 지연에 대응한다.
- RevenueCat 키가 placeholder/test key이면 충전 버튼을 비활성화한다.

스토어 상품 ID:
- `alimtalk_pack_125`
- `alimtalk_pack_400`
- `alimtalk_pack_700`
- `alimtalk_pack_1250`

제출 전 확인할 일:
1. App Store Connect에 인앱 상품 4개를 소모성 상품으로 만든다.
2. RevenueCat에 iOS 앱과 같은 상품 ID 4개를 연결한다.
3. RevenueCat iOS public SDK key를 EAS production 환경변수에 등록한다.
4. Supabase Edge Function `revenuecat-credit-webhook`을 배포하고 `REVENUECAT_WEBHOOK_SECRET`을 설정한다.
5. RevenueCat Webhook URL을 Supabase Edge Function URL로 연결한다.
6. Sandbox Apple Account로 결제 후 `alimtalk_transactions`와 `users.alimtalk_balance` 반영을 확인한다.
7. 앱 버전 심사 제출 시 앱 내 구입 4개도 함께 심사에 포함한다.

## 6. 방명록 사용자 콘텐츠 관리/삭제 흐름

상태: 앱 코드 연결 완료, DB RPC 반영 필요

관련 파일:
- `src/screens/event/EventDetailScreen.js`
- `src/lib/supabaseHelper.js`
- `database-event-message-moderation.sql`
- `database-account-deletion.sql`

처리 방식:
- 축의대/하객 접수로 저장된 `guest_book` 부조 내역은 행사 상세 화면에서 수정, 확정, 확정 취소, 삭제할 수 있다.
- 모바일 청첩장/부고장에 남겨진 공개 메시지(`event_messages`)는 행사 상세 화면의 `방명록 메시지 관리` 섹션에서 주최자/공동관리자가 삭제할 수 있다.
- 행사 삭제 또는 계정 삭제 시 `events` 기준 연결 데이터가 함께 정리되도록 기존 계정 삭제 SQL에서 처리한다.
- 보기 전용으로 공유된 사용자는 수정/삭제 버튼을 사용할 수 없다.

Supabase에서 해야 할 일:
1. Supabase SQL Editor에 `database-event-message-moderation.sql` 전체를 실행한다.
2. 테스트 행사에 모바일 청첩장/부고장 메시지를 하나 남긴다.
3. 앱의 행사 상세 화면에서 `방명록 메시지 관리` 섹션이 보이는지 확인한다.
4. 메시지 `삭제`를 눌렀을 때 목록에서 사라지고, 모바일 청첩장/부고장에도 더 이상 노출되지 않는지 확인한다.

심사 설명 문구 예시:
> 하객이 남긴 방명록/축하 메시지는 행사 주최자가 앱의 행사 상세 화면에서 확인하고 삭제할 수 있습니다. 부적절한 메시지나 개인정보가 포함된 메시지는 즉시 삭제할 수 있으며, 계정 삭제 시 관련 행사와 방명록 데이터도 함께 삭제됩니다.

## 남은 항목

- App Store Connect 활성화 후 인앱 상품 생성 및 Sandbox 결제 확인
