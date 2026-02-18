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
- **Real-time**: Cloudflare Durable Objects (WebSockets)
- **Database**: PostgreSQL (via Cloudflare Hyperdrive) + Drizzle ORM
- **Storage**: Cloudflare R2 + ImageKit (CDN & transformations)
- **Data Fetching**: TanStack Query
- **Authentication**: Better Auth
- **Package Manager**: pnpm

## Project layout 🗂️

A quick tour of the repo and the domain-driven structure.

```
/                           # repo root
├─ src/
│  ├─ components/           # global shared UI
│  │  ├─ layout/            # app shell & layout primitives
│  │  └─ ui/                # reusable UI components
│  ├─ db/                   # Drizzle schema & database client
│  │  └─ schema/            # table definitions
│  ├─ domains/              # domain-driven feature modules
│  │  ├─ users/             # [example domain]
│  │  │  ├─ auth/           # Better Auth client & server config
│  │  │  ├─ components/     # domain-specific UI
│  │  │  ├─ utils/          # domain-specific helpers
│  │  │  ├─ functions.ts    # server functions (RPC layer)
│  │  │  ├─ service.ts      # backend business logic & DB calls
│  │  │  ├─ queries.ts      # client data fetching & mutations
│  │  │  ├─ hooks.ts        # domain-specific React hooks
│  │  │  ├─ middleware.ts   # auth & request middleware
│  │  │  └─ types.ts        # domain types & Zod schemas
│  │  └─ ...                # ratings, comments, stuff, activity
│  ├─ hooks/                # global React hooks
│  ├─ infrastructure/       # cross-cutting concerns
│  │  ├─ file-storage/      # R2 file upload handling
│  │  ├─ rate-limit/        # rate limiting utilities
│  │  └─ durable-objects/   # durable objects for real-time features
│  ├─ integrations/         # third-party integrations
│  │  └─ tanstack-query/    # query client config
│  ├─ routes/               # TanStack Router file-based routes
│  ├─ utils/                # global utility functions
│  ├─ styles.css            # global styles & design system
│  └─ router.tsx            # TanStack Router config
├─ drizzle/                 # SQL migrations and snapshots
└─ wrangler.jsonc           # Cloudflare Workers config
```

### Modular Guidelines
- **Domains**: Everything related to a specific domain (API, UI, State) stays inside its `domains/` folder.
- **Server Functions**: Use `functions.ts` to bridge the client and server with Zod validation.
- **Backend**: Put heavy business logic and database interactions in `service.ts`.
- **Infrastructure**: Cross-cutting concerns like file storage and rate limiting live in `infrastructure/`.
- **Reusable UI**: If a component is used by >1 domain, move it to `src/components/ui/`.

---

## Local development 🧭

1. **Install dependencies:** `pnpm install`
2. **Run locally:** `pnpm dev`
3. **Database migrations:** `pnpm db:migrate`

## License 📄

Copyright (C) 2026 Sun Envidiado

This project is licensed under the **GNU General Public License v3.0** — see the [LICENSE](LICENSE) file for details.