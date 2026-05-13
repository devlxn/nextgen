# AGENTS.md

## Project Overview

This repository is a Dota 2 analytics web app named DOTAW / Dota 2 Tracker.

- `client/` is a React 18 + TypeScript + Vite frontend.
- `server/` is a Node.js + TypeScript + Express backend.
- MongoDB is used for persisted users and match records through Mongoose.
- Redis is used for sessions and OpenDota response caching.
- Steam login is implemented with `passport-steam`.
- Dota data is fetched mostly from OpenDota API, with some hero metadata and league data stored locally.
- `images/` contains local Dota hero images.
- `docker-compose.yml` starts MongoDB 6 and Redis 7 for local development.

## Stack

Frontend:

- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Axios
- Chart.js / react-chartjs-2
- lucide-react

Backend:

- Node.js
- TypeScript
- Express
- Mongoose
- Redis / connect-redis
- express-session
- Passport + passport-steam
- Axios + axios-retry
- dotenv

Infrastructure:

- Docker Compose
- MongoDB
- Redis
- Vercel config for the frontend

## Key Commands

From the project root:

```powershell
docker compose up -d
```

Starts MongoDB and Redis.

Frontend commands from `client/`:

```powershell
npm run dev
npm run build
npm run lint
npm run preview
```

Backend commands from `server/`:

```powershell
npm run dev
npm run build
npm start
```

Expected local URLs:

- Frontend dev server: `http://localhost:5173`
- Backend API: `http://localhost:5000`
- MongoDB: `mongodb://127.0.0.1:27017`
- Redis: `redis://127.0.0.1:6379`

## Environment

The backend reads environment variables from `server/.env`.

Important variables:

- `MONGODB_URI`
- `REDIS_URL`
- `STEAM_API_KEY`
- `OPENDOTA_API_KEY`
- `PORT`
- `SESSION_SECRET`
- `RETURN_URL`
- `REALM`
- `NODE_ENV`

Do not commit real secrets. If a secret appears in git history or a shared branch, treat it as compromised and rotate it.

## Code Guidelines

- Keep changes scoped to the requested feature or bug.
- Follow the existing split between `client/` and `server/`.
- Prefer TypeScript types and interfaces for API data shapes that are used in multiple places.
- Use existing libraries already present in the project before adding new dependencies.
- Use Axios for HTTP requests to match the current codebase.
- Keep API routes in `server/src/index.ts` unless a larger refactor is explicitly requested.
- Keep Mongoose schemas in `server/src/models/`.
- Keep React route pages in `client/src/pages/`.
- Keep shared static hero metadata in `client/src/data/heroes.ts`.
- Preserve existing dark/light theme behavior when editing frontend UI.
- Avoid unrelated formatting churn, broad rewrites, or file moves.
- Add comments only when they explain non-obvious behavior, especially OpenDota edge cases, caching, or auth/session details.

## ExecPlans

When writing complex features or significant refactors, use an ExecPlan, as described in `PLANS.md`, from design to implementation.

## Data And API Notes

- Steam 64-bit IDs are converted to OpenDota account IDs by subtracting `76561197960265728`.
- Redis cache keys currently include patterns such as `matches:{steamId}:{page}`, `match:{matchId}`, `league:{leagueId}`, and `search:{accountId}`.
- Heavy OpenDota endpoints may timeout; backend requests already use retries and longer timeouts for match details.
- League listing uses `server/data/leagues.json` instead of requesting the full `/leagues` OpenDota endpoint.
- Some frontend pages call OpenDota directly, while others call the local backend API. Be careful when changing CORS, cookies, or API base URLs.

## Self-Check Instructions

Before finishing backend changes:

```powershell
cd server
npm run build
```

Before finishing frontend changes:

```powershell
cd client
npm run build
npm run lint
```

For full local smoke testing:

```powershell
docker compose up -d
cd server
npm run dev
```

In a second terminal:

```powershell
cd client
npm run dev
```

Then check:

- The frontend loads at `http://localhost:5173`.
- The backend responds at `http://localhost:5000/api/user`.
- Search, tournaments, match details, and hero pages still load.
- Steam auth redirects still use the configured local or production URLs.
- No new secrets, generated build output, or unrelated `node_modules` changes are staged.

If validation cannot be run because services, credentials, or network access are unavailable, mention exactly what was skipped and why.
