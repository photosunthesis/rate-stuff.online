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

- **Made with:** **TanStack Start** (app scaffolding & routing)
- Frontend: **React / TypeScript**, Vite
- App framework & routing: **TanStack Start** & **TanStack Router**
- Backend: **Cloudflare Workers** (edge-first server runtime)
- Database: **PostgreSQL (via Hyperdrive)** + **Drizzle ORM** + SQL migrations
- Storage: **Cloudflare R2** (object storage for uploads)
- State & Data: **TanStack Query** (data fetching & caching)
 - Authentication: Better Auth (https://www.better-auth.com/)
- Build & package: **pnpm**

## Project layout 🗂️

A quick tour of the repo and where to look for important pieces.

```
/                      # repo root
├─ src/
│  ├─ assets/           # static assets (images, icons, etc.)
│  ├─ components/
│  │  ├─ layout/        # layout components (main-layout, sidebars, headers)
│  │  └─ ui/            # small reusable UI pieces (button, avatar, text-field)
│  ├─ db/               # Drizzle client and schema (client.ts, schema/*)
│  ├─ features/         # feature modules (auth, create-rating, display-ratings, stuff, rate-limit, file-storage)
│  ├─ integrations/     # integration helpers/providers (e.g., TanStack Query)
│  ├─ lib/              # app-level helpers and clients (auth client, server helpers, utils)
│  ├─ routes/           # app routes and API handlers (see __root.tsx, api/r2-upload.ts)
│  ├─ router.tsx
│  ├─ routeTree.gen.ts
│  └─ styles.css
├─ drizzle/             # SQL migrations and snapshots
├─ public/              # static assets
├─ wrangler.jsonc       # Cloudflare Workers config
├─ package.json
└─ README.md
```

Key files:
- `src/db/client.ts` (Hyperdrive connection + Drizzle client)
- `src/db/schema/*` (table definitions)
- `src/lib/auth.client.ts` and `src/lib/auth.server.ts` (Better Auth integration & helpers)
- `src/features/*` (feature-scoped API, UI, middleware — e.g., `src/features/auth`, `src/features/create-rating`)

---

## Local development 🧭

1. Install dependencies: `pnpm install`
2. Run locally: `pnpm dev`
3. Database migrations: `pnpm db:migrate`

## License 📄

- Licensed under the **MIT License** — see [LICENSE](LICENSE) for details.