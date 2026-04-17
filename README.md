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
- **USD-M Futures Trading**: Real-time Binance USD-M futures data over the bearer-authenticated legacy `/ws` feed
- **COIN-M Futures Trading**: Coin-margined futures with USD value estimates
- **Balance Monitoring**: Track account balances and positions
- **P&L Analysis**: Profit and loss calculations with liquidation distance
- **Media Attachments**: Support for images, videos, and audio notes on investments

### Muninn AI Assistant
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
- **Event Management**: Create, edit, and delete custom events through huginn-external
- **Smart Calendar Display**: Visual calendar with colored dots indicating event types
- **Event Type Prioritization**: Red (Registration End) > Green (Registration Start) > Yellow (Other) > Blue (Lessons)
- **Auto-Generated Events**: Automatic lesson, registration, and seminar events from WT Registry data
- **REST API Integration**: Persistent event storage via huginn-external

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

## Recent Updates

- **Authenticated futures websocket**: The mobile Binance websocket handshake now sends `Authorization: Bearer <HUGINN_API_TOKEN>`, matching the backend requirement on `/ws`.
- **Correct paginated totals**: Dashboard and shared transaction-count helpers now use the backend `total` field from `/api/transactions` instead of the current page length.
- **Still backend-first**: Persistence stays on huginn-external REST + Cloudflare R2; the websocket is only for live trading data.

## Architecture

### Technology Stack

| Category | Technology |
|----------|------------|
| **Framework** | React Native 0.80.2 |
| **Language** | TypeScript (Strict Mode) |
| **Data Fetching** | TanStack Query (React Query) |
| **State Management** | Redux Toolkit |
| **Styling** | NativeWind (Tailwind CSS) |
| **Database** | huginn-external REST API (Postgres-backed) |
| **Storage** | Cloudflare R2 via huginn-external `/api/storage` |
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
│   ├── muninn/                # Muninn AI Assistant
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
│   │   └── api/                # huginn-external REST client
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
- Running huginn-external API instance (with `HUGINN_API_TOKEN`)

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
   # huginn-external REST API (backend)
   API_BASE_URL_DEV=http://localhost:3000/
   API_BASE_URL_PROD=http://your-server-ip:3000/

   # WebSocket Configuration (Real-time Binance Data)
   WS_URL_DEV=ws://localhost:3000/ws
   WS_URL_PROD=ws://your-server-ip:3000/ws

   # Shared bearer token for huginn-external protected data modules
   HUGINN_API_TOKEN=your_huginn_api_token
   ```

   The mobile app talks exclusively to the huginn-external REST API for persistence, and media attachments are uploaded through `/api/storage` (backed by Cloudflare R2). The futures websocket handshake also uses `HUGINN_API_TOKEN`, so leaving it unset will break live futures updates even if REST calls work.

4. **Install iOS dependencies** (iOS only)
   ```bash
   cd ios && pod install && cd ..
   ```

5. **Start Metro bundler**
   ```bash
   npm start
   ```

6. **Run the application**

   For Android:
   ```bash
   npm run android
   ```

   For iOS:
   ```bash
   npm run ios
   ```

## Configuration

### huginn-external REST API resources
All data is persisted through huginn-external REST endpoints. Primary resources:
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
- `muninn conversations` - AI chat conversations and message history

Media attachments (images, videos, voice notes, drawings) are uploaded via `/api/storage`, which is backed by Cloudflare R2.

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

**Backend connection issues**
- Verify `API_BASE_URL_DEV` / `API_BASE_URL_PROD` point at a running huginn-external instance
- Verify `HUGINN_API_TOKEN` matches the token configured on the server
- Check server logs in huginn-external for auth/CORS errors
- If futures tabs stay disconnected, verify `WS_URL_DEV` / `WS_URL_PROD` point at the protected legacy `/ws` endpoint and that the websocket handshake is sending the same Bearer token

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

### Current Version: Unreleased (2026-04-17)
- **Authenticated futures websocket**: Legacy `/ws` connections now use the shared Bearer token during the handshake.
- **Paginated totals alignment**: Dashboard history/transaction cards and cached count helpers now honor `/api/transactions` `{ items, total }` responses.

### Previous Version: Unreleased (2026-04-05)
- **Firebase Eradication**: Full removal of firebase/firestore code, `firebase` npm package, and all related configs/docs. Mobile talks exclusively to huginn-external + Cloudflare R2.
- **R2 Key-Based Media**: New `useResolvedUri` hook resolves opaque R2 keys to short-lived signed URLs at render time. Notes, investments, history, wtregistry, and muninn chat all consume keys.
- **Muninn R2 Persistence**: ChatInput sends R2 keys instead of signed URLs; backend re-signs on use, so historical conversations stay valid indefinitely.
- **Binance API on httpClient**: Rewritten to use shared Bearer auth client.
- **Theme token expansion**: `colors.overlay` added; futures/calendar/wtregistry migrated off hardcoded hex.
- **Tasks server-ID consistency**: `saveTask`/`saveTaskGroup` return persisted entities (no more `Date.now()` placeholders).

### Unreleased (2026-04-04)
- **App Icon**: Updated to Huginn raven logo
- **Project Rename**: Renamed from "allinone" to "Huginn"
- **Instagram Module**: Removed references

### v2.3.0
- **Media Upload Reliability**: Fixed upload failures across voice, image, and file uploads
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
- Review huginn-external documentation for backend issues

---

**Built with React Native, huginn-external REST API, Cloudflare R2, TanStack Query, NativeWind, Skia, and OpenAI**
