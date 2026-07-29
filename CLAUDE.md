# Todo

Self-hosted todo app: Next.js 15 (App Router), TypeScript, Tailwind CSS v4, SWR, SQLite via Drizzle ORM, Auth.js v5 with a custom Authelia OIDC provider.

## Architecture

```
src/
  auth.config.ts        # Edge-safe Auth.js config (no DB/providers) — used by middleware
  auth.ts                # Full Auth.js config — Authelia OIDC provider, DB upsert on login
  middleware.ts           # Redirects unauthenticated requests straight into Authelia sign-in
  db/
    schema.ts             # Drizzle schema: users, lists, tasks, subtasks, tags, task_tags
    index.ts               # DB client singleton (better-sqlite3 + drizzle)
  lib/
    session.ts             # requireUserId() — used by every API route
    api-helpers.ts          # unauthorized()/notFound()/badRequest() JSON response helpers
    validation.ts           # zod schemas for API request bodies
    tasks.ts                # attachTags()/replaceTaskTags() — shared task+tag join logic
    fetcher.ts               # SWR fetcher + apiRequest() helper for client-side calls
    hooks/                    # useLists, useTasks, useTags, useTaskDetail (SWR + mutations)
  app/
    api/                      # REST-ish route handlers, one per resource (see below)
    (app)/                    # Authenticated route group: layout.tsx (AppShell), page.tsx (all tasks),
                                lists/[listId]/page.tsx (one list)
  components/                 # Sidebar, MobileHeader, TaskBoard, TaskList/TaskRow (dnd-kit),
                                QuickAddTask, TaskDetailPanel, SubtaskList
scripts/
  migrate.ts                  # Runs committed drizzle/ SQL migrations against DATABASE_PATH; run on container boot
drizzle/                      # Committed SQL migrations (generate with `npm run db:generate`)
```

## Key env vars

See `.env.example` / README for the full table. The ones that matter for local dev:

| Var | Purpose |
|-----|---------|
| `DATABASE_PATH` | SQLite file location (default `./data/todo.db` locally) |
| `AUTH_SECRET` | Session encryption — required even in dev |
| `AUTH_AUTHELIA_ISSUER` / `AUTH_AUTHELIA_ID` / `AUTH_AUTHELIA_SECRET` | Authelia OIDC client |

## Auth

- Every list/task/tag row is scoped by `userId`. **API routes must always derive `userId` from `requireUserId()` (server-side session) — never trust a client-supplied user id.**
- `auth.config.ts` has no providers/DB import — it's the only thing `middleware.ts` imports, because better-sqlite3 is a native addon and can't run in the Edge runtime that middleware uses by default. Providers + DB access live only in `auth.ts`, imported by route handlers and server components (Node runtime).
- On first login, the `jwt` callback in `auth.ts` upserts a `users` row and creates a default "My Tasks" list if the user has none.

## Adding a new API resource

1. Add the table to `src/db/schema.ts`, run `npm run db:generate` then `npm run db:migrate`.
2. Add zod schemas to `src/lib/validation.ts`.
3. Add route handler(s) under `src/app/api/<resource>/route.ts` — always start with `requireUserId()` and scope every query by it.
4. Add an SWR hook in `src/lib/hooks/`.
5. Wire it into a component under `src/components/`.

## Ordering / drag-and-drop

Lists and tasks use a plain integer `position` column, fully reindexed (0..n-1) in one transaction per reorder call (`/api/lists/reorder`, `/api/tasks/reorder`). Data volumes are small enough per user that this beats fractional-index complexity. The "All tasks" view (mixing multiple lists) does not support drag-reorder, since position is scoped per-list — only single-list views do.

## Dev

```bash
npm install
npm run db:migrate   # create/update local SQLite schema
npm run dev           # :3000, no Turbopack (matches production build behavior)
npm run build
npm run lint
npm run db:generate    # after editing src/db/schema.ts
```

The Docker image is built and pushed to GHCR on every `main` commit (`.github/workflows/build.yml`, same pattern as the `homepage` project). The container runs `scripts/migrate.ts` via `tsx` before starting the server, so schema migrations apply automatically on deploy.
