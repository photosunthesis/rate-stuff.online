<p align="center">
  <a href="https://rate-stuff.online">
    <img src="public/favicon-96x96.png" alt="rate-stuff.online logo" width="96" height="96" />
  </a>
</p>

A tiny corner to rate stuff — quickly create, browse, and score things you find interesting.

---

## Overview ✨

- An app for quickly rating and sharing things you stumble on.
- Create, browse, and score items — concrete or delightfully vague.
- Simple UI, clear scores, and low-key social discovery.
- WIP in my spare time; pull requests, odd ideas, and feedback welcome.

## Tech stack 🔧

- **Framework**: TanStack Start (React + TypeScript + Vite)
- **Routing**: TanStack Router
- **Backend & Edge**: Cloudflare Workers
- **Caching**: Cloudflare KV (edge cache for public data)
- **Real-time**: Cloudflare Durable Objects (WebSockets)
- **Database**: PostgreSQL (via Cloudflare Hyperdrive) + Drizzle ORM
- **Storage**: Cloudflare R2 + ImageKit (CDN & transformations)
- **Data Fetching**: TanStack Query
- **Authentication**: Better Auth
- **Package Manager**: pnpm

## Project layout 🗂️

A feature-first architecture where each feature owns its full vertical slice.

```
/                               # repo root
├─ src/
│  ├─ features/                 # feature modules — each owns its full stack
│  │  ├─ auth/                  # authentication & user management
│  │  │  ├─ components/         # auth-specific UI (sign-in, sign-up forms, etc.)
│  │  │  ├─ lib/                # domain helpers (email, passwords)
│  │  │  ├─ api.ts              # server functions (RPC layer)
│  │  │  ├─ data.ts             # data access & DB queries
│  │  │  ├─ hooks.ts            # React Query hooks & mutations
│  │  │  ├─ middleware.ts       # auth & request middleware
│  │  │  ├─ client.ts           # Better Auth client config
│  │  │  ├─ server.ts           # Better Auth server config
│  │  │  └─ types.ts            # types & Zod schemas
│  │  ├─ ratings/               # rating creation, display, voting
│  │  │  ├─ components/         # rating cards, vote section, forms, etc.
│  │  │  ├─ api/                # server functions (create, display, vote)
│  │  │  ├─ data/               # data access (create, display, vote)
│  │  │  ├─ hooks/              # React Query hooks (create, display, vote)
│  │  │  └─ types/              # types (create, display, vote)
│  │  └─ ...                    # comments, stuff, activity
│  │
│  ├─ shared/                   # truly generic, domain-agnostic code
│  │  ├─ components/
│  │  │  ├─ layout/             # app shell (main layout, sidebars, footer)
│  │  │  ├─ ui/                 # primitives (button, modal, avatar, etc.)
│  │  │  └─ feedback/           # error & not-found pages
│  │  ├─ hooks/                 # generic hooks (debounce, local-storage, etc.)
│  │  └─ lib/                   # pure utility functions (format, strings, rich-text)
│  │
│  ├─ infrastructure/           # external services & platform capabilities
│  │  ├─ db/                    # Drizzle schema & database client
│  │  ├─ file-storage/          # R2 file upload handling
│  │  ├─ imagekit/              # image CDN signing & transformations
│  │  ├─ kv/                    # Cloudflare KV edge caching
│  │  ├─ http/                  # server concerns (cache headers, timeouts)
│  │  ├─ rate-limit/            # rate limiting middleware
│  │  └─ durable-objects/       # real-time WebSocket notifications
│  │
│  ├─ providers/                # root providers (TanStack Query client)
│  ├─ routes/                   # TanStack Router file-based routes
│  ├─ router.tsx                # TanStack Router config
│  ├─ server.ts                 # Cloudflare Workers entry point
│  └─ styles.css                # global styles & design system
├─ drizzle/                     # SQL migrations and snapshots
└─ wrangler.jsonc               # Cloudflare Workers config
```

### Architecture guidelines
- **Features own their slice**: API, data access, hooks, components, and types all live together under `features/`.
- **`api.ts`** bridges client and server — TanStack server functions with Zod validation.
- **`data.ts`** handles database queries and business logic (server-only).
- **`hooks.ts`** wraps server functions with React Query for client-side data fetching.
- **Shared is generic**: if a component imports from a specific feature, it belongs in that feature, not shared.
- **Infrastructure is external**: database, caching, file storage, rate limiting — platform concerns, not business logic.

---

## Local development 🧭

1. **Install dependencies:** `pnpm install`
2. **Run locally:** `pnpm dev`
3. **Database migrations:** `pnpm db:migrate`

## License 📄

Copyright (C) 2026 Sun Envidiado

This project is licensed under the **GNU General Public License v3.0** — see the [LICENSE](LICENSE) file for details.