# Changelog

All notable changes to the AllInOne React Native project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- Migrated to TanStack Query for data fetching and caching
- Integrated NativeWind (Tailwind CSS) for styling
- Restructured project to feature-first architecture
- Updated ESLint and Prettier configurations
- Fixed TypeScript strict mode issues

---

## [2.0.0] - 2024-12

### Added
- **TanStack Query Integration**: Migrated all features to use TanStack Query for data fetching, caching, and state management
- **NativeWind/Tailwind CSS**: Added utility-first CSS styling support
- **Feature-First Architecture**: Complete codebase restructure with feature-based organization
- **Shared Utilities**: Centralized logger, validation, and performance monitoring utilities
- **Type Safety**: Enhanced TypeScript types across all features

### Changed
- Refactored all screens to use new architecture patterns
- Updated path aliases for cleaner imports (`@features/*`, `@shared/*`, `@App`)
- Improved error handling with centralized error boundaries
- Enhanced caching mechanisms across all data fetching operations

### Fixed
- TypeScript strict mode compliance
- ESLint and Prettier configuration issues
- Babel configuration for NativeWind preset
- Date serialization in Redux state

---

## [1.6.0] - 2024-12

### Added
- **Instagram Image Component**: New InstagramImage component for reliable image loading
- **All-in-One API Endpoint**: Combined profile, stories, and posts fetching in single call
- **Posts Tab**: Display user posts alongside stories in ProfileDetailScreen
- **Linear Progress Bar**: Loading indicators for better UX feedback

### Changed
- Refactored InstagramImage to use direct Instagram URLs instead of proxy
- Updated ProfileDetailScreen to use combined data fetching
- Enhanced caching mechanism for combined Instagram data
- Improved error handling with better user feedback messages

### Removed
- Instagram proxy utility (no longer needed)

---

## [1.5.0] - 2024-11

### Added
- **Instagram Profiler Module**: Complete Instagram profile viewing functionality
  - ProfilerTab for managing tracked usernames
  - ProfileDetailScreen for viewing profile details and stories
  - Story viewing with full-screen modal and swipe navigation
  - Bulk story download with progress indicators
  - Avatar caching for better performance
- **Camera Roll Integration**: Save Instagram stories to device gallery
- **Instagram API Service**: Methods for profile pictures, stories, and posts

### Changed
- Enhanced Instagram navigation with stack navigator
- Added PostDetailScreen for detailed post viewing
- Improved hashtag formatting with formatHashtagForDisplay function
- Updated AndroidManifest.xml for network security configuration

### Fixed
- 404 error detection for unavailable profiles
- Story modal scrolling behavior
- Error re-throwing in saveStoryToGallery

---

## [1.4.0] - 2024-11

### Added
- **COIN-M Futures Support**: New CoinMFuturesAccountCard component
  - Display coin balances with USD value estimates
  - Position value and unrealized PnL tracking
  - Conditional COIN-M chip rendering
- **WebSocket Live Data**: Real-time updates for futures screens
- **Connection Status Indicators**: Visual feedback for WebSocket connections
- **Delete Workout Functionality**: Remove workouts with confirmation dialog

### Changed
- Updated position color representation (green for LONG, red for SHORT)
- Enhanced liquidation price calculations to consider all positions
- Improved currency formatting consistency in FuturesTab
- Refactored FuturesPositionCard for better theme support

### Fixed
- Liquidation distance calculations accuracy
- Position type display based on amount

---

## [1.3.0] - 2024-10

### Added
- **Workout Module**: Complete workout tracking system
  - StopwatchScreen for timing workouts
  - WorkoutNavigator for module navigation
  - Workout history tracking
  - Delete workout functionality
- **FlashList Integration**: High-performance list rendering
- **Native Screen Optimization**: Screen freezing for memory optimization

### Changed
- Integrated WorkoutTabs into drawer navigator
- Added workoutReducer to Redux store
- Updated package dependencies for FlashList
- Enhanced workout state management

### Fixed
- Gradle build errors on Windows
- Performance issues with large lists

---

## [1.2.0] - 2024-10

### Added
- **Professional Drawing System**: GPU-accelerated drawing with Skia engine
  - 14-color palette with visual feedback
  - 8 brush sizes (1px-20px)
  - Eraser mode for corrections
  - Undo/redo functionality
  - Dual save options (SVG for notes, PNG for gallery)
- **Investment Attachments**: Support for images, videos, and audio in investments
  - Voice recorder integration
  - Attachment preview modals
  - Multiple URI storage

### Changed
- Enhanced transaction handling with investment integration
- Updated HistoryScreen to revert investment effects on transaction deletion
- Improved TransactionForm with investment selection

### Fixed
- Transaction-investment linking issues
- Attachment upload handling

---

## [1.1.0] - 2024-09

### Added
- **Calendar & Events System**: Complete calendar implementation
  - Event management with Firebase integration
  - Color-coded calendar dots (Red > Green > Yellow > Blue priority)
  - Auto-generated events from WT Registry data
  - Event details modal with rich information display
- **Notes Feature**: Rich text notes with media attachments
  - Stack navigation for notes management
  - Rich text editor via react-native-pell-rich-editor
  - Attachment gallery for previewing media
  - Audio recording and playback support
- **Tasks Module**: Task management with groups
  - TasksScreen for task organization
  - Task groups with color coding
  - Add/Edit task dialogs

### Changed
- Enhanced balance management with force refresh mechanism
- Refactored transaction screens to modular tabs
- Improved lesson management in WTRegistryScreen
- Updated month filtering for registrations

### Fixed
- Firebase event CRUD operations
- Redux state serialization for events
- Cache invalidation logic

---

## [1.0.0] - 2024-08

### Added
- **Transaction Management**: Complete financial tracking
  - Income and expense recording
  - 11 predefined categories with custom icons
  - Transaction summary pie chart
  - Pagination for transaction history
- **Investment Portfolio**: Portfolio monitoring
  - Investment tracking with current values
  - Binance futures integration
  - P&L calculations
- **Wing Tsun Registry**: Student management system
  - Student database with profile photos
  - Registration tracking with payments
  - Lesson scheduling
  - Seminar organization
- **Core Infrastructure**:
  - Firebase Firestore integration
  - Firebase Storage for media
  - Redux Toolkit state management
  - React Navigation 7 setup
  - React Native Paper UI components

### Technical
- React Native 0.80.2 setup
- TypeScript configuration
- ESLint and Prettier setup
- Path aliases configuration

---

## Git Commit History (Chronological)

### December 2024
- `46b5447` - Update gitignore
- `ea94af5` - Refactor InstagramImage component to remove proxy handling
- `2837b67` - Refactor ProfileDetailScreen to utilize new all-in-one API endpoint
- `425aee0` - Update package dependencies and improve Instagram proxy handling
- `f71636a` - Implement Posts Tab in ProfileDetailScreen
- `53e8a8d` - Enhance ProfileDetailScreen with Linear Progress Bar

### November 2024
- `4acce12` - Refactor attachment handling in InvestmentsTab
- `ec095ac` - Refactor BalanceCard and transaction services
- `fe53795` - Move web config to env and purge firebase.ts from history
- `5735e7b` - Update environment variable handling and Firebase configuration
- `b0342e1` - Add Instagram profile picture download functionality
- `e36049d` - Refactor image handling in Instagram screens
- `83c6429` - Implement COIN-M Futures Account Card
- `eca896c` - Update FuturesTab and futures calculations
- `cfc22c4` - Sort and paginate transactions in ReportsTab
- `22b4649` - Enhance FuturesTab functionality with WebSocket support
- `75df981` - Refactor UI components: Replace PurpleFab with AddFab
- `349c3f4` - Refactor TransactionHomeScreen
- `2b6e23e` - Refactor dialog components in RegisterTab, StudentsTab
- `968a233` - Fixed duplicate transaction adding issue in registrations
- `128ce52` - Improve error handling in ProfileDetailScreen
- `50a6c58` - Enhance ProfileDetailScreen functionality
- `39b7226` - Refactor FuturesTab and InvestmentsTab UI
- `0df9fe2` - Add delete workout functionality
- `3bddec0` - Enhance ProfileDetailScreen and ProfilerTab
- `6834541` - Add camera roll functionality and improve profile detail screen
- `475dcf9` - Add Profiler feature to Instagram module

### October 2024
- `ded4b1a` - Update AndroidManifest.xml for network security
- `da6e61d` - Enhance transaction handling and investment integration
- `d9b074f` - Implement investment attachment functionality
- `9121923` - Enhance NotesScreen navigation and video rendering
- `bc4cfb3` - Fix Windows Gradle build errors, implement caching
- `4e01c02` - Delete outdated specifications
- `24ab2e2` - Integrate Stopwatch into Workout module
- `bb5c9e5` - Add Workout module to navigation
- `c55e96b` - Refactor babel.config.js
- `ccb8d94` - Refactor Instagram module and enhance hashtag display
- `d2f2f84` - Integrate FlashList and enable native screens
- `82b884a` - Enhance Instagram module with navigation
- `00f9bf1` - Refactor transaction configuration and currency formatting
- `fcd8f2d` - BIG UPDATE: Refactor project structure
- `e124751` - Test push for Instagram module
- `b17c77b` - Refactor task dialogs and enhance UI consistency
- `151241a` - BIG UPDATE: Refactor screen organization

### September 2024
- `cdaa822` - Update react-native-worklets
- `35eeada` - Enhance AttachmentGallery and EditNoteScreen
- `60db899` - Refactor media handling in AttachmentGallery
- `f564af1` - Document-picker final implementation
- `3be2f3e` - Document-picker fix in wtregistry
- `a31ea2d` - Add serviceAccountKey.json to .gitignore
- `7915c6e` - Notes page fix part 3: Audio handling
- `af99bb7` - Notes page fix part 2: Media handling
- `c5a174e` - Notes page fix part 1
- `5677e48` - Enhance note management and media handling
- `d5d963c` - Implement attachment gallery in NotesScreen
- `123d463` - Add Notes feature with stack navigation
- `e99576a` - Implement comprehensive calendar and event management
- `13c9e64` - Refactor Chip components across screens
- `152b561` - Enhance calendar with Firebase event management
- `49ebf88` - Enhance balance management
- `591775e` - Refactor transaction screens
- `87adeb1` - Add lesson management functionality
- `588974b` - Implement month filtering in registration screen
- `70b53f5` - Update dependencies and enhance registration management
- `c90dff4` - Enhance file handling in registration

### August 2024
- Initial release with core functionality
- Transaction management system
- Investment portfolio tracking
- Wing Tsun registry management
- Firebase integration
- Core UI components

---

## Migration Guide

### Upgrading to v2.0.0

1. **Install new dependencies**:
   ```bash
   npm install @tanstack/react-query nativewind
   ```

2. **Update babel.config.js**:
   ```javascript
   presets: ['module:@react-native/babel-preset', 'nativewind/babel'],
   ```

3. **Update imports** to use new path aliases:
   ```typescript
   // Before
   import { Something } from '../../components/Something';

   // After
   import { Something } from '@shared/components/Something';
   ```

4. **Wrap app with QueryClientProvider**:
   ```typescript
   import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

   const queryClient = new QueryClient();

   <QueryClientProvider client={queryClient}>
     <App />
   </QueryClientProvider>
   ```

---

**Note**: This changelog is auto-generated from git history and may be updated as new features are added.
