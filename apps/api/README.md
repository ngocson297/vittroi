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
