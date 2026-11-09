# Learn this project module by module

Your baseline: HTML, CSS, PHP, basic JavaScript and SQL. Learn the project in the order below; **do not** memorize full source files.

## Module 1 — JavaScript foundation (2–3 focused sessions)

Open `backend/src/utils/helpers.js`. Learn `const`, `let`, functions, named exports, objects, arrays, `Date`, comparisons and `Math.ceil`.

- Explain `fineFor(dueDate, returnedAt, rate)` in your own words.
- Experiment with a book object in Chrome Console: `{ title: 'Balbharti', availableCopies: 2 }`.
- Challenge: write a function that checks whether `availableCopies > 0` and returns a message.

## Module 2 — React UI and component model

Open `frontend/src/main.jsx`, `App.jsx`, `components/UI.jsx`, `pages/Catalog.jsx`.

- JSX = JavaScript syntax for describing UI. A **component** is a reusable function that returns JSX.
- `useState` stores local interactive data; `useEffect` performs external side effects (API loads).
- `.map` renders each book; `props` pass a book to `<BookCover book={book} />`.
- React Router changes the screen without a full page reload.
- Challenge: add a new label to each book card.

## Module 3 — HTTP, Node and Express

Open `backend/src/server.js`, `routes/index.js` and `frontend/src/lib/api.js`.

- Node runs JS outside the browser. Express receives HTTP routes. Axios requests API data.
- `GET` retrieves, `POST` creates, `PUT` updates and `DELETE` removes data.
- `req.body` contains submitted JSON; `res.json()` returns JSON.
- Status 200 = OK, 201 = created, 400 = invalid, 401 = no valid login, 403 = forbidden, 409 = conflict, 500 = server error.
- Challenge: explain the journey from clicking “Issue a book” to a new MongoDB transaction.

## Module 4 — MongoDB and Mongoose

Open `backend/src/models/index.js`, `src/config/db.js`, `src/seed.js`.

- Collection ↔ SQL table; document ↔ row; ObjectId ↔ primary key / foreign key reference.
- Schemas define fields and validation. `.find()`, `.create()`, `.findOneAndUpdate()` perform CRUD.
- `populate()` follows referenced documents to show author/member/book names.
- Challenge: find a book by ISBN inside MongoDB Compass.

## Module 5 — Auth, roles and security

Open `backend/src/middleware/auth.js`, login routes in `routes/index.js`, `frontend/src/context/AuthContext.jsx`.

- Passwords are hashed with bcrypt; JWT is a signed token; Express checks the JWT on protected requests.
- Authentication answers “Who are you?” Authorization answers “What may you do?”
- The UI hides restricted pages, but **the backend also enforces roles** (critical).
- Challenge: try creating a book using a member JWT; expect HTTP 403.

## Module 6 — Business rules

Review `POST /transactions/issue`, `PUT /transactions/:id/return`, reservations and fine logic.

- Borrowing limit; available copies; overdue fine; queue order; once-only renewal.
- Challenge: explain how a return triggers the reservation queue.
- Caveat: atomic stock updates help, but a production app needs database transactions for fully consistent multi-document writes.

## Module 7 — Testing, reporting, deployment

Open `backend/test/helpers.test.js`, `backend/scripts/smoke.js`, and `pages/Reports.jsx`.

- Test expected behavior and edge cases. Export CSV and PDF. Keep secrets in `.env` and out of Git.
- Practice explaining a test case: 0 copies must block issue; returned loans must not be returned again.
- Challenge: add one pure function test, run `npm test`.

## A confident explanation template

For each module, answer these five questions without looking at the screen:
1. What does this feature do for the user?
2. Which React page handles it?
3. Which API endpoint is called?
4. Which MongoDB collection changes?
5. What validation and error cases must be handled?
