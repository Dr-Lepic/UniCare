# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

UniCare — a university medical center management system. React SPA client + Express/MongoDB server, role-based (student / doctor / pharmacist / admin). Currently at **Milestone 1** (auth + dashboard shells only); see `UniCare_HighLevelDesign_Roadmap.md` for the full 8-milestone plan, data model sketch, and key workflows (appointment→prescription→dispensing, OTP collection, sick-leave sharing links, reimbursement claims). Read that file before adding features from later milestones — it defines the intended schema and flow before you invent one.

Note: the root `README.md` is not a real README (it currently contains stray `.gitignore`-style content) — don't treat it as a source of truth.

## Commands

Server (`server/`):
```bash
npm run dev     # nodemon server.js, http://localhost:5000
npm start       # node server.js
npm run seed    # BROKEN: package.json points to seed/seedData.js, actual file is seed/seed.js
                 # run directly instead: node seed/seed.js
```

Client (`client/`):
```bash
npm run dev       # vite dev server
npm run build
npm run lint      # eslint
npm run preview
```

No test suite exists in either package yet.

### Environment

`server/server.js` loads env vars from `../.env` — i.e. a `.env` file at the **repo root**, not inside `server/`. Required: `MONGO_URI`, `JWT_SECRET`, optionally `PORT` (defaults 5000).

The client's axios instance (`client/src/api/index.js`) hardcodes `baseURL: 'http://localhost:5000/api'` — no env-based config.

## Architecture

**Auth flow**: JWT-based, stateless. `authController.js` signs `{ id, role }` into the token (7d expiry). `middleware/auth.js` exposes `protect` (verifies token, sets `req.user`) and `allowRoles(...roles)` (role guard, not yet wired into any routes — only `auth.js` routes exist so far). Passwords hashed with bcryptjs.

**Server structure** is a standard layered Express setup — `routes/` → `controllers/` → `models/`, with `middleware/errorHandler.js` as the last-mounted error handler (controllers call `next(err)` on failure rather than handling responses inline). Follow this pattern for new modules: add a model, a controller with route handlers that call `next(err)` in catch blocks, a router, and mount it in `server.js`.

**User model** (`models/User.js`) is a single collection for all four roles with role-specific optional fields (`studentId`/`department` for students, `specialty` for doctors, `station` for pharmacists) rather than separate collections per role — follow this pattern rather than splitting into per-role schemas.

**Client structure**: `AuthContext` (`context/AuthContext.jsx`) owns the session — token in `localStorage`, user fetched via `GET /auth/me` on mount to restore sessions, axios request interceptor auto-attaches the bearer token. `ProtectedRoute` gates authenticated routes; role-specific views are **not yet route-gated by role**, only by "is logged in."

**Routing convention**: role-scoped panel routes follow `/panel/:role/...` (see `App.jsx`, `PanelLayout.jsx`). `PanelLayout` reads `role` from the URL param (not from the authenticated user) to pick sidebar config/theme — when adding real per-role pages, wire them into each role's `nav` array in `PanelLayout.jsx`'s `ROLE_CONFIG`, matching the `to` path convention (`/panel/${role}/${item.to}`).

**Dashboard.jsx** is currently all placeholder/mock data (`ROLE_DATA` object keyed by role, tagged with milestone numbers like `M2`, `M3`) — replace per-role sections with real API-backed data as each milestone's routes/controllers are built, rather than adding a parallel data source.

No global state library — Context API only, per the roadmap's "Context API or Redux Toolkit" choice (Context API was chosen). No CSS framework — plain CSS in `client/src/index.css`.
