# UniCare — High-Level Design & Development Roadmap

## Assumptions

Since some details weren't specified in the proposal, the following assumptions were made:

1. **Auth & roles**: JWT-based authentication with three primary roles — Student, Doctor, Pharmacist — plus an implicit Admin role for managing users, inventory master data, and system settings.
2. **File uploads**: External hospital bills (for reimbursement) and any supporting documents are images/PDFs, stored via a cloud service (e.g., Cloudinary) or local disk storage referenced by URL in MongoDB — not stored as binary blobs in the DB.
3. **OTP delivery**: OTP for medicine collection is generated server-side and delivered via email (Nodemailer) or displayed in-app; SMS is out of scope unless a gateway is later integrated.
4. **Prescription sharing link**: A shareable "sick leave" link is a unique, time-limited, read-only public URL (token-based) pointing to a specific prescription — no login required to view it.
5. **Pharmacy stock integration**: "Live" stock check means the doctor's prescription screen queries current inventory counts synchronously when writing a prescription — not a real-time push (per your choice of REST-only).
6. **Reimbursement workflow**: Student submits → Doctor reviews/approves or rejects → status tracked; actual payment processing/finance system integration is out of scope.
7. **Scope boundary**: Web-only, responsive frontend. No native/hybrid mobile app, no WebSocket/real-time layer — all communication via REST APIs.
8. **Single university/tenant**: The system serves one university medical center (not multi-tenant across institutions).

Feel free to flag any of these if they don't match your intended design — the roadmap below is structured so individual modules can be adjusted without much rework.

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (React SPA)                     │
│  Role-based views: Student | Doctor | Pharmacist | Admin      │
│  React Router · Context API / Redux Toolkit · Axios           │
└───────────────────────────┬─────────────────────────────────┘
                             │ REST API (HTTPS, JWT in headers)
┌───────────────────────────▼─────────────────────────────────┐
│                    SERVER (Node.js + Express)                 │
│  ┌───────────┐ ┌───────────┐ ┌────────────┐ ┌─────────────┐  │
│  │   Auth     │ │Appointment │ │Prescription│ │ Inventory   │  │
│  │  Module    │ │  Module    │ │  Module    │ │  Module     │  │
│  └───────────┘ └───────────┘ └────────────┘ └─────────────┘  │
│  ┌───────────┐ ┌───────────┐ ┌────────────┐                  │
│  │    OTP     │ │Reimburse-  │ │ Shareable  │                  │
│  │  Module    │ │ment Module │ │ Link Module│                  │
│  └───────────┘ └───────────┘ └────────────┘                  │
│  Middleware: JWT verify · role guard · validation · error hdlr│
└───────────────────────────┬─────────────────────────────────┘
                             │ Mongoose ODM
┌───────────────────────────▼─────────────────────────────────┐
│                     MongoDB (Atlas / self-hosted)              │
│  Users · Appointments · Prescriptions · Medicines ·            │
│  OTPs · ReimbursementClaims · InventoryLogs                    │
└───────────────────────────────────────────────────────────────┘
        │
        └──▶ External: Nodemailer (email/OTP) · Cloud storage (bill uploads)
```

**Stack summary**
- **Frontend**: React (Vite), React Router, Axios, Context API or Redux Toolkit, Tailwind CSS or MUI
- **Backend**: Node.js, Express.js, JWT (jsonwebtoken), bcrypt for password hashing
- **Database**: MongoDB with Mongoose
- **Supporting services**: Nodemailer (OTP/notifications), Multer + Cloudinary/S3 (file uploads), express-validator (input validation)

---

## 2. Core Data Models (simplified)

| Collection | Key Fields |
|---|---|
| **User** | name, email, passwordHash, role (student/doctor/pharmacist/admin), studentId/doctorId, department |
| **Appointment** | studentId, doctorId, date, timeSlot, status (pending/confirmed/completed/cancelled) |
| **Prescription** | appointmentId, studentId, doctorId, medicines[{medicineId, dosage, qty}], notes, shareToken, createdAt |
| **Medicine (Inventory)** | name, stockQty, unit, reorderThreshold, lastRestockedAt |
| **OTP** | prescriptionId, studentId, code, expiresAt, used (bool) |
| **ReimbursementClaim** | studentId, doctorId, billFileUrl, hospitalName, amount, status (pending/approved/rejected), reviewNotes |
| **InventoryLog** | medicineId, changeQty, reason (dispensed/restocked), performedBy, timestamp |

---

## 3. Key Workflows

- **Appointment → Prescription → Dispensing**: Student books slot → Doctor sees queue → Doctor writes prescription (checks live stock) → System generates OTP, emails/shows it to student → Student shows OTP to pharmacist → Pharmacist verifies OTP → inventory auto-decrements.
- **Sick leave sharing**: Student clicks "Generate Link" on a prescription → server creates a signed token tied to that prescription → public read-only page renders it via `GET /prescriptions/share/:token`.
- **Reimbursement**: Student uploads bill + details → status `pending` → Doctor reviews in dashboard → approves/rejects with notes → student sees updated status.

---

## 4. Feature-Based Development Roadmap

Since there's no fixed timeline, the roadmap is organized as sequential milestones — each is a self-contained deliverable, and later ones depend on earlier ones being functional.

### Milestone 1 — Foundation
- Project scaffolding (client + server folders, env config, MongoDB connection)
- User schema, registration/login, JWT auth middleware, role-based route guards
- Basic role-specific dashboard shells (empty pages per role)

### Milestone 2 — Appointment Booking
- Doctor availability/slot model
- Student: browse doctors, book appointment
- Doctor: view/manage incoming queue (accept/complete/cancel)

### Milestone 3 — E-Prescription + Pharmacy Stock
- Medicine/inventory schema + seed data
- Doctor: write prescription during a consult, with live stock lookup while adding medicines
- Student: view prescription history

### Milestone 4 — Shareable Prescription Link
- Token generation on a prescription
- Public read-only route to view a prescription via token (no auth)

### Milestone 5 — OTP-Based Medicine Collection
- OTP generation tied to a prescription, emailed to student
- Pharmacist: lookup prescription, verify OTP
- Auto-decrement inventory on successful dispensing + inventory log entry

### Milestone 6 — Reimbursement Claims
- Student: submit claim with bill upload + amount + hospital name
- Doctor: review queue, approve/reject with notes
- Student: track claim status

### Milestone 7 — Inventory Management (Admin/Pharmacist)
- View current stock levels, low-stock alerts (threshold-based, computed on read)
- Manual restock entry, inventory log/history view

### Milestone 8 — Polish & Hardening
- Input validation everywhere, consistent error handling
- Basic responsive styling pass across all role dashboards
- Seed/demo data script, README, deployment (e.g., Vercel for client, Render/Railway for server, MongoDB Atlas)

---

## 5. Suggested Repo Structure

```
unicare/
├── client/          # React app
│   ├── src/
│   │   ├── pages/{student,doctor,pharmacist,admin}/
│   │   ├── components/
│   │   ├── context/ (or store/ for Redux)
│   │   └── api/     # Axios instance + endpoint calls
├── server/
│   ├── models/
│   ├── routes/
│   ├── controllers/
│   ├── middleware/  # auth, roleGuard, errorHandler
│   └── utils/       # otpGenerator, mailer, tokenGenerator
```

---

*Next step suggestion*: if you'd like, this can be turned into ER diagrams or sequence diagrams for the key workflows (appointment→dispensing, reimbursement) to include visually in the proposal.
