# Vịt Trời API

NestJS API for Vịt Trời, backed by PostgreSQL and Prisma ORM.

## Prerequisites

- Node.js 22 LTS (22.12+) or Node.js 24+
- npm
- Docker with Docker Compose

## Local setup

Run all commands in `apps/api`.

1. Start PostgreSQL:

   ```bash
   docker compose up -d
   ```

   The container listens on host port `5433` and persists data in the
   `vit_troi_postgres_data` Docker volume.

2. Create a local environment file:

   ```bash
   cp .env.example .env
   ```

   PowerShell equivalent:

   ```powershell
   Copy-Item .env.example .env
   ```

   The checked-in values are local-development defaults only. Use separately
   managed credentials in deployed environments.

   Authentication requires a unique `JWT_ACCESS_SECRET` of at least 32 bytes.
   `JWT_ACCESS_EXPIRES_IN` defaults to `15m`, and
   `REFRESH_TOKEN_TTL_DAYS` defaults to `30`. The values in `.env.example` are
   obvious local placeholders and must be replaced outside local development.

3. Install dependencies and generate Prisma Client:

   ```bash
   npm install
   npx prisma generate
   ```

4. Apply the database migrations:

   ```bash
   npx prisma migrate dev
   ```

5. Start the API:

   ```bash
   npm run start:dev
   ```

6. Verify API and database health:

   ```bash
   curl http://localhost:3000/health
   ```

   Expected response:

   ```json
   { "status": "ok", "api": "ok", "database": "ok" }
   ```

The generated starter endpoint remains available at `GET /`.

## Database workflow

The schema is in `prisma/schema.prisma`, Prisma CLI configuration is in
`prisma.config.ts`, and migrations are committed under `prisma/migrations`.

```bash
npm run prisma:format
npm run prisma:validate
npm run prisma:generate
npm run prisma:migrate
```

The schema contains `User`, `MotherProfile`, `Pregnancy`, and `AuthSession`.
Each successful registration or login creates an independent authentication
session.

## Authentication

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/auth/register` | Create a user and authenticated session |
| `POST` | `/auth/login` | Create an independent authenticated session |
| `POST` | `/auth/refresh` | Rotate a refresh token and issue new tokens |
| `POST` | `/auth/logout` | Revoke the current bearer-token session |
| `GET` | `/auth/me` | Return the current safe user representation |

Access tokens are JWT bearer tokens with a default lifetime of 15 minutes.
Refresh tokens are opaque, rotate on every successful refresh, and have a
default session lifetime of 30 days. Only SHA-256 refresh-token digests are
stored. Passwords are hashed with Argon2id. Never put real secrets or tokens in
documentation or source control.

## Mother profile and pregnancy onboarding

All onboarding routes require a valid access-token bearer session. Ownership is
always derived from that session; clients cannot select a `userId` or
`motherProfileId`.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/me/profile` | Return `{ "profile": null }` or the current user's mother profile |
| `POST` | `/me/profile` | Create the current user's one mother profile |
| `PATCH` | `/me/profile` | Update `fullName` and/or `dateOfBirth` |
| `GET` | `/me/pregnancies` | List only the current user's pregnancy history, ACTIVE first |
| `GET` | `/me/pregnancies/current` | Return `{ "pregnancy": null }` or the ACTIVE pregnancy |
| `POST` | `/me/pregnancies` | Create an ACTIVE pregnancy for the current user's profile |

`dateOfBirth`, `dueDate`, and `actualBirthDate` use strict calendar-date values
in `YYYY-MM-DD` format. Birth dates are accepted from `1900-01-01` through the
server's current local date. Onboarding due dates are accepted from 21 days
before through 300 days after that date, inclusive.

A user may have one mother profile. A profile may have multiple COMPLETED
pregnancies, but PostgreSQL migration
`20260818090000_enforce_single_active_pregnancy` adds a partial unique index so
it can have at most one ACTIVE pregnancy, including under concurrent requests.
Gestational age and days remaining are derived by clients and are not stored.

## Validation

With PostgreSQL running and `.env` configured:

```bash
npm run build
npm run lint
npm test
npm run test:e2e
```

Stop the local database without deleting its persistent volume:

```bash
docker compose down
```
