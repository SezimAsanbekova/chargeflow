This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## 🚗 EV Charging Station Platform with Navigation Simulator

A comprehensive electric vehicle charging station platform with an advanced navigation test-drive feature and **Progressive Web App (PWA)** support.

### ✨ Key Features

- 🗺️ **Interactive Map** - Browse charging stations on an interactive map
- 🧭 **Navigation Simulator** - Test drive routes without real GPS (2GIS-style)
- 🔊 **Voice Guidance** - Automatic voice instructions in Russian ✅ **FIXED: Now correctly announces left/right turns**
- ⚡ **Real-time Updates** - Live distance and time updates
- 🎮 **Speed Control** - Adjustable simulation speed (10-60 km/h)
- 📍 **Turn-by-Turn Directions** - Clear visual and audio instructions
- 🔋 **Station Management** - Browse, filter, and book charging stations
- 💳 **Balance Management** - Top-up and track charging costs
- 👨‍💼 **Admin Panel** - Comprehensive management system for administrators
- 📱 **PWA Support** - Install as native app, work offline, fast loading

### 🎯 Navigation Test Drive

The platform includes a full-featured navigation simulator that allows you to:

1. **Build Routes** - Automatic route planning to charging stations
2. **Test Drive** - Virtual movement along the route without real GPS
3. **Voice Guidance** - Hear turn-by-turn instructions
4. **Control Speed** - Choose from 10, 20, 40, or 60 km/h
5. **Pause/Resume** - Control simulation at any time
6. **View All Steps** - See complete route with all turns

#### Quick Start for Navigation

```bash
# 1. Open the map
Navigate to /map

# 2. Select a charging station
Click on any green marker

# 3. Build route
Click "Маршрут" button

# 4. Start test drive
Click "Начать тест-драйв"

# 5. Control simulation
Use the control panel to play/pause/reset
```

For detailed instructions, see:
- 📱 **[PWA Installation Guide](PWA_УСТАНОВКА.md)** - Quick PWA installation guide (Russian)
- 📱 **[PWA Complete Guide](PWA_GUIDE.md)** - Complete PWA documentation
- 📖 [Quick Start Guide](QUICKSTART_NAVIGATION.md) - Get started in 60 seconds
- 📚 [User Guide (Russian)](NAVIGATION_GUIDE_RU.md) - Complete user documentation
- 🔧 [Developer Notes](app/map/DEVELOPER_NOTES.md) - Technical documentation
- 💻 [API Examples](app/map/API_EXAMPLES.md) - Code examples
- 👨‍💼 [Admin Panel Guide](ADMIN_PANEL_GUIDE.md) - Complete admin panel documentation
- 📋 [Admin Panel (Russian)](АДМИН_ПАНЕЛЬ.md) - Quick admin guide in Russian
- ✅ [Voice Timing Fix](VOICE_TIMING_FIX.md) - Latest fix for announcement timing
- ✅ [Voice Debug Guide](VOICE_DEBUG_INSTRUCTIONS.md) - Debugging voice navigation
- ✅ [Voice Fix (Russian)](ГОЛОСОВОЙ_НАВИГАТОР_ИСПРАВЛЕН.md) - Voice navigation fix details
- 🔧 [Voice Directions Fix](VOICE_DIRECTIONS_FIX.md) - Technical details of the fix

## Getting Started

### 📱 Install as PWA (Recommended)

ChargeFlow supports Progressive Web App installation for the best experience:

**Benefits:**
- ✅ Install on home screen
- ✅ Work offline
- ✅ Fast loading with caching
- ✅ Native app experience
- ✅ Automatic updates

**Quick Install:**
- **Android/Desktop**: Click "Install" banner or browser menu → "Install ChargeFlow"
- **iOS**: Safari → Share → "Add to Home Screen"

See [PWA_УСТАНОВКА.md](PWA_УСТАНОВКА.md) for detailed instructions.

### 💻 Run Development Server

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## 📦 Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Maps**: MapLibre GL JS
- **Authentication**: NextAuth.js
- **Database**: PostgreSQL (via Prisma)
- **UI Components**: Custom + Lucide Icons
- **Navigation**: OSRM API
- **Voice**: Web Speech API
- **PWA**: next-pwa with Workbox

## 🏗️ Project Structure

```
├── app/
│   ├── map/                      # Map and navigation
│   │   ├── components/           # Navigation components
│   │   │   ├── NavigationPanel.tsx
│   │   │   ├── NavigationSimulator.tsx
│   │   │   └── SimulationControls.tsx
│   │   └── page.tsx              # Main map page
│   ├── admin/                    # Admin dashboard
│   ├── api/                      # API routes
│   └── components/               # Shared components
├── docs/                         # Documentation
│   ├── NAVIGATION_GUIDE_RU.md
│   ├── QUICKSTART_NAVIGATION.md
│   └── CHANGELOG_NAVIGATION.md
└── public/                       # Static assets
```

## 🚀 Features in Detail

### 👨‍💼 Admin Panel

The platform includes a comprehensive admin panel for managing the entire system:

**Access**: `/admin/signin` (Two-factor authentication via Telegram)

**Features:**
- 📊 **Dashboard** - Overview with key statistics (users, stations, bookings, revenue)
- 📈 **Analytics** - Detailed statistics with PDF export (sessions, energy, revenue by period)
- 👥 **Users** - User management (search, filter, block/unblock, view history)
- 📍 **Stations** - Station management (add, edit, delete, filter by status/date)
- 📅 **Bookings** - View and manage all bookings (active, completed, cancelled)
- 💰 **Finance** - Financial tracking with CSV export (payments, revenue, transactions)
- ⚙️ **Settings** - System configuration (Telegram, Email, Payments, System settings)

**Security:**
- Two-factor authentication (Email + Telegram code)
- Role-based access control
- Protected routes
- Session management

**See**: [ADMIN_PANEL_GUIDE.md](ADMIN_PANEL_GUIDE.md) for complete documentation or [АДМИН_ПАНЕЛЬ.md](АДМИН_ПАНЕЛЬ.md) for quick guide in Russian.

### 🆕 Recent Fixes (May 9, 2026)

#### ✅ Voice Navigation Timing Fixed (Latest)
Voice announcements now work correctly during navigation:
- ✅ Announces at **200m, 100m, and 50m** before turns
- ✅ Works during movement (not just at arrival)
- ✅ Wider announcement ranges (170-200m, 70-100m, 20-50m)
- ✅ Detailed console logging for debugging

**What was fixed**: 
1. Added 200m threshold for earlier warnings
2. Expanded announcement ranges from 20m to 30m width
3. Added comprehensive logging to track announcement logic

**See**: [VOICE_TIMING_FIX.md](VOICE_TIMING_FIX.md) for technical details and [VOICE_DEBUG_INSTRUCTIONS.md](VOICE_DEBUG_INSTRUCTIONS.md) for debugging guide.

#### ✅ Voice Navigation Directions Fixed
The voice navigator now correctly announces all turn directions:
- ✅ "Turn left" / "Turn right" - works correctly
- ✅ "Sharp turn left/right" - works correctly  
- ✅ "Slight turn left/right" - works correctly
- ✅ "At the end of the road turn left/right" - works correctly
- ✅ "Continue straight" - works correctly

**What was fixed**: The `formatInstruction()` method in `voiceNavigator.ts` was missing handlers for turn instructions. Now all turn types are properly processed and announced.

**See**: [ГОЛОСОВОЙ_НАВИГАТОР_ИСПРАВЛЕН.md](ГОЛОСОВОЙ_НАВИГАТОР_ИСПРАВЛЕН.md) for user guide (Russian) or [VOICE_DIRECTIONS_FIX.md](VOICE_DIRECTIONS_FIX.md) for technical details.

### Navigation Simulator

The navigation simulator provides a realistic test-drive experience:

- **Smooth Movement**: Marker moves smoothly along the route
- **Auto-Follow**: Map automatically follows the marker
- **Smart Detection**: Automatic step detection and switching
- **Voice Announcements**: Speaks instructions 50m before turns
- **Real-time Updates**: Distance and time update every second
- **Flexible Control**: Pause, resume, reset, or exit anytime

### Supported Maneuvers

- ⬆️ Start movement
- ↖️ Turn left / ↗️ Turn right
- ⬆️ Continue straight
- ↩️ U-turn
- 🔄 Roundabout
- 🔀 Fork in road
- 🏁 Arrival

## 🎨 UI/UX Highlights

- **2GIS-Inspired Design**: Familiar navigation interface
- **Dark Theme**: Easy on the eyes, especially at night
- **Large Icons**: Clear direction arrows
- **Responsive**: Works on desktop and mobile
- **Accessible**: Voice guidance for drivers

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
