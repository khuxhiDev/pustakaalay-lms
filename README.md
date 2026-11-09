# Pustakaalay — Library Management System (MERN)

**An individual full-stack student project.** Built using **MongoDB + Mongoose, Express.js, React (Vite), Node.js**. Includes demo data and three user roles.

> IMPORTANT: This is source code, not a pre-compiled Windows `.exe`. You must install Node.js, MongoDB, and npm dependencies locally. The environment used to package this ZIP could not download npm dependencies or connect to a MongoDB server, so a fully running integration build has **not** been verified here. Backend unit tests and JS/JSX syntax checks passed. Run the included smoke tests after local installation.

## 1. What is included?

| Module | Features |
|---|---|
| Guest | Landing page, browse books, search/filter by category and availability, book details |
| Member | Register/login, personal dashboard, current loans, due dates, history, reservations, renew once, fine information, notifications, profile |
| Librarian | Manage catalogue, add categories, add members, issue/return/renew, fines, reservation queues, dashboard, downloadable reports |
| Admin | All staff functionality plus librarian management, account status control and borrowing policy settings |
| Backend | REST APIs, Mongoose collections, role-based JWT middleware, bcrypt passwords, server validation, overdue detection, in-app notifications |
| Reporting | Overdue books, popular books, monthly issues, members; download CSV or PDF |
| Optional email | SMTP reminders via Nodemailer; daily scheduler with node-cron. In-app notifications work without email credentials. |

> No real payment processing, barcode scanning, multi-branch support, and e-book uploads (these are extensions in the project brief).

## 2. Software required on your Windows laptop

1. **Node.js LTS (20 or 22)** including npm. Check in CMD/PowerShell: `node -v` and `npm -v`.
2. **MongoDB Community Server** running locally at `mongodb://127.0.0.1:27017`, or a MongoDB Atlas database. You may use **MongoDB Compass** to inspect the database.
3. **Visual Studio Code**. A browser such as Chrome or Edge.
4. Internet access once for `npm install`.

**Important for PHP/XAMPP users:** XAMPP contains Apache, PHP, and usually MariaDB/MySQL. This MERN project uses **MongoDB**, not the MySQL database in XAMPP. You do not need to start XAMPP.

Alternative: if Docker Desktop is already installed, you can run the local MongoDB using `docker compose up -d` at the project root.

## 3. Quick start on Windows

Extract the ZIP to a path such as `C:\Projects\Pustakaalay_LMS_MERN`, open the extracted folder in VS Code, then open **Terminal → New Terminal**.

**Backend terminal (PowerShell):**

```powershell
cd backend
Copy-Item .env.example .env
npm install
```

Open `backend/.env` and replace `JWT_SECRET` with a long random value. To generate one, run this command and copy the output:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Confirm MongoDB is running, then:

```powershell
npm run seed
npm run dev
```

The Express API is at **http://localhost:5000**. Open `http://localhost:5000/api/health` to check it.

**Frontend terminal (a SECOND VS Code terminal):**

```powershell
cd frontend
Copy-Item .env.example .env
npm install
npm run dev
```

If the terminal starts at the project root, `cd frontend` is correct. If it is still inside `backend`, use `cd ..\frontend` first.

Open **http://localhost:5173** in Chrome.

**On Windows Command Prompt instead of PowerShell**, use `copy .env.example .env` rather than `Copy-Item .env.example .env`.

### Private demo accounts

The sample Admin, Librarian and Member accounts are available for local demonstration. Their login details are kept in a **separate private credentials file** supplied outside the project ZIP; do not commit that file to GitHub.

In `backend/.env`, set `DEMO_PASSWORD` to the private password from that file **before running `npm run seed`** or the API smoke tests. Seeded email addresses and roles remain unchanged. Rerunning the seed command updates the sample users' passwords to match the value set in `DEMO_PASSWORD`.

**Security:** The original demo password was included in an earlier version of the source and is publicly guessable. Use a fresh strong password before live deployment, update the private record, and rerun the seed script in your test database. Do not seed sample accounts in a production database unless deliberately required for an isolated evaluation.

### Testing API responses

With the backend running, from a new terminal:

```powershell
cd backend
npm test
node scripts/smoke.js
```

`npm test` checks pure business utilities. `node scripts/smoke.js` performs 10 non-destructive requests against the running, seeded API.

## 4. Top-level project structure

```text
Pustakaalay_LMS_MERN/
├── backend/
│   ├── src/
│   │   ├── config/db.js            # MongoDB connection
│   │   ├── models/index.js         # Mongoose collections
│   │   ├── middleware/auth.js       # JWT and role checks
│   │   ├── routes/index.js          # REST API controllers and routes
│   │   ├── utils/                  # Dates, fine calculation, notifications
│   │   ├── jobs/reminders.js        # Daily overdue and collection checks
│   │   ├── seed.js                 # Demo books, members and sample loans
│   │   └── server.js               # API app entrypoint
│   ├── scripts/smoke.js            # Non-destructive API checks
│   └── test/helpers.test.js        # Unit tests
├── frontend/
│   ├── src/
│   │   ├── components/             # Layout, forms, cards, modal, etc.
│   │   ├── context/                # Authentication and toast state
│   │   ├── lib/api.js              # Axios client and JWT header
│   │   ├── pages/                  # React screens (public and protected)
│   │   ├── App.jsx                 # Route definitions
│   │   ├── main.jsx                # React entrypoint
│   │   └── styles.css              # Responsive UI styles
│   └── index.html
├── docs/                          # Architecture, test cases, demo and viva
└── README.md
```

## 5. MongoDB collections

- `users`: account, bcrypt password hash, role, membership ID, active status
- `books`: catalogue, ISBN, total/available copies, category reference
- `categories`: named book groupings
- `transactions`: issue, return, renewal, fine records (Mongoose model `Loan`)
- `reservations`: queue, collection expiry and status
- `settings`: single library rules document
- `notifications`: member/system alerts

## 6. Essential demo walkthrough

1. Start backend, seed data, start frontend.
2. As **Guest**, open Catalogue and search for "Atomic Habits".
3. Sign in as **Member**, inspect loans, overdue status and reservation history.
4. Sign in as **Librarian**, add a new book, issue a copy, return it, view the changed stock.
5. As **Admin**, change the fine rate and borrowing limit, manage librarian access.
6. Open Reports, export a CSV and a PDF.
7. Open MongoDB Compass to show the `books` and `transactions` collections.

Full walkthrough: [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md).

## 7. Common setup issues

| Error | Solution |
|---|---|
| `'node' is not recognized` | Install/reinstall Node.js LTS and reopen terminal |
| `MongoServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017` | Start MongoDB service / Docker container or configure Atlas URI |
| `JWT_SECRET is missing` | Create `backend/.env` and paste a 32+ character secret |
| `Cannot find module 'express'` | Run `npm install` inside **backend** |
| `vite is not recognized` | Run `npm install` inside **frontend** |
| CORS error | Check frontend URL in `backend/.env` `CLIENT_URL=http://localhost:5173` |
| `401` from protected routes | Log in again; JWT expires after one day |
| Login fails | Check `DEMO_PASSWORD` in private `backend/.env`, run `npm run seed` if needed, and consult your private credentials record |
| Report has no data | Issue/return some books using librarian role |
| Email not arriving | SMTP settings are optional; configure real credentials in `.env` |

## 8. Important engineering notes

This is an education/demo project, not a fully hardened production library service. It performs an **atomic conditional stock decrement** on issue and protects individual return state transitions, but **multi-document transactions with replica-set sessions** should be added for stronger consistency under failures/concurrent operations. In particular, simultaneous changes to member borrow counts and reservation holds need additional constraints. JWTs are kept in browser localStorage for ease of studying; for a production deployment, prefer secure httpOnly cookies, a CSP, CSRF protections and a threat-model review. Change the original demo password before any deployment and keep the private credentials record outside the repository. There is no payment gateway; the staff only records payments manually. Email reminders only work after SMTP configuration. Daily reminders run at server-local 09:00 if the backend process remains running.

## 9. Suggested learning order

Start with [`docs/LEARNING_GUIDE.md`](docs/LEARNING_GUIDE.md), then use [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), [`docs/TEST_CASES.md`](docs/TEST_CASES.md), and [`docs/VIVA_QUESTIONS.md`](docs/VIVA_QUESTIONS.md). All examples use this exact project instead of unrelated exercises.
