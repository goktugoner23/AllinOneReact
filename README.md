# AllInOne React Native

A comprehensive personal finance and life management mobile application built with React Native, featuring transaction tracking, investment management, Wing Tsun registry, and real-time cryptocurrency futures data.

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
- **Charts**: React Native Chart Kit
- **Icons**: React Native Vector Icons + Custom SVG
- **Image Handling**: React Native Image Picker

### Project Structure
```
src/
├── components/          # Reusable UI components
│   ├── BalanceCard.tsx
│   ├── TransactionCard.tsx
│   ├── TransactionForm.tsx
│   ├── SpendingPieChart.tsx
│   ├── YinYangIcon.tsx
│   └── ...
├── screens/            # Screen components
│   ├── TransactionHomeScreen.tsx
│   ├── InvestmentsScreen.tsx
│   ├── WTRegistryScreen.tsx
│   ├── ReportsScreen.tsx
│   └── wtregistry/
├── config/             # Configuration files
│   ├── firebase.ts
│   └── TransactionCategories.ts
├── data/              # Data layer
│   ├── firebase.ts
│   ├── firebaseIdManager.ts
│   ├── transactions.ts
│   ├── investments.ts
│   └── wtRegistry.ts
├── store/             # Redux store
│   ├── index.ts
│   ├── calendarSlice.ts
│   └── wtRegistrySlice.ts
├── types/             # TypeScript interfaces
│   ├── Transaction.ts
│   ├── Investment.ts
│   └── WTRegistry.ts
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
   - `transactions` - Financial transaction records
   - `investments` - Investment portfolio data
   - `students` - Wing Tsun student information
   - `registrations` - Student registration records
   - `wtLessons` - Wing Tsun lesson data
   - `seminars` - Seminar information

2. **Storage Buckets**:
   - `profile_pictures` - Student profile photos
   - `attachments` - Document attachments

### External API Integration
The app integrates with external APIs for real-time data:

- **Binance API**: Futures trading data (via external Node.js service)
- **Base URL**: `http://129.212.143.6`
- **Endpoints**: Account info, positions, balance data

## 💡 Key Features Deep Dive

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

### Data Management
- **Sequential ID Generation**: Atomic ID generation using Firebase transactions
- **Device-based Data Isolation**: Each device maintains separate data using unique device IDs
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
- **Modal Overlays**: Category selection and form inputs

### Interactive Elements
- **Pull-to-Refresh**: Refresh data with pull gesture
- **Long Press Actions**: Delete transactions with long press
- **Modal Forms**: Clean, focused data entry
- **Custom Icons**: Hand-crafted SVG icons for categories

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

## 📋 API Documentation

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

## 🧪 Testing

### Running Tests
```bash
npm test
```

### Test Coverage
- Unit tests for data layer functions
- Component testing for UI interactions
- Integration tests for Firebase operations

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

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review Firebase documentation for backend issues

## 🔄 Version History

### v1.0.0 (Current)
- Initial release with core functionality
- Transaction management system
- Investment portfolio tracking
- Wing Tsun registry management
- Real-time Binance integration
- Custom UI components and icons

---

**Built with ❤️ using React Native and Firebase**
