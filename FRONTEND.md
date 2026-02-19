# AllInOneReact - Complete Frontend Documentation

This document provides comprehensive documentation of every feature, screen, button, and interaction in the AllInOneReact mobile application.

---

## Table of Contents

1. [App Architecture](#1-app-architecture)
2. [Navigation Structure](#2-navigation-structure)
3. [Theme System](#3-theme-system)
4. [Transactions Feature](#4-transactions-feature)
5. [Instagram Feature](#5-instagram-feature)
6. [Wing Tzun Registry Feature](#6-wing-tzun-registry-feature)
7. [Notes Feature](#7-notes-feature)
8. [Tasks Feature](#8-tasks-feature)
9. [Shared UI Components](#9-shared-ui-components)
10. [Data Management](#10-data-management)

---

## 1. App Architecture

### Technology Stack
- **Framework**: React Native with TypeScript
- **Navigation**: React Navigation v7 (Drawer, Tabs, Stack)
- **State Management**: Redux Toolkit + TanStack Query (React Query)
- **Backend**: Firebase (Firestore + Storage)
- **UI**: Custom component library inspired by shadcn/ui
- **Animations**: React Native Reanimated
- **Lists**: FlashList for optimized rendering

### Project Structure
```
src/
├── features/           # Feature modules
│   ├── transactions/   # Financial tracking
│   ├── instagram/      # Instagram analytics
│   ├── wtregistry/     # Wing Tzun registry
│   ├── notes/          # Note-taking
│   ├── tasks/          # Task management
│   ├── calendar/       # Calendar events
│   └── workout/        # Fitness tracking
├── shared/
│   ├── components/ui/  # Reusable UI components
│   ├── theme/          # Theme system
│   ├── hooks/          # Custom hooks
│   ├── services/       # API & Firebase services
│   └── store/          # Redux store
└── App.tsx             # App entry point
```

---

## 2. Navigation Structure

### Drawer Navigation (Main Menu)
The primary navigation uses a side drawer with 8 main sections:

| Route | Icon | Description |
|-------|------|-------------|
| Transactions | wallet | Financial dashboard |
| WT Registry | school | Student/registration management |
| Calendar | calendar | Event scheduling |
| Notes | document-text | Rich text notes |
| Tasks | checkmark-circle | Task management |
| Instagram | logo-instagram | Analytics & AI |
| Workout | barbell | Fitness tracking |
| History | time | Historical data |

### Feature-Specific Navigation

**Transactions** (Bottom Tabs):
- Home → Balance, charts, transaction form
- Investments → Portfolio management
- Reports → Analytics and filtering

**Instagram** (Bottom Tabs + Stack):
- Posts → Grid of Instagram posts
- Insights → Analytics dashboard
- Ask AI → AI-powered chat
- PostDetail → Full post view (stack)

**Notes** (Stack Navigator):
- NotesList → All notes with search
- EditNote → Rich text editor

**WT Registry** (Top Tabs):
- Students → Student management
- Register → Registrations & payments
- Lessons → Weekly schedule
- Seminars → Events

**Tasks** (Single Screen):
- Simple list or grouped view toggle

---

## 3. Theme System

### Color Modes
- **Light Mode**: Soft whites with indigo primary (#6366F1)
- **Dark Mode**: Deep blacks with luminous indigo (#818CF8)
- **System Mode**: Follows device preference

### Theme Toggle
Location: Drawer menu footer (dark mode switch)

### Color Tokens

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| background | #FAFBFC | #0C0D10 | Screen backgrounds |
| card | #FFFFFF | #16171C | Card surfaces |
| primary | #6366F1 | #818CF8 | Actions, highlights |
| foreground | #1A1F2E | #F3F4F6 | Primary text |
| foregroundMuted | #6B7280 | #9CA3AF | Secondary text |
| success | #059669 | #34D399 | Positive/income |
| destructive | #DC2626 | #F87171 | Negative/expense |
| border | #E5E9EF | #2A2D38 | Dividers |

### Theme Hooks
```typescript
useAppTheme()   // Full theme object
useColors()     // Color scheme only
useIsDark()     // Boolean dark mode check
```

---

## 4. Transactions Feature

### 4.1 Transaction Home Screen

**Balance Card**
- Displays monthly Income, Expense, and Balance
- Color-coded amounts (green/red)
- Currency: Turkish Lira (TRY)

**Spending Pie Chart**
- Top 3 expense categories with progress bars
- Category colors from theme
- Percentage breakdown

**Transaction Form**
- **Segmented Control**: Toggle Expense/Income
- **Amount Input**: Numeric with currency symbol (₺)
- **Category Dropdown**: 11 categories with icons
- **Investment Type**: Conditional (if category = Investment)
- **Description**: Optional multiline input
- **Add Button**: Submits transaction

**Transaction List**
- FlashList sorted by date (newest first)
- Pull-to-refresh support
- Each card shows amount, category, date, description

### 4.2 Investments Tab

**View Toggle**: Investments / Futures tabs

**Investment Cards Display**:
- Name, amount, type, description
- Date and attachment indicators
- Past investment: profit/loss tracking

**Investment Actions** (Long-press):
- Edit → Opens edit modal
- Delete → Confirmation required
- Liquidate → Special delete for closed investments

**Add/Edit Investment Modal**:
- Name (required)
- Amount (required)
- Type dropdown: Stock, Crypto, Bond, ETF, Mutual Fund, Real Estate, Other
- Description (optional)
- Past Investment toggle
- Media attachments: Images (5), Videos (3), Voice notes

### 4.3 Futures Tab

**USD-M Futures**:
- Account overview: Balance, Unrealized PnL, Margin
- Position cards with:
  - Symbol, size, entry/mark price
  - Leverage, P&L, ROI%, ROE%
  - Liquidation price, margin ratio
  - Risk level indicators (SAFE to CRITICAL)
  - TP/SL button

**COIN-M Futures**:
- Coin balances with USD estimates
- Position-specific coin P&L

**WebSocket Status**: Live data connection indicator

**TP/SL Modal**:
- Take Profit / Stop Loss inputs
- Suggested prices (±5%)
- Confirm/Cancel buttons

### 4.4 Reports Tab

**Filters**:
- Category dropdown (All or specific)
- Date range: 7d, 30d, 90d, This Year, All Time

**Summary Cards**:
- Total Income (green)
- Total Expense (red)
- Balance (dynamic color)
- Transaction count

**Spending Trends Chart**:
- Line chart (Bezier curves)
- Daily expense aggregation
- Filtered by selected range

**Category Breakdown**:
- List sorted by amount
- Progress bars per category

**Paginated Transactions**:
- 5 per page with navigation
- Long-press to delete

---

## 5. Instagram Feature

### 5.1 Posts Tab

**Header**:
- Post count display
- Data source tag (Firestore/Cache)

**Post Cards**:
- Timestamp (relative: "2h ago")
- Media type badge (IMAGE, VIDEO, CAROUSEL, REELS)
- Engagement rate badge
- Thumbnail image
- Caption preview (2 lines)
- Metrics: ♥ Likes, 💬 Comments, ↗ Shares, 👁 Reach
- Hashtags (first 4 + overflow count)

**Actions**:
- Tap card → PostDetailScreen
- Pull-to-refresh → Force sync

### 5.2 Post Detail Screen

**Header**:
- Back button (arrow left)
- Open in Instagram button

**Sections**:
1. **Post Info**: User, Date, Type, Engagement %
2. **Media**: Full-size image (300px height)
3. **Caption**: Complete text
4. **Metrics Grid**: All available metrics
5. **Hashtags**: All tags as chips

### 5.3 Insights Tab

**Account Card**:
- @username (primary color)
- Account name
- Stats: Followers, Following, Posts

**Performance Card**:
- Total Posts, Total Engagement, Avg Rate

**Top Post Card** (if available):
- Caption preview
- Engagement %, Interactions

**Detailed Metrics** (if available):
- Totals: Likes, Comments, Shares, Reach
- Averages: Per-post metrics
- Growth: Engagement and Reach trends (green/red)

### 5.4 Ask AI Tab

**Empty State**:
- Robot icon
- "AI Assistant" title
- 6 suggested questions as chips

**Chat Interface**:
- User messages (right, primary color)
- AI messages (left, card background)
- Metadata: Confidence %, Processing time
- Sources: Related post IDs

**Input Bar**:
- Clear chat button (trash icon, left)
- Text input (multiline, 500 char max)
- Send button (primary when active)

**AI Capabilities**:
- Standard text queries
- Instagram URL analysis (auto-detected)
- Post/Reel/Profile analysis

**URL Detection**:
- Pattern: `instagram.com/p/`, `/reel/`, `/@username`
- Auto-generates appropriate analysis query

---

## 6. Wing Tzun Registry Feature

### 6.1 Students Tab

**Student List**:
- Profile photo (circular avatar)
- Name and phone number
- Status indicator (green=active, red=inactive)
- Chevron for expansion

**Search & Filter**:
- Search bar: name, phone, email, Instagram
- "Show active only" toggle

**Add Student Button** (FAB)

**Add/Edit Student Dialog**:
- Photo upload section
- Name (required)
- Phone (required)
- Email (optional)
- Instagram handle (optional)
- Notes (optional)
- Active toggle

**Student Detail Modal**:
- Large profile photo (tap for fullscreen)
- Contact buttons: Call (green), WhatsApp (green), Instagram (pink)
- Registration status

**Photo Options** (Long-press in edit):
- View Photo
- Change Photo
- Remove Photo
- Download from Instagram

### 6.2 Register Tab (Registrations)

**Month Filter** (Header):
- Dropdown: All Months or specific month
- Filters by payment date

**Summary Boxes**:
- Total Amount (all registrations)
- Paid Amount (green)
- Unpaid Amount (red)

**Registration Cards**:
- Student name
- Payment status badge (Paid=green, Unpaid=yellow)
- Amount in TRY
- Date range
- Notes (if any)
- Attachment icon (if receipt attached)

**Add Registration Button** (FAB)

**Add/Edit Registration Dialog**:
- Student selector (required)
- Amount (required)
- Start Date (date picker)
- End Date (date picker)
- Notes (optional)
- Paid toggle
- Receipt attachment (when Paid=ON)

**Registration Actions** (Long-press):
- Edit
- Delete (removes related transactions)
- View Attachment

**Payment Toggle**:
- Tap badge to toggle Paid/Unpaid
- Auto-creates/deletes linked transaction

### 6.3 Lessons Tab

**Weekly Schedule Display**:
- Day of week name
- Time range (24-hour format)
- Duration display
- Edit/Delete icons per card

**Add Lesson Button** (FAB)

**Add/Edit Lesson Dialog**:
- Day selector (segmented: Sun-Sat)
- Start time picker
- End time picker
- Duration (auto-calculated, read-only)

### 6.4 Seminars Tab

**Seminar Cards**:
- Seminar name
- Status badge (Upcoming=primary, Past=muted)
- Date and time range
- Duration
- Location and description (if any)
- Left border accent (color by status)

**Add Seminar Button** (FAB)

**Add/Edit Seminar Dialog**:
- Name (required)
- Date picker (minimum: today)
- Start/End time pickers
- Location (optional)
- Description (optional)
- Duration (auto-calculated)

---

## 7. Notes Feature

### 7.1 Notes Screen

**Note Cards**:
- Title (2 lines max)
- Content preview (3 lines, HTML stripped)
- Attachment thumbnails (first 3)
- "+N more" badge for overflow
- Last edited timestamp
- Attachment count chip

**Actions**:
- Tap card → EditNoteScreen
- Tap thumbnail → AttachmentGallery
- Share button → Share text content
- Delete button → Confirmation dialog
- Pull-to-refresh

**FABs**:
- Add note (+)
- Search toggle

**Search**:
- Filters by title and content
- Real-time results

### 7.2 Edit Note Screen

**Header**:
- Back button (with unsaved changes prompt)
- Save button

**Fields**:
- Title input
- Rich text content editor

**Rich Text Toolbar**:
| Category | Options |
|----------|---------|
| Text | Bold, Italic, Underline, Strikethrough |
| Headings | H1, H2, H3 |
| Lists | Bullets, Numbers, Checklists |
| Alignment | Left, Center, Right |
| Blocks | Blockquote, Code |
| Insert | Link (with modal), Table (with size picker) |
| History | Undo, Redo |

**Attachment Buttons**:
1. **Image**: Camera or Gallery (up to 10)
2. **Video**: Camera or Gallery (up to 5)
3. **Voice**: Opens VoiceRecorder modal
4. **Drawing**: Opens DrawingScreen

**Attachment Previews**:
- Grid of thumbnails
- Type badge (Image, Video, Voice, Drawing)
- Remove button (X)
- Tap to view in gallery

### 7.3 Drawing Screen

**Canvas**:
- White background
- Gesture-based drawing
- Real-time Skia rendering

**Toolbar**:
1. **Color Picker**: 14 color palette
2. **Size Selector**: 1-20px brush sizes
3. **Pen/Eraser Toggle**
4. **Undo Button**
5. **Clear Button** (with confirmation)

**Save Options**:
- Save to Note (SVG format)
- Save to Note & Gallery

### 7.4 Attachment Gallery

**Navigation**:
- Close button (X)
- Download button with progress
- Previous/Next arrows
- Counter: "X / Total"

**Media Display**:
- Images: Full-screen with contain mode
- Videos: Play button overlay, full controls
- Audio: Music icon + AudioPlayer

---

## 8. Tasks Feature

### 8.1 Tasks Screen

**View Modes** (Toggle in appbar):
- **Simple List**: Tasks sorted by due date
- **Grouped View**: Tasks organized by groups

**Appbar Actions**:
- View toggle (list/grid icon)
- Add group (folder icon, grouped view only)

**Task Cards**:
- Checkbox (completion toggle)
- Task name (strikethrough when done)
- Description (2 lines max)
- Due date ("MMM DD, YYYY HH:MM")
- Edit button (vertical ellipsis)

**Visual States**:
- Completed: Muted background, strikethrough text
- Overdue: Red/destructive styling
- Normal: Card background

**Group Headers** (Grouped view):
- Color indicator
- Group title
- Progress: "X of Y tasks completed (Z%)"
- Menu button for group actions

**Add Task Button** (FAB)

### 8.2 Add/Edit Task Dialog

**Fields**:
- Task Name (required)
- Description (optional, 3 lines)
- Due Date: Date picker + Time picker
- Clear date button (X)
- Group Assignment: Dropdown with:
  - "No Group" option
  - Existing groups (colored)
  - "Create New Group" option

**Inline Group Creation**:
- Title (required)
- Description (optional)
- Color selection (8 colors)

**Actions**:
- Cancel
- Add Task / Update Task
- Delete (edit mode only, destructive)

### 8.3 Task Groups

**Group Colors** (8 options):
- Dark Blue (#1E40AF)
- Green (#4CAF50)
- Red (#F44336)
- Orange (#FF9800)
- Blue (#2196F3)
- Deep Purple (#9C27B0)
- Blue Grey (#607D8B)
- Brown (#795548)

**Group Actions** (Long-press header):
- Delete group (tasks become ungrouped)

---

## 9. Shared UI Components

### Button Variants
| Variant | Usage |
|---------|-------|
| primary | Main actions |
| secondary | Alternative actions |
| outline | Bordered style |
| ghost | Minimal style |
| destructive | Delete/danger |
| success | Positive actions |

### FAB (Floating Action Button)
- **AddFab**: + icon for creation
- **RefreshFab**: Refresh icon for reload

### Dialog Components
- **Dialog**: Modal with custom content
- **AlertDialog**: Confirmation dialogs
- **DeleteConfirmationDialog**: Delete prompts

### Form Components
- **Input**: Text fields with validation
- **Select**: Dropdown selection
- **Switch**: Toggle control
- **Checkbox**: Selection control
- **SegmentedControl**: Radio button group
- **Searchbar**: Search input

### Display Components
- **Card**: Content containers
- **Chip**: Tags and badges
- **Badge**: Small labels
- **Avatar**: Profile images
- **Divider**: Visual separators
- **Skeleton**: Loading placeholders
- **EmptyState**: No data states
- **ProgressBar**: Linear progress

### Media Components
- **MediaViewer**: Image/video viewer
- **AudioPlayer**: Audio playback
- **VoiceRecorder**: Audio recording

---

## 10. Data Management

### Firebase Collections
| Collection | Feature |
|------------|---------|
| transactions | Financial records |
| investments | Investment portfolio |
| students | WT Registry students |
| registrations | WT Registry payments |
| wtLessons | Weekly lesson schedule |
| seminars | Seminar events |
| notes | Note documents |
| tasks | Task items |
| taskGroups | Task groupings |
| calendar | Calendar events |

### React Query Hooks
```typescript
// Transactions
useTransactions(), useBalance(), useAddTransaction()
useInvestments(), useAddInvestment()

// Instagram
useInstagramPosts(), useInstagramAnalytics(), useRAGQuery()

// Notes
useNotes(), useNote(), useAddNote(), useUpdateNote()

// Tasks
useTasks(), useTaskGroups(), useAddTask(), useToggleTaskCompleted()

// Calendar
useCalendarEvents(), useAddCalendarEvent()
```

### Storage
- **AsyncStorage**: Theme preferences, local caching
- **Firebase Storage**: Media attachments, receipts
- **Media Cache**: Image/video caching for performance

### Real-time Features
- **Futures WebSocket**: Live position and balance updates
- **Firebase Listeners**: Available for tasks and other collections

---

## Appendix: All Buttons & Actions

### Global Actions
| Button | Location | Action |
|--------|----------|--------|
| Menu Toggle | Drawer handle | Open/close drawer |
| Dark Mode Switch | Drawer footer | Toggle theme |

### Transactions
| Button | Location | Action |
|--------|----------|--------|
| Add Transaction | Transaction form | Submit new transaction |
| Income/Expense Toggle | Transaction form | Switch transaction type |
| Add Investment FAB | Investments tab | Open add investment modal |
| TP/SL Button | Futures position | Open take profit/stop loss modal |
| Refresh FAB | Futures tab | Reload positions |

### Instagram
| Button | Location | Action |
|--------|----------|--------|
| Post Card | Posts tab | Open post detail |
| Back Button | Post detail | Return to list |
| Open Button | Post detail | Open in Instagram app |
| Send Button | Ask AI | Submit AI query |
| Clear Chat | Ask AI | Delete all messages |
| Suggested Chips | Ask AI | Pre-fill question |

### WT Registry
| Button | Location | Action |
|--------|----------|--------|
| Add FAB | All tabs | Add student/registration/lesson/seminar |
| Call Button | Student detail | Open phone dialer |
| WhatsApp Button | Student detail | Open WhatsApp |
| Instagram Button | Student detail | Open Instagram profile |
| Payment Toggle | Registration card | Toggle paid status |
| View Receipt | Registration | Open attachment |

### Notes
| Button | Location | Action |
|--------|----------|--------|
| Add FAB | Notes list | Create new note |
| Search FAB | Notes list | Toggle search bar |
| Share Button | Note card | Share note content |
| Delete Button | Note card | Delete with confirmation |
| Save Button | Edit screen | Save note changes |
| Format Buttons | Rich editor | Apply text formatting |
| Attachment Buttons | Edit screen | Add media |
| Drawing Tools | Drawing screen | Color, size, eraser, undo, clear |

### Tasks
| Button | Location | Action |
|--------|----------|--------|
| View Toggle | Appbar | Switch list/grouped view |
| Add Group | Appbar | Create task group |
| Add Task FAB | Task list | Create new task |
| Checkbox | Task card | Toggle completion |
| Menu Button | Task/Group | Edit or delete |

---

*Last Updated: February 2026*
*Version: 1.0*
