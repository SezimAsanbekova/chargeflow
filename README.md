This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## 🚗 EV Charging Station Platform with Navigation Simulator

A comprehensive electric vehicle charging station platform with an advanced navigation test-drive feature.

### ✨ Key Features

- 🗺️ **Interactive Map** - Browse charging stations on an interactive map
- 🧭 **Navigation Simulator** - Test drive routes without real GPS (2GIS-style)
- 🔊 **Voice Guidance** - Automatic voice instructions in Russian
- ⚡ **Real-time Updates** - Live distance and time updates
- 🎮 **Speed Control** - Adjustable simulation speed (10-60 km/h)
- 📍 **Turn-by-Turn Directions** - Clear visual and audio instructions
- 🔋 **Station Management** - Browse, filter, and book charging stations
- 💳 **Balance Management** - Top-up and track charging costs

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
- 📖 [Quick Start Guide](QUICKSTART_NAVIGATION.md) - Get started in 60 seconds
- 📚 [User Guide (Russian)](NAVIGATION_GUIDE_RU.md) - Complete user documentation
- 🔧 [Developer Notes](app/map/DEVELOPER_NOTES.md) - Technical documentation
- 💻 [API Examples](app/map/API_EXAMPLES.md) - Code examples

## Getting Started

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
