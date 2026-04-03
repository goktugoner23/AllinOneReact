# Huginn React Native

A comprehensive personal finance and life management mobile application built with React Native, featuring transaction tracking, investment management, Wing Tsun registry, workout tracking, calendar events, real-time cryptocurrency futures data, and professional drawing capabilities.

## Features

### Transaction Management
- **Transaction Tracking**: Record income and expenses with detailed categorization
- **Balance Overview**: Real-time balance calculation with income/expense breakdown
- **Category-based Organization**: 11 predefined categories with custom icons
- **Transaction Summary Chart**: Visual pie chart showing spending distribution
- **Smart Form**: Intuitive transaction input with category dropdown and validation
- **Investment Integration**: Link transactions to investments with automatic value adjustment

### Investment Portfolio
- **Investment Tracking**: Monitor your investment portfolio with attachments
- **USD-M Futures Trading**: Real-time Binance USD-M futures data with WebSocket
- **COIN-M Futures Trading**: Coin-margined futures with USD value estimates
- **Balance Monitoring**: Track account balances and positions
- **P&L Analysis**: Profit and loss calculations with liquidation distance
- **Media Attachments**: Support for images, videos, and audio notes on investments

### GPT AI Assistant
- **AI-Powered Chat**: Full conversational AI assistant powered by OpenAI GPT-5.2
- **App Control**: AI can read, create, update, and delete data across all features
- **Multi-Conversation**: Persistent chat history with conversation management (like ChatGPT)
- **Smart Navigation**: Ask the AI to take you to any screen in the app
- **Interactive Prompts**: AI can present choices and confirmations for ambiguous requests
- **Business Logic**: Enforces app rules (e.g., paid registration auto-creates income transaction)
- **Bilingual**: Responds in Turkish or English, matching the user's language

### Workout Module
- **Workout Tracking**: Track exercises and workout sessions
- **Stopwatch**: Built-in timer for workout duration
- **Workout History**: View past workout sessions
- **Exercise Management**: Add, edit, and delete exercises

### Wing Tsun Registry
- **Student Management**: Comprehensive student database with profile photos
- **Registration System**: Track student registrations and payments
- **Lesson Scheduling**: Manage Wing Tsun lessons and attendance
- **Seminar Organization**: Plan and track martial arts seminars
- **Month Filtering**: Filter registrations by month with totals

### Calendar & Events
- **Event Management**: Create, edit, and delete custom events in Firestore
- **Smart Calendar Display**: Visual calendar with colored dots indicating event types
- **Event Type Prioritization**: Red (Registration End) > Green (Registration Start) > Yellow (Other) > Blue (Lessons)
- **Auto-Generated Events**: Automatic lesson, registration, and seminar events from WT Registry data
- **Firebase Integration**: Persistent event storage with sequential ID management

### Notes with Media
- **Rich Text Editor**: Full-featured text editing with formatting
- **Media Attachments**: Support for images, videos, and audio recordings
- **Attachment Gallery**: Preview and manage media attachments
- **Voice Recording**: Record audio notes directly in the app

### Professional Drawing System
- **High-Performance Drawing**: GPU-accelerated drawing using Skia engine
- **Professional Tools**: 14-color palette, 8 brush sizes (1px-20px)
- **Eraser Function**: Toggle eraser mode for corrections
- **Undo/Redo**: Remove last stroke or clear entire drawing
- **Dual Save Options**: Save to note only or save to note & device gallery
- **Vector Graphics**: SVG format for infinite scalability and quality

### Reports & Analytics
- **Financial Reports**: Detailed transaction analysis and summaries
- **Category Breakdown**: Spending analysis by category
- **Date Range Filtering**: Custom period analysis with pagination
- **Visual Charts**: Interactive charts and graphs

## Architecture

### Technology Stack

| Category | Technology |
|----------|------------|
| **Framework** | React Native 0.80.2 |
| **Language** | TypeScript (Strict Mode) |
| **Data Fetching** | TanStack Query (React Query) |
| **State Management** | Redux Toolkit |
| **Styling** | NativeWind (Tailwind CSS) |
| **Database** | Firebase Firestore |
| **Storage** | Firebase Storage |
| **Navigation** | React Navigation 7 |
| **UI Components** | Custom shadcn-style components |
| **Lists** | FlashList (@shopify/flash-list) |
| **Calendar** | React Native Calendars |
| **Charts** | React Native Chart Kit |
| **Drawing Engine** | React Native Skia (GPU-accelerated) |
| **Gesture Handling** | React Native Gesture Handler |
| **Animation** | React Native Reanimated |
| **Rich Text** | React Native Pell Rich Editor |
| **Audio** | React Native Audio Recorder Player |

### Project Structure

```
src/
├── features/                    # Feature-based modules
│   ├── calendar/               # Calendar feature
│   │   ├── screens/
│   │   ├── services/
│   │   ├── hooks/
│   │   └── types/
│   ├── history/                # History feature
│   │   ├── screens/
│   │   └── types/
│   ├── gpt/                   # GPT AI Assistant
│   │   ├── screens/
│   │   ├── components/
│   │   ├── services/
│   │   ├── store/
│   │   └── types/
│   ├── notes/                  # Notes feature
│   │   ├── screens/
│   │   ├── components/
│   │   ├── services/
│   │   └── types/
│   ├── tasks/                  # Tasks feature
│   │   ├── screens/
│   │   ├── components/
│   │   ├── services/
│   │   └── types/
│   ├── transactions/           # Transactions & investments
│   │   ├── screens/
│   │   │   ├── TransactionHomeScreen.tsx
│   │   │   ├── FuturesTab.tsx
│   │   │   ├── InvestmentsTab.tsx
│   │   │   └── ReportsTab.tsx
│   │   ├── components/
│   │   ├── services/
│   │   ├── hooks/
│   │   └── types/
│   ├── workout/                # Workout module
│   │   ├── screens/
│   │   ├── components/
│   │   ├── services/
│   │   └── types/
│   └── wtregistry/             # Wing Tsun Registry
│       ├── screens/
│       ├── components/
│       ├── services/
│       └── types/
├── shared/                     # Shared utilities and components
│   ├── components/
│   │   └── ui/                 # Reusable UI components
│   ├── services/
│   │   └── firebase/           # Firebase configuration
│   ├── hooks/                  # Shared hooks
│   ├── utils/                  # Utility functions
│   │   ├── logger.ts
│   │   ├── validation.ts
│   │   └── performanceMonitor.ts
│   └── types/                  # Shared types
├── store/                      # Redux store
│   ├── index.ts
│   ├── balanceSlice.ts
│   ├── calendarSlice.ts
│   ├── notesSlice.ts
│   ├── tasksSlice.ts
│   ├── workoutSlice.ts
│   └── wtRegistrySlice.ts
│   └── theme/                  # Theme configuration (colors, typography, spacing)
├── declarations.d.ts           # TypeScript declarations
└── App.tsx                     # Root component
```

### Path Aliases

```typescript
// Available path aliases
import { Component } from '@features/featureName';
import { utility } from '@shared/utils';
import { useAppTheme } from '@App';
```

## Getting Started

### Prerequisites
- Node.js (>= 18)
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development)
- Firebase project with Firestore enabled

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd HuginnReact
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   # Firebase Configuration
   FIREBASE_API_KEY=your_api_key
   FIREBASE_AUTH_DOMAIN=your_auth_domain
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_STORAGE_BUCKET=your_storage_bucket
   FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   FIREBASE_APP_ID=your_app_id

   # API Configuration (Backend Server)
   API_BASE_URL_DEV=http://localhost:3000/
   API_BASE_URL_PROD=http://your-server-ip:3000/

   # WebSocket Configuration (Real-time Binance Data)
   WS_URL_DEV=ws://localhost:3000/ws
   WS_URL_PROD=ws://your-server-ip:3000/ws
   ```

4. **Firebase Setup**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Firestore Database
   - Enable Firebase Storage
   - Download `google-services.json` and place it in `android/app/`
   - Download `GoogleService-Info.plist` and place it in `ios/HuginnReactNative/`

5. **Install iOS dependencies** (iOS only)
   ```bash
   cd ios && pod install && cd ..
   ```

6. **Start Metro bundler**
   ```bash
   npm start
   ```

7. **Run the application**

   For Android:
   ```bash
   npm run android
   ```

   For iOS:
   ```bash
   npm run ios
   ```

## Configuration

### Firebase Collections
- `events` - Calendar events and custom events
- `transactions` - Financial transaction records
- `investments` - Investment portfolio data
- `students` - Wing Tsun student information
- `registrations` - Student registration records
- `wtLessons` - Wing Tsun lesson data
- `seminars` - Seminar information
- `notes` - Notes with media attachments
- `tasks` - Task items
- `taskGroups` - Task group definitions
- `workouts` - Workout session data
- `ai_conversations` - GPT AI chat conversations
- `ai_conversations/{id}/messages` - Chat message history (subcollection)

### External API Integration

**Binance API** (via external Node.js service):
- Base URL: `http://129.212.143.6`
- USD-M Futures: Account info, positions, balance
- COIN-M Futures: Coin balances, positions
- WebSocket: Real-time price updates

## Transaction Categories

| Category | Icon | Type | Color |
|----------|------|------|-------|
| Salary | 💰 | Income/Expense | Green |
| Investment | 📈 | Income/Expense | Blue |
| Wing Tzun | ☯️ | Income/Expense | Red |
| Work | 💼 | Income/Expense | Brown |
| Sports | 🏀 | Expense | Pink |
| General | ℹ️ | Expense | Blue-Grey |
| Shopping | 🛍️ | Expense | Blue |
| Bills | 🧾 | Expense | Red |
| Food | 🍽️ | Expense | Orange |
| Transport | 🚗 | Expense | Purple |
| Game | 🎮 | Expense | Indigo |

## Development

### Code Style
- **TypeScript**: Strict type checking enabled
- **ESLint**: Code linting (relaxed for large codebase)
- **Prettier**: Consistent code formatting
- **Component Structure**: Functional components with hooks

### State Management
- **TanStack Query**: Server state, caching, and data fetching
- **Redux Toolkit**: Client-side state (UI state, theme, etc.)
- **AsyncStorage**: Persistent local storage

### Performance Optimizations
- **FlashList**: High-performance list rendering
- **Native Screens**: Screen freezing for memory optimization
- **Memo Components**: Preventing unnecessary re-renders
- **Image Caching**: Avatar and media caching
- **GPU Acceleration**: Skia engine for drawing

### Linting & Formatting

```bash
# Check linting
npx eslint . --ext .ts,.tsx

# Auto-fix linting issues
npx eslint . --ext .ts,.tsx --fix

# Format code
npx prettier --write "src/**/*.{ts,tsx}"

# Type check
npx tsc --noEmit
```

### Build

```bash
# Android Release
cd android && ./gradlew assembleRelease

# iOS Release
cd ios && xcodebuild -workspace HuginnReactNative.xcworkspace -scheme HuginnReactNative archive

# Bundle (for testing)
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle
```

## Troubleshooting

### Common Issues

**Metro bundler not starting**
```bash
npx react-native start --reset-cache
```

**Android build fails**
```bash
cd android && ./gradlew clean && cd ..
```

**Firebase connection issues**
- Verify `google-services.json` is in the correct location
- Check Firebase project configuration
- Ensure Firestore is enabled

**Icons not displaying**
```bash
npx react-native link react-native-vector-icons
```

**NativeWind not working**
- Ensure `nativewind/babel` is in presets (not plugins) in babel.config.js
- Clear Metro cache: `npm start -- --reset-cache`

**Drawing performance issues**
- Ensure Skia is properly installed
- Check gesture handler configuration
- Verify React Native Reanimated setup

## Version History

See [CHANGELOG.md](CHANGELOG.md) for detailed version history.

### Current Version: Unreleased (2026-04-04)
- **App Icon**: Updated to Huginn raven logo
- **Project Rename**: Renamed from "allinone" to "Huginn"
- **Instagram Module**: Removed references

### v2.3.0
- **Firebase Storage Reliability**: Fixed upload failures across voice, image, and file uploads
- **WTRegistryScreen Refactor**: Split 2062-line monolith into 8 focused files
- **GPT Attachment Sheet**: Bottom sheet modal replacing native Alert picker
- **Currency/Date Consolidation**: Unified formatting across all features
- **TypeScript Zero-Error**: All 25 compilation errors resolved

### v2.2.0
- **GPT AI Assistant**: AI-powered chat with full app control via OpenAI GPT-5.2
- Multi-conversation persistence, 9 tool handlers, navigation and interaction tools
- **Soft Minimal UI Design**: Complete visual refresh with indigo primary color
- **React Native Paper Removal**: Migrated to custom shadcn-style components
- 5 new UI components: Appbar, Searchbar, Snackbar, Checkbox, Divider

### Previous Versions
- **v2.0.0**: TanStack Query, NativeWind, feature-first architecture
- **v1.6.0**: All-in-one API, Posts tab
- **v1.5.0**: Profiler with stories and downloads
- **v1.4.0**: COIN-M futures, WebSocket live data
- **v1.3.0**: Workout module, FlashList integration
- **v1.2.0**: Professional drawing system with Skia
- **v1.1.0**: Calendar & events, Notes with media
- **v1.0.0**: Initial release

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review Firebase documentation for backend issues

---

**Built with React Native, Firebase, TanStack Query, NativeWind, Skia, and OpenAI**
