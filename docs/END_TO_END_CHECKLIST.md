# NexaChain AI End-to-End Checklist

This checklist covers the supported user flow across the React client, Express API, and MongoDB. Do not use production accounts or a production database for test runs.

## Environment and startup

- [ ] Configure `server/.env` with a MongoDB replica-set or sharded-cluster `MONGODB_URI`; financial writes require transaction support.
- [ ] Configure `JWT_SECRET` with at least 32 non-placeholder characters.
- [ ] Configure `CLIENT_ORIGIN`, `CRON_TIMEZONE`, investment plan terms, and referral commission levels. The assessment does not define investment terms or commission rates; `.env.example` values are development examples only.
- [ ] Configure `client/.env` with `VITE_API_URL` pointing to the backend API base URL (for example `http://localhost:5000/api`).
- [ ] Start the backend from `server/` with `npm run dev`, then start the client from `client/` with `npm run dev`.
- [ ] Confirm `GET /api/health` reports a connected database.
- [ ] Create or configure an admin account through the supported deployment/admin provisioning procedure; registration does not grant admin privileges.

## User and referral workflow

- [x] Register User A without a referral code; verify a referral code is returned and the password is not present in the response.
- [x] Register User B using User A's referral code and User C using User B's code; verify each account's `referredBy` relationship.
- [x] Log in and verify the bearer-token profile endpoint and protected-route behavior.
- [x] View User A's direct referrals and nested referral tree; verify the A → B → C structure.
- [x] View referral income after an eligible investment; verify configured level terms, history, and wallet ledger entries.

## Investment, ROI, and wallet workflow

- [x] Create an investment using an approved backend plan with a zero-balance account; verify it is persisted with backend-owned amount, dates, and ROI terms without changing the wallet. The assessment does not define deposits or payment processing.
- [x] Run `POST /api/admin/roi/run` as an admin (or use **Run ROI now** on the admin dashboard); verify the processed count and wallet credit.
- [x] Verify an ROI history record and a matching wallet transaction are persisted for the eligible UTC date.
- [x] Run the scheduler again for the same date; verify no second ROI credit, history entry, or ledger credit is created.
- [x] Refresh the authenticated dashboard and wallet; verify totals match persisted MongoDB values.
- [ ] Confirm an unauthorized user receives a forbidden response from the manual ROI endpoint and cannot see admin controls.
- [ ] Verify investment status, ROI history, referral income, and wallet transaction pagination and filters against multiple records.

## Frontend behavior

- [ ] Exercise registration and login validation, loading states, password visibility, and API error states.
- [ ] Confirm each protected page redirects unauthenticated users and logout clears the client session.
- [ ] Confirm investment forms submit to the API and refresh displayed data after success.
- [ ] Confirm dashboard cards and charts use API responses rather than hardcoded financial values.
- [ ] Confirm referral dashboard, referral tree, investment history, ROI history, and transaction history show real records and useful empty/error states.
- [ ] Confirm admin users/investments tables, filters, pagination, service health, and manual ROI action work for an admin.
- [ ] Test responsive layouts and check the browser console and network panel for errors.

## Automated verification

From `server/`, run `npm test`. The integration suite uses an isolated disposable database and requires MongoDB transaction support.

From `client/`, run `npm run build`.

Before sharing results, record the test commands and outcomes, verify that the test database was dropped, and remove temporary test accounts/data only from the explicitly named disposable database. Do not drop or modify a shared or production database.

## Known product boundaries

- Wallet deposits, withdrawals, and payment-provider processing are not implemented.
- Profile is read-only; users cannot edit account fields through the current API.
- Email notifications and two-factor authentication are explicitly unavailable.
- Logout removes the local bearer token; server-side JWT revocation is not implemented.
- Investment plan terms and referral commission percentages are configuration, not assessment-defined financial promises.
