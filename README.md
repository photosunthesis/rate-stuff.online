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
- **Real-time**: PartyKit (WebSockets & broadcasting)
- **Database**: PostgreSQL (via Cloudflare Hyperdrive) + Drizzle ORM
- **Storage**: Cloudflare R2
- **Data Fetching**: TanStack Query
- **Authentication**: Better Auth
- **Package Manager**: pnpm

## Project layout 🗂️

A quick tour of the repo and the modular feature-based structure.

```
/                         # repo root
├─ src/
│  ├─ auth/               # Better Auth client & server config
│  ├─ components/         # global shared UI & layout primitives
│  ├─ db/                 # Drizzle schema & database client
│  ├─ features/           # modular feature directories
│  │  ├─ create-rating/   # [example feature]
│  │  │  ├─ components/   # feature-specific UI
│  │  │  ├─ functions.ts  # server functions (RPC layer)
│  │  │  ├─ service.ts    # backend business logic & DB calls
│  │  │  ├─ queries.ts    # client data fetching & mutations
│  │  │  └─ types.ts      # feature-specific types & Zod schemas
│  │  └─ ...              # display-ratings, stuff, file-storage, etc.
│  ├─ routes/             # TanStack Router file-based routes
│  ├─ lib/                # core client/server helpers
│  ├─ utils/              # global utility functions
│  ├─ styles.css          # global styles & design system
│  └─ router.tsx          # TanStack Router config
├─ drizzle/               # SQL migrations and snapshots
└─ wrangler.jsonc         # Cloudflare Workers config
```

### Modular Guidelines
- **Features**: Everything related to a specific domain (API, UI, State) stays inside its `features/` folder.
- **Server Functions**: Use `functions.ts` to bridge the client and server with Zod validation.
- **Backend**: Put heavy business logic and database interactions in `service.ts`.
- **Reusable UI**: If a component is used by >1 feature, move it to `src/components/ui/`.

---

## Local development 🧭

1. **Install dependencies:** `pnpm install`
2. **Run locally:** `pnpm dev`
3. **Database migrations:** `pnpm db:migrate`

## License 📄

Copyright (C) 2026 Sun Envidiado

This project is licensed under the **GNU General Public License v3.0** — see the [LICENSE](LICENSE) file for details.