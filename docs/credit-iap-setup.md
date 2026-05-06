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

`app.json` 또는 EAS 환경변수에 RevenueCat public SDK key를 넣는다.

- `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`
- `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY`

`app.json`의 `extra.revenueCatIosApiKey`, `extra.revenueCatAndroidApiKey`는 로컬 기본값으로도 읽는다.

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

1. RevenueCat Sandbox 앱 사용자 ID가 Supabase `users.id`와 같은지 확인한다.
2. 테스트 결제를 진행한다.
3. RevenueCat Webhook delivery가 200을 받는지 확인한다.
4. `alimtalk_transactions`에 `type = 'charge'` 거래가 생기는지 확인한다.
5. `users.alimtalk_balance`가 증가했는지 확인한다.
