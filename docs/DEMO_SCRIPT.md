# Presentation demo script (approximately 10 minutes)

## Preparation

- Start MongoDB (Windows service / Docker).
- Backend: `cd backend`, then `npm run seed` if needed, then `npm run dev`.
- Frontend: `cd frontend`, then `npm run dev`.
- Check `http://localhost:5000/api/health` and `http://localhost:5173`.
- Keep Chrome and MongoDB Compass open. Use the private credentials record supplied separately from the source ZIP.
- Close sensitive tabs and notifications. Ensure a stable local setup; no external login/email is needed.

## Presentation sequence

**00:00–01:00 — Introduce problem.** Manual registers make searches, loans, returns and fines unreliable. The project automates a single library using MERN.

**01:00–02:00 — Explain architecture.** React frontend → Axios → Express REST API → role checks → Mongoose → MongoDB. Highlight Admin, Librarian, Member roles.

**02:00–03:00 — Guest catalogue.** Show search, category filter, availability, and book details without a login.

**03:00–04:00 — Member.** Log in as the demo Member. Show active books, due dates, one renewal, historical loans and reservations.

**04:00–06:30 — Librarian.** Log in as the demo Librarian. Add a demo book, register a member if desired, issue a copy, show stock decreasing, then record a return and stock increasing. The backend checks limits and reservations.

**06:30–07:30 — Admin.** Log in as the demo Admin. Update fine rate, borrow limit and inspect librarian management.

**07:30–08:30 — Reports.** Show dashboard, overdue list, popular book report. Export CSV/PDF.

**08:30–09:30 — Database + security.** Open Compass `pustakaalay_lms`. Show `books`, `transactions`, `users`. Explain bcrypt-hashed passwords and JWT role validation.

**09:30–10:00 — Wrap-up.** Mention responsive UI, reusable components, tests, and future scope (barcodes, online payments, production-grade Mongo transactions).

## Reliable fallback

If an API request fails during presentation, check the two terminals and MongoDB service. The entire demo is designed to run on localhost, without internet once dependencies are installed. SMTP email is optional and should not be relied upon during the demo.
