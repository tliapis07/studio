# SalesStream CRM

High-performance partner portal for telesales management. Built with Next.js, Firebase, and AI. Optimized for high-velocity organizational workflows.

## 🚀 Deployment & APK Build Guide

SalesStream is optimized for static export and native wrapping via Capacitor (Android/iOS). Follow these steps to generate your local APK.

### 1. Prerequisites
- **Node.js** (v18+)
- **Android Studio** (for APK generation)
- **Firebase Project** (with Auth and Firestore enabled)

### 2. Local Setup & Build
```bash
# Install dependencies
npm install

# Generate production static assets
npm run build
```
This generates the `out/` folder containing the standalone SPA.

### 3. Capacitor Android Sync
```bash
# Synchronize web assets with the Android project
npx cap sync android
```

### 4. Build APK (Android Studio)
1. Open the project in Android Studio: `npx cap open android`
2. Wait for Gradle sync to complete.
3. In the top menu, go to **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
4. Once finished, a notification will appear. Click **Locate** to find `app-debug.apk`.
5. Install this APK on any Android device for testing.

## 🛠 Features
- **Offline First:** Local Firestore persistence for interrupted connectivity.
- **AI Strategic Suite:** Automated call script generation and lead summarization via Genkit + Gemini.
- **Secure Dual-Auth:** Google Workspace + Email/Password with mandatory verification.
- **Native Haptics:** Tactile feedback for high-impact actions on mobile.
- **Enterprise Analytics:** Real-time organizational velocity diagnostics.

## 🔒 Security
- **ownerUid Enforcement:** Every query is strictly scoped to the authenticated user ID before execution.
- **Defense in Depth:** The `useCollection` hook automatically injects ownership filters to prevent "Rules are not Filters" permission crashes.
- **GDPR Ready:** Account termination flow wipes all organizational references from Firestore.

---
**SalesStream v0.1.0-prod** | High-Performance Partner CRM