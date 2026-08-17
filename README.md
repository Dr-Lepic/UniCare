# UniCare — University Medical Center Management System

A role-based medical center management platform for universities, enabling students to book appointments, receive prescriptions, access pharmacy services, and manage reimbursement claims. Built with **React**, **Express.js**, and **MongoDB**.

---

## 🎯 Overview

UniCare is a comprehensive web application that streamlines healthcare workflows across a university medical center. It connects students, doctors, pharmacists, and administrators through an integrated platform with appointment booking, e-prescriptions, pharmacy stock management, and reimbursement processing.

### Key Features

- **👥 Role-Based Access**: Four distinct user types with tailored workflows:
  - **Students**: Book appointments, view prescriptions, manage reimbursements
  - **Doctors**: View patient queues, write prescriptions, review reimbursement claims
  - **Pharmacists**: Dispense medicines, manage inventory, track stock
  - **Admins**: Manage users, monitor system logs, oversee all operations

- **📅 Appointment Booking** (Milestone 2)
  - Browse available doctors and time slots
  - Book, cancel, or reschedule appointments
  - Doctor-side appointment queue management

- **💊 E-Prescription & Pharmacy Integration** (Milestone 3)
  - Doctors write prescriptions with live inventory lookup
  - Real-time stock availability display
  - Student prescription history and details

- **🔗 Shareable Prescription Links** (Milestone 4)
  - Generate time-limited, public shareable links for prescriptions
  - Perfect for sick leave or medical proof sharing
  - No login required to view shared prescriptions

- **💰 Reimbursement Management** (Milestone 5)
  - Students upload hospital bills and claim details
  - Doctors review and approve/reject claims
  - Status tracking and audit trail

- **🏥 Pharmacy Operations** (Milestone 5)
  - OTP-based medicine dispensing verification
  - Inventory tracking and restock logging
  - Automated stock alerts

- **📊 Admin Dashboard**
  - User management (create, view, deactivate)
  - System activity logging
  - Role-based access control

---

## 🏗️ Architecture

```
┌─────────────────┐
│  React SPA      │  Vite · React Router · Context API
│  (client/)      │  Axios · Lucide Icons
└────────┬────────┘
         │ REST API (JWT Auth)
┌────────▼────────┐
│  Express.js     │  Node.js · Port 5000 (default)
│  (server/)      │  Mongoose · Middleware stack
└────────┬────────┘
         │ Mongoose ODM
┌────────▼────────┐
│  MongoDB        │  Collections: Users, Appointments,
│                 │  Prescriptions, Medicines, etc.
└─────────────────┘
```

**Key architectural patterns:**
- **Layered structure**: Routes → Controllers → Models
- **JWT authentication**: Stateless, 7-day token expiry
- **Role guards**: Middleware-based access control
- **Context API**: Client-side global state (authentication, user session)
- **Token-based CSS**: Design system via CSS custom properties

For detailed architecture, data models, and API structure, see [ARCHITECTURE.md](ARCHITECTURE.md).

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm/yarn
- MongoDB (local or Atlas)
- Git

### Setup in 3 Steps

1. **Clone and install dependencies**
   ```bash
   git clone <repo-url>
   cd UniCare
   npm install  # installs in both server/ and client/ directories
   ```

2. **Configure environment variables**
   ```bash
   # Create .env in the project root
   echo "MONGO_URI=mongodb://localhost:27017/unicare" > .env
   echo "JWT_SECRET=your-secret-key-here" >> .env
   echo "PORT=5000" >> .env
   ```

3. **Start development servers**
   ```bash
   # Terminal 1: Start MongoDB (if local)
   mongod

   # Terminal 2: Start backend
   cd server && npm run dev
   # Server running on http://localhost:5000

   # Terminal 3: Start frontend
   cd client && npm run dev
   # Client running on http://localhost:5173 (Vite default)
   ```

**Seed the database** (optional, for demo data):
```bash
cd server
node seed/seed.js
```

For detailed setup instructions, database seeding, and troubleshooting, see [SETUP.md](SETUP.md).

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [SETUP.md](SETUP.md) | Installation, environment setup, running locally, database seeding |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System architecture, data models, API endpoints, workflows |
| [STYLEGUIDE.md](STYLEGUIDE.md) | Design system, CSS tokens, component styling conventions |
| [UniCare_HighLevelDesign_Roadmap.md](UniCare_HighLevelDesign_Roadmap.md) | 8-milestone roadmap, feature specifications, development plan |
| [WALKTHROUGH.md](WALKTHROUGH.md) | E-prescription and shareable link feature flow |
| [CLAUDE.md](CLAUDE.md) | Development guidance for AI assistants |

---

## 📂 Project Structure

```
UniCare/
├── client/                          # React SPA (Vite)
│   ├── src/
│   │   ├── pages/                   # Role-based page components
│   │   ├── components/              # Reusable UI components
│   │   ├── context/                 # Context API (AuthContext)
│   │   ├── api/                     # Axios instance & API client
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── utils/                   # Utilities
│   │   ├── App.jsx                  # Main router
│   │   └── index.css                # Design system tokens
│   ├── vite.config.js               # Vite configuration
│   └── package.json
│
├── server/                          # Express.js API
│   ├── routes/                      # API route definitions
│   ├── controllers/                 # Route handlers & business logic
│   ├── models/                      # Mongoose schemas
│   ├── middleware/                  # Auth, error handling, validation
│   ├── config/                      # Database & environment config
│   ├── seed/                        # Database seeding scripts
│   ├── uploads/                     # Local file uploads (optional)
│   ├── server.js                    # Express app entry point
│   ├── package.json
│   └── utils/                       # Helpers (mailer, logger, etc.)
│
├── Documentation/
│   ├── README.md                    # This file
│   ├── SETUP.md                     # Setup instructions
│   ├── ARCHITECTURE.md              # Architecture & workflows
│   ├── STYLEGUIDE.md                # Design system reference
│   ├── UniCare_HighLevelDesign_Roadmap.md
│   ├── WALKTHROUGH.md
│   └── CLAUDE.md
│
└── .env                             # Environment variables (DO NOT COMMIT)
```

---

## 🔐 Authentication & Authorization

- **Method**: JWT-based stateless authentication
- **Token storage**: Browser `localStorage`
- **Expiry**: 7 days
- **Role-based access**: Four roles (student, doctor, pharmacist, admin)
- **Middleware**: `protect` (verifies token) + `allowRoles(...roles)` (guards endpoints)

Each API request includes:
```
Authorization: Bearer <jwt-token>
```

The token payload contains:
```json
{
  "id": "user_id",
  "role": "student|doctor|pharmacist|admin"
}
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite, React Router 7, Axios, Lucide Icons |
| **Backend** | Node.js, Express 5, Mongoose 9 |
| **Database** | MongoDB (Atlas or self-hosted) |
| **Authentication** | JWT (jsonwebtoken) |
| **Password hashing** | bcryptjs |
| **File uploads** | Multer |
| **Notifications** | Nodemailer (email/OTP) |
| **Dev tools** | Nodemon, ESLint |

---

## 📋 API Overview

All endpoints are prefixed with `/api/` and require JWT authentication (except auth routes and public share links).

### Auth Routes
- `POST /auth/register` — User registration
- `POST /auth/login` — User login
- `GET /auth/me` — Get current user (requires auth)
- `POST /auth/change-password` — Change password

### Appointments (M2)
- `GET /appointments` — List appointments
- `POST /appointments` — Book appointment
- `PATCH /appointments/:id` — Update appointment status

### Prescriptions (M3-M4)
- `GET /prescriptions/mine` — My prescriptions (doctor-written or student-received)
- `POST /prescriptions` — Create prescription (doctor-only)
- `POST /prescriptions/:id/share` — Generate shareable link
- `GET /prescriptions/share/:token` — View shared prescription (no auth required)

### Medicines (M3)
- `GET /medicines` — List all medicines with stock

### Students (M2)
- `GET /students` — List all students (doctor-only)

### Reimbursements (M5)
- `GET /reimbursements/mine` — My reimbursement claims
- `POST /reimbursements` — Submit claim
- `PATCH /reimbursements/:id` — Update claim status (doctor-only)

### Admin (M5+)
- `GET /admin/users` — List all users
- `POST /admin/users` — Create user
- `GET /admin/logs` — System logs

For full API specification, see [ARCHITECTURE.md](ARCHITECTURE.md).

---

## 🌱 Database Seeding

The project includes seed scripts to populate demo data:

```bash
cd server
node seed/seed.js
```

**Demo users created:**
- **Student**: `student@example.com` / `password123`
- **Doctor**: `doctor@example.com` / `password123`
- **Pharmacist**: `pharmacist@example.com` / `password123`
- **Admin**: `admin@example.com` / `password123`

---

## 📝 Development Guidelines

### Adding a New Feature

1. **Define the schema** in `server/models/`
2. **Create the controller** in `server/controllers/` with error handling
3. **Add routes** in `server/routes/` with role guards
4. **Mount route** in `server/server.js`
5. **Create API client** in `client/src/api/` (if needed)
6. **Build UI components** in `client/src/pages/` and `client/src/components/`
7. **Update documentation** (this README, ARCHITECTURE.md)

### Code Patterns

- **Error handling**: Controllers use `try-catch` with `next(err)` — don't respond inline
- **Role guards**: Use `protect` (auth check) + `allowRoles('role1', 'role2')` (role check)
- **API calls**: Use the axios instance from `client/src/api/index.js`
- **Styling**: Use CSS custom properties from `index.css` — no inline styles

---

## 📄 License

ISC
