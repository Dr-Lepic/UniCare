# Setup & Development Guide

Complete instructions for setting up UniCare locally, configuring the development environment, running the application, and troubleshooting common issues.

---

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js 16+** — [Download from nodejs.org](https://nodejs.org/)
- **npm** or **yarn** — Comes with Node.js
- **MongoDB** — Either:
  - Local MongoDB instance ([Download Community Edition](https://www.mongodb.com/try/download/community))
  - MongoDB Atlas account (free tier at [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas))
- **Git** — For cloning the repository
- **Code editor** — VS Code recommended

### Verify installations:
```bash
node --version        # Should be v16 or higher
npm --version         # Should be v7 or higher
mongo --version       # If using local MongoDB (or mongosh for newer versions)
```

---

## 🔧 Installation

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd UniCare
```

### Step 2: Install Dependencies

The project has two package.json files (server and client). You can install both at once using the root, or individually.

**Option A: Install both (from root)**
```bash
npm install
# This script should install both server/node_modules and client/node_modules
```

**Option B: Install individually**
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
cd ..
```

Verify installations:
```bash
ls server/node_modules    # Should contain many packages
ls client/node_modules    # Should contain many packages
```

---

## 🌍 Environment Configuration

### Create `.env` File

The server loads environment variables from a `.env` file at the **project root** (not inside `server/`).

```bash
# Create .env in the project root directory
cd UniCare  # Make sure you're in the root
echo "MONGO_URI=mongodb://localhost:27017/unicare" > .env
echo "JWT_SECRET=your-super-secret-key-change-this" >> .env
echo "PORT=5000" >> .env
```

Or manually create `UniCare/.env`:
```env
# MongoDB connection string
# Local: mongodb://localhost:27017/unicare
# Atlas: mongodb+srv://username:password@cluster.mongodb.net/unicare
MONGO_URI=mongodb://localhost:27017/unicare

# JWT secret (use a strong random string in production)
JWT_SECRET=your-super-secret-key-change-this-in-production

# Server port (optional, defaults to 5000)
PORT=5000
```

### ⚠️ Important Security Notes

- **Never commit `.env`** — It's in `.gitignore` for a reason
- **Use strong secrets** — For production, generate cryptographically secure keys:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- **Rotate secrets regularly** in production
- **Use environment-specific values** — Different for dev/staging/production

### MongoDB Connection Strings

**Local MongoDB:**
```
MONGO_URI=mongodb://localhost:27017/unicare
```

**MongoDB Atlas (Cloud):**
```
MONGO_URI=mongodb+srv://username:password@cluster-name.mongodb.net/unicare?retryWrites=true&w=majority
```

Replace `username`, `password`, and `cluster-name` with your Atlas credentials.

---

## 🚀 Running the Application

### Prerequisite: Start MongoDB

**If using local MongoDB:**
```bash
# Windows
mongod

# macOS (if installed via Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

**If using MongoDB Atlas:**
- No local setup needed; connection is via `MONGO_URI`

### Start the Server

```bash
cd server
npm run dev
```

**Expected output:**
```
🚀 Server on port 5000
```

If you see this, the server is running at `http://localhost:5000`.

**Available scripts:**
- `npm run dev` — Start with nodemon (auto-restarts on file changes)
- `npm start` — Start without nodemon
- `npm run seed` — Seed database with demo data (see below)

### Start the Client

**In a new terminal:**
```bash
cd client
npm run dev
```

**Expected output:**
```
  Local:        http://localhost:5173/
```

Open your browser and navigate to `http://localhost:5173/`. You should see the UniCare login page.

**Available scripts:**
- `npm run dev` — Start Vite dev server
- `npm run build` — Build for production
- `npm run lint` — Run ESLint
- `npm run preview` — Preview production build locally

---

## 🌱 Seeding the Database

To populate the database with demo data (users, medicines, sample appointments, etc.):

```bash
cd server
node seed/seed.js
```

**Note**: The `npm run seed` script is broken (points to `seedData.js` which doesn't exist). Always use `node seed/seed.js` directly.

### Demo Users Created

After seeding, you can log in with these credentials:

| Role | Email | Password |
|------|-------|----------|
| Student | `student@example.com` | `password123` |
| Doctor | `doctor@example.com` | `password123` |
| Pharmacist | `pharmacist@example.com` | `password123` |
| Admin | `admin@example.com` | `password123` |

### What Gets Seeded

- **4 users** (one per role)
- **Sample medicines** (with stock levels)
- **Doctor availability** (time slots for appointments)
- **Sample appointments** (for demo workflows)

---

## 🔍 Verifying Your Setup

### 1. Check Server Health

```bash
curl http://localhost:5000
# Expected: "UniCare API running ✅"
```

Or open `http://localhost:5000` in your browser.

### 2. Check Database Connection

The server will log successful connection:
```
Connected to MongoDB: mongodb://localhost:27017/unicare
```

If you see connection errors, check:
- MongoDB is running (`mongod` command)
- `MONGO_URI` is correct in `.env`
- Network connectivity (if using Atlas)

### 3. Test Authentication

```bash
# Register a new user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"testpass","role":"student"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass"}'

# Expected response includes a token
```

### 4. Check Frontend Connection

- Open `http://localhost:5173` in your browser
- You should see the login page
- The browser console should show no CORS errors

---

## 📁 Project Structure

```
UniCare/
├── .env                             # ← Create this file with your config
├── server/
│   ├── server.js                    # ← Main server entry point
│   ├── package.json
│   ├── routes/                      # API routes
│   ├── controllers/                 # Request handlers
│   ├── models/                      # Mongoose schemas
│   ├── middleware/                  # Auth, error handling
│   ├── config/db.js                 # Database connection
│   ├── seed/seed.js                 # ← Run this to seed data
│   └── utils/                       # Helpers
│
├── client/
│   ├── src/
│   │   ├── App.jsx                  # Main router
│   │   ├── main.jsx                 # Entry point
│   │   ├── index.css                # Design system
│   │   ├── pages/                   # Page components
│   │   ├── context/AuthContext.jsx  # Auth state
│   │   └── api/index.js             # Axios instance
│   ├── vite.config.js
│   └── package.json
│
└── Documentation/
    ├── README.md                    # Project overview
    ├── SETUP.md                     # ← You are here
    ├── ARCHITECTURE.md              # Architecture & APIs
    ├── STYLEGUIDE.md
    └── ...
```

---

## 🐛 Troubleshooting

### Issue: "Cannot find module 'mongoose'"

**Solution:**
```bash
cd server
npm install
```

### Issue: "MONGO_URI is not defined" or Connection Error

**Check:**
1. `.env` file exists in project root (not inside `server/`)
2. `MONGO_URI` is set correctly
3. MongoDB is running:
   ```bash
   # Test local MongoDB
   mongosh  # or 'mongo' in older versions
   ```
4. For Atlas, verify:
   - Connection string is correct
   - IP whitelist includes your machine
   - Credentials are accurate

**Fix:**
```bash
# View current working directory
pwd  # or 'cd' on Windows

# Make sure you're in project root
cd /path/to/UniCare

# Check .env exists
cat .env  # or 'type .env' on Windows

# Restart server
cd server && npm run dev
```

### Issue: "CORS error" in browser console

**Solution:**
1. Server is running on `http://localhost:5000`
2. Client is running on `http://localhost:5173` (or whatever Vite assigns)
3. CORS is enabled in `server/server.js`: `app.use(cors())`

If issue persists, restart both server and client.

### Issue: "Port 5000 already in use"

**Find and kill the process:**

**Windows (PowerShell):**
```powershell
netstat -ano | findstr :5000
taskkill /PID <PID> /F  # Replace <PID> with the process ID
```

**macOS/Linux:**
```bash
lsof -i :5000
kill -9 <PID>  # Replace <PID> with the process ID
```

Or use a different port:
```bash
PORT=5001 npm run dev  # Inside server/
```

### Issue: Vite dev server won't start

**Solution:**
```bash
cd client
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Issue: Database seeding fails

**Check:**
1. MongoDB is running
2. `.env` `MONGO_URI` is correct
3. Run from `server/` directory:
   ```bash
   cd server
   node seed/seed.js  # NOT npm run seed
   ```

---

## 🔗 Port Configuration

By default:
- **Server**: `http://localhost:5000`
- **Client**: `http://localhost:5173` (Vite's default)

### Change Server Port

Edit `.env`:
```env
PORT=5001
```

Then restart the server.

### Change Client Port

Edit `client/vite.config.js`:
```javascript
export default {
  server: {
    port: 3000,
    strictPort: false,  // Use next available port if 3000 is taken
  },
  // ...
}
```

---

## 📦 NPM Scripts

### Server Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `npm run dev` | `nodemon server.js` | Start with auto-restart on changes |
| `npm start` | `node server.js` | Start server (production-like) |
| `npm run seed` | `node seed/seedData.js` | ⚠️ **Broken** — use `node seed/seed.js` instead |

### Client Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `npm run dev` | `vite` | Start dev server |
| `npm run build` | `vite build` | Build for production |
| `npm run lint` | `eslint .` | Run ESLint |
| `npm run preview` | `vite preview` | Preview production build |

---

## 🛡️ Environment Variables Summary

| Variable | Required | Example | Notes |
|----------|----------|---------|-------|
| `MONGO_URI` | ✅ | `mongodb://localhost:27017/unicare` | Database connection |
| `JWT_SECRET` | ✅ | Random string | Signing and verifying JWTs |
| `PORT` | ❌ | `5000` | Server port (default: 5000) |

---

## 📝 Development Workflow

Typical development session:

```bash
# 1. Start MongoDB
mongod

# 2. Terminal 1: Start server
cd server && npm run dev
# Wait for "🚀 Server on port 5000"

# 3. Terminal 2: Start client
cd client && npm run dev
# Wait for "Local: http://localhost:5173/"

# 4. Open browser
# http://localhost:5173

# 5. Login with seeded credentials
# Email: student@example.com, Password: password123

# 6. Make code changes (both server and client auto-reload)

# 7. Test changes in browser
```

---

## 🧪 Testing API Endpoints

Use **curl**, **Postman**, or **VS Code REST Client** to test endpoints:

### Example: Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com",
    "password": "password123"
  }'

# Response:
# {
#   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "user": { "id": "...", "name": "...", "role": "student" }
# }
```

### Example: Get Current User (Authenticated)

```bash
# Replace TOKEN with the token from login
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### Example: List Medicines

```bash
curl -X GET http://localhost:5000/api/medicines \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🚢 Production Deployment

When ready to deploy:

1. **Build the client:**
   ```bash
   cd client
   npm run build
   # Output: client/dist/
   ```

2. **Set production environment variables:**
   ```env
   MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/unicare
   JWT_SECRET=<strong-random-key>
   NODE_ENV=production
   PORT=5000
   ```

3. **Deploy options:**
   - **Backend**: Railway, Render, Heroku, AWS (Node.js)
   - **Frontend**: Vercel, Netlify, AWS S3 + CloudFront
   - **Database**: MongoDB Atlas (recommended) or self-managed
   - **File uploads**: Cloudinary or AWS S3

4. **Update API URL** in `client/src/api/index.js`:
   ```javascript
   // Change from localhost:5000 to production URL
   baseURL: 'https://api.unicare.example.com/api'
   ```

---

## 📚 Next Steps

After successful setup:

1. **Review the Architecture**: Read [ARCHITECTURE.md](ARCHITECTURE.md) to understand data models and API structure
2. **Explore Features**: Check [WALKTHROUGH.md](WALKTHROUGH.md) for prescription and sharing flows
3. **Study the Roadmap**: See [UniCare_HighLevelDesign_Roadmap.md](UniCare_HighLevelDesign_Roadmap.md) for upcoming features
4. **Check the Styleguide**: Review [STYLEGUIDE.md](STYLEGUIDE.md) for design system tokens
5. **Login and explore**: Test the application with seeded demo users

---

## 💡 Tips & Best Practices

- **Auto-save your work**: Both `npm run dev` commands watch files and auto-reload
- **Check console errors**: Browser DevTools (F12) and terminal console for errors
- **Use meaningful commit messages**: Makes debugging easier later
- **Keep `.env` secure**: Never commit it; add to `.gitignore`
- **Regular backups**: MongoDB data isn't backed up automatically
- **Test with different roles**: Log out and switch between user roles to verify access control

---

## 🆘 Getting Help

1. **Check documentation**:
   - [README.md](README.md) — Project overview
   - [ARCHITECTURE.md](ARCHITECTURE.md) — API details
   - [CLAUDE.md](CLAUDE.md) — Development guidance

2. **Check logs**:
   - **Server**: Terminal running `npm run dev`
   - **Client**: Browser console (F12)
   - **Database**: MongoDB logs (if local)

3. **Common issues**: See [Troubleshooting](#-troubleshooting) section above

---

**Last updated**: August 2026
