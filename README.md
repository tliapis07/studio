# SalesStream CRM

High-performance partner portal for telesales management. Built with Next.js, Firebase, and AI. Optimized for high-velocity organizational workflows.

## 🚀 Production Deployment

SalesStream is optimized for static export and native wrapping via Capacitor (Android/iOS).

### 1. Build Static Assets
```bash
npm run build
```
This generates the `out/` folder containing the standalone SPA.

### 2. Android Deployment
Ensure you have Android Studio installed and the `ANDROID_HOME` env variable set.

**Sync Assets:**
```bash
npm run cap:sync
```

**Build APK:**
1. Open in Android Studio: `npx cap open android`
2. In Android Studio: `Build > Build Bundle(s) / APK(s) > Build APK(s)`
3. The APK will be located in `android/app/build/outputs/apk/debug/app-debug.apk`.

### 3. Desktop Deployment (Tauri)
- Ensure `tauri.conf.json` has `distDir` set to `../out`.
- Build: `cargo tauri build`

## 🛠 Features
- **Offline First:** Local Firestore persistence for interrupted connectivity.
- **AI Strategic Suite:** Automated call script generation and lead summarization via Genkit + Gemini.
- **Secure Dual-Auth:** Google Workspace + Email/Password with mandatory verification.
- **Enterprise Analytics:** Real-time organizational velocity diagnostics.

## 🔒 Security
- **Defense in Depth:** Mandatory `ownerUid` filtering enforced at the hook layer.
- **Rules are not Filters:** Queries are strictly scoped to authenticated user IDs before execution.
- **GDPR Ready:** Account termination flow wipes all organizational references from Firestore.

---
**SalesStream v0.1.0** | High-Performance Partner CRM
