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

The initial schema contains only `User`, `MotherProfile`, and `Pregnancy`.
Authentication and the remaining product domains are intentionally out of
scope for this sprint.

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
