# UniCare Architecture & Workflows

Comprehensive documentation of UniCare's system architecture, data models, API structure, authentication flows, and feature workflows.

---

## 📐 System Architecture

### High-Level Overview

```
┌────────────────────────────────────────────────────┐
│              FRONTEND (React SPA)                    │
│  ┌────────────────────────────────────────────┐    │
│  │  Login Page                                 │    │
│  └────────────────────────────────────────────┘    │
│  ┌────────────────────────────────────────────┐    │
│  │  Role-Based Panels (Student/Doctor/...)    │    │
│  │  ├── Dashboard                              │    │
│  │  ├── Appointments                           │    │
│  │  ├── Prescriptions                          │    │
│  │  ├── Pharmacy/Reimbursement                 │    │
│  │  └── Admin Controls                         │    │
│  └────────────────────────────────────────────┘    │
│  ┌────────────────────────────────────────────┐    │
│  │  Shared Prescription (No Auth Required)     │    │
│  └────────────────────────────────────────────┘    │
│                                                      │
│  Built with: React 19, Vite, React Router 7,       │
│              Axios, Context API, Lucide Icons       │
└────────┬─────────────────────────────────────────┘
         │ REST API (HTTPS, JWT in Authorization header)
         │
┌────────▼──────────────────────────────────────────┐
│           BACKEND (Node.js + Express)              │
│ ┌────────────────────────────────────────────┐    │
│ │  Routes Layer                              │    │
│ │  /auth, /appointments, /prescriptions,     │    │
│ │  /medicines, /students, /reimbursements    │    │
│ └────────────────────────────────────────────┘    │
│ ┌────────────────────────────────────────────┐    │
│ │  Controllers Layer (Business Logic)        │    │
│ │  authController, appointmentsController,   │    │
│ │  prescriptionsController, etc.             │    │
│ └────────────────────────────────────────────┘    │
│ ┌────────────────────────────────────────────┐    │
│ │  Middleware Stack                          │    │
│ │  • CORS, JSON parser                       │    │
│ │  • JWT authentication (protect)            │    │
│ │  • Role-based guards (allowRoles)          │    │
│ │  • Error handler (last middleware)         │    │
│ └────────────────────────────────────────────┘    │
│ ┌────────────────────────────────────────────┐    │
│ │  Models Layer (Mongoose ODM)               │    │
│ │  User, Appointment, Prescription,          │    │
│ │  Medicine, OTP, ReimbursementClaim, etc.   │    │
│ └────────────────────────────────────────────┘    │
│                                                     │
│  Built with: Express.js 5, Mongoose 9,            │
│              JWT, bcryptjs, Nodemailer            │
└────────┬──────────────────────────────────────────┘
         │ Mongoose ODM
         │
┌────────▼──────────────────────────────────────────┐
│         DATABASE (MongoDB)                         │
│  • Local (localhost:27017)                         │
│  • Or Atlas (mongodb+srv://...)                    │
│                                                     │
│  Collections:                                      │
│  Users | Appointments | Prescriptions |           │
│  Medicines | OTPs | ReimbursementClaims |         │
│  InventoryLogs | SystemLogs                       │
└────────────────────────────────────────────────┘
         │
    ┌────┴─────────────────────────────────────┐
    │ External Services (Optional)             │
    ├─ Nodemailer (Email/OTP)                  │
    ├─ Cloudinary/S3 (File uploads)            │
    └─ SMS Gateway (Future)                    │
```

---

## 🔐 Authentication & Authorization

### Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│  USER LOGIN / REGISTRATION                              │
└──────────────┬──────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────┐
│  POST /api/auth/register  or  POST /api/auth/login   │
│  • Email + password sent                              │
│  • Password hashed with bcryptjs                      │
│  • User record created/validated                      │
└──────────────┬──────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────┐
│  JWT Token Generated                                 │
│  • Payload: { id, role }                             │
│  • Signed with JWT_SECRET                            │
│  • Expires: 7 days                                   │
└──────────────┬──────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────┐
│  Client stores token in localStorage                 │
│  ("token" key)                                       │
└──────────────┬──────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────┐
│  All subsequent requests include:                    │
│  Authorization: Bearer <token>                       │
│  (Axios interceptor auto-attaches)                   │
└──────────────┬──────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────┐
│  Server Middleware: protect (auth.js)                │
│  • Extracts token from header                        │
│  • Verifies signature + expiry                       │
│  • Sets req.user = { id, role }                      │
│  • Calls next() if valid, else 401 Unauthorized      │
└──────────────┬──────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────┐
│  Route-Level Guards: allowRoles('student', ...)      │
│  • Checks req.user.role                              │
│  • Calls next() if allowed                           │
│  • Calls next(new Error(...)) if forbidden (403)     │
└──────────────┬──────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────┐
│  Controller executes                                 │
│  • req.user contains { id, role }                    │
│  • Can be trusted (verified by middleware)           │
└──────────────────────────────────────────────────────┘
```

### Middleware Pattern

**routes/prescriptions.js:**
```javascript
router.use(protect);                    // ← All routes below require auth

router.get('/mine', listMine);          // All authenticated users
router.post('/', allowRoles('doctor'), create);    // Doctors only
router.post('/:id/share', allowRoles('doctor'), share);  // Doctors only

// Public route BEFORE protect middleware
router.get('/share/:token', publicShare);  // No auth needed
```

### Roles & Permissions

| Role | Can | Cannot |
|------|-----|--------|
| **student** | View own appointments, prescriptions, reimbursements | Write prescriptions, manage inventory, view other users |
| **doctor** | View appointments, write prescriptions, review reimbursements, view medicines | Manage inventory, access admin panel |
| **pharmacist** | Dispense medicines, view/update inventory, restock | Write prescriptions, manage users |
| **admin** | Manage all users, view system logs, access all features | Limited by database permissions |

---

## 📊 Data Models

### User Schema

```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  passwordHash: String (bcryptjs),
  role: String (enum: 'student', 'doctor', 'pharmacist', 'admin'),
  
  // Role-specific fields
  studentId: String (unique, for students),
  department: String (for students, e.g., "Engineering"),
  specialty: String (for doctors, e.g., "Cardiology"),
  station: String (for pharmacists, e.g., "Main Counter"),
  
  createdAt: Date,
  updatedAt: Date,
  active: Boolean (default: true)
}
```

### Appointment Schema

```javascript
{
  _id: ObjectId,
  student: ObjectId (ref: User),
  doctor: ObjectId (ref: User),
  date: Date (UTC midnight, no time component),
  timeSlot: String (format: "HH:MM-HH:MM", e.g., "09:00-09:30"),
  status: String (enum: 'pending', 'confirmed', 'completed', 'cancelled'),
  notes: String (optional),
  
  createdAt: Date,
  updatedAt: Date
}
```

**Key detail**: `date` is stored as UTC midnight to prevent timezone drift. The `timeSlot` is a separate string field.

**Unique index** (partial):
```javascript
{ doctor: 1, date: 1, timeSlot: 1 },
sparse: true,
partialFilterExpression: {
  status: { $in: ['pending', 'confirmed', 'completed'] }
}
```
This prevents double-booking across active appointments.

### Prescription Schema

```javascript
{
  _id: ObjectId,
  doctor: ObjectId (ref: User),
  student: ObjectId (ref: User),
  medicines: [
    {
      medicine: ObjectId (ref: Medicine),
      dosage: String (e.g., "500mg"),
      qty: Number (quantity)
    }
  ],
  notes: String (optional),
  
  // Shareable link fields
  shareToken: String (unique, crypto.randomBytes(32).toString('hex')),
  shareTokenExpiresAt: Date (default: 30 days from creation),
  
  createdAt: Date,
  updatedAt: Date
}
```

**Special routes**:
- `GET /prescriptions/mine` — Filters by `doctor` or `student` based on user role
- `POST /prescriptions/:id/share` — Generates/refreshes `shareToken` with 30-day expiry
- `GET /prescriptions/share/:token` — Public access (no auth), returns projection with only name fields

### Medicine Schema

```javascript
{
  _id: ObjectId,
  name: String (e.g., "Aspirin"),
  unit: String (e.g., "tablet", "ml"),
  stockQty: Number,
  reorderThreshold: Number (alert when stock < this),
  lastRestockedAt: Date,
  
  createdAt: Date,
  updatedAt: Date
}
```

### OTP Schema

```javascript
{
  _id: ObjectId,
  prescription: ObjectId (ref: Prescription),
  student: ObjectId (ref: User),
  code: String (6-digit numeric),
  expiresAt: Date (TTL index, auto-deletes after expiry),
  used: Boolean (default: false),
  usedAt: Date (optional),
  
  createdAt: Date
}
```

### ReimbursementClaim Schema

```javascript
{
  _id: ObjectId,
  student: ObjectId (ref: User),
  doctor: ObjectId (ref: User),
  billFileUrl: String (URL to uploaded bill image/PDF),
  hospitalName: String,
  amount: Number (in currency units),
  status: String (enum: 'pending', 'approved', 'rejected'),
  reviewNotes: String (doctor's feedback),
  
  createdAt: Date,
  updatedAt: Date
}
```

### InventoryLog Schema

```javascript
{
  _id: ObjectId,
  medicine: ObjectId (ref: Medicine),
  changeQty: Number (positive for restock, negative for dispensing),
  reason: String (enum: 'dispensed', 'restocked', 'damage', 'adjustment'),
  performedBy: ObjectId (ref: User),
  notes: String (optional),
  
  createdAt: Date
}
```

### SystemLog Schema

```javascript
{
  _id: ObjectId,
  action: String (e.g., "user_login", "prescription_created"),
  actor: ObjectId (ref: User, optional),
  resourceType: String (e.g., "appointment", "prescription"),
  resourceId: ObjectId (optional),
  details: Object (any extra context),
  ipAddress: String,
  
  createdAt: Date
}
```

---

## 🔌 API Endpoints

All endpoints are prefixed with `/api/` and use JSON for request/response bodies.

### Authentication Routes

**Public routes** (no auth required):

```
POST   /api/auth/register
       Request: { name, email, password, role }
       Response: { token, user: { id, name, email, role } }
       Status: 201 Created / 400 Bad Request

POST   /api/auth/login
       Request: { email, password }
       Response: { token, user: { id, name, email, role } }
       Status: 200 OK / 401 Unauthorized

GET    /api/auth/me
       Headers: Authorization: Bearer <token>
       Response: { id, name, email, role, ... }
       Status: 200 OK / 401 Unauthorized

POST   /api/auth/change-password
       Headers: Authorization: Bearer <token>
       Request: { currentPassword, newPassword }
       Response: { message: "Password changed" }
       Status: 200 OK / 400 Bad Request / 401 Unauthorized
```

### Appointments Routes

```
GET    /api/appointments
       Headers: Authorization: Bearer <token>
       Query: ?status=pending&doctor=<id>  (optional filters)
       Response: { appointments: [...] }
       Status: 200 OK / 401 Unauthorized

POST   /api/appointments
       Headers: Authorization: Bearer <token>
       Request: { studentId, doctorId, date, timeSlot }
       Response: { _id, student, doctor, date, timeSlot, status, ... }
       Status: 201 Created / 400 Bad Request / 409 Conflict (double-book)

PATCH  /api/appointments/:id
       Headers: Authorization: Bearer <token>
       Request: { status: "confirmed"|"completed"|"cancelled" }
       Response: { _id, ..., status: "confirmed", ... }
       Status: 200 OK / 400 Bad Request / 404 Not Found / 403 Forbidden
```

**Guard**: `POST` and `PATCH` require `protect` middleware. Status transitions validate via state machine.

### Prescriptions Routes

```
GET    /api/prescriptions/mine
       Headers: Authorization: Bearer <token>
       Query: ?role=doctor|student
       Response: [
         {
           _id, doctor: { name, specialty }, student: { name },
           medicines: [...], notes, shareToken, shareTokenExpiresAt
         }
       ]
       Status: 200 OK / 401 Unauthorized

POST   /api/prescriptions
       Headers: Authorization: Bearer <token> (doctor-only)
       Request: {
         studentId: ObjectId,
         medicines: [{ medicineId, dosage, qty }],
         notes: String (optional)
       }
       Response: { _id, doctor, student, medicines, notes, createdAt }
       Status: 201 Created / 400 Bad Request / 404 Not Found

POST   /api/prescriptions/:id/share
       Headers: Authorization: Bearer <token> (doctor-only, owner)
       Request: { } (empty body)
       Response: { shareToken: "abc123...", shareTokenExpiresAt: Date }
       Status: 200 OK / 404 Not Found / 403 Forbidden

GET    /api/prescriptions/share/:token
       Headers: (none — public)
       Response: {
         doctor: { name }, student: { name },
         medicines: [...], notes
       }
       Status: 200 OK / 404 Not Found / 410 Gone (expired)
```

**Notes**:
- `POST /prescriptions/:id/share` must be registered **before** `router.use(protect)` to prevent auth blocking
- `GET /prescriptions/share/:token` is public and returns a restricted projection (no IDs)

### Medicines Routes

```
GET    /api/medicines
       Headers: Authorization: Bearer <token>
       Response: [
         { _id, name, unit, stockQty, reorderThreshold }
       ]
       Status: 200 OK / 401 Unauthorized

POST   /api/medicines
       Headers: Authorization: Bearer <token> (admin-only)
       Request: { name, unit, stockQty, reorderThreshold }
       Response: { _id, name, unit, stockQty, ... }
       Status: 201 Created / 400 Bad Request / 403 Forbidden
```

### Students Routes

```
GET    /api/students
       Headers: Authorization: Bearer <token> (doctor-only)
       Response: [
         { _id, name, studentId, department }
       ]
       Status: 200 OK / 401 Unauthorized / 403 Forbidden
```

### Reimbursements Routes

```
GET    /api/reimbursements/mine
       Headers: Authorization: Bearer <token> (student-only)
       Response: [
         { _id, amount, status, billFileUrl, hospitalName, ... }
       ]
       Status: 200 OK / 401 Unauthorized

POST   /api/reimbursements
       Headers: Authorization: Bearer <token> (student-only)
       Request: {
         billFileUrl: String (URL),
         hospitalName: String,
         amount: Number
       }
       Response: { _id, student, amount, status: "pending", ... }
       Status: 201 Created / 400 Bad Request

PATCH  /api/reimbursements/:id
       Headers: Authorization: Bearer <token> (doctor-only)
       Request: { status: "approved"|"rejected", reviewNotes: String }
       Response: { _id, ..., status: "approved", reviewNotes: "..." }
       Status: 200 OK / 404 Not Found / 403 Forbidden
```

### Admin Routes

```
GET    /api/admin/users
       Headers: Authorization: Bearer <token> (admin-only)
       Query: ?role=student&active=true (optional filters)
       Response: [
         { _id, name, email, role, createdAt, active }
       ]
       Status: 200 OK / 401 Unauthorized / 403 Forbidden

POST   /api/admin/users
       Headers: Authorization: Bearer <token> (admin-only)
       Request: { name, email, password, role, ... }
       Response: { _id, name, email, role, ... }
       Status: 201 Created / 400 Bad Request / 403 Forbidden

GET    /api/admin/logs
       Headers: Authorization: Bearer <token> (admin-only)
       Query: ?limit=50&skip=0 (pagination)
       Response: [
         { _id, action, actor, resourceType, createdAt, ... }
       ]
       Status: 200 OK / 401 Unauthorized / 403 Forbidden
```

---

## 🔄 Feature Workflows

### Workflow 1: Appointment Booking (Milestone 2)

```
1. STUDENT BROWSING
   Student logs in → Sidebar "Appointments" → StudentAppointments.jsx
   ↓
   GET /api/doctors
   → Lists all doctors with availability

2. STUDENT BOOKING
   Student selects doctor + time slot → Clicks "Book Appointment"
   ↓
   POST /api/appointments
   {
     studentId: "...",
     doctorId: "...",
     date: "2026-08-20",  (UTC midnight)
     timeSlot: "09:00-09:30"
   }
   ↓
   Server validation:
   • Confirms student exists and is role 'student'
   • Confirms doctor exists and is role 'doctor'
   • Confirms date/timeSlot in doctor's availability
   • Checks unique index for double-booking (status = pending/confirmed/completed)
   ↓
   Response: 201 Created (appointment stored)
   OR 409 Conflict (slot already taken)

3. DOCTOR VIEWING QUEUE
   Doctor logs in → Sidebar "Appointments" → Appointments.jsx
   ↓
   GET /api/appointments?doctor=<doctorid>
   → Lists all appointments for this doctor

4. DOCTOR UPDATING STATUS
   Doctor clicks "Confirm" or "Complete" on appointment
   ↓
   PATCH /api/appointments/<id>
   {
     status: "confirmed"  or  "completed"  or  "cancelled"
   }
   ↓
   Server validates status transition via TRANSITIONS state machine
   • pending → confirmed, cancelled
   • confirmed → completed, cancelled
   • completed → (no transitions)
   • cancelled → (no transitions)
   ↓
   Response: 200 OK (updated appointment)

5. STUDENT VIEWING HISTORY
   Student refreshes or navigates back to Appointments
   ↓
   GET /api/appointments
   (filtered by student automatically in controller)
   → Shows updated status
```

### Workflow 2: E-Prescription & Shareable Link (Milestone 3–4)

```
1. DOCTOR WRITING PRESCRIPTION
   Doctor logs in → Sidebar "Prescriptions" → DoctorPrescriptions.jsx
   ↓
   On page load, fetch three lists:
   • GET /api/prescriptions/mine     (doctor's written prescriptions)
   • GET /api/students               (list of students to select from)
   • GET /api/medicines              (catalog with stock levels)

2. DOCTOR FILLING FORM
   • Select student (dropdown from students list)
   • Add medicine rows:
     - Select medicine (dropdown, shows stock level)
     - Enter dosage (free text)
     - Enter quantity
     - Check: If qty > stock → show amber warning "exceeds stock"
             (NOT blocked; stock is only consumed at dispensing)
   • Enter optional notes
   ↓
   Click "Write Prescription" button

3. SERVER VALIDATION & STORAGE
   POST /api/prescriptions
   {
     studentId: "...",
     medicines: [
       { medicineId: "...", dosage: "500mg", qty: 2 },
       ...
     ],
     notes: "Take with food"
   }
   ↓
   Server checks:
   • Student exists and is role 'student'
   • Each medicineId exists
   • Each row has dosage + qty ≥ 1 and integer
   • NO stock is decremented (happens only at dispensing in M5)
   ↓
   Creates prescription doc with:
   doctor: req.user.id  (from token, never body)
   student: studentId
   medicines: [...]
   shareToken: null     (until shared)
   ↓
   Response: 201 Created (prescription stored)

4. STUDENT VIEWING PRESCRIPTIONS
   Student logs in → Sidebar "Prescriptions" → StudentPrescriptions.jsx
   ↓
   GET /api/prescriptions/mine
   (automatically filtered by student)
   → Shows prescriptions received (doctor + date + medicines)

5. GENERATING SHAREABLE LINK
   Each prescription card has a "Share" button
   ↓
   Click "Generate shareable link" → Shows spinner
   ↓
   POST /api/prescriptions/<id>/share
   {
     (empty body)
   }
   ↓
   Server:
   • Loads prescription
   • Generates shareToken = crypto.randomBytes(32).toString('hex')
   • Sets shareTokenExpiresAt = now + 30 days
   • Saves
   ↓
   Response: 200 OK
   {
     shareToken: "a1b2c3...",
     shareTokenExpiresAt: "2026-09-14T..."
   }
   ↓
   UI displays link:
   http://localhost:5173/rx/a1b2c3...

6. SHARING & PUBLIC ACCESS
   Student copies link and shares (email, WhatsApp, etc.)
   ↓
   Anyone (no login needed) opens:
   http://localhost:5173/rx/a1b2c3...
   ↓
   Frontend renders SharedPrescription.jsx
   ↓
   GET /api/prescriptions/share/a1b2c3
   (public endpoint, NO auth required)
   ↓
   Server:
   • Finds prescription by shareToken
   • Checks not expired (shareTokenExpiresAt > now)
   • Returns projection with ONLY name fields (no IDs):
     {
       doctor: { name },
       student: { name },
       medicines: [...],
       notes: "..."
     }
   ↓
   Response:
   • 200 OK (prescription data)
   • 404 Not Found (invalid token)
   • 410 Gone (expired token)
   ↓
   UI displays read-only prescription card
```

### Workflow 3: Reimbursement Claim (Milestone 5)

```
1. STUDENT SUBMITTING CLAIM
   Student logs in → Sidebar "Reimbursements" → StudentReimbursements.jsx
   ↓
   Click "Submit New Claim" → Form
   ↓
   Fill:
   • Hospital/Clinic name
   • Bill amount
   • Attach bill file (uploads to Cloudinary/S3, returns URL)
   ↓
   Click "Submit" → POST /api/reimbursements
   {
     billFileUrl: "https://cdn.example.com/bill.jpg",
     hospitalName: "City Hospital",
     amount: 5000
   }
   ↓
   Server:
   • Validates amount > 0
   • Creates ReimbursementClaim with:
     student: req.user.id
     status: "pending"
     doctor: null (unassigned initially)
   ↓
   Response: 201 Created

2. DOCTOR REVIEWING CLAIMS
   Doctor logs in → Sidebar "Claims" → DoctorClaims.jsx
   ↓
   GET /api/reimbursements
   (lists pending claims; exact endpoint TBD)
   ↓
   Doctor reviews claim:
   • Views bill file
   • Reads notes
   • Enters review notes (optional)

3. DOCTOR APPROVING/REJECTING
   Click "Approve" or "Reject" button
   ↓
   PATCH /api/reimbursements/<id>
   {
     status: "approved" or "rejected",
     reviewNotes: "Bill covers eligible items"
   }
   ↓
   Server updates claim status
   ↓
   Response: 200 OK

4. STUDENT VIEWING STATUS
   Student refreshes or navigates to Reimbursements
   ↓
   GET /api/reimbursements/mine
   → Shows updated status + doctor's review notes
```

### Workflow 4: OTP Dispensing (Milestone 5)

```
1. PRESCRIPTION CREATED (see Workflow 2)
   Prescription is written and stored

2. STUDENT RECEIVES OTP (auto-generated, in real app)
   Server generates OTP code (6-digit numeric)
   ↓
   Creates OTP document:
   {
     prescription: <id>,
     student: <id>,
     code: "123456",
     expiresAt: now + 15 minutes,
     used: false
   }
   ↓
   Sends via email (Nodemailer) or displays in app

3. STUDENT SHOWS OTP TO PHARMACIST
   Student arrives at pharmacy, shows OTP (via app or paper)

4. PHARMACIST VERIFIES & DISPENSES
   Pharmacist logs in → Sidebar "Dispense" → Dispense.jsx
   ↓
   Enters OTP code → POST /api/dispense
   {
     otpCode: "123456"
   }
   ↓
   Server:
   • Finds OTP by code
   • Checks not expired (expiresAt > now)
   • Checks not already used (used === false)
   • Marks OTP.used = true
   • For each medicine in prescription:
     - Decrements Medicine.stockQty
     - Creates InventoryLog entry
   ↓
   Response: 200 OK or 400 Bad Request (invalid/expired OTP)

5. STOCK UPDATE
   Pharmacy/Admin can view InventoryLog:
   ↓
   GET /api/inventory/logs
   → Shows all stock changes with reason (dispensed, restocked, etc.)
```

---

## 🎯 Layered Architecture Pattern

### Standard Implementation for New Features

When adding a new resource (e.g., "LabTests"):

```
1. CREATE MODEL (server/models/LabTest.js)
   ├─ Define schema (fields, types, validation)
   ├─ Add indexes if needed
   └─ Export model

2. CREATE CONTROLLER (server/controllers/labTestController.js)
   ├─ list() → GET all (with optional filters)
   ├─ create() → POST (validate input, save, return)
   ├─ update() → PATCH (check permissions, update, return)
   ├─ delete() → DELETE (check permissions, remove)
   └─ Each method:
      • Validates input
      • Uses try-catch with next(err)
      • Sets res.status() + res.json()

3. CREATE ROUTES (server/routes/labTests.js)
   ├─ router.use(protect)  ← Require auth for all
   ├─ router.get('/', list)
   ├─ router.post('/', allowRoles('doctor'), create)
   ├─ router.patch('/:id', allowRoles('doctor'), update)
   └─ router.delete('/:id', allowRoles('doctor'), delete)

4. MOUNT ROUTE (server/server.js)
   └─ app.use('/api/lab-tests', labTestRoutes)

5. CREATE API CLIENT (client/src/api/labTestApi.js or add to index.js)
   ├─ getLabTests()
   ├─ createLabTest(data)
   ├─ updateLabTest(id, data)
   └─ deleteLabTest(id)

6. BUILD UI (client/src/pages/LabTests.jsx)
   ├─ useEffect → Fetch data on mount
   ├─ useState → Manage local state
   ├─ JSX → Render table/list + form
   └─ Handle errors + loading states

7. REGISTER PAGE (client/src/App.jsx)
   └─ <Route path="/panel/:role/lab-tests" element={<LabTests />} />

8. ADD TO NAVIGATION (client/src/pages/PanelLayout.jsx)
   └─ Add to ROLE_CONFIG[role].nav array

9. UPDATE DOCUMENTATION
   └─ Add endpoint to ARCHITECTURE.md
   └─ Describe workflow in README.md
```

### Error Handling Pattern

```javascript
// Controller
try {
  const data = await LabTest.findById(id);
  if (!data) {
    return res.status(404).json({ message: 'Not found' });
  }
  res.json(data);
} catch (err) {
  next(err);  // ← Pass to error handler middleware
}

// Middleware (errorHandler.js)
(err, req, res, next) => {
  console.error(err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || 'Server error',
    error: process.env.NODE_ENV === 'production' ? {} : err
  });
}
```

---

## 🔄 Client State Management

### AuthContext Pattern

```javascript
// context/AuthContext.jsx
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      // Restore session
      api.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => setUser(res.data));
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    setToken(res.data.token);
    setUser(res.data.user);
    localStorage.setItem('token', res.data.token);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### Axios Interceptor Pattern

```javascript
// api/index.js
const api = axios.create({ baseURL: 'http://localhost:5000/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

---

## 🔗 Dependency Flows

```
                     Frontend (React)
                            │
                            ├─→ Uses AuthContext
                            ├─→ Calls api (axios instance)
                            └─→ Renders pages/components
                                    │
                                    ▼
                        Backend (Express.js)
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
                Routes         Middleware       Controllers
                  │              (auth)             │
                  │          (error handler)       │
                  │                                 │
                  └─────────────────┬───────────────┘
                                    │
                                    ▼
                              Models (Mongoose)
                                    │
                                    ▼
                              MongoDB (Database)
```

---

## 🚀 Deployment Considerations

### Environment-Specific Configuration

```
Development:
├─ MONGO_URI = mongodb://localhost:27017/unicare
├─ JWT_SECRET = dev-secret-key
├─ NODE_ENV = development
└─ Client baseURL = http://localhost:5000/api

Staging:
├─ MONGO_URI = mongodb+srv://user:pass@staging-cluster.mongodb.net/unicare
├─ JWT_SECRET = staging-secret-key (use env vars)
├─ NODE_ENV = staging
└─ Client baseURL = https://api-staging.unicare.com/api

Production:
├─ MONGO_URI = mongodb+srv://user:pass@prod-cluster.mongodb.net/unicare
├─ JWT_SECRET = prod-secret-key (use managed secrets)
├─ NODE_ENV = production
└─ Client baseURL = https://api.unicare.com/api
```

### Scaling Considerations

- **Database**: Use MongoDB Atlas for managed backups, auto-scaling
- **Server**: Stateless design allows horizontal scaling (load balancer + multiple instances)
- **File uploads**: Use Cloudinary/S3 (not local disk) for distributed deployments
- **Session**: JWT is stateless, no session store needed
- **Rate limiting**: Add express-rate-limit for API protection
- **Monitoring**: Integrate APM tool (DataDog, New Relic, etc.)

---

## 📚 Additional Resources

- [README.md](README.md) — Project overview & quick start
- [SETUP.md](SETUP.md) — Installation & configuration
- [STYLEGUIDE.md](STYLEGUIDE.md) — Design system reference
- [WALKTHROUGH.md](WALKTHROUGH.md) — Detailed prescription workflow
- [CLAUDE.md](CLAUDE.md) — AI development guidance

---

**Last updated**: August 2026 | Architecture Version: 1.0
