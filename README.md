# AllInOne React Native

A comprehensive personal finance and life management mobile application built with React Native, featuring transaction tracking, investment management, Wing Tsun registry, calendar events management, real-time cryptocurrency futures data, and professional drawing capabilities.

## 📱 Features

### 🏠 Transaction Management
- **Transaction Tracking**: Record income and expenses with detailed categorization
- **Balance Overview**: Real-time balance calculation with income/expense breakdown
- **Category-based Organization**: 11 predefined categories with custom icons
- **Transaction Summary Chart**: Visual pie chart showing spending distribution
- **Smart Form**: Intuitive transaction input with category dropdown and validation
- **Pagination**: Efficient browsing of transaction history

### 💰 Investment Portfolio
- **Investment Tracking**: Monitor your investment portfolio
- **Futures Trading**: Real-time Binance futures data integration
- **Balance Monitoring**: Track account balances and positions
- **P&L Analysis**: Profit and loss calculations for trading positions

### 🥋 Wing Tsun Registry
- **Student Management**: Comprehensive student database with profile photos
- **Registration System**: Track student registrations and payments
- **Lesson Scheduling**: Manage Wing Tsun lessons and attendance
- **Seminar Organization**: Plan and track martial arts seminars

### 📅 Calendar & Events
- **Event Management**: Create, edit, and delete custom events in Firestore
- **Smart Calendar Display**: Visual calendar with colored dots indicating event types
- **Event Type Prioritization**: Red (Registration End) > Green (Registration Start) > Yellow (Other) > Blue (Lessons)
- **Auto-Generated Events**: Automatic lesson, registration, and seminar events from WT Registry data
- **Event Details Modal**: Rich event information display with date, time, and descriptions
- **Firebase Integration**: Persistent event storage with sequential ID management

### 🎨 Professional Drawing System
- **High-Performance Drawing**: GPU-accelerated drawing using Skia engine
- **Ultra-Smooth Lines**: 10000fps-like performance with real-time feedback
- **Professional Tools**: 14-color palette, 8 brush sizes (1px-20px)
- **Eraser Function**: Toggle eraser mode for corrections
- **Undo/Redo**: Remove last stroke or clear entire drawing
- **Dual Save Options**: Save to note only or save to note & device gallery
- **Vector Graphics**: SVG format for infinite scalability and quality
- **Hybrid Storage**: SVG for notes (quality), PNG for gallery (compatibility)

### 📊 Reports & Analytics
- **Financial Reports**: Detailed transaction analysis and summaries
- **Category Breakdown**: Spending analysis by category
- **Date Range Filtering**: Custom period analysis
- **Visual Charts**: Interactive charts and graphs

## 🏗️ Architecture

### Technology Stack
- **Framework**: React Native 0.80.2
- **Language**: TypeScript
- **State Management**: Redux Toolkit
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage
- **Navigation**: React Navigation 7
- **UI Components**: React Native Paper
- **Calendar**: React Native Calendars
- **Date/Time Picker**: React Native Community DateTimePicker
- **Charts**: React Native Chart Kit
- **Icons**: React Native Vector Icons + Custom SVG
- **Image Handling**: React Native Image Picker
- **Drawing Engine**: React Native Skia (GPU-accelerated)
- **Gesture Handling**: React Native Gesture Handler
- **Animation**: React Native Reanimated

### Project Structure
```
src/
├── components/          # Reusable UI components
│   ├── BalanceCard.tsx
│   ├── TransactionCard.tsx
│   ├── TransactionForm.tsx
│   ├── SpendingPieChart.tsx
│   ├── YinYangIcon.tsx
│   ├── SkiaDrawingCanvas.tsx    # Professional drawing canvas
│   ├── DrawingViewer.tsx        # SVG drawing display
│   ├── AttachmentGallery.tsx    # Media attachment viewer
│   └── ...
├── screens/            # Screen components
│   ├── CalendarScreen.tsx
│   ├── TransactionHomeScreen.tsx
│   ├── InvestmentsScreen.tsx
│   ├── WTRegistryScreen.tsx
│   ├── ReportsScreen.tsx
│   ├── DrawingScreen.tsx        # Drawing modal screen
│   ├── EditNoteScreen.tsx       # Note editing with drawing
│   ├── transactions/
│   └── wtregistry/
├── config/             # Configuration files
│   ├── firebase.ts
│   └── TransactionCategories.ts
├── data/              # Data layer
│   ├── firebase.ts
│   ├── firebaseIdManager.ts
│   ├── events.ts
│   ├── transactions.ts
│   ├── investments.ts
│   ├── notes.ts       # Note management with drawing support
│   └── wtRegistry.ts
├── store/             # Redux store
│   ├── index.ts
│   ├── calendarSlice.ts
│   ├── notesSlice.ts  # Notes state management
│   └── wtRegistrySlice.ts
├── types/             # TypeScript interfaces
│   ├── Event.ts
│   ├── Transaction.ts
│   ├── Investment.ts
│   ├── Note.ts        # Note and drawing types
│   ├── MediaAttachment.ts  # Media attachment types
│   └── WTRegistry.ts
├── utils/             # Utility functions
│   ├── svgToPng.ts    # SVG to PNG conversion
│   └── ...
└── declarations.d.ts
```

## 🚀 Getting Started

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
   cd AllInOneReact
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Firebase Setup**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Firestore Database
   - Enable Firebase Storage
   - Download `google-services.json` and place it in `android/app/`
   - Download `GoogleService-Info.plist` and place it in `ios/AllInOneReactNative/`

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

## 🔧 Configuration

### Firebase Configuration
The app uses Firebase for data storage and real-time synchronization. Configure your Firebase project:

1. **Firestore Collections**:
   - `events` - Calendar events and custom events
   - `transactions` - Financial transaction records
   - `investments` - Investment portfolio data
   - `students` - Wing Tsun student information
   - `registrations` - Student registration records
   - `wtLessons` - Wing Tsun lesson data
   - `seminars` - Seminar information
   - `notes` - Notes with drawing attachments

2. **Storage Buckets**:
   - `profile_pictures` - Student profile photos
   - `attachments` - Document attachments and drawings

### External API Integration
The app integrates with external APIs for real-time data:

- **Binance API**: Futures trading data (via external Node.js service)
- **Base URL**: `http://129.212.143.6`
- **Endpoints**: Account info, positions, balance data

## 💡 Key Features Deep Dive

### 🎨 Professional Drawing System

#### **High-Performance Drawing Engine**
- **Skia Graphics Engine**: GPU-accelerated 2D rendering
- **Ultra-Smooth Performance**: 10000fps-like drawing experience
- **Real-Time Feedback**: Immediate visual response during drawing
- **Gesture Optimization**: Optimized touch handling for smooth curves

#### **Professional Drawing Tools**
- **14-Color Palette**: Professional color selection with visual feedback
- **8 Brush Sizes**: From 1px precision to 20px bold strokes
- **Eraser Mode**: Toggle eraser for corrections (white color, 2x thickness)
- **Undo Function**: Remove last stroke with smart button state management
- **Clear All**: Reset entire drawing canvas

#### **Smart Save Options**
- **Save to Note Only**: Store drawing as SVG in note (high quality, small size)
- **Save to Note & Gallery**: SVG for note + PNG for device gallery (universal compatibility)
- **Hybrid Format**: Best of both worlds - quality and compatibility

#### **Technical Excellence**
- **Vector Graphics**: SVG format for infinite scalability
- **Memory Efficient**: Optimized point collection and path management
- **Cross-Platform**: Works seamlessly on both Android and iOS
- **Professional Quality**: Photoshop-like drawing experience

### Transaction Categories
The app supports 11 predefined categories with custom icons:

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

### Calendar Features
- **Multi-Source Events**: Combines Firebase events with auto-generated WT Registry events
- **Color-Coded Dots**: Visual priority system with red, green, yellow, and blue indicators
- **Event Priority System**: Red (Registration End) → Green (Registration Start) → Yellow (Other) → Blue (Lessons)
- **Modal Event Management**: Create, edit, delete events with rich form interface
- **Date/Time Selection**: Native date and time pickers for precise scheduling

### Data Management
- **Sequential ID Generation**: Atomic ID generation using Firebase transactions
- **Data Serialization**: Redux state optimized with serializable event objects
- **Offline Support**: Transactions cached locally for offline access
- **Real-time Sync**: Automatic synchronization across devices

### Security & Privacy
- **No Authentication Required**: Personal app with device-based data isolation
- **Local Storage**: Sensitive data stored locally using AsyncStorage
- **Firebase Security Rules**: Proper access control (configure in Firebase Console)

## 🎨 UI/UX Features

### Design System
- **Material Design**: Following Material Design 3 principles
- **Dark/Light Mode**: Automatic theme switching support
- **Responsive Layout**: Adaptive design for different screen sizes
- **Accessibility**: Proper touch targets and screen reader support

### Navigation
- **Drawer Navigation**: Main app navigation with custom drawer
- **Bottom Tabs**: Transaction module with Home/Investments/Reports
- **Tab Navigation**: WT Registry with Students/Register/Lessons/Seminars
- **Modal Overlays**: Category selection, form inputs, and drawing canvas

### Interactive Elements
- **Pull-to-Refresh**: Refresh data with pull gesture
- **Long Press Actions**: Delete transactions with long press
- **Modal Forms**: Clean, focused data entry
- **Custom Icons**: Hand-crafted SVG icons for categories
- **Drawing Canvas**: Full-screen drawing with professional tools

## 🔍 Development

### Code Style
- **TypeScript**: Strict type checking enabled
- **ESLint**: Code linting and formatting
- **Prettier**: Consistent code formatting
- **Component Structure**: Functional components with hooks

### State Management
- **Redux Toolkit**: Centralized state management
- **Local State**: Component-level state for UI interactions
- **Async Storage**: Persistent local storage

### Performance Optimizations
- **Memo Components**: Preventing unnecessary re-renders
- **Virtualized Lists**: Efficient rendering of large datasets
- **Image Optimization**: Lazy loading and caching
- **Bundle Splitting**: Optimized bundle size
- **GPU Acceleration**: Skia engine for high-performance graphics

## 📋 API Documentation

### Drawing System
```typescript
// Save drawing to note
const handleDrawingSave = (svgContent: string, saveToGallery: boolean) => {
  // SVG content for note storage
  // PNG conversion for gallery if saveToGallery is true
};

// Drawing tools
const drawingTools = {
  colors: ['#000000', '#FF0000', '#00FF00', ...], // 14 colors
  brushSizes: [1, 2, 3, 5, 8, 12, 16, 20], // 8 sizes
  eraserMode: false, // Toggle eraser
  undo: () => {}, // Remove last stroke
  clear: () => {}, // Clear all
};
```

### Transaction Management
```typescript
// Add a new transaction
await addTransaction({
  amount: 100.50,
  type: "Food",
  description: "Lunch at restaurant",
  isIncome: false,
  date: new Date().toISOString(),
  category: "Food"
});

// Fetch all transactions
const transactions = await fetchTransactions();

// Delete a transaction
await deleteTransaction(transactionId);
```

### Investment Data
```typescript
// Fetch Binance futures data
const binanceData = await BinanceApiClient.getAccount();
const positions = await BinanceApiClient.getPositions();
const balance = await BinanceApiClient.getBalance();
```

### Calendar Events
```typescript
// Add a new event
await addEvent({
  title: "Wing Tzun Seminar",
  description: "Advanced techniques workshop",
  date: new Date(),
  endDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours later
  type: "Event"
});

// Fetch all events
const events = await getEvents();

// Update an event
await updateEvent(eventId, updatedEventData);

// Delete an event
await deleteEvent(eventId);

// Generate calendar events from WT Registry data
dispatch(generateCalendarEvents());
```

### Notes with Drawings
```typescript
// Add note with drawing
await addNote({
  title: "Meeting Notes",
  content: "Discussion points...",
  drawingUris: "svg_content_here",
  imageUris: "image_urls",
  videoUris: "video_urls",
  voiceNoteUris: "audio_urls"
});

// Update note with new drawing
await updateNote(noteId, {
  drawingUris: newSvgContent,
  // ... other fields
});
```

## 🧪 Testing

### Running Tests
```bash
npm test
```

### Test Coverage
- Unit tests for data layer functions
- Component testing for UI interactions
- Integration tests for Firebase operations
- Drawing functionality testing

## 📦 Build & Deployment

### Android Build
```bash
cd android
./gradlew assembleRelease
```

### iOS Build
```bash
cd ios
xcodebuild -workspace AllInOneReactNative.xcworkspace -scheme AllInOneReactNative archive
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Troubleshooting

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

**Drawing performance issues**
- Ensure Skia is properly installed
- Check gesture handler configuration
- Verify React Native Reanimated setup

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review Firebase documentation for backend issues

## 🔄 Version History

### v1.2.0 (Current)
- **Professional Drawing System**: Complete drawing implementation with Skia engine
- **Ultra-High Performance**: 10000fps-like drawing with GPU acceleration
- **Professional Tools**: 14-color palette, 8 brush sizes, eraser, undo
- **Smart Save Options**: SVG for notes, PNG for gallery
- **Drawing Integration**: Seamless integration with notes system
- **Gesture Optimization**: Smooth, responsive touch handling
- **Vector Graphics**: SVG format for infinite scalability

### v1.1.0
- **Calendar & Events System**: Complete calendar implementation with event management
- **Smart Event Display**: Color-coded calendar dots with priority system
- **Firebase Events Integration**: Full CRUD operations for custom events
- **Auto-Generated Events**: Automatic lesson, registration, and seminar events
- **Redux State Optimization**: Serializable event objects for performance
- **Enhanced UI**: White modal backgrounds, improved chip styling, and better UX

### v1.0.0
- Initial release with core functionality
- Transaction management system
- Investment portfolio tracking
- Wing Tsun registry management
- Real-time Binance integration
- Custom UI components and icons

---

**Built with ❤️ using React Native, Firebase, and Skia**
