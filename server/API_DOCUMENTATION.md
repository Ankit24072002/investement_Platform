# Investment Platform REST API

Base URL: `http://localhost:5000/api`

Private endpoints require `Authorization: Bearer <JWT>`. Obtain the token from registration or login and do not commit it. The importable Postman collection is `server/postman_collection.json`.

All responses use JSON. Successful endpoints return `{ "success": true, "message": "...", "data": { ... } }`. Common errors:

```json
{
  "success": false,
  "message": "Request validation failed.",
  "errors": [{ "field": "email", "message": "A valid email address is required." }]
}
```

Missing/invalid authentication returns `401`; invalid input returns `400`; duplicate email/mobile returns `409`; and MongoDB without transaction support returns `503` for financial writes.

The API rejects MongoDB operator and dotted-path keys in request bodies, query parameters, and route parameters. Configure `CLIENT_URL` to the exact trusted frontend origin when deploying; local development defaults to `http://localhost:5173`.

Authentication uses a seven-day JWT returned in the JSON response and stored by the browser client in `localStorage`. This is a bearer-token design (not an HttpOnly-cookie design); clear the client token on logout. Passwords are bcrypt-hashed before persistence, and account endpoints return an allow-listed user shape without password fields. Suspended and inactive accounts cannot log in or use private endpoints.

Financial amounts use JavaScript `Number` values rounded consistently to two decimal places by the shared `roundMoney` helper. Investment inputs with more than two decimal places are rejected; wallet and history updates run in MongoDB transactions.

## Authentication

### Register

`POST /auth/register` (public)

```json
{
  "fullName": "Jane Doe",
  "email": "jane@example.com",
  "mobileNumber": "9876543210",
  "password": "a-strong-password",
  "referralCode": ""
}
```

Password must be 8–128 characters. Mobile number is required and unique. Supply an existing referral code or leave it empty.

Example `201`:

```json
{
  "success": true,
  "message": "User registered successfully.",
  "data": {
    "user": {
      "id": "665000000000000000000001",
      "fullName": "Jane Doe",
      "email": "jane@example.com",
      "mobileNumber": "9876543210",
      "referralCode": "ABC23456",
      "walletBalance": 0,
      "totalROIEarned": 0,
      "totalLevelIncomeEarned": 0,
      "accountStatus": "active",
      "role": "user"
    },
    "token": "<JWT>"
  }
}
```

### Login

`POST /auth/login` (public)

```json
{ "email": "jane@example.com", "password": "a-strong-password" }
```

Example `200` has the same `data.user` and `data.token` structure as registration. Invalid credentials return `401`.

### Current user and logout

- `GET /auth/me` — private; returns the authenticated user without their password hash.
- `POST /auth/logout` — private; acknowledges logout. JWT invalidation is client-side (discard the token); server-side token revocation is not implemented.

## Investments

All investment endpoints require JWT authentication and are scoped to the authenticated user.

### Available plans

`GET /investments/plans`

Returns the plan terms configured by the server through `INVESTMENT_PLANS`. Outside production, an empty setting uses the clearly labeled ₹10,000 / 1% daily / 30-day assessment example for local testing only. Production requires explicit approved plan configuration.

### Create investment

`POST /investments`

```json
{ "planId": "demo", "amount": 500 }
```

Plan id, ROI, start/end dates, duration, and description are server-controlled; client-supplied terms are not accepted. The investment is saved atomically with any applicable configured referral payouts. It does not debit the wallet: the assessment does not specify deposits or payment processing.

Example `201`:

```json
{
  "success": true,
  "message": "Investment created successfully.",
  "data": {
    "investment": {
      "_id": "665000000000000000000010",
      "userId": "665000000000000000000001",
      "amount": 500,
      "planName": "Demo plan",
      "planDetails": "Example terms",
      "startDate": "2026-11-03T00:00:00.000Z",
      "endDate": "2026-12-02T00:00:00.000Z",
      "dailyROI": 0.05,
      "dailyROIPercentage": 0.05,
      "status": "active"
    }
  }
}
```

### List and inspect investments

- `GET /investments?page=1&limit=20&status=active&sortBy=createdAt&sortOrder=desc`
- `GET /investments/:id`

List query parameters are optional. `limit` is capped at 100; `status` is `active`, `completed`, or `cancelled`; supported sort fields are `createdAt`, `startDate`, `endDate`, `amount`, and `status`. A list response contains `data.items` and `data.pagination` (`page`, `limit`, `total`, `totalPages`). A user cannot read another user's investment.

## Dashboard

### Summary

`GET /dashboard/summary`

Returns portfolio principal, estimated daily ROI for currently active investments, total credited ROI, total referral-level income, and wallet balance. Investment and history detail arrays are limited to the latest 10 records.

Example response shape:

```json
{
  "success": true,
  "message": "Dashboard summary fetched successfully.",
  "data": {
    "summary": {
      "totalInvestments": 500,
      "dailyROI": 0.25,
      "totalROIEarned": 2.5,
      "totalLevelIncomeEarned": 25,
      "walletBalance": 527.5,
      "directReferrals": 1
    },
    "investments": [],
    "roiHistory": [],
    "referralHistory": []
  }
}
```

### Analytics

- `GET /dashboard/earnings` — investment total, earned totals, wallet balance, and ledger counts.
- `GET /dashboard/roi-chart` — daily credited ROI series (up to 30 dates).
- `GET /dashboard/earnings-trend?days=30` — daily investment volume, ROI income, and referral income; `days` is 7–90.

## Referrals

All referral routes are private and scoped to the authenticated user.

- `GET /referrals/direct?page=1&limit=20` — direct referrals and pagination; user fields are limited to name, referral code, account status, and creation time.
- `GET /referrals/tree` — complete nested referral hierarchy. Each node contains safe profile fields, `level`, and `children`.
- `GET /referrals/income?page=1&limit=20` — paginated referral commission history.
- `GET /referrals/summary` — direct referral count, total level income, configured levels, and earned levels.

Example tree response shape:

```json
{
  "success": true,
  "message": "Referral tree fetched successfully.",
  "data": {
    "tree": {
      "_id": "665000000000000000000001",
      "fullName": "Jane Doe",
      "referralCode": "ABC23456",
      "level": 0,
      "children": [
        {
          "_id": "665000000000000000000002",
          "fullName": "Alex Smith",
          "level": 1,
          "children": []
        }
      ]
    }
  }
}
```

## Other private endpoints

- `GET /roi/history?page=1&limit=20` — paginated ROI history.
- `GET /wallet` — wallet balance and earnings totals.
- `GET /wallet/transactions?page=1&limit=20&type=ROI&status=success&sortBy=createdAt&sortOrder=desc` — paginated wallet ledger; all filters and sorting parameters are optional. `type` accepts `ROI`, `REFERRAL`, `INVESTMENT`, `WITHDRAWAL`, or `ADJUSTMENT`; `status` accepts `pending`, `success`, or `failed`.

## Admin-only endpoints

All require a JWT for a user with the `admin` role:

- `GET /admin/users?page=1&limit=20&search=alex&accountStatus=active` — paginated; optional search matches name/email and status is `active`, `suspended`, or `inactive`.
- `GET /admin/investments?page=1&limit=20&status=active&sortBy=createdAt&sortOrder=desc` — paginated; optional status is `active`, `completed`, or `cancelled`.
- `POST /admin/roi/run`

Manual ROI execution is available to admins only and is also exposed by the admin dashboard. The idempotency key prevents duplicate credits when run repeatedly for the same UTC date.

## Operational requirements

- Configure a strong `JWT_SECRET` with at least 32 non-placeholder characters.
- Run MongoDB as a replica set or sharded cluster. Financial mutations use MongoDB transactions.
- Configure and review production investment terms in `INVESTMENT_PLANS`; local development uses only the explicitly illustrative assessment example when no plans are configured. The platform does not configure a deposit/payment provider.
- Referral payout depth and terms use `REFERRAL_MAX_LEVELS`, `REFERRAL_LEVELS`, and `MIN_ELIGIBLE_INVESTMENT_AMOUNT`. The percentages in `.env.example` are development examples only; production startup requires explicit depth and level configuration. No assessment-defined referral commission policy is assumed.
- `CRON_TIMEZONE` controls the node-cron schedule timezone; ROI history and date eligibility use UTC day boundaries.
- Tests use a uniquely named disposable database; set `TEST_MONGODB_URI` to a test cluster with permission to create/drop that database.
