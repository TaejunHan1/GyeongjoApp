# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Running the App
```bash
# Start development server (primary command)
npm start

# Run on specific platform
npm run ios      # iOS simulator
npm run android  # Android emulator  
npm run web      # Web browser

# Alternative Expo commands
npx expo start   # Alternative to npm start
npx expo start --clear  # Clear cache and start
```

### Building for Production
```bash
# Build for specific platforms (requires EAS CLI)
npm run build:android  # Android APK/AAB
npm run build:ios      # iOS IPA
npm run build:all      # Both platforms

# Submit to app stores
npm run submit:android  # Google Play
npm run submit:ios      # App Store

# EAS Update (for OTA updates)
npm run update   # Push updates to existing builds
```

### Code Quality & Development
```bash
npm run lint     # Run ESLint
npm test         # Run Jest tests (if configured)

# Manual testing commands
npx expo install --fix  # Fix dependency issues
npx expo doctor        # Check for common issues
```

## Architecture Overview

### Core Technologies
- **React Native + Expo**: Cross-platform mobile app framework (SDK 53)
- **Supabase**: Backend-as-a-Service for database, auth, and real-time features
- **React Navigation 6**: Screen navigation with bottom tabs and stack navigators
- **AsyncStorage**: Local data persistence for auth state

### Authentication Flow
The app uses a phone-first authentication system:
1. **Primary**: Phone Authentication via SMS OTP using Twilio integration
2. **Session Management**: Stores auth session in AsyncStorage for persistence
3. **Backup**: OAuth (Google/Kakao) via Supabase Auth (currently disabled/backup)

Key files:
- `App.js`: Main auth state management, checks both AsyncStorage and Supabase sessions
- `src/lib/smsAuth.js`: Twilio SMS verification logic
- `src/lib/twilioDirectSms.js`: Direct Twilio SMS sending
- `src/lib/supabase.js`: Supabase client configuration with phone auth methods
- `src/screens/auth/`: Authentication screens (Welcome, PhoneAuth, Verification, Register)

### Database Schema (Supabase PostgreSQL)
- **users**: User profiles with phone verification status
- **events**: Wedding/funeral events with templates, images, and settings
- **contributions**: Guest contributions with amounts and messages
- **event_messages**: Optional messages from guests
- **sms_verifications**: SMS OTP tracking

### Navigation Structure
```
AuthNavigator (not authenticated)
├── WelcomeScreen
├── PhoneAuthScreen
├── VerificationScreen
└── RegisterScreen

AppNavigator (authenticated)
└── BottomTabNavigator
    ├── HomeScreen
    ├── MyEventsScreen
    ├── GuideScreen
    └── ProfileScreen
```

### Event Management System
The app specializes in Korean cultural events (경조사):
- **Wedding Events**: 5 template styles (Classic, Modern, Garden, Luxury, Vintage)
- **Funeral Events**: Solemn memorial template
- **QR Code System**: Generate QR codes for guest contributions
- **Real-time Updates**: Live contribution tracking

Key screens:
- `CreateEventScreen.js`: Two-step event creation wizard
- `CreateWeddingScreen.js`: Specialized wedding event creation
- `CreateFuneralScreen.js`: Specialized funeral event creation
- `EventDisplayScreen.js`: Template-based event display with QR codes
- `ContributionScreen.js`: Guest contribution form

### Template System
Wedding templates located in `src/screens/event/templates/wedding/`:
- **ElegantGardenTemplate.js**: Garden theme with natural elements
- **KoreanElegantTemplate.js**: Classic Korean traditional style
- **ModernMinimalTemplate.js**: Clean, minimal modern design
- **RomanticPinkTemplate.js**: Romantic pink/rose themed design
- **VintageAppTemplate.js**: Vintage/retro styled template
- **WeddingCommonComponents.js**: Shared components across templates
- **WeddingStyles.js** & **WeddingUtils.js**: Style utilities and helpers

Funeral templates:
- **FuneralTemplatePreview.js**: Solemn memorial template with appropriate styling

Template system features:
- Each template is self-contained with unique styling
- Image slideshow support with placeholder fallback
- QR code integration for contribution collection
- Responsive design for tablet display mode

### Supabase Configuration
- URL: `https://ofshqvrldcesvjtredxo.supabase.co`
- RLS policies must be configured for proper data access
- Storage buckets needed for image uploads (event-images)

## Important Notes

### Current Development Status
- Phone authentication is primary, OAuth is backup/disabled
- Five wedding templates + one funeral template fully implemented
- QR code generation works, but links point to web app (needs separate deployment)
- Real-time contribution updates via Supabase subscriptions (needs RLS policy setup)
- Image upload UI exists but needs Supabase Storage integration

### Critical Setup Requirements
1. **Enable RLS policies** in Supabase dashboard:
   ```sql
   -- Enable RLS on tables
   ALTER TABLE events ENABLE ROW LEVEL SECURITY;
   ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;
   
   -- Create policies for events
   CREATE POLICY "Users can manage their own events" ON events
   FOR ALL USING (auth.uid() = user_id);
   
   -- Create policies for contributions
   CREATE POLICY "Anyone can view contributions" ON contributions
   FOR SELECT USING (true);
   CREATE POLICY "Anyone can insert contributions" ON contributions
   FOR INSERT WITH CHECK (true);
   ```

2. **Configure Supabase Storage bucket** for event images:
   ```sql
   -- Create storage bucket
   INSERT INTO storage.buckets (id, name, public) 
   VALUES ('event-images', 'event-images', true);
   ```

3. **Environment Variables** (currently hardcoded in source):
   - Supabase URL and anon key (in `src/lib/supabase.js`)
   - Twilio credentials (in `src/lib/twilioDirectSms.js`)

### Known Issues
- **RLS Policies**: Events/contributions operations fail without proper RLS setup
- **Image Upload**: UI exists but storage integration incomplete
- **Web QR Page**: QR codes generate but need separate web app deployment
- **Template Selection**: CreateEventScreen template selection needs database integration

### Testing Workflow
1. Use Expo Go app for rapid testing during development
2. Test phone auth flow with real phone numbers (Twilio sandbox limitations)
3. Test all template rendering in EventDisplayScreen
4. Verify QR code generation (note: web endpoint doesn't exist yet)
5. Test contribution flow end-to-end once RLS policies are enabled

### DeepSeek AI Integration
The app includes AI-powered features via DeepSeek service:
- **File**: `src/lib/deepseekService.js`
- **Features**: Contribution analysis, event insights, budget recommendations
- **Usage**: Integrated in guide screens and budget calculator

---

## Agent Teams 사용 가이드

### 환경 설정 (이미 완료)
- `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` → `~/.zshrc` + `~/.claude/settings.json` 적용 완료

### 팀 프롬프트 파일 위치
```
agents/
├── README.md              # 사용법 요약
├── basic-team.md          # 10인 기본 팀 (일반 기능 개발)
├── simple-team.md         # 5인 간소화 팀 (작은 기능)
└── large-team.md          # 12인 대규모 팀 (새 앱/리팩토링)
```

### 실행 방법
```bash
# 터미널에서
claude --model opus

# 프롬프트: agents/basic-team.md 내용 복사 후
# [기능 설명] 부분만 바꿔서 붙여넣기
```

### 팀 규모 선택 기준
| 규모 | 파일 | 사용 시점 |
|------|------|-----------|
| 5인 | `simple-team.md` | 버튼 추가, UI 수정 등 작은 변경 |
| 10인 | `basic-team.md` | 새 화면, API 연동 등 일반 기능 |
| 12인 | `large-team.md` | 새 앱, 대규모 리팩토링 |