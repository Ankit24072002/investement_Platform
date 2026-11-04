# NexaChain AI Investment Platform

A MERN investment and referral platform built for the NexaChain AI technical assessment. It includes a React investor dashboard, JWT-protected Express APIs, MongoDB/Mongoose models, transactional ROI and referral processing, and a midnight scheduler.

**GitHub repository:** [Ankit24072002/investement_Platform](https://github.com/Ankit24072002/investement_Platform)

> **Financial terms are configuration, not promises.** The assessment does not define investment returns or referral commission rates. The development example is for local testing only. Configure only terms approved by the business before production use.

## Assessment submission deliverables

| Required submission | Project location |
| --- | --- |
| GitHub repository link | [Ankit24072002/investement_Platform](https://github.com/Ankit24072002/investement_Platform) |
| Database schemas | `server/src/models/` — `User.js`, `Investment.js`, `ReferralIncome.js`, `ROIHistory.js`, and `WalletTransaction.js` |
| API source code | `server/src/routes/` and `server/src/controllers/`; request validation and auth middleware are in `server/src/middleware/` |
| API documentation | `server/API_DOCUMENTATION.md`; Postman collection: `server/postman_collection.json` |
| Business logic | `server/src/services/businessLogic.js` — transactional ROI credits, wallet ledger entries, referral payouts, and nested referral tree |
| React dashboard | `client/src/pages/DashboardPage.jsx`, with reusable components in `client/src/components/dashboard/` |
| Cron scheduler | `server/src/config/cron.js`; scheduler locking and idempotent ROI processing are in `server/src/services/businessLogic.js` |
| README and development assumptions | This file, especially [Business configuration](#business-configuration), [Core workflows](#core-workflows), and [Security and operational notes](#security-and-operational-notes) |

### Evaluation areas addressed

- **Database design:** Mongoose models define the required fields, references, validation, and indexes.
- **API architecture and security:** Express route/controller structure, JWT-protected account-scoped APIs, input validation, and role-protected admin operations.
- **Business logic accuracy:** UTC-day ROI calculations, configurable referral payout rules, MongoDB transactions, ledger records, and idempotency safeguards.
- **Frontend UI/UX:** Responsive dashboard, investment and earnings charts, referral tree, history tables, and loading/error/empty states.
- **Performance and scalability:** Query indexes, pagination, bounded ROI cursor processing, and a MongoDB-backed scheduler lease.
- **Documentation:** Setup, environment settings, API reference, development assumptions, and an end-to-end checklist.

## Features

- User registration with bcrypt password hashing, generated referral codes, and optional parent referral.
- JWT login and protected, account-scoped APIs.
- Server-configured investment plans with persisted owner, amount, plan details, start/end dates, daily ROI percentage, and status.
- Daily ROI processing with per-investment/per-UTC-day idempotency.
- MongoDB transactions that keep ROI history, wallet balance, investment totals, and wallet ledger entries consistent.
- Configurable, multi-level referral payouts and a nested referral tree.
- Dashboard cards, earnings charts, investment/ROI/referral history, wallet records, and loading/error/empty states.
- Admin tools, including guarded manual ROI processing.
- Node-cron scheduler configured to run at midnight in the selected timezone.

## Repository layout

| Path | Purpose |
| --- | --- |
| `server/` | Canonical Express, Mongoose, scheduler, and API implementation |
| `client/` | Canonical React/Vite dashboard |
| `docs/END_TO_END_CHECKLIST.md` | Workflow and deployment checklist |
| `server/API_DOCUMENTATION.md` | REST API reference and sample responses |
| `server/postman_collection.json` | Importable Postman collection |
| `backend/`, `frontend/` | Compatibility launchers that delegate to `server/` and `client/` |

## Requirements

- Node.js compatible with the installed Vite version (Node.js 20.19+ or 22.12+ recommended).
- npm.
- MongoDB running as a **replica set or sharded cluster**. Financial updates use MongoDB transactions; a standalone MongoDB server is not sufficient.
- A MongoDB user with the required database read/write permissions.

## Local setup

Open two PowerShell terminals from the repository root.

### 1. Configure the backend

```powershell
Copy-Item server\.env.example server\.env
```

Edit `server\.env` and set at least:

- `MONGODB_URI` — replica-set/sharded MongoDB connection string.
- `JWT_SECRET` — a private random secret of at least 32 characters.
- `CLIENT_URL` — the exact frontend origin, normally `http://localhost:5173`.
- `CRON_TIMEZONE` — scheduler timezone, such as `UTC` or `Asia/Kolkata`.
- `ADMIN_EMAIL` and `ADMIN_PASSWORD` — optional values for initial admin provisioning.

Install dependencies and start the API:

```powershell
Set-Location .\server
npm install
npm run dev
```

The API listens on `http://localhost:5000` by default. Check `http://localhost:5000/api/health`; a healthy response includes `"databaseConnected": true`.

### 2. Configure and start the frontend

In the second terminal:

```powershell
Copy-Item client\.env.example client\.env
Set-Location .\client
npm install
npm run dev
```

The dashboard is available at `http://localhost:5173`. `VITE_API_URL` defaults to `http://localhost:5000/api`; Vite proxies `/api` to the local backend during development.

## Business configuration

### Investment plans

`INVESTMENT_PLANS` is a JSON array with `id`, `name`, `description`, `minAmount`, `maxAmount`, `durationDays`, and `dailyROIPercentage`. The client submits only the plan ID and amount; the server controls dates and plan terms.

In development, an empty plan setting enables the illustrative example: ₹10,000, 1% daily ROI, 30 days. It is not a company-approved plan or a promise of returns. Production requires explicit approved plan configuration.

Example format only—replace with reviewed terms:

```json
[
  {
    "id": "approved-plan-id",
    "name": "Approved plan name",
    "description": "Business-approved plan description",
    "minAmount": 1000,
    "maxAmount": 5000,
    "durationDays": 30,
    "dailyROIPercentage": 0.1
  }
]
```

### Referral commissions

Referral payouts are controlled by:

- `REFERRAL_MAX_LEVELS`
- `REFERRAL_LEVELS`, a JSON array of `{ "level": number, "percentage": number }`
- `MIN_ELIGIBLE_INVESTMENT_AMOUNT`

The values in `.env.example` are development examples, not company policy. Production requires explicit, business-approved configuration. Do not use the sample percentages as promised returns or commissions.

## Core workflows

1. Register and log in; registration returns an authentication token and referral code.
2. Create an investment from an available server-configured plan.
3. The scheduler processes investments eligible for the current UTC date at midnight in `CRON_TIMEZONE` (or `TZ`, then UTC).
4. ROI history, wallet balance, investment totals, and wallet ledger records are committed in one database transaction.
5. A repeated run for the same investment and UTC date does not credit ROI again.
6. Eligible configured referral ancestors receive transactional, recorded referral income.
7. Dashboard endpoints return persisted account totals and history; the client renders those values and the referral tree.

Manual ROI execution is restricted to administrators: `POST /api/admin/roi/run`. Never trigger financial processing against production data as a test.

## API reference

- Base URL: `http://localhost:5000/api`
- Interactive requests: import `server/postman_collection.json` into Postman.
- Full endpoint details, auth requirements, validation, and response examples: [server/API_DOCUMENTATION.md](./server/API_DOCUMENTATION.md)

The main route groups are `/auth`, `/investments`, `/dashboard`, `/referrals`, `/roi`, `/wallet`, and `/admin`. Private routes require `Authorization: Bearer <JWT>`.

## Tests and build

Backend integration tests use a uniquely named disposable database (`investment-platform-test-<process-id>`) and drop that database after the run. They require MongoDB transaction support and a database account with permission to create/drop the disposable test database. Set `TEST_MONGODB_URI` to a dedicated test cluster when possible.

```powershell
Set-Location .\server
npm test
```

Build and type-check the frontend:

```powershell
Set-Location .\client
npm run build
```

The backend integration suite covers authentication, investment creation, ROI credits, duplicate prevention, transaction rollback, referrals, and dashboard persistence. The end-to-end checklist is in [docs/END_TO_END_CHECKLIST.md](./docs/END_TO_END_CHECKLIST.md).

## Security and operational notes

- Never commit `.env` files, JWT secrets, database credentials, or real user data. Use the committed `.env.example` files as templates.
- Use a unique, strong `JWT_SECRET`; the API rejects missing or placeholder secrets.
- Configure MongoDB Atlas network access for the server’s actual IP instead of allowing all addresses.
- The client stores its JWT in `localStorage`; logout clears the local token. Server-side JWT revocation is not implemented.
- Wallet deposits, withdrawals, and payment-provider processing are not implemented because they are not specified by the assessment.
- Email delivery, two-factor authentication, and editable profile APIs are not implemented.
- ROI eligibility and idempotency use UTC day boundaries. Choose `CRON_TIMEZONE` with that boundary behavior in mind.

## Deployment checklist

Before deploying, review [docs/END_TO_END_CHECKLIST.md](./docs/END_TO_END_CHECKLIST.md) and confirm:

- Production-approved investment and referral terms are configured.
- The deployment MongoDB supports transactions.
- `JWT_SECRET`, `MONGODB_URI`, `CLIENT_URL`, admin provisioning, and scheduler timezone are configured securely.
- Health checks, protected user workflows, admin permissions, and the dashboard are verified in the target environment.
