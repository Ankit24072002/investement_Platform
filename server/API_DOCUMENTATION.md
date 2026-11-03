# Investment Platform API Documentation

Base URL: `http://localhost:5000/api`

## Authentication

### 1) Register user
- `POST /auth/register`
- Body:
  ```json
  {
    "fullName": "Jane Doe",
    "email": "jane@example.com",
    "mobileNumber": "9876543210",
    "password": "secret123",
    "referralCode": "INVEST22"
  }
  ```
- Response:
  ```json
  {
    "success": true,
    "message": "User registered successfully.",
    "data": {
      "user": {
        "id": "...",
        "fullName": "Jane Doe",
        "email": "jane@example.com",
        "referralCode": "ABC12345"
      },
      "token": "jwt-token"
    }
  }
  ```

### 2) Login user
- `POST /auth/login`
- Body:
  ```json
  {
    "email": "jane@example.com",
    "password": "secret123"
  }
  ```

### 3) Get current user
- `GET /auth/me`

### 4) Logout
- `POST /auth/logout`

## Protected routes

Add the API JWT in the `Authorization` header:

```http
Authorization: Bearer <jwt-token>
```

## Investment routes

### 5) Create investment
- `POST /investments`
- Body:
  ```json
  {
    "amount": 5000,
    "planName": "Premium Growth",
    "planDetails": "Premium Growth",
    "startDate": "2026-11-01",
    "endDate": "2026-12-31",
    "dailyROI": 1.5
  }
  ```
- Response:
  ```json
  {
    "success": true,
    "message": "Investment created successfully.",
    "data": {
      "investment": {
        "_id": "...",
        "amount": 5000,
        "status": "active"
      }
    }
  }
  ```

### 6) List investments
- `GET /investments?page=1&limit=20&status=active&sortBy=createdAt&sortOrder=desc`

### 7) ROI history
- `GET /investments/roi-history`

### 8) Referral income history
- `GET /investments/referral-history`

## Dashboard

### 9) Dashboard summary
- `GET /dashboard/summary`

### 10) ROI chart data
- `GET /dashboard/roi-chart`

### 11) Earnings breakdown
- `GET /dashboard/earnings`

## Referral routes

### 12) Direct referrals
- `GET /referrals/direct`

### 13) Complete referral tree
- `GET /referrals/tree`

### 14) Referral income ledger
- `GET /referrals/income`

## ROI routes

### 15) User ROI history
- `GET /roi/history`

## Wallet routes

### 16) Wallet summary
- `GET /wallet`

### 17) Wallet transactions
- `GET /wallet/transactions`

## Admin routes

### 18) List users
- `GET /admin/users?page=1&limit=20`

### 19) List all investments
- `GET /admin/investments?page=1&limit=20`

### 20) Manual ROI execution
- `POST /admin/roi/run`

## Notes

- JWT authentication is required for all private endpoints.
- Direct referrals, dashboards, wallet data, ROI, and admin endpoints are protected.
- Daily ROI calculations use an idempotency key to prevent duplicate processing for the same investment and date.
- Referral commissions are configuration-driven. Sample percentages are kept in the project config file and may be adjusted by environment values.
- The current implementation uses a JWT bearer token approach and stores it on the client instead of HTTP-only cookies to keep the API simple and compatible with a React client.
