# 🛠️ PWA Developer Guide

## Quick Start

### Installation
```bash
npm install
npm run pwa:icons  # Generate icons from logo
npm run build      # Build with PWA
npm start          # Start production server
```

### Development
```bash
npm run dev  # PWA disabled in development
```

## Architecture

### File Structure
```
chargeflow/
├── app/
│   ├── components/
│   │   ├── PWAProvider.tsx          # Main PWA wrapper
│   │   ├── PWAInstallPrompt.tsx     # Android/Desktop install
│   │   ├── IOSInstallPrompt.tsx     # iOS install guide
│   │   ├── OfflineIndicator.tsx     # Connection status
│   │   └── PWAStatus.tsx            # Status display
│   ├── hooks/
│   │   └── usePWA.ts                # PWA hooks
│   ├── layout.tsx                   # PWA meta tags
│   └── sitemap.ts                   # Dynamic sitemap
├── public/
│   ├── manifest.json                # Web app manifest
│   ├── icon-*.png                   # App icons
│   └── sw.js                        # Service worker (generated)
├── scripts/
│   └── generate-icons.js            # Icon generator
├── types/
│   └── next-pwa.d.ts               # TypeScript types
└── next.config.ts                   # PWA configuration
```

## Components

### PWAProvider
Main provider component that wraps the app.

```tsx
import PWAProvider from './PWAProvider';

<PWAProvider>
  {children}
</PWAProvider>
```

**Features:**
- Service Worker registration
- Update detection
- Prevent accidental close during charging

### PWAInstallPrompt
Install prompt for Android and Desktop browsers.

**Features:**
- Automatic display on first visit
- Dismissible with localStorage
- beforeinstallprompt event handling

### IOSInstallPrompt
Step-by-step installation guide for iOS Safari.

**Features:**
- iOS detection
- Visual installation steps
- Dismissible with localStorage

### OfflineIndicator
Connection status indicator.

**Features:**
- Real-time online/offline detection
- Auto-hide after 3 seconds (online)
- Persistent display (offline)

### PWAStatus
Display PWA installation and connection status.

```tsx
import PWAStatus from '@/app/components/PWAStatus';

<PWAStatus />
```

**Shows:**
- Installation status
- Display mode (app/browser)
- Platform (iOS/Android/Desktop)
- Connection status
- Cache size

## Hooks

### usePWA()
Get PWA installation state.

```typescript
import { usePWA } from '@/app/hooks/usePWA';

const {
  isInstalled,    // App is installed
  isStandalone,   // Running as standalone app
  canInstall,     // Can show install prompt
  isIOS,          // iOS device
  isAndroid       // Android device
} = usePWA();
```

### useOnlineStatus()
Get online/offline status.

```typescript
import { useOnlineStatus } from '@/app/hooks/usePWA';

const isOnline = useOnlineStatus();
```

### useBeforeInstallPrompt()
Manage install prompt.

```typescript
import { useBeforeInstallPrompt } from '@/app/hooks/usePWA';

const { canInstall, promptInstall } = useBeforeInstallPrompt();

if (canInstall) {
  const accepted = await promptInstall();
  console.log(accepted ? 'Installed' : 'Dismissed');
}
```

## Configuration

### next.config.ts

```typescript
import withPWA from 'next-pwa';

const pwaConfig = withPWA({
  dest: 'public',              // Output directory
  register: true,              // Auto-register SW
  skipWaiting: true,           // Activate new SW immediately
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    // Caching strategies
  ]
});

export default pwaConfig(nextConfig);
```

### manifest.json

```json
{
  "name": "ChargeFlow",
  "short_name": "ChargeFlow",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#10b981",
  "background_color": "#ffffff",
  "icons": [...]
}
```

## Caching Strategies

### CacheFirst
Cache first, network fallback. Best for static assets.

```typescript
{
  urlPattern: /\.(?:png|jpg|jpeg|svg)$/i,
  handler: 'CacheFirst',
  options: {
    cacheName: 'images',
    expiration: {
      maxEntries: 64,
      maxAgeSeconds: 24 * 60 * 60
    }
  }
}
```

### NetworkFirst
Network first, cache fallback. Best for API calls.

```typescript
{
  urlPattern: /\/api\/.*$/i,
  handler: 'NetworkFirst',
  options: {
    cacheName: 'api',
    networkTimeoutSeconds: 10,
    expiration: {
      maxEntries: 16,
      maxAgeSeconds: 24 * 60 * 60
    }
  }
}
```

### StaleWhileRevalidate
Serve from cache, update in background. Best for frequently updated content.

```typescript
{
  urlPattern: /\.(?:js|css)$/i,
  handler: 'StaleWhileRevalidate',
  options: {
    cacheName: 'static-assets',
    expiration: {
      maxEntries: 32,
      maxAgeSeconds: 24 * 60 * 60
    }
  }
}
```

## Icon Generation

### Automatic Generation
```bash
npm run pwa:icons
```

Generates from `public/logo12.png`:
- 16x16, 32x32 (favicons)
- 72x72, 96x96, 128x128, 144x144, 152x152
- 180x180 (Apple Touch Icon)
- 192x192, 384x384, 512x512 (Android)

### Manual Generation
```javascript
const sharp = require('sharp');

await sharp('logo.png')
  .resize(192, 192)
  .png()
  .toFile('icon-192x192.png');
```

## Testing

### Chrome DevTools

1. **Lighthouse Audit**
   - DevTools → Lighthouse
   - Select "Progressive Web App"
   - Generate report

2. **Application Panel**
   - Manifest: Check manifest.json
   - Service Workers: Check registration
   - Cache Storage: Inspect cached files
   - Storage: Check usage

3. **Network Panel**
   - Throttling: Test slow connections
   - Offline: Test offline functionality

### Manual Testing

```bash
# Build production
npm run build

# Start production server
npm start

# Test in browser
open http://localhost:3000
```

**Test checklist:**
- [ ] Install prompt appears
- [ ] App installs successfully
- [ ] Offline mode works
- [ ] Updates are detected
- [ ] Icons display correctly
- [ ] Manifest loads
- [ ] Service Worker registers

## Debugging

### Service Worker Issues

```javascript
// Unregister all service workers
navigator.serviceWorker.getRegistrations()
  .then(registrations => {
    registrations.forEach(r => r.unregister());
  });

// Clear all caches
caches.keys().then(names => {
  names.forEach(name => caches.delete(name));
});
```

### Console Logging

```typescript
// Enable SW logging
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js', {
    scope: '/',
    updateViaCache: 'none'
  }).then(reg => {
    console.log('SW registered:', reg);
  });
}
```

### Common Issues

**Issue: SW not updating**
```bash
# Clear cache and rebuild
rm -rf .next
npm run build
```

**Issue: Icons not showing**
```bash
# Regenerate icons
npm run pwa:icons
npm run build
```

**Issue: Manifest not loading**
- Check HTTPS (required for PWA)
- Verify manifest.json syntax
- Check Content-Type header

## Deployment

### Vercel
```bash
vercel --prod
```

PWA works automatically on Vercel.

### Custom Server
```bash
npm run build
npm start
```

**Requirements:**
- HTTPS (required for PWA)
- Serve static files from /public
- Proper MIME types for manifest.json

### Environment Variables
```bash
NEXT_PUBLIC_BASE_URL=https://chargeflow.app
```

## Best Practices

### Do's ✅
- Test on real devices
- Use HTTPS in production
- Keep Service Worker simple
- Cache strategically
- Update regularly
- Monitor cache size
- Handle offline gracefully

### Don'ts ❌
- Don't cache sensitive data
- Don't cache too much (quota limits)
- Don't block main thread
- Don't forget to test offline
- Don't ignore update prompts
- Don't cache API responses indefinitely

## Performance

### Metrics
- First Load: ~3-5s
- Repeat Load: ~0.5-1s
- Offline: Instant

### Optimization
```typescript
// Preload critical assets
<link rel="preload" href="/icon-192x192.png" as="image" />

// Lazy load non-critical
const PWAStatus = lazy(() => import('./PWAStatus'));
```

## Security

### Content Security Policy
```typescript
// next.config.ts
headers: [
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-eval'"
  }
]
```

### Service Worker Scope
```typescript
// Limit SW scope
navigator.serviceWorker.register('/sw.js', {
  scope: '/'  // Only cache this domain
});
```

## Resources

- [Next.js PWA Docs](https://github.com/shadowwalker/next-pwa)
- [Workbox Docs](https://developers.google.com/web/tools/workbox)
- [PWA Checklist](https://web.dev/pwa-checklist/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

## Support

For issues or questions:
1. Check [PWA_GUIDE.md](PWA_GUIDE.md)
2. Review [PWA_CHANGELOG.md](PWA_CHANGELOG.md)
3. Test with Chrome DevTools
4. Check browser console for errors

---

**Happy PWA Development!** 🚀
