<p align="center">
  <a href="https://rate-stuff.online">
    <img src="public/favicon-96x96.png" alt="rate-stuff.online logo" width="96" height="96" />
  </a>
</p>

A small, delightful app for quickly rating and discovering "stuff" — whether it’s a product, idea, or anything you or your friends care about. Built for speed, simplicity, and community.

---

## Overview ✨

- Single-purpose site to create, browse, and rate items (concrete or abstract).
- Focus on lightweight UX, clear scores, and social discovery.
- In active development — contributions and feedback are welcome.

## Tech stack 🔧

- **Made with:** **TanStack Start** (app scaffolding & routing)
- Frontend: **React / TypeScript**, Vite
- App framework & routing: **TanStack Start** & **TanStack Router**
- Backend: **Cloudflare Workers** (edge-first server runtime)
- Database: **Cloudflare D1** (SQL) + **Drizzle ORM** + SQL migrations
- Storage: **Cloudflare R2** (object storage for uploads)
- State & Data: **TanStack Query** (data fetching & caching)
- Authentication & Sessions: secure cookies / session table
- Build & package: **pnpm**

## Architecture & notable details 🏗️

- Serverless edge functions power the API for low-latency global responses.
- Database schema managed with straightforward SQL migrations (see `drizzle/`).
- Modular feature structure under `src/features/` (e.g., `create-rating`, `create-account`) for easy discoverability and maintenance.
- Middleware for auth and rate limiting to keep the platform safe and performant.

---

## Local development 🧭

1. Install dependencies: `pnpm install`
2. Run locally: `pnpm dev`
3. Database migrations: `pnpm db:migrate`

## License 📄

- Licensed under the **MIT License** — see [LICENSE](LICENSE) for details.