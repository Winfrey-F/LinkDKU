# LINKDKU

A simple, professional light-theme web app for:

- Duke OAuth login entry (plus dev fallback login)
- Full student survey collection
- Backend storage of responses
- Scheduled matching run using weighted cosine + stable matching
- Automated result emails to `netid@duke.edu`
- Private admin dashboard with login

## Stack

- Runtime: Node.js built-in modules (no external dependencies)
- Frontend: static HTML/CSS/JS (`/public`)
- Backend: `src/server.js`
- Data store: JSON files under `data/`

## Quick Start

1. Copy env template:

```bash
cp .env.example .env
```

2. Set admin credentials in `.env`:

- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`

3. Run app:

```bash
npm start
```

4. Open:

- Home: `http://localhost:3000`
- Admin login: `http://localhost:3000/admin-login.html`

## OAuth Setup

Configure these values in `.env` from your Duke OAuth app:

- `DUKE_OAUTH_CLIENT_ID`
- `DUKE_OAUTH_CLIENT_SECRET`
- `DUKE_OAUTH_AUTH_URL`
- `DUKE_OAUTH_TOKEN_URL`
- `DUKE_OAUTH_USERINFO_URL`
- `DUKE_OAUTH_REDIRECT_URI`

Until then, use the developer fallback login with netid on the home page.

## Admin Dashboard

- Protected by session-based admin login
- Manual matching trigger button
- Overview metrics
- Latest matching results table
- Recent survey responses table
- Recent email logs table

Main API used by dashboard:

- `POST /auth/admin/login`
- `POST /auth/admin/logout`
- `GET /api/admin/dashboard`
- `POST /api/admin/run-matching`

Home page admin login is now collapsed behind an `Admin Login` button.

## Email Setup

Current implementation supports:

- `EMAIL_PROVIDER=resend` (API mode)
- `EMAIL_PROVIDER=smtp` (SMTP mode, including Gmail)

Set in `.env`:

- `EMAIL_API_KEY`
- `EMAIL_FROM`
- `EMAIL_API_HOST`
- `EMAIL_API_PATH`

If `EMAIL_API_KEY` is empty, emails are written to `data/email_outbox.json` as dry-run records.

### Gmail SMTP Mode

Set:

```env
EMAIL_PROVIDER=smtp
EMAIL_FROM=linkdku@gmail.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=linkdku@gmail.com
SMTP_PASS=your_gmail_app_password
```

Notes:
- Use a Gmail App Password (not your normal Gmail password).
- Turn on 2-Step Verification in the Gmail account first.
- Install dependency once:
  - `npm install`

## Matching Job

- Scheduled daily at UTC hour/minute from:
  - `MATCH_CRON_HOUR`
  - `MATCH_CRON_MINUTE`
- CLI run:

```bash
npm run run:matching
```

## Database Preparation

- SQL schema prepared at `db/schema.sql`
- Migration notes at `db/README.md`
- Runtime still uses JSON storage in `data/` until DB adapter is wired

## Files

- `src/server.js`: HTTP server, auth/session routing, API endpoints, scheduler
- `src/matching.js`: feature encoding, weighted cosine similarity, hard filtering, stable matching, explanations
- `src/auth.js`: Duke OAuth helper methods
- `src/email.js`: email dispatch + outbox logging
- `src/storage.js`: JSON-based persistence
- `public/survey.html`: survey form and UX
- `public/admin-login.html`: admin login page
- `public/admin.html`: admin dashboard page
- `public/styles.css`: light visual design
