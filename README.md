# SalesStream CRM

High-performance partner portal for sales team management. Built with Next.js, Firebase, and AI.

## Native App Deployment

SalesStream is optimized for static export and native wrapping via Capacitor (Mobile) and Tauri (Desktop).

### 1. Build the Static Web Assets
```bash
npm run build
```
This generates the `out/` folder containing the full SPA.

### 2. Mobile Deployment (iOS/Android)
We use **Capacitor** to wrap the static site into native binaries.
- **Initialize (first time):** `npx cap add ios` or `npx cap add android`
- **Sync changes:** `npx cap sync`
- **Open in IDE:** `npx cap open ios` or `npx cap open android`

### 3. Desktop Deployment (Windows/Mac/Linux)
We use **Tauri** for desktop wrapping.
- **Setup:** Ensure `tauri.conf.json` has `distDir` set to `../out`.
- **Build:** `cargo tauri build`

## Features
- **Offline First:** Full Firestore persistence for working without connectivity.
- **AI Sales Strategist:** Persistent Gemini assistant for script drafting and task automation.
- **Universal Leads:** Import from CSV/Excel and auto-sync with client directory.
- **Professional Calendar:** Multi-view grid with automated follow-up reminders.
