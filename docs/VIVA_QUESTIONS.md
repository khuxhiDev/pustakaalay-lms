# Viva questions with short, authentic answers

**1. What is MERN?** MongoDB (database), Express (Node HTTP framework), React (frontend), Node.js (JavaScript runtime).

**2. Why React?** Reusable UI components, state-driven rendering, client-side navigation and a responsive single-page interface.

**3. Why Node and Express?** Node runs JavaScript server-side; Express simplifies REST routes, middleware and HTTP error handling.

**4. Why MongoDB?** Flexible document storage for library records and straightforward integration with JavaScript/Mongoose. SQL would also work, but the assigned architecture is MERN.

**5. What is an API?** An interface through which the frontend requests operations/data from the backend using HTTP.

**6. Difference between GET, POST, PUT, DELETE?** Read, create, update and delete respectively.

**7. Authentication versus authorization?** Authentication confirms identity. Authorization decides permissions after identification.

**8. How does login work?** Express finds the user, bcrypt compares password with its hash, then sends a signed JWT. Protected routes verify token and role.

**9. Why hash passwords?** To avoid storing plaintext passwords. bcrypt includes salting and makes brute-force attacks more expensive.

**10. What is middleware?** A function that runs in the Express request-processing chain, e.g. verifying a JWT before a controller runs.

**11. What is Mongoose?** A Node library that offers models, schema validation and queries for MongoDB documents.

**12. Explain MongoDB collections and documents.** Collections group documents. Documents hold key-value fields. Relationships can use ObjectId references.

**13. How are available copies tracked?** On issue, a conditional atomic update decrements an available copy. On return, stock is incremented and the loan is marked returned.

**14. Can two librarians borrow the last copy at once?** The conditional atomic decrement helps ensure only one request can decrement the last copy. For complete multi-document consistency and duplicate-member checks, production needs transactions and additional constraints.

**15. How is a fine calculated?** `max(0, ceil((returnTime − dueTime) / 86400000)) * finePerDay`. The librarian marks any resulting payment as paid.

**16. What happens if a book is unavailable?** A member can enter a first-in-first-out reservation queue. When a copy returns, the next member is notified and gets a two-day pickup window.

**17. How does renewal work?** One renewal per loan, only if the loan is active, not overdue and there are no pending reservations.

**18. How do you generate reports?** The API queries/aggregates transactions and related books/users, then returns JSON or exports CSV/PDF.

**19. Difference between props and state?** Props are inputs passed from a parent component; state is data managed by the component that triggers rerender when changed.

**20. What is `useEffect`?** A React hook used here to load data when pages mount or filters change.

**21. What is `async/await`?** Syntax to work with promise-returning asynchronous operations without deeply nested callbacks.

**22. How did you test it?** Unit tests for fine/date helpers, non-destructive API smoke tests, plus manual role-by-role flows after local installation. Do not claim tests you have not actually run.

**23. What are the limitations?** Requires database and server uptime; SMTP not enabled by default; no online payments; multi-document consistency and token storage should be hardened for production.

**24. What is your individual contribution?** Explain the modules you personally tested, modified and understood. Practice demonstrating changes in React, APIs, and MongoDB rather than memorizing a script.

**25. What would you improve next?** Database transactions, automated API integration tests, secure cookie-based auth, more complete email scheduling, barcode support and deployment monitoring.
