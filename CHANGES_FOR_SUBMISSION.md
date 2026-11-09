# Pustakaalay – submission cleanup

- Public login page no longer shows sample usernames/passwords or shortcut login buttons.
- Removed the homepage quote, promotional bottom banner, and decorative fake user initials.
- Replaced promotional hero wording with functional library information.
- Both public and authenticated footers display **Developed by Khushi** only.
- Removed the sidebar motivational panel and login-side footer slogan.
- Credentials are provided in a **separate private file outside this ZIP**; they are not included here.
- `backend/src/seed.js` and `backend/scripts/smoke.js` read `DEMO_PASSWORD` from `backend/.env` instead of containing a known password.
- `backend/.env.example` describes the private `DEMO_PASSWORD` variable; `.gitignore` excludes `.env` and common private credential filenames.
- Admin, Librarian, Member roles, seed account email addresses, API endpoints, and functional screens remain present.

## After extracting

1. See `START_HERE_WINDOWS.txt` and `README.md`.
2. Add `DEMO_PASSWORD` to `backend/.env` from the separately provided private credentials record. Do not publish either file.
3. Start MongoDB and install dependencies as usual.
4. Execute `npm run seed` in `backend` only after checking the database you intend to modify. This will set the demo users' passwords to `DEMO_PASSWORD`.
5. Run `npm test` and `node scripts/smoke.js` from backend while the API and MongoDB are running; check workflows in the browser.

## Verification completed for this ZIP

- Backend JavaScript syntax checks passed.
- All 21 JSX files parsed successfully with TypeScript JSX parser.
- All 6 included backend unit tests passed.
- Running React build, connected database integration, and actual browser deployment **not yet verified** here because project dependencies and MongoDB are not installed in this workspace.

**Before deploying online:** Change the known original sample password. A previous ZIP had published it. Configure the new secret privately, and avoid publishing working demo login details in the public repository.
