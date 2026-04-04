# Implementation Plan: Docker Everywhere Migration

## Goal
Unify the platform (app + MongoDB + PostgreSQL + Redis + RabbitMQ) in Docker, so local/native services are isolated and conflicts are eliminated.

## Completed steps
1. Verified Docker Desktop is running.
2. Checked existing compose and Dockerfile setup:
   - `compose/docker-compose.yml`: stack config for all services.
   - `Dockerfile`: multi-stage production build.
   - `docker/Dockerfile.dev`: dev build.
3. Created `/.env.docker` with container host references.
4. Updated `compose/docker-compose.yml`:
   - `build.context` to `..` (root workspace)
   - `build.dockerfile` to `Dockerfile` (from root context)
   - `env_file` to include `../.env.docker` and `../.env`
   - explicit `environment` for critical DB/MQ vars.
5. Updated `src/config/configuration.ts` to support both `MONGO_URI` and `MONGODB_URI`.
6. Updated `Dockerfile` command to `node dist/src/main.js` (project output layout).
7. Added scripts in `package.json`:
   - `prisma:generate`
   - `prisma:migrate`
8. Brought stack up with:
   - `docker compose -f compose/docker-compose.yml up -d --build`
9. Applied migrations inside the container with Prisma.
10. Created migration at `prisma/migrations/20260402171654_init` and applied it.

## Results
- Stack is running and healthy.
- App reachable (logs show `Application is running on: http://localhost:3000/api/v1`).
- PostgreSQL has migration history in `prisma_migrations`.

## Notes & next steps
- Because `prisma migrate dev` from host used container-local DB, we created migration as root in the app container then `docker cp` to host.
- If you want CI-friendly startup, add `docker compose -f compose/docker-compose.yml up -d` and `docker exec ... npx prisma migrate deploy` in scripts.
- You may optionally remove `version: '3.8'` from compose file (warning: obsolete in newer compose).
