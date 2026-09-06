<div align="center">

# 🌍 Earth Flow

A customizable focus workspace with ambient sound mixing, a Pomodoro timer,<br/>daily tasks, time analytics, cloud sync, and four distinct interfaces.

[![Live](https://img.shields.io/badge/Live-earthflow.pro-3dc9b0?style=flat-square&logo=vercel&logoColor=white)](https://earthflow.pro)
[![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06b6d4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-cloud-3ecf8e?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-000000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com)

<br/>

<img src="https://earthflow.pro/og-image.png?v=5.5.3" alt="Earth Flow preview" width="720" />

</div>

---

## ✨ Features

| | Feature | Description |
|---|---|---|
| 🎛️ | **Ambient Sound Mixer** | Mix 17 built-in nature sounds with independent volume controls and add your own audio. |
| ⏱️ | **Focus Timer** | Configurable Pomodoro with optional lunch break, custom ring styles and fonts. |
| ✅ | **Daily Tasks** | Task list with categories, live time tracking, and completion history. |
| 🍩 | **Time Analytics** | Donut chart showing time spent per category — day, week, month, or year. |
| 🧭 | **Four Interfaces** | Switch between Classic, Panels, Orbit, and Horizon layouts without losing your settings. |
| 🌌 | **Backgrounds** | Choose from 20 animated and static atmosphere presets or upload a custom image. |
| ☁️ | **Cloud Sync** | Sync settings, tasks, backgrounds, profile data, and an optional compressed custom-audio library across devices. |
| 🔥 | **Streak System** | Daily visit streak with flame badge, restore mechanic, and longest-streak record. |
| 🔔 | **Notifications** | Styled focus and break notifications with phase-specific artwork and sounds. |
| 🪄 | **Profile Studio** | Customize profile atmosphere, banner, surface, avatar treatment, composition, identity details, motion and privacy with cloud sync. |
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

TanStack Start · TanStack Router · TanStack Query · Morphicons · Lucide icon data

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
| `DISCORD_WEBHOOK_URL` | *(optional)* Discord webhook for live visit pings — set as a server-side Vercel env var, never `VITE_`-prefixed |

---

## 🗄 Supabase Setup

The app requires the following in your Supabase project:

- Table `user_settings` — per-user settings JSON
- Table `daily_tasks` — tasks and completion records
- Table `user_streaks` — streak data
- Table `user_custom_tracks` — metadata for optional cloud-synced custom audio
- Storage bucket `user-backgrounds` *(public)* — custom background images
- Storage bucket `avatars` *(public)* — user profile photos
- Storage bucket `user-audio-sync` *(private)* — compressed custom audio
- Edge Function `delete-account` — authenticated account and user-data cleanup

---

## 📦 Deployment

Deployed as a static SPA on Vercel via `@vercel/static-build`. The `vercel.json` handles SPA fallback routing — all routes redirect to `/index.html`.

OG meta tags are injected at build time into the static HTML so social crawlers (Telegram, Twitter, etc.) see them without JavaScript.

### Discord notifications

- **Visits** — a tiny `@vercel/node` function at `api/visit-ping.js` posts an embed to Discord on real page loads (triggered client-side from the root route, 10s dedupe). Requires `DISCORD_WEBHOOK_URL` as a Vercel env var.
- **Deploys** — `.github/workflows/deploy-notify.yml` posts a richer embed (commit list, author, version) on every push to `main`. Requires the `DISCORD_DEPLOY_WEBHOOK_URL` GitHub Actions secret.

### Embed widget

`/embed` is a chrome-free version of the timer meant for embedding elsewhere (e.g. Notion via its `/embed` command). Paste `https://earthflow.pro/embed` — it renders as an interactive iframe rather than a bookmark card, since it ships its own OG-tag-free static shell. The dedicated Vercel route permits framing through nested embed providers while the rest of Earth Flow continues to block framing.

---

## 📋 Version History

### v5.5.3 — Animated interactive icons
- Replaced clickable Lucide React components across the workspace, authentication pages, profile, settings, sound controls, task tools, and shared UI primitives with a centralized Morphicons system
- Added smooth, accessible hover, press, and keyboard-focus morphs with related action states, including Play ↔ Pause, pie chart → trend graph, Crickets → audio waveform, and remove → close
- Preserved static decorative artwork and the multicolor Google brand mark while honoring the user's reduced-motion preference
- Temporarily hid the Cloud Sound Library controls in Sound settings and the local-track upload dialog without removing their underlying sync implementation
- Increased the spacing before the destructive Delete account action and retained the v5.3.2 saved-account switcher while integrating the new icon system

### v5.3.2 — Account switcher
- Added a "Switch account" section to Profile → Settings: remembers every account signed into on this device and lets you swap the active session without re-entering credentials, plus an inline "Add another account" form
- Since Supabase's client only holds one active session at a time, switching persists the session you're leaving (`src/lib/savedAccounts.ts`, localStorage-backed) and calls `setSession()` with the one you're moving to
- Added spacing between the saved-accounts list and the "Add another account" button, and a Google icon on "Continue with Google"

### v5.2.13 — GitHub status endpoint
- Added `api/github-status.js`, a serverless function proxying public repo metadata (stars, forks, open issues, default branch, last update) from the GitHub REST API for `BANANCHIKIREAL/Earth-flow`. No token, no secrets, 60s in-memory cache. Not called from the app and not linked anywhere in the UI — reachable only by requesting `/api/github-status` directly

### v5.2.12 — Fixed black screen on mobile embed
- Mobile Safari blocks `localStorage` for cross-origin iframes (ITP); reading or writing it there throws `SecurityError` instead of returning `null`. Several hooks touched it unguarded during initial render, so the app crashed into its error boundary before the timer ever painted — invisible on desktop Notion (not blocked there), but a black screen on mobile
- Added `src/lib/safe-storage.ts`, a storage wrapper that catches any read/write failure and falls back to an in-memory store for the session instead of throwing. Routed all `localStorage` access through it — including the Supabase client, which persists its auth session there by default
- Verified by emulating a mobile browser with `localStorage` forced to throw: crashed before the fix, renders normally after

### v5.2.11 — Fixed Notion iframe loading
- Fixed the embed route being blocked when Notion loaded it through a nested Iframely container
- Made `/embed` terminate before the site's global anti-framing rule, removed the invalid `ALLOWALL` header, and allowed framing for this public widget only
- Kept `frame-ancestors 'none'` and `X-Frame-Options: DENY` on every regular Earth Flow page

### v5.2.10 — Embed widget fixes
- Fixed sound cards collapsing to an unreadable "ID" fragment at 5 columns in the embed's narrow width — the fixed-size icon left ~0px for the name/status text, which then overflowed and got clipped at the card edge. Widened the embed's sound section container so names truncate gracefully instead
- Removed the custom-track ("Your music") feature from the embed — `SoundDock` now takes an optional `showCustom` prop
- Removed the "Playing"/"Idle" status label from embed sound cards via a new `showStatusLabel`/`showTrackStatus` prop (main site unaffected, defaults to shown)
- Embed now shows half as many built-in sounds (9 instead of 17) to stay compact
- The settings gear now opens earthflow.pro in a new tab instead of a local settings panel (there's no room for it in a small embedded widget)

### v5.2.9 — Notion embed widget
- New `/embed` route: a chrome-free timer + sound mixer + settings + background, meant for embedding as an iframe widget (e.g. via Notion's `/embed` command)
- Ships its own static HTML shell with no OG tags and `robots: noindex` — this is a static SPA, so every route shares one pre-built HTML file, and a link-preview scraper never runs client JS that would otherwise override the head. Without a dedicated shell, `/embed` would still serve the landing page's og:image and get rendered as a bookmark card instead of an iframe
- `vercel.json` now allows framing from `notion.so`/`*.notion.site` specifically for `/embed`, while every other route still blocks framing entirely

### v5.2.8 — Updated social preview
- Replaced the Open Graph preview with the latest Earth Flow welcome-page design
- Updated Open Graph, Twitter, and README image URLs to refresh cached previews

### v5.2.7 — Fixed visit pings never firing in production
- `vercel.json`'s custom `routes` array silently prevented the `api/visit-ping.js` function from being reached — `handle: filesystem` doesn't auto-route to serverless functions once a custom routes array is present, so requests fell through to the SPA fallback (405 on every real visit). Added an explicit route so it resolves correctly

### v5.2.6 — Deploy notification polish & Supabase config fix
- Deploy Discord embed now shows the app version instead of a files-changed/±lines stat
- Fixed Supabase Preview failing on auth email templates: `content_path` resolves relative to the repo root under `auth.email.template.*` but relative to `supabase/` under `auth.email.notification.*`

### v5.2.5 — Discord notifications
- Live visit pings posted to Discord via a `@vercel/node` function, triggered client-side once per page load
- Deploy notifications on every push to `main`, with commit list, author, and diff stats

### v5.2.4 — Fixed profile composition
- Removed all profile composition controls from Profile Studio
- Standardized the profile layout and permanently aligned identity content to the left

### v5.2.2 — Updated social preview
- Replaced the Open Graph preview with the current Earth Flow workspace design
- Versioned the Open Graph and Twitter image URLs to refresh cached link previews

### v5.2.1 — Profile palette fix
- Fixed the Profile / Customize / Settings navigation so it follows the selected profile atmosphere instead of retaining the global blue palette
- Added a dedicated monochrome navigation treatment for Noir profiles
- Removed the redundant `Adjust` action from the Horizon focus card

### v5.2.0 — Expanded Profile Studio
- Added profile composition controls for header height, avatar size and shape, profile width, and identity alignment
- Added fine controls for atmosphere depth and border definition, including valid zero-value settings
- Made the Profile / Customize / Settings navigation adapt to the selected profile atmosphere and accent
- Added a dedicated monochrome navigation treatment for Noir profiles

### v5.1.0 — Profile Studio
- Added a dedicated profile customization workspace with live preview
- Added six profile atmospheres, six banners, five avatar frames, four surface materials, custom accent colors and adjustable glow
- Added custom profile titles, short notes, mood symbols, ambient effects and visibility controls
- Profile customization is validated and synchronized through Supabase across devices

### v5.0.2 — Account method detection
- Fixed Google accounts with an added password incorrectly showing `Add password`
- Password status is now checked securely for the current authenticated account

### v5.0.0 — Security, account reliability, and release polish
- Hardened Supabase row-level security and Storage policies, restricted RPC access, and removed the unsafe admin impersonation function
- Strengthened password requirements and account deletion cleanup, including custom audio and all user-owned Storage objects
- Added validated image uploads, production security headers, dependency updates, and a zero-vulnerability production dependency audit
- Improved cloud-audio quality with adaptive AAC compression while keeping the combined library within the 4.5 MB sync budget
- Fixed stale email display after a confirmed address change and added correct password actions for Google-only accounts
- Fixed fallback-avatar rendering artifacts and added a stable branded favicon for browsers and search results

### v4.7.3 — Horizon and cloud-audio improvements
- Added the Horizon workspace layout and refined responsive task sizing
- Made custom-track cards fully clickable and expanded the Orbit sound grid
- Added cloud audio usage, sync-state indicators, and total-library quota handling
- Improved custom audio compression and upload reliability

### v4.6.9 — Welcome page and theme fixes
- Updated Welcome page feature counts and cloud/local storage descriptions to match the application
- Fixed the missing Waves theme preview
- Refined profile and custom-music presentation

### v4.6.6 — Notifications, streaks, and custom audio sync
- Added reliable phase-specific browser notifications and notification artwork
- Enabled and repaired the streak system, including the personalized boss streak presentation
- Added optional compressed cloud sync for custom audio with local-device fallback
- Improved loading-state behavior, profile layout, and cloud sync feedback

### v4.6.2 — Theme gallery
- Replaced text-only background selection with compact visual previews
- Added new animated atmosphere themes with slower, subtler motion

### v4.5.1
- Made the Panels workspace rail indicators static and non-interactive

### v4.5.0 — New interface modes
- Added the experimental Orbit focus interface with orbital settings navigation
- Rebuilt Sidebar as the responsive Panels workspace
- Added layout-specific settings panels, smoother interactions, and consistent version display

### v4.4.1
- Fixed recurring "mobile layout on desktop" production bug for good: stale built CSS committed in `public/assets` was overriding fresh styles on every Vercel build. Removed committed assets, dropped the copy step, gitignored `public/assets`, and made the static index generator always pick the newest stylesheet

### v4.4.0 — Profile Overhaul
- Profile modal redesigned: gradient banner, overlapping avatar, animated tab switch, bottom segmented control (Profile / Settings)
- Account info: email, member number, member since date, sign-in method (Google / Email)
- Change password from profile — via email confirmation link
- Change email — confirmation sent to both old and new address
- Photo management moved to Settings: upload, change, remove (with confirmation)
- Delete account — requires a 6-digit email code; wipes settings, tasks, streaks and files via Edge Function
- New danger-styled confirmation email template

### v4.3.0 — Landing Page
- New animated landing page at `/welcome`: starfield canvas, shimmer headline, live ticking timer mock with 3D tilt and equalizer, scrolling sounds marquee, scroll-reveal sections
- Clickable atmosphere tiles — theme applies live on the page and carries into the app
- Landing is now the home page for logged-out visitors; guests enter the app via "Start focusing"
- Logged-in users see a profile chip in the landing header instead of Sign in / Sign up
- App logo (all layouts) now links to the landing page

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
