<div align="center">

# 🌍 Earth Flow

A calm focus space — ambient sound mixer, Pomodoro timer,<br/>task tracker, and time analytics in one minimal interface.

[![Live](https://img.shields.io/badge/Live-earthflow.pro-3dc9b0?style=flat-square&logo=vercel&logoColor=white)](https://earthflow.pro)
[![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06b6d4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-cloud-3ecf8e?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-000000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com)

<br/>

<img src="https://earthflow.pro/og-image.png" alt="Earth Flow preview" width="720" />

</div>

---

## ✨ Features

| | Feature | Description |
|---|---|---|
| 🎛️ | **Ambient Sound Mixer** | 16 layered nature sounds with individual volume control. Upload your own tracks. |
| ⏱️ | **Focus Timer** | Configurable Pomodoro with optional lunch break, custom ring styles and fonts. |
| ✅ | **Daily Tasks** | Task list with categories, live time tracking, and completion history. |
| 🍩 | **Time Analytics** | Donut chart showing time spent per category — day, week, month, or year. |
| 🌌 | **Backgrounds** | 10 gradient presets plus custom image upload synced to your account. |
| ☁️ | **Cloud Sync** | Settings, tasks, and custom backgrounds synced across devices via Supabase. |
| 🔥 | **Streak System** | Daily visit streak with flame badge, restore mechanic, and longest-streak record. |
| 🎓 | **Tutorial** | Spotlight-guided onboarding tour covering all key features. |

---

## 🛠 Tech Stack

<div align="center">

![React](https://img.shields.io/badge/React_19-20232a?style=for-the-badge&logo=react&logoColor=61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-3178c6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646cff?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_v4-06b6d4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ecf8e?style=for-the-badge&logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

</div>

TanStack Start · TanStack Router · TanStack Query · Lucide Icons

---

## 🚀 Getting Started

**Prerequisites:** Node.js 20+, a Supabase project.

```bash
git clone https://github.com/BANANCHIKIREAL/Earth-flow.git
cd Earth-flow
npm install
npm run dev
```

**Production build:**

```bash
npm run build
```

> The build runs `generate-static-index.js` to produce a fully self-contained `dist/client/index.html` with OG meta tags baked in for social previews.

---

## 🔑 Environment Variables

Create a `.env.local` file in the project root:

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon / public key |

---

## 🗄 Supabase Setup

The app requires the following in your Supabase project:

- Table `user_settings` — per-user settings JSON
- Table `daily_tasks` — tasks and completion records
- Table `user_streaks` — streak data
- Storage bucket `user-backgrounds` *(public)* — custom background images
- Storage bucket for avatars — user profile photos

---

## 📦 Deployment

Deployed as a static SPA on Vercel via `@vercel/static-build`. The `vercel.json` handles SPA fallback routing — all routes redirect to `/index.html`.

OG meta tags are injected at build time into the static HTML so social crawlers (Telegram, Twitter, etc.) see them without JavaScript.

---

## 📋 Version History

### v4.2.3
- Translated all remaining Russian strings in DonutChart, TodayTasks, ProfileModal, AddTrackModal
- Google Drive picker title translated

### v4.2.2 — Background Sync & Sound Grid
- Custom background images uploaded to Supabase Storage and synced across devices
- Images over 5 MB saved locally with a warning; no hard block
- Sound grid expanded to 5 columns per row
- AddTrackModal fully translated to English

### v4.1.0 — Tutorial, New Backgrounds & Polish
- Interactive spotlight tutorial for new users
- English UI translation across all main components
- Four new gradient backgrounds: Mist, Stone, Mahogany, Wine
- Named Tailwind breakpoint `panel:` replacing arbitrary `min-[900px]:` — fixes production CSS generation
- OG image and social preview meta tags for Telegram / Twitter
- Removed "?" restart tutorial button from all layouts

### v3.5.2 — Streak System
- Daily streak with flame badge and milestone-matched animation
- Streak restore mechanic — up to 3 restores per month
- Settings and streak data reset on logout to prevent cross-account bleed
- Page transitions

### v3.4.0 — Admin & User Numbers
- Admin panel with user search
- Sequential user number shown in profile modal
- Admin streak override tools

### v3.3.5 — Guest Mode & Avatar Upload
- Guest mode — use the app without an account
- Avatar photo upload in profile modal
- Session tracking

### v3.3.3
- Fixed duplicate globe on desktop auth pages

### v3.3.1
- Earth globe animation on mobile auth screens

### v3.3.0 — Layout Switcher & Auth Redesign
- Split-screen auth pages with animated Earth globe
- Classic / Sidebar layout toggle synced to account
- Layout sync settings

### v3.2.0 — Auth Page Polish
- Auth page redesign with floating orbs
- Password strength validation
- Email templates

### v3.1.0 — Auth & Cloud Sync
- Full authentication system (Supabase Auth)
- Settings synced to cloud per user
- Custom music upload
- New background themes; Galaxy set as default
- Categories with color coding and time breakdown
- Profile modal

### v2.0.2
- Vercel Analytics and Speed Insights added

### v2.0.0 — Earth Flow Rebranding & DonutChart
- Project renamed to Earth Flow
- DonutChart with real task time tracking and interactive legend
- Chart history — archived tasks contribute to stats
- Timer continuity improvements

### Pre-release — Initial Build
- Focus Space SPA bootstrapped on TanStack Start
- Pomodoro timer with configurable durations
- 16 ambient sound tracks with per-track volume sliders
- Daily task list with elapsed time display
- Task completion statistics
- Custom background image upload (local)
- Vercel static build pipeline with SPA fallback routing
- Static `index.html` generation from TanStack manifest
