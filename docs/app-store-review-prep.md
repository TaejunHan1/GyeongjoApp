# App Store 심사 준비 메모

## 1. 계정 삭제 기능

상태: 앱 코드 연결 완료, Supabase SQL 실행 필요

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

## 2. 다음에 볼 항목

- iOS 권한 문구: 사진 접근 권한 설명 추가 필요
- 심사용 데모 계정 또는 테스트 로그인 방법 준비
- 준비중으로 노출되는 설정 메뉴 정리
- 크레딧/IAP 흐름 점검
- 방명록 사용자 콘텐츠 관리/삭제 흐름 점검
