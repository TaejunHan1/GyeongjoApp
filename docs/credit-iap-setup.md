# 알림톡 크레딧 인앱결제 설정

## 구조

앱은 RevenueCat SDK로 Apple/Google 결제만 실행한다. 크레딧 적립은 RevenueCat Webhook이 Supabase Edge Function을 호출하고, Edge Function이 `charge_alimtalk_credits` RPC를 `service_role`로 실행한다.

이 구조를 쓰는 이유:

- 앱에서 직접 잔액을 올리지 않는다.
- 같은 결제 `transaction_id`는 `alimtalk_transactions` unique index로 한 번만 반영된다.
- Apple/Google 상품 ID는 `alimtalk_packages.apple_product_id`, `google_product_id`와 매칭한다.

## 스토어 상품 ID

현재 DB 시드 기준 상품 ID:

- `alimtalk_pack_125`
- `alimtalk_pack_400`
- `alimtalk_pack_700`
- `alimtalk_pack_1250`

App Store Connect, Google Play Console, RevenueCat에 위 ID로 소모성 상품을 만든다. 다른 ID를 쓰면 `database-alimtalk-credits.sql`의 `alimtalk_packages` 값을 같이 바꿔야 한다.

## 앱 설정

EAS 환경변수에 RevenueCat public SDK key를 넣는다. `app.json`의 `extra.revenueCatIosApiKey`, `extra.revenueCatAndroidApiKey`는 로컬 기본값으로 읽지만, 배포 빌드는 EAS 환경변수 기준으로 관리한다.

- `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`
- `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY`

현재 `app.json`에는 placeholder만 넣어두었다. 실제 키를 넣기 전에는 크레딧 화면의 충전 버튼이 비활성화된다.

예시:

```bash
eas env:create --name EXPO_PUBLIC_REVENUECAT_IOS_API_KEY --value "<ios public sdk key>" --environment production
eas env:create --name EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY --value "<android public sdk key>" --environment production
```

## Supabase Edge Function

배포 대상:

```bash
supabase functions deploy revenuecat-credit-webhook
```

필요한 Secret:

```bash
supabase secrets set REVENUECAT_WEBHOOK_SECRET="RevenueCat webhook Authorization bearer token"
```

Supabase 기본 Secret인 `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`도 함수에서 사용한다.

RevenueCat Webhook URL:

```text
https://<project-ref>.functions.supabase.co/revenuecat-credit-webhook
```

Webhook Authorization 헤더:

```text
Bearer <REVENUECAT_WEBHOOK_SECRET>
```

## DB 반영

`database-alimtalk-credits.sql`을 실행한다. 특히 `charge_alimtalk_credits`는 `anon/authenticated` 실행 권한을 막고 `service_role`만 허용해야 한다.

## 테스트

### App Store 심사 우선

1. App Store Connect에서 심사 제출할 앱을 연다.
2. 사이드바의 `수익화 > 앱 내 구입`에서 아래 4개 소모성 상품을 만든다.
   - `alimtalk_pack_125`
   - `alimtalk_pack_400`
   - `alimtalk_pack_700`
   - `alimtalk_pack_1250`
3. 각 상품의 가격, 현지화 이름/설명, 심사용 스크린샷과 심사 메모를 채운다.
4. RevenueCat에서 iOS 앱을 연결하고 같은 상품 ID를 등록한다.
5. RevenueCat iOS public SDK key를 EAS production 환경변수에 넣고 iOS 빌드를 새로 만든다.
6. Supabase Edge Function `revenuecat-credit-webhook`을 배포하고 `REVENUECAT_WEBHOOK_SECRET`을 설정한다.
7. RevenueCat Webhook URL과 Authorization header를 설정한다.
8. Sandbox Apple Account로 테스트 결제를 진행한다.
9. RevenueCat Webhook delivery가 200을 받는지 확인한다.
10. `alimtalk_transactions`에 `type = 'charge'` 거래가 생기는지 확인한다.
11. `users.alimtalk_balance`가 증가했는지 확인한다.
12. 앱 버전 심사 제출 시 앱 내 구입 4개도 함께 심사에 포함한다.

### Google Play는 이후 진행

1. Google Play Console에서 비공개 테스트 트랙에 앱이 올라가 있는지 확인한다.
2. Google Play Console의 인앱 상품에 아래 4개 소모성 상품을 만든다.
   - `alimtalk_pack_125`
   - `alimtalk_pack_400`
   - `alimtalk_pack_700`
   - `alimtalk_pack_1250`
3. RevenueCat에서 Google Play 앱을 연결하고 같은 상품 ID를 등록한다.
4. RevenueCat Android public SDK key를 EAS 환경변수에 넣고 새 빌드를 만든다.
5. RevenueCat Webhook URL과 Authorization header를 설정한다.
6. 비공개 테스트 계정으로 앱을 설치해서 크레딧 화면 상품 가격이 스토어 가격으로 보이는지 확인한다.
7. 테스트 결제를 진행한다.
8. RevenueCat Webhook delivery가 200을 받는지 확인한다.
9. `alimtalk_transactions`에 `type = 'charge'` 거래가 생기는지 확인한다.
10. `users.alimtalk_balance`가 증가했는지 확인한다.

## 현재 코드 상태

- 앱 결제는 `src/screens/main/CreditScreen.js`에서 RevenueCat SDK로 실행한다.
- 결제 완료 후 `alimtalk_transactions`에 새 충전 거래가 생겼는지 최대 6번 확인한다.
- 앱에서 직접 잔액을 올리지 않고, Supabase Edge Function만 `charge_alimtalk_credits` RPC를 실행한다.
- RevenueCat 키가 없거나 placeholder/test key이면 충전 버튼을 비활성화한다.
- 스토어 상품을 못 불러오면 사용자에게 설정 확인 메시지를 보여준다.

## 남은 외부 설정

- App Store Connect 소모성 인앱 상품 생성.
- RevenueCat iOS 앱/상품 연결.
- RevenueCat iOS public SDK key를 EAS production 환경변수에 등록.
- Supabase Edge Function 배포와 `REVENUECAT_WEBHOOK_SECRET` 설정.
- RevenueCat Webhook을 Supabase Edge Function URL로 연결.
- Sandbox Apple Account로 실제 테스트 결제 확인.
- 앱 버전 심사 제출 시 앱 내 구입 4개도 함께 심사 제출.

Google Play 쪽은 App Store 심사 준비가 끝난 뒤 같은 상품 ID로 이어서 진행한다.
