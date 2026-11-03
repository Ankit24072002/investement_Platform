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

### 2) Login user
- `POST /auth/login`
- Body:
  ```json
  {
    "email": "jane@example.com",
    "password": "secret123"
  }
  ```

Response includes a JWT token used for private routes.

## Protected routes

Add the JWT token in the `Authorization` header:

```http
Authorization: Bearer <token>
```

## Investment routes

### 3) Create investment
- `POST /investments`
- Body:
  ```json
  {
    "amount": 5000,
    "planDetails": "Premium Growth",
    "startDate": "2026-11-01",
    "endDate": "2027-01-01",
    "dailyROI": 1.5
  }
  ```

### 4) List investments
- `GET /investments`

### 5) ROI history
- `GET /investments/roi-history`

### 6) Referral income history
- `GET /investments/referral-history`

### 7) Manual ROI processing trigger
- `POST /investments/process-roi`

## Dashboard

### 8) Dashboard summary
- `GET /dashboard`

Returns:
- total investments
- total ROI earned
- total level income earned
- wallet balance
- investment history
- ROI history
- referral history

## Referral routes

### 9) Direct referrals
- `GET /referrals/direct`

### 10) Complete referral tree
- `GET /referrals/tree`

## Notes

- JWT authentication is required for all private endpoints.
- Direct referrals and complete referral trees are protected routes.
- Daily ROI processing is idempotent and avoids duplicate crediting for the same investment and date.
