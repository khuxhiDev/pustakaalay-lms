# Requirements-based test checklist

**Status:** This is a manual checklist aligned to FR-01 through FR-20 in the supplied project brief. Mark each case **PASS / FAIL** after running locally. Do not treat it as proof that those tests have already been executed.

| ID | Scenario | Expected result | Result |
|---|---|---|---|
| FR-01 | Member registers with name, email, password, member ID | New member stored | Not run |
| FR-02 | Login with valid and invalid credentials | Valid JWT / error | Not run |
| FR-03 | Member POSTs to `/api/books` | HTTP 403 | Not run |
| FR-04 | Librarian adds, edits, deletes a never-issued title | Changes persist | Not run |
| FR-05 | Add duplicate ISBN | HTTP 409 | Not run |
| FR-06 | Search by title, author, ISBN and category | Filtered matching results | Not run |
| FR-07 | Issue available book | Loan created, due date set | Not run |
| FR-08 | Issue after borrow limit/unpaid fine ceiling | Blocked with message | Not run |
| FR-09 | Issue then return | Copies decrease then increase | Not run |
| FR-10 | Return overdue loan | Fine calculated and stored | Not run |
| FR-11 | Renew eligible loan once and attempt twice | First succeeds, second blocked | Not run |
| FR-12 | Reserve title with zero available copies | Pending reservation created | Not run |
| FR-13 | Return title with pending reservation | Next member notified, status available | Not run |
| FR-14 | Execute daily reminders with SMTP configured | Due/overdue email sent | Not run |
| FR-15 | Pay an unpaid returned fine | finePaid becomes true | Not run |
| FR-16 | Admin changes rules | Subsequent loans use new rules | Not run |
| FR-17 | Admin creates/deactivates/deletes librarian | Permissions enforced | Not run |
| FR-18 | Staff views dashboard | Accurate counts and recent activity | Not run |
| FR-19 | Export report as CSV/PDF | Download opens and contains data | Not run |
| FR-20 | Member visits own dashboard | Own loans, history, reservations, fines shown | Not run |

### Negative test ideas

- Login fails for wrong password or disabled account.
- Issue fails for unavailable book, active duplicate loan, member above limit or held reservation for someone else.
- Return a loan twice: second attempt is blocked.
- Renew after one renewal or after due date: blocked.
- Delete a book with history: blocked to preserve audit trail.
- Request a protected endpoint without Bearer token: HTTP 401.
- Member tries another member's renewal: HTTP 403.
