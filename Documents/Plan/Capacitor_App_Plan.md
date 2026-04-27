# 📱 Capacitor — Android/iOS App Implementation Plan

> **Project:** ConEco Marketplace  
> **Date:** April 2026  
> **Effort:** Medium (3–5 days)  
> **Cost:** Google Play $25 one-time | Apple Dev $99/year  
> **Result:** Real native Android APK + iOS app from your existing React code

---

## What is Capacitor?

**Capacitor by Ionic** wraps your existing React + Vite web app inside a native Android/iOS shell. Your web code runs inside a WebView, but it:
- Gets published on **Google Play Store** and **Apple App Store**
- Accesses native device APIs (camera, push notifications, GPS, etc.)
- Installs like a full native app
- Requires **zero rewrite** of your existing React code

---

## Final Result

```
Your existing React + Vite code
           ↓
Capacitor wraps it as a native shell
           ↓
Android Studio generates signed APK/AAB
           ↓
Upload to Google Play → Users download ConEco from Play Store
```

---

## Prerequisites

| Tool | Required For | Download |
|---|---|---|
| **Node.js** | Capacitor CLI | Already installed |
| **Android Studio** | Android build | https://developer.android.com/studio |
| **Java JDK 17+** | Android Studio | Bundled with Android Studio |
| **Xcode** | iOS build | Mac App Store (Mac only) |
| **Google Play Account** | Publishing Android | play.google.com/console ($25 one-time) |
| **Apple Dev Account** | Publishing iOS | developer.apple.com ($99/year) |

> **Note:** iOS publishing requires a Mac. Android can be done on Windows.

---

## Files to Create / Modify

| File | Action |
|---|---|
| `Frontend/capacitor.config.json` | **NEW** — Capacitor configuration |
| `Frontend/android/` | **NEW** — Auto-generated Android project |
| `Frontend/ios/` | **NEW** — Auto-generated iOS project (Mac only) |
| `Frontend/vite.config.js` | **MODIFY** — Set base path for Capacitor |
| `Frontend/src/api.js` or `axiosConfig.js` | **MODIFY** — Ensure API URL is absolute |

---

## Step-by-Step Implementation

---

### Step 1 — Install Capacitor

```bash
cd Frontend
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android
npm install @capacitor/ios    # Optional — only if you have a Mac
```

---

### Step 2 — Initialize Capacitor

```bash
npx cap init
```

When prompted:
- **App Name:** `ConEco`
- **App ID:** `com.coneco.app`
- **Web Dir:** `dist`

This creates `capacitor.config.json`:

```json
{
  "appId": "com.coneco.app",
  "appName": "ConEco",
  "webDir": "dist",
  "server": {
    "androidScheme": "https",
    "url": "https://coneco-frontend.onrender.com",
    "cleartext": false
  },
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 2000,
      "backgroundColor": "#1a1a2e",
      "androidSplashResourceName": "splash",
      "showSpinner": false
    }
  }
}
```

> **`server.url`** — Points to your live Render URL. This means the app always loads the latest version from the web. Remove this for a fully offline bundled app.

---

### Step 3 — Update `vite.config.js`

Make sure the base is `/` (default for Capacitor):

```js
export default defineConfig({
  base: '/',
  plugins: [react()],
  // ... rest of your config
})
```

---

### Step 4 — Build the Web App

```bash
npm run build
# This generates the /dist folder that Capacitor wraps
```

---

### Step 5 — Add Android Platform

```bash
npx cap add android
```

This creates a full Android Studio project at `Frontend/android/`.

---

### Step 6 — Sync Web Build into Android

Run this every time you build new web code:

```bash
npx cap sync android
```

---

### Step 7 — Open in Android Studio

```bash
npx cap open android
```

Android Studio opens. Wait for Gradle to finish syncing (~2–5 min first time).

---

### Step 8 — Configure App Icons & Splash Screen

Install the assets plugin:
```bash
npm install @capacitor/assets --save-dev
```

Create source images:
```
Frontend/assets/
├── icon.png          # 1024x1024 px — your ConEco logo
└── splash.png        # 2732x2732 px — splash screen background
```

Generate all sizes automatically:
```bash
npx capacitor-assets generate --android
```

This auto-generates all required icon sizes for Android.

---

### Step 9 — Configure App in Android Studio

In `AndroidManifest.xml`:
```xml
<application
    android:label="ConEco"
    android:icon="@mipmap/ic_launcher"
    android:roundIcon="@mipmap/ic_launcher_round"
    ...>
```

In `build.gradle` (app level):
```gradle
android {
    defaultConfig {
        applicationId "com.coneco.app"
        minSdkVersion 22
        targetSdkVersion 34
        versionCode 1
        versionName "1.0.0"
    }
}
```

---

### Step 10 — Install Useful Capacitor Plugins (Optional)

```bash
# Push Notifications
npm install @capacitor/push-notifications

# Camera (for profile photos)
npm install @capacitor/camera

# Network status
npm install @capacitor/network

# App info (version display)
npm install @capacitor/app

# After installing any plugin:
npx cap sync android
```

---

### Step 11 — Test on Real Device

1. Enable **Developer Mode** on your Android phone
2. Enable **USB Debugging**
3. Connect via USB
4. In Android Studio → Run → Select your device
5. App installs and opens on your phone!

Or test on emulator:
- Android Studio → Device Manager → Create Virtual Device
- Choose Pixel 6, API 34
- Run

---

### Step 12 — Build Signed APK for Play Store

1. In Android Studio: **Build → Generate Signed Bundle / APK**
2. Choose **Android App Bundle (AAB)** — required for Play Store
3. Create a **Keystore file** (save this — you need it for every update!):
   - Keystore path: `Frontend/android/coneco.jks`
   - Key alias: `coneco-key`
   - Passwords: set strong passwords — **DO NOT LOSE THEM**
4. Build → `release/app-release.aab` is generated

---

### Step 13 — Publish on Google Play Store

1. Go to [play.google.com/console](https://play.google.com/console)
2. Create new app → **ConEco**
3. Fill in:
   - App description
   - Screenshots (phone + tablet)
   - Feature graphic (1024×500 px banner)
   - Privacy policy URL (required)
   - Category: Business / Shopping
4. Upload your `.aab` file
5. Submit for review (takes 1–3 days for first submission)

---

## API Configuration for Mobile

Since Capacitor runs the app from a native shell, all API calls must use the **full absolute URL**:

```js
// ❌ Don't use:
const API = '/api/auth/login'

// ✅ Use full URL:
const API = 'https://coneco-backend.onrender.com/api/auth/login'
```

Check your `axiosConfig.js` or wherever `baseURL` is defined:
```js
const axiosInstance = axios.create({
  baseURL: 'https://coneco-backend.onrender.com',
  withCredentials: true,
})
```

---

## CORS Configuration (Backend)

Make sure your FastAPI `main.py` allows requests from the Capacitor app origin:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://coneco-frontend.onrender.com",
        "capacitor://localhost",       # Capacitor iOS
        "http://localhost",            # Capacitor Android
        "http://localhost:5173",       # Local dev
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Update Workflow (After Release)

Every time you make code changes:

```bash
# 1. Build new web version
npm run build

# 2. Sync to Android
npx cap sync android

# 3. Open Android Studio
npx cap open android

# 4. Increment versionCode in build.gradle (e.g., 1 → 2)

# 5. Generate new signed AAB

# 6. Upload to Play Store → Production → New release
```

---

## iOS (Mac Only)

```bash
npx cap add ios
npx cap sync ios
npx cap open ios   # Opens Xcode
```

In Xcode:
- Set Bundle ID: `com.coneco.app`
- Set version: `1.0.0`
- Configure signing with Apple Dev certificate
- Product → Archive → Distribute to App Store

---

## Timeline

| Day | Task |
|---|---|
| Day 1 AM | Install Capacitor, initialize, configure |
| Day 1 PM | Build, add Android platform, open Android Studio |
| Day 2 AM | Configure icons, splash screen, test on emulator |
| Day 2 PM | Test on real Android device, fix any issues |
| Day 3 AM | Fix API URLs, CORS, cookie handling |
| Day 3 PM | Build signed APK/AAB |
| Day 4 | Create Play Store listing, upload screenshots, submit |
| Day 5 | Review period (Google takes 1–3 days) |

---

## Cost Breakdown

| Item | Cost |
|---|---|
| Capacitor (open source) | Free |
| Android Studio | Free |
| Google Play Developer Account | $25 (one-time) |
| Apple Developer Account | $99/year |
| Render hosting (already set up) | Free tier |
| **Android Total** | **$25 one-time** |
| **iOS Total** | **$99/year + Mac required** |

---

## Capacitor vs PWA — When to Use Which

| Scenario | Use |
|---|---|
| Want users to try the app quickly | PWA |
| Want Play Store listing | Capacitor |
| Want push notifications on iOS | Capacitor |
| Limited budget, no App Store needed | PWA |
| Want the best install experience | Capacitor |
| Have a Mac for iOS | Capacitor + iOS |

---

## Recommended Order

1. **Do PWA first** → Free, fast, works on Android immediately
2. **Then do Capacitor** → Get on Play Store for credibility
3. **iOS later** → Only when you have a Mac or budget for Mac rental

---

*Last Updated: April 2026 | ConEco Team*
