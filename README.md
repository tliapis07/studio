# SalesStream CRM

High-performance partner portal for sales team management. Built with Next.js, Firebase, and AI.

## Native App Deployment

SalesStream is optimized for static export and native wrapping via Capacitor (Mobile) and Tauri (Desktop).

### 1. Build the Static Web Assets
```bash
npm run build
```
This generates the `out/` folder containing the full standalone SPA.

### 2. Mobile Deployment (Android / iOS)
We use **Capacitor** to wrap the static site into native binaries.

**First-time Setup:**
1. Add the Android platform:
   ```bash
   npx cap add android
   ```
2. (Optional) Add iOS:
   ```bash
   npx cap add ios
   ```

**Routine Sync & Launch:**
- **Sync changes:** `npx cap sync` (This pulls the `out/` directory into native platforms)
- **Open in IDE:** `npx cap open android` or `npx cap open ios`
- **Build APK:** In Android Studio, go to `Build > Build Bundle(s) / APK(s) > Build APK(s)`.

### 3. Desktop Deployment (Windows/Mac/Linux)
We use **Tauri** for desktop wrapping.
- **Setup:** Ensure `tauri.conf.json` has `distDir` set to `../out`.
- **Build:** `cargo tauri build`

## Features
- **Offline First:** Full Firestore persistence for working without connectivity.
- **AI Sales Strategist:** Persistent Gemini assistant for script drafting and task automation.
- **Universal Leads:** Import from CSV/Excel and auto-sync with client directory.
- **Professional Calendar:** Multi-view grid with automated follow-up reminders.
