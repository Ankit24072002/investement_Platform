# NexaChain AI API Documentation

Base URL: http://localhost:5000/api

## Authentication

### Register user
POST /auth/register

Request body:
{
  "fullName": "Jane Doe",
  "email": "jane@example.com",
  "mobileNumber": "9876543210",
  "password": "secret123",
  "referralCode": "INVEST22"
}

Example success response:
{
  "success": true,
  "message": "User registered successfully.",
  "data": {
    "user": {
      "id": "64f1d0a77c7a3a1b3e2a57bd",
      "fullName": "Jane Doe",
      "email": "jane@example.com",
      "mobileNumber": "9876543210",
      "referralCode": "ABC12345",
      "walletBalance": 0,
      "totalROIEarned": 0,
      "totalLevelIncomeEarned": 0,
      "accountStatus": "active",
      "role": "user"
    },
    "token": "jwt-token"
  }
}

### Login user
POST /auth/login

Request body:
{
  "email": "jane@example.com",
  "password": "secret123"
}

Example success response:
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "token": "jwt-token",
    "user": {
      "id": "64f1d0a77c7a3a1b3e2a57bd",
      "fullName": "Jane Doe",
      "email": "jane@example.com",
      "mobileNumber": "9876543210",
      "referralCode": "ABC12345",
      "walletBalance": 0,
      "totalROIEarned": 0,
      "totalLevelIncomeEarned": 0,
      "accountStatus": "active",
      "role": "user"
    }
  }
}

### Get current user
GET /auth/me

Headers:
Authorization: Bearer <token>

### Logout
POST /auth/logout

Headers:
Authorization: Bearer <token>

## Investments

### Create investment
POST /api/investments

Headers:
Authorization: Bearer <token>

Request body:
{
  "amount": 5000,
  "planName": "Premium Growth",
  "planDetails": "Premium Growth",
  "startDate": "2026-11-01T00:00:00.000Z",
  "endDate": "2026-12-31T00:00:00.000Z",
  "dailyROI": 1.5
}

Example success response:
{
  "success": true,
  "message": "Investment created successfully.",
  "data": {
    "investment": {
      "_id": "64f1d0b87c7a3a1b3e2a57bf",
      "amount": 5000,
      "planName": "Premium Growth",
      "planDetails": "Premium Growth",
      "status": "active",
      "dailyROI": 1.5
    }
  }
}

### List user investments
GET /api/investments?page=1&limit=20&status=active

Headers:
Authorization: Bearer <token>

### Investment ROI history
GET /api/investments/roi-history

Headers:
Authorization: Bearer <token>

### Referral income history for investment user
GET /api/investments/referral-history

Headers:
Authorization: Bearer <token>

## Dashboard

### Dashboard summary
GET /api/dashboard/summary

Headers:
Authorization: Bearer <token>

Example response:
{
  "success": true,
  "data": {
    "summary": {
      "totalInvestments": 5000,
      "totalROIEarned": 50,
      "totalLevelIncomeEarned": 0,
      "walletBalance": 50,
      "directReferrals": 0
    }
  }
}

### ROI chart data
GET /api/dashboard/roi-chart

### Earnings breakdown
GET /api/dashboard/earnings

## Referrals

### Direct referrals
GET /api/referrals/direct

### Referral tree
GET /api/referrals/tree

### Referral income
GET /api/referrals/income

## ROI

### User ROI history
GET /api/roi/history

## Wallet

### Wallet summary
GET /api/wallet

### Wallet transactions
GET /api/wallet/transactions

## Admin

### List users
GET /api/admin/users?page=1&limit=20

### List investments
GET /api/admin/investments?page=1&limit=20

### Run manual ROI processing
POST /api/admin/roi/run

Headers:
Authorization: Bearer <admin-token>

Example response:
{
  "success": true,
  "message": "Manual ROI processing completed.",
  "data": {
    "processed": 1
  }
}

## Notes

- All private routes require JWT authentication.
- The app uses a bearer-token approach for the React client.
- ROI processing includes idempotency safeguards to prevent duplicate daily crediting.
- Referral rates are configurable via environment values in the server configuration.
- For production-grade MongoDB transactions, use a replica set. Local single-node MongoDB runs are supported with the included fallback logic.
