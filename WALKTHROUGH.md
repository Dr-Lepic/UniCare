# Prescription & Shareable Link — Flow Walkthrough (Milestones 3–4)

End-to-end trace of the e-prescription + pharmacy-stock (M3) and shareable "sick-leave" link (M4)
features, following each step through the UI, the HTTP call, and the server code.

> Traced from the code, not a live run — there's no local `.env`/MongoDB in this environment.
> To run it: add a root `.env` (`MONGO_URI`, `JWT_SECRET`), start MongoDB, `node server/seed/seed.js`,
> then exercise the flow below.

## Actors & entry points

- **Doctor** logs in → sidebar **Prescriptions** (`/panel/doctor/prescriptions`) → `Prescriptions.jsx` sees `role === 'doctor'` → renders `DoctorPrescriptions`.
- **Student** logs in → sidebar **Prescriptions** (`/panel/student/prescriptions`) → same splitter renders `StudentPrescriptions`.
- **Anyone** with a link → `/rx/:token` → `SharedPrescription` (no login).

Every authenticated call carries `Authorization: Bearer <jwt>` — the axios interceptor in `client/src/api/index.js` attaches it automatically.

---

## 1. Doctor writes a prescription

**On page load**, `DoctorPrescriptions` fires three GETs:

| Call | Server | Returns |
|---|---|---|
| `GET /prescriptions/mine` | `listMine` → `{ doctor: req.user.id }` | prescriptions this doctor authored |
| `GET /students` | `studentsController.listStudents` (doctor-only) | `[{ _id, name, studentId, department }]` |
| `GET /medicines` | `medicinesController.listMedicines` | full stock catalog |

**The form** builds a prescription in local state:

- **Patient** `<select>` — from the students list. This is the *standalone* model: the doctor picks any student directly, not derived from an appointment.
- **Medicine rows** — each row picks from the catalog. On select, the row shows `In stock: 42 tablet` from the cached catalog. If the entered **qty > stock**, it shows `· exceeds stock` in amber — a **soft warning only**; submission is still allowed, because stock isn't consumed until dispensing (M5).
- Dosage (free text), qty, notes, add/remove rows.

**On submit**, client-side guards run first (student selected, ≥1 medicine, every row has dosage, qty ≥ 1), then:

```
POST /prescriptions
{ studentId, medicines: [{ medicineId, dosage, qty }], notes }
```

`prescriptionsController.create` (guarded by `allowRoles('doctor')`):

1. Verifies the student exists and is role `student` → else **404**.
2. Loops each line: requires dosage + integer qty ≥ 1 (**400**), and confirms each `medicineId` exists (**404**). It re-fetches each medicine server-side — the client can't forge a fake medicine.
3. Creates the doc with `doctor: req.user.id` (taken from the token, never the body), `student`, `medicines`, `notes`. **No stock is touched.**
4. Returns the populated prescription (**201**).

The form clears and the "Prescriptions Written" list refreshes via `loadMine()`.

---

## 2. Student views prescription history

`StudentPrescriptions` calls `GET /prescriptions/mine`. Same controller, but `req.user.role === 'student'`
flips the filter to `{ student: req.user.id }` — a student sees prescriptions *received*, a doctor sees ones
*authored*. Both are populated with:

```
student → name, studentId, department
doctor  → name, specialty
medicines.medicine → name, unit, stockQty
```

Each renders as a read-only `rx-card`: doctor + date header, the medicine list (`name · dosage · ×qty unit`), and notes.

---

## 3. Student generates a shareable link

Each card has a `ShareBox`. With no active token yet it shows **🔗 Generate shareable link**. Clicking it:

```
POST /prescriptions/:id/share      (owner-only)
```

`share` handler:

1. Loads the prescription → **404** if missing.
2. `isOwner` check — for a student, `p.student.equals(req.user.id)`; **403** otherwise. A student can only share *their own* prescription.
3. Mints `shareToken = crypto.randomBytes(24).toString('hex')` (unguessable) and `shareTokenExpiresAt = now + 30 days` (`SHARE_TTL_DAYS`).
4. Saves and returns `{ token, expiresAt }`.

The UI composes `${window.location.origin}/rx/${token}`, shows it in a read-only field with **Copy**, and notes
the expiry date. **Regenerate** re-runs the same call, overwriting the token and resetting the 30-day clock
(invalidating the old link).

---

## 4. Anyone opens the public link

Navigating to `/rx/:token` hits `SharedPrescription` — a **top-level route outside `ProtectedRoute`**, so no
login is required. It calls:

```
GET /prescriptions/share/:token    (NO auth)
```

This route is registered in `routes/prescriptions.js` **before** `router.use(protect)`, so the auth middleware
never runs on it. `viewShared`:

1. Finds by `shareToken` → **404** `"This prescription link is invalid."` if unknown.
2. Checks `shareTokenExpiresAt` → if missing or past, **410** `"This prescription link has expired."`
3. Returns `publicView(p)` — a **name-only projection**: doctor name/specialty, student name/studentId,
   medicines (name, unit, dosage, qty), notes, date. No user Mongo ids, no email, no internal refs leak out.

The page maps the status code to UI state:

- **200** → renders the clean prescription card (the "sick-leave" document).
- **410** → "This prescription link has expired."
- **404** → "This prescription link is invalid."
- other → generic error.

---

## Security & design properties

- **Doctor identity is trust-derived**, not client-supplied — `doctor: req.user.id` on create.
- **Ownership is enforced** on `/:id` and `/:id/share` (403 on mismatch), so ids aren't guessable-into.
- **The public endpoint is the only unauthenticated one**, returns a minimal projection, and self-expires —
  an old shared link stops working after 30 days or on regeneration.
- **Stock is read-only** across this whole flow; the inventory decrement is deferred to M5 (OTP dispensing),
  which is why over-prescribing only warns.

---

## File map

| Concern | File |
|---|---|
| Models | `server/models/Prescription.js`, `server/models/Medicine.js` |
| Controllers | `server/controllers/prescriptionsController.js`, `medicinesController.js`, `studentsController.js` |
| Routes | `server/routes/prescriptions.js` (public `/share/:token` before `protect`), `medicines.js`, `students.js` |
| Seed | `server/seed/seed.js` |
| Client pages | `client/src/pages/Prescriptions.jsx` (splitter), `DoctorPrescriptions.jsx`, `StudentPrescriptions.jsx`, `SharedPrescription.jsx` |
| Routing / nav | `client/src/App.jsx` (`/rx/:token`, `prescriptions`), `PanelLayout.jsx` |
