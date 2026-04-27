# 📱 PWA (Progressive Web App) — Implementation Plan

> **Project:** ConEco Marketplace  
> **Date:** April 2026  
> **Effort:** Low (1–2 days)  
> **Cost:** Free  
> **Result:** Installable app directly from browser — no App Store needed

---

## What is a PWA?

A Progressive Web App makes your existing website **installable on Android/iOS home screens** like a real app. Users open Chrome/Safari, visit your site, and tap "Add to Home Screen". It:
- Opens full-screen (no browser bar)
- Works offline (with caching)
- Gets push notifications (optional)
- Loads instantly on repeat visits

**No APK, no App Store, no rewrite needed.**

---

## Final Result

```
User visits https://coneco-frontend.onrender.com on mobile Chrome
           ↓
Chrome shows banner: "Add ConEco to Home Screen"
           ↓
User taps "Add"
           ↓
ConEco icon appears on home screen like a real app
           ↓
Tap icon → opens full screen, no browser URL bar
           ↓
App works offline for previously visited pages
```

---

## Requirements Checklist

| Requirement | Status |
|---|---|
| React + Vite frontend | ✅ Already have it |
| HTTPS on production | ✅ Render provides SSL |
| `manifest.json` | 🔲 Need to create |
| Service Worker | 🔲 Need to add (via plugin) |
| App icons (various sizes) | 🔲 Need to create |

---

## Files to Create / Modify

| File | Action |
|---|---|
| `Frontend/vite.config.js` | **MODIFY** — Add VitePWA plugin |
| `Frontend/public/manifest.json` | **NEW** — App identity & display config |
| `Frontend/public/icons/` | **NEW** — App icons (multiple sizes) |
| `Frontend/src/main.jsx` | **MODIFY** — Register service worker |

---

## Step-by-Step Implementation

---

### Step 1 — Install `vite-plugin-pwa`

```bash
cd Frontend
npm install vite-plugin-pwa --save-dev
```

---

### Step 2 — Update `vite.config.js`

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/*.png'],
      manifest: {
        name: 'ConEco — B2B Marketplace',
        short_name: 'ConEco',
        description: 'B2B construction marketplace connecting customers and vendors',
        theme_color: '#1a1a2e',
        background_color: '#1a1a2e',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/icons/icon-72.png',   sizes: '72x72',   type: 'image/png' },
          { src: '/icons/icon-96.png',   sizes: '96x96',   type: 'image/png' },
          { src: '/icons/icon-128.png',  sizes: '128x128', type: 'image/png' },
          { src: '/icons/icon-144.png',  sizes: '144x144', type: 'image/png' },
          { src: '/icons/icon-152.png',  sizes: '152x152', type: 'image/png' },
          { src: '/icons/icon-192.png',  sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/icons/icon-384.png',  sizes: '384x384', type: 'image/png' },
          { src: '/icons/icon-512.png',  sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/coneco-backend\.onrender\.com\/api\/.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 300 }
            }
          }
        ]
      }
    })
  ]
})
```

---

### Step 3 — Create App Icons

You need PNG icons in these sizes:
```
Frontend/public/icons/
├── icon-72.png
├── icon-96.png
├── icon-128.png
├── icon-144.png
├── icon-152.png
├── icon-192.png   ← Most important (Android home screen)
├── icon-384.png
└── icon-512.png   ← Most important (splash screen)
```

**Free icon generator:** https://realfavicongenerator.net  
Upload your ConEco logo → download all sizes automatically.

---

### Step 4 — Add "Install App" Banner in UI (Optional but recommended)

Add a subtle install prompt in `Navbar.jsx` or `Home.jsx`:

```jsx
const [deferredPrompt, setDeferredPrompt] = useState(null);
const [showInstall, setShowInstall] = useState(false);

useEffect(() => {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    setDeferredPrompt(e);
    setShowInstall(true);
  });
}, []);

const handleInstall = async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setShowInstall(false);
  }
};

// In JSX:
{showInstall && (
  <div className="install-banner">
    <span>📱 Install ConEco App</span>
    <button onClick={handleInstall}>Install</button>
    <button onClick={() => setShowInstall(false)}>✕</button>
  </div>
)}
```

---

### Step 5 — Build and Deploy

```bash
npm run build
# Check dist/ — you'll see sw.js and workbox-*.js files generated
git add .
git commit -m "feat: add PWA support with vite-plugin-pwa"
git push
```

Render auto-deploys → your site is now a PWA!

---

## Testing PWA

### On Android (Chrome):
1. Visit your Render URL in Chrome
2. Tap ⋮ menu → "Add to Home Screen"
3. Install → icon appears on home screen
4. Open → full-screen app experience

### Using Chrome DevTools:
1. Open DevTools → Application → Manifest
2. Check all manifest fields are green ✅
3. Application → Service Workers → verify SW registered
4. Lighthouse → Run audit → PWA score should be 90+

---

## Offline Support

With `workbox` configured, the PWA will:
- Cache pages users have already visited
- Show cached content when offline
- Sync when connection returns

---

## Limitations vs Native App

| Feature | PWA | Native App |
|---|---|---|
| Home screen icon | ✅ | ✅ |
| Full screen | ✅ | ✅ |
| Push notifications | ✅ Android, ❌ iOS | ✅ Both |
| Camera / GPS access | ✅ (via browser API) | ✅ |
| App Store listing | ❌ | ✅ |
| Works offline | ✅ (cached pages) | ✅ |
| iOS home screen | ✅ (limited) | ✅ |

---

## Timeline

| Day | Task |
|---|---|
| Day 1 AM | Install plugin, update vite.config.js |
| Day 1 PM | Create icons, test locally |
| Day 2 AM | Add install banner to UI |
| Day 2 PM | Deploy, test on real Android device, Lighthouse audit |

---

## Cost

| Item | Cost |
|---|---|
| vite-plugin-pwa | Free (open source) |
| Hosting | Free (already on Render) |
| Icon creation | Free (realfavicongenerator.net) |
| **Total** | **₹0** |

---

*Last Updated: April 2026 | ConEco Team*
