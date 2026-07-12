# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

UniCare — a university medical center management system. React SPA client + Express/MongoDB server, role-based (student / doctor / pharmacist / admin). **Milestones 1–4** are implemented — auth, appointment booking, e-prescriptions + pharmacy stock, and shareable prescription links; later milestones (OTP dispensing, reimbursements, inventory management) are still placeholder in the UI. See `UniCare_HighLevelDesign_Roadmap.md` for the full 8-milestone plan, data model sketch, and key workflows. Read that file before adding features from later milestones — it defines the intended schema and flow before you invent one.

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

**Auth flow**: JWT-based, stateless. `authController.js` signs `{ id, role }` into the token (7d expiry). `middleware/auth.js` exposes `protect` (verifies token, sets `req.user`) and `allowRoles(...roles)` (role guard). Passwords hashed with bcryptjs. Wiring pattern (see `routes/appointments.js`, `routes/doctors.js`): `router.use(protect)` for the whole router, then `allowRoles('student')` / `allowRoles('doctor')` on the specific routes that need it — mixed-role reads (e.g. `/mine`) stay open to any authenticated user and branch on `req.user.role` in the controller.

**Server structure** is a standard layered Express setup — `routes/` → `controllers/` → `models/`, with `middleware/errorHandler.js` as the last-mounted error handler (controllers call `next(err)` on failure rather than handling responses inline). Follow this pattern for new modules: add a model, a controller with route handlers that call `next(err)` in catch blocks, a router, and mount it in `server.js`.

**User model** (`models/User.js`) is a single collection for all four roles with role-specific optional fields (`studentId`/`department` for students, `specialty` for doctors, `station` for pharmacists) rather than separate collections per role — follow this pattern rather than splitting into per-role schemas.

**Appointments (Milestone 2)**: `models/Appointment.js` stores `date` as a **UTC-midnight** calendar day (no time component) plus a `timeSlot` string like `"09:00-09:30"` — `appointmentsController.parseDate` forces UTC so weekday derivation never drifts with server timezone. Open slots are computed on the fly from the doctor's `availability` array (`generateSlots`), minus slots already taken by active appointments; there is no persisted slot table. Double-booking is prevented two ways: a friendly pre-check in the controller and a **partial unique index** `{ doctor, date, timeSlot }` scoped to active statuses (`pending`/`confirmed`/`completed`) as a race backstop — so `err.code === 11000` on create means "slot taken", and cancelled appointments free the slot. Status changes go through the `TRANSITIONS` state machine (keyed by role → current status → allowed next), not free-form updates.

**Prescriptions & shareable links (Milestones 3–4)**: `models/Prescription.js` holds `medicines: [{ medicine→Medicine, dosage, qty }]`, an optional `appointment` ref, and share fields (`shareToken` sparse-unique, `shareTokenExpiresAt`). `models/Medicine.js` is the pharmacy stock catalog — **read-only here**; stock is decremented only on dispensing (M5), so writing a prescription never changes stock (the doctor form shows live stock and a *soft* over-stock warning but does not block). Prescriptions are **standalone**: the doctor picks any student (`GET /api/students`, doctor-only) rather than deriving one from an appointment. The **public share route** `GET /api/prescriptions/share/:token` needs no auth — it's registered in `routes/prescriptions.js` **before** `router.use(protect)`; expired tokens return **410**, unknown **404**, and the handler returns a name-only projection (`publicView`), never raw refs/ids. `POST /api/prescriptions/:id/share` (owner-only) mints a `crypto.randomBytes` token with a 30-day expiry (`SHARE_TTL_DAYS` in the controller); regenerating overwrites with a fresh expiry. Client-side, the public page is a top-level React route `/rx/:token` (`SharedPrescription.jsx`) **outside** `ProtectedRoute`.

**Client structure**: `AuthContext` (`context/AuthContext.jsx`) owns the session — token in `localStorage`, user fetched via `GET /auth/me` on mount to restore sessions, axios request interceptor auto-attaches the bearer token. `ProtectedRoute` gates authenticated routes; role-specific views are **not yet route-gated by role**, only by "is logged in."

**Routing convention**: role-scoped panel routes follow `/panel/:role/...` (see `App.jsx`, `PanelLayout.jsx`). `PanelLayout` reads `role` from the URL param (not from the authenticated user) to pick sidebar config/theme — when adding real per-role pages, wire them into each role's `nav` array in `PanelLayout.jsx`'s `ROLE_CONFIG`, matching the `to` path convention (`/panel/${role}/${item.to}`).

**Dashboard.jsx** is currently all placeholder/mock data (`ROLE_DATA` object keyed by role, tagged with milestone numbers like `M2`, `M3`) — replace per-role sections with real API-backed data as each milestone's routes/controllers are built, rather than adding a parallel data source.

No global state library — Context API only, per the roadmap's "Context API or Redux Toolkit" choice (Context API was chosen).

**Styling / design system**: No CSS framework. `client/src/index.css` is a token-based design system — all color/type/spacing/radii/elevation live as CSS custom properties in `:root`, and components are built from those tokens (see `STYLEGUIDE.md`, the human-readable reference). Per-role theming works by setting `--accent` (and `--accent-weak`/`--focus`) **once** on the `.panel` container in `PanelLayout.jsx` from `ROLE_CONFIG`; nav highlight, stat-card rules, focus rings, and primary buttons all inherit it — so restyle via the token, don't hardcode per-element colors (the old inline `data.accent`/`cfg.color` overrides were removed for this reason). System font stack, light theme only, no external fonts.
