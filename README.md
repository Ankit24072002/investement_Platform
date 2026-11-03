# NexaChain AI Investment Platform

This project implements a full-stack MERN platform aligned to the assessment requirements:

- MongoDB models for users, investments, referral payout history, ROI history, and wallet transactions
- JWT-based authentication and protected API routes
- Daily ROI processing with idempotency safeguards and ledger updates
- Multi-level referral commissions managed through configuration
- Responsive React dashboard with analytics and portfolio views

## Structure

- `server/` — Express + MongoDB backend
- `client/` — Vite + React dashboard frontend
- `docs/` — Project documentation and API references (if used)

## Quick start

1. Start MongoDB locally on `mongodb://127.0.0.1:27017/investment-platform`
2. In `server/`, copy `.env.example` to `.env` and update your values
3. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in the server environment to seed the default admin user
4. In `client/`, copy `.env.example` to `.env` and update `VITE_API_URL` if your backend runs on a different port
5. Run:
   - `cd server && npm install && npm run dev`
   - `cd client && npm install && npm run dev`

> For full MongoDB transaction support in production, run MongoDB as a replica set. The app includes a graceful fallback for single-node local development so ROI processing still works without a replica set.

## Features

- User registration, login, and profile fetch
- Investment creation and listing with validation
- Daily ROI processing and wallet ledger updates
- Referral tree and income history
- Dashboard summary, chart endpoints, and admin tools
- Idempotent processing to prevent duplicate ROI and referral payouts

## Referral assumptions

The assessment does not define exact referral percentages. This implementation keeps sample values in `server/src/config/referral.js` and supports environment overrides via `REFERRAL_LEVELS` and `REFERRAL_MAX_LEVELS`.

## API documentation

- Markdown API docs: `server/API_DOCUMENTATION.md`
- Postman collection: `server/postman_collection.json`
