# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Running the App
```bash
# Start development server
npm start

# Run on specific platform
npm run ios      # iOS simulator
npm run android  # Android emulator
npm run web      # Web browser
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
```

### Code Quality
```bash
npm run lint  # Run ESLint
npm test      # Run Jest tests (if configured)
```

## Architecture Overview

### Core Technologies
- **React Native + Expo**: Cross-platform mobile app framework (SDK 53)
- **Supabase**: Backend-as-a-Service for database, auth, and real-time features
- **React Navigation 6**: Screen navigation with bottom tabs and stack navigators
- **AsyncStorage**: Local data persistence for auth state

### Authentication Flow
The app uses a dual authentication system:
1. **Phone Authentication**: SMS OTP via Twilio integration, stores session in AsyncStorage
2. **OAuth Fallback**: Google/Kakao login via Supabase Auth (currently backup)

Key files:
- `App.js`: Main auth state management, checks both AsyncStorage and Supabase sessions
- `src/lib/smsAuth.js`: Twilio SMS verification
- `src/lib/supabase.js`: Supabase client with phone auth methods

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
- **Wedding Events**: 5 template styles (Classic, Modern, Garden, Luxury)
- **Funeral Events**: Solemn memorial template
- **QR Code System**: Generate QR codes for guest contributions
- **Real-time Updates**: Live contribution tracking

Key screens:
- `CreateEventScreen.js`: Two-step event creation wizard
- `EventDisplayScreen.js`: Template-based event display with QR codes
- `ContributionScreen.js`: Guest contribution form

### Template System
Located in `src/screens/event/templates/wedding/`:
- Shared components in `WeddingCommonComponents.js`
- Style utilities in `WeddingStyles.js` and `WeddingUtils.js`
- Each template is a self-contained component with unique styling

### Supabase Configuration
- URL: `https://ofshqvrldcesvjtredxo.supabase.co`
- RLS policies must be configured for proper data access
- Storage buckets needed for image uploads (event-images)

## Important Notes

### Current Development Status
- Phone authentication is primary, OAuth is backup
- Image upload system needs Supabase Storage integration
- QR code links point to web contribution page (needs separate web app)
- Real-time contribution updates via Supabase subscriptions

### Critical TODOs
1. **Enable RLS policies** in Supabase dashboard for events and contributions tables
2. **Configure Storage bucket** for event image uploads
3. **Deploy web contribution page** for QR code scanning
4. **Test payment flow** end-to-end

### Environment Variables
Store sensitive keys in `.env` or use Expo's secure store:
- Supabase URL and anon key (currently hardcoded in `supabase.js`)
- Twilio credentials for SMS (in `twilioDirectSms.js`)

### Testing Approach
- Use Expo Go app for rapid development testing
- Test on both iOS and Android devices/simulators
- Verify phone auth flow with real phone numbers
- Test all 5 wedding templates and funeral template rendering