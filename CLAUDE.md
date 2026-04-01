# CLAUDE.md — AI Assistant Guide

> **Important:** This repository uses **Next.js 16.2.1** with breaking changes from earlier versions. Before writing any Next.js code, read the relevant guide in `node_modules/next/dist/docs/`. Heed deprecation notices. See also: `@AGENTS.md` on the `claude/review-previous-app-jeoM1` branch.

---

## Repository Overview

This repository hosts two distinct projects across separate branches:

| Branch | Project | Stack |
|--------|---------|-------|
| `claude/review-previous-app-jeoM1` | **Family Platform** — a full-stack household management web app | Next.js 16, React 19, TypeScript, Prisma, SQLite, NextAuth v5, Tailwind CSS v4 |
| `claude/mobile-game-development-h6yEQ` | **NEON BLITZ** — a mobile-first PWA arcade game | Vanilla HTML/CSS/JS, Canvas API |

The `main` branch and `claude/add-claude-documentation-GGL6v` branch contain only this documentation file.

---

## Family Platform (Next.js App)

### Tech Stack

- **Framework:** Next.js 16.2.1 (App Router)
- **Language:** TypeScript 5 with strict mode
- **UI:** React 19, Tailwind CSS v4
- **Database:** SQLite via Prisma 7 + `@libsql/client`
- **Auth:** NextAuth.js v5 (beta) with Prisma adapter; Credentials + Google OAuth
- **Password hashing:** bcryptjs

### Directory Structure

```
app/
├── layout.tsx              # Root layout — PWA meta tags, service worker registration
├── page.tsx                # Root page — redirects to /dashboard or /auth
├── globals.css             # Global Tailwind styles
├── manifest.ts             # PWA manifest
├── auth/
│   ├── page.tsx            # Login / Register UI
│   └── actions.ts          # Server actions: loginAction, registerAction, signOutAction
├── api/
│   ├── auth/
│   │   ├── [...nextauth]/route.ts   # NextAuth.js handler
│   │   └── register/route.ts        # Custom registration endpoint
│   ├── budget/route.ts
│   ├── contacts/route.ts
│   ├── courses/
│   │   ├── route.ts                 # Shopping lists
│   │   └── items/route.ts           # Shopping list items
│   ├── menu/route.ts
│   ├── notes/route.ts
│   ├── recettes/route.ts
│   └── taches/route.ts
└── dashboard/
    ├── page.tsx            # Main dashboard — module grid
    ├── budget/page.tsx
    ├── compresseur/page.tsx
    ├── contacts/page.tsx
    ├── convertisseur/page.tsx
    ├── courses/page.tsx
    ├── menu/page.tsx
    ├── notes/page.tsx
    ├── recettes/page.tsx
    └── taches/page.tsx

components/
├── Navbar.tsx              # Top navigation with user menu
└── ModuleCard.tsx          # Reusable module card for dashboard grid

lib/
├── auth.ts                 # NextAuth.js config (JWT strategy, callbacks)
└── prisma.ts               # Prisma client singleton

prisma/
├── schema.prisma           # Database schema
└── migrations/             # Migration history (3 migrations)

public/
├── sw.js                   # Service worker
├── icons/                  # PWA icons (192×192, 512×512)
└── manifest.json
```

### Development Commands

```bash
npm run dev      # Start dev server on 0.0.0.0:3000 (accessible on local network)
npm run build    # Production build
npm start        # Start production server
npm run lint     # Run ESLint

npx prisma migrate dev      # Apply migrations and regenerate client
npx prisma studio           # Open Prisma Studio GUI
npx prisma generate         # Regenerate Prisma client after schema changes
```

### Environment Variables

Required in `.env` (not committed):

```
DATABASE_URL=           # SQLite path, e.g. file:./dev.db
NEXTAUTH_SECRET=        # Random secret for JWT signing
NEXTAUTH_URL=           # e.g. http://localhost:3000
GOOGLE_CLIENT_ID=       # For Google OAuth (optional)
GOOGLE_CLIENT_SECRET=   # For Google OAuth (optional)
```

### Database Schema Summary

All data is **shared across the whole family** — records are owned by the creating user but visible to all authenticated users.

| Model | Purpose |
|-------|---------|
| `User` | Authentication + family member profile |
| `Account` / `Session` / `VerificationToken` | NextAuth.js internals |
| `ShoppingList` + `ShoppingItem` | Grocery lists with categories and check-off |
| `Note` | Colored, pinnable notes |
| `BudgetEntry` | Income/expense tracking by category |
| `MealPlan` | Weekly meal planning (breakfast/lunch/dinner per day) |
| `Recipe` | Recipes with ingredients, steps, timing |
| `Chore` + `ChoreAssignment` | Task management with frequency and assignee |
| `EmergencyContact` | Important phone numbers |

IDs use `cuid()`. Cascading deletes are set on all user-owned relations.

### Authentication Flow

1. **Credentials login** — `loginAction` in `app/auth/actions.ts` (server action)
2. **Registration** — `registerAction` hashes password with bcryptjs, creates user, then auto-logs in
3. **Sign out** — `signOutAction` (server action, avoids Safari iOS client-side navigation issues)
4. **Session** — JWT strategy; token contains `id`, `role`; session callback exposes these to client
5. **LAN access** — `trustHost: true` and non-secure cookies configured for HTTP local-network use

### Code Conventions

**File naming:**
- Pages and routes: `page.tsx`, `route.ts`, `layout.tsx`, `actions.ts`
- Components: PascalCase (`Navbar.tsx`, `ModuleCard.tsx`)
- Utilities: camelCase (`lib/auth.ts`, `lib/prisma.ts`)

**TypeScript:**
- Strict mode enabled — no `any` unless unavoidable
- Path alias `@/*` maps to project root

**React / Next.js patterns:**
- Server Components by default; add `"use client"` only when needed
- Form mutations via Server Actions (`"use server"`)
- Client-side state with `useState`; no external state library

**Styling:**
- Tailwind CSS v4 utility classes only — no custom CSS except `globals.css`
- Primary color: `indigo-600`
- Layout: `max-w-6xl` container, responsive grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`)

**Localization:**
- UI text is in **French** — maintain this when adding or modifying UI strings
- Module names: Tâches, Recettes, Courses, Notes, Budget, Menu, Contacts, Compresseur, Convertisseur

**API routes:**
- Use `NextResponse.json()` for responses
- POST for all mutations; return `{ error }` on failure with appropriate HTTP status

### PWA

The app is a Progressive Web App:
- Service worker at `public/sw.js`
- Manifest generated by `app/manifest.ts`
- Icons at `public/icons/` (192×192 and 512×512)
- Registered in `app/layout.tsx`

---

## NEON BLITZ Mobile Game

### Stack

- Vanilla HTML5 + CSS3 + JavaScript (no build tools)
- Canvas API for game rendering
- PWA manifest (`manifest.json`)

### Structure

```
index.html          # Entry point
manifest.json       # PWA manifest
css/style.css       # Responsive game styles, neon aesthetic
js/game.js          # Game engine — canvas rendering, game loop, state machines
```

### Key Features

- Multiple screens: splash → menu → level select → gameplay → game over → high scores
- Settings: sound, music, vibration, FPS display
- Retro neon visual aesthetic
- High score persistence (localStorage)
- Mobile-optimized touch controls

---

## What Not To Do

- Do not add test frameworks unless explicitly requested — no testing infrastructure exists yet
- Do not change the French UI strings to English
- Do not add `"use client"` to components that don't require browser APIs or React hooks
- Do not commit `.env` files or `*.db` SQLite files (both are in `.gitignore`)
- Do not use `next/router` — this project uses the App Router (`next/navigation`)
- Do not use Pages Router patterns (`getServerSideProps`, `getStaticProps`, `_app.tsx`) — App Router only
- Do not bypass `trustHost` or cookie settings without understanding the LAN deployment context
