# Multi Medical Model Platform

Production-oriented monorepo scaffold for a future AI medical diagnosis platform.

## Architecture Goal

This repository is split into two independently maintainable application roots:

- `frontend/` for the React application
- `backend/` for the Django API and platform services

The current step only establishes architecture, routing, shared layout structure, auth scaffolding, configuration, and environment setup. No diagnosis logic or AI model logic is implemented yet.

## Directory Map

### Root

- `README.md` documents the architecture and design decisions.
- `.gitignore` keeps generated artifacts, local environments, and secrets out of version control.

### Frontend

- `frontend/package.json` declares React 19, Vite, TypeScript, Tailwind CSS, React Router, Framer Motion, Axios, and Lucide React.
- `frontend/src/app/` contains application-level providers and bootstrapping concerns.
- `frontend/src/routes/` centralizes route definitions and route guards.
- `frontend/src/layouts/` contains the reusable page shells for public, auth, and dashboard experiences.
- `frontend/src/components/layout/` contains the shared shell pieces such as sidebar, navbar, and footer.
- `frontend/src/components/shared/` contains reusable UI primitives.
- `frontend/src/context/` holds authentication and theme state.
- `frontend/src/lib/api/` is the API service layer for Axios clients and auth helpers.
- `frontend/src/pages/` stores page-level route components, grouped by domain.
- `frontend/src/config/` keeps runtime configuration and environment access isolated.
- `frontend/src/data/` stores static navigation and menu definitions.
- `frontend/src/types/` centralizes shared TypeScript contracts.

### Backend

- `backend/requirements.txt` declares Django, Django REST Framework, JWT auth, and database drivers.
- `backend/config/settings/` separates base, development, and production configuration.
- `backend/apps/accounts/` owns authentication and user management structure.
- `backend/apps/core/` owns shared platform scaffolding and future cross-cutting features.
- `backend/apps/common/` is reserved for reusable backend utilities.

## Design Decisions

- The repository uses a monorepo layout so the frontend and backend can evolve independently while staying synchronized.
- React routing, layout shells, and shared components are separated so pages stay thin and features remain composable.
- Theme state is isolated in context and CSS variables so visual changes can be made centrally without rewriting components.
- Axios is wrapped in a dedicated service layer so authentication, base URLs, and interceptors do not leak into page code.
- Django settings are split by environment to keep development simple with SQLite while preparing production for PostgreSQL.
- Authentication lives in a dedicated backend app so JWT, user models, and security policy can evolve without coupling to future diagnosis services.
- No diagnosis endpoints, AI model code, or medical inference logic are included in this step.

## Environment Variables

### Frontend

Create `frontend/.env` from `frontend/.env.example`.

### Backend

Create `backend/.env` from `backend/.env.example`.

## Next Step

The next implementation step should wire the frontend shell to the backend auth scaffolding and then add real domain modules one bounded context at a time.
