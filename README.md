# Vịt Trời

Vịt Trời is a mobile application supporting mothers through late pregnancy,
birth preparation, postpartum recovery, and newborn care.

## Project structure

- `apps/mobile` — React Native, Expo, and TypeScript mobile application.
- `apps/api` — NestJS API backed by Prisma ORM and PostgreSQL.
- `docs` — Product and technical documentation.

## Prerequisites

- A Node.js version supported by each application
- npm
- Docker with Docker Compose for the local API database

## API development

```bash
cd apps/api
cp .env.example .env
npm install
docker compose up -d
npm run prisma:generate
npx prisma migrate dev
npm run start:dev
```

On Windows PowerShell, use `Copy-Item .env.example .env` instead of `cp`.
The database-backed health endpoint is available at
`http://localhost:3000/health`.

See [`apps/api/README.md`](apps/api/README.md) for backend details.

## Mobile development

```bash
cd apps/mobile
npm install
npm start
```

See [`apps/mobile/README.md`](apps/mobile/README.md) for Expo-specific details.
