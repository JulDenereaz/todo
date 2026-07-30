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
    session.ts             # requireUserId() — used by every API route; logs each auth check
    api-helpers.ts          # unauthorized()/notFound()/badRequest() JSON response helpers
    validation.ts           # zod schemas for API request bodies
    tasks.ts                # attachTags()/replaceTaskTags() — shared task+tag join logic
    lists.ts                 # shared-list access helpers (getAccessibleListIds/canAccessList/getListMembers)
    activity.ts                # logActivity()/getActivityFeed() — cross-list activity log (see below)
    format.ts                   # formatUserLabel(), formatRelativeTime() — shared display formatting
    logger.ts                 # pino instance — structured JSON logs to stdout, LOG_LEVEL-controlled
    api-logging.ts             # withLogging() wrapper — every route handler is wrapped with it
    fetcher.ts               # SWR fetcher + apiRequest() helper for client-side calls
    hooks/                    # useLists, useTasks, useTags, useTaskDetail, useUsers, useActivity (SWR + mutations)
  app/
    api/                      # REST-ish route handlers, one per resource (see below)
    (app)/                    # Authenticated route group: layout.tsx (AppShell), page.tsx (all tasks),
                                lists/[listId]/page.tsx (one list), activity/page.tsx (activity feed)
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
3. Add route handler(s) under `src/app/api/<resource>/route.ts` — always start with `requireUserId()` and scope every query by it. Wrap every exported handler (`GET`/`POST`/`PATCH`/`DELETE`) with `withLogging("<label>", handler)` from `src/lib/api-logging.ts`, matching the pattern in existing routes.
4. Add an SWR hook in `src/lib/hooks/`.
5. Wire it into a component under `src/components/`.

## Activity log

- The `activity` table records notable events (task created/completed/deleted/assigned, member added/removed, list renamed) scoped to a `listId`. `GET /api/activity` returns the feed across all lists the caller can access (or one list via `?listId=`), same "optional listId, else all accessible lists" pattern as `/api/tasks`.
- Writes happen server-side as a side effect inside the existing mutation route handlers (`logActivity()` from `src/lib/activity.ts`) — there's no separate client-facing write endpoint. When adding a new kind of event, add the `ActivityType` variant in `src/lib/types.ts` and call `logActivity()` at the point of mutation, following the pattern already in `src/app/api/tasks/[taskId]/route.ts` (compares old vs new value before logging, so e.g. a PATCH that doesn't actually change `completed` doesn't log a no-op event).
- `summary` is precomputed human-readable text at write time (e.g. the task's title), not derived by joining to the live task/list — so an entry like "deleted \"Buy milk\"" still reads correctly after the task is gone. `taskId` is nullable with `onDelete: "set null"` for the same reason: deleting a task must not delete its own "task deleted" log entry.
- `listId` is `onDelete: "cascade"` — deleting a list wipes its activity log with it, consistent with the equal-rights sharing model (any member can already delete the whole list and everything in it).

## Logging

- `src/lib/logger.ts` exports a `pino` instance writing structured JSON to stdout — `docker logs`/Portainer show it as-is, no extra infra needed. `LOG_LEVEL` env var controls verbosity (default `debug`, i.e. verbose).
- Every API route handler is wrapped with `withLogging()` (`src/lib/api-logging.ts`), logging request start/end (method, url, params, status, duration) and any thrown error.
- Every SQL query (text + params) is logged at `debug` via a custom Drizzle `Logger` wired up in `src/db/index.ts`.
- `requireUserId()` (`src/lib/session.ts`) logs whether a session resolved on every call.
- OIDC login events in `src/auth.ts` log the granted scope and the raw Authelia profile claims at `info`, plus a `warn` if both email and name come back empty (points at Authelia's client scopes / user attributes as the likely cause).
- `middleware.ts` runs on the Edge runtime (no Node APIs), so it logs with plain `console.log(JSON.stringify(...))` instead of pino — same structured-JSON convention, just not routed through the shared logger instance.
- Credential-shaped fields (tokens, secrets, auth headers/cookies) are redacted in `logger.ts` even at the most verbose level; treat that as a hard boundary, not just a default — don't log raw tokens/secrets in new code even if `LOG_LEVEL=trace`.

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

## Git workflow

- All feature work happens on the `dev` branch. Make one commit per feature/fix with a clear, specific message — don't bundle unrelated changes into one commit.
- **Never push to or merge into `main` unless the user explicitly asks for it in that conversation turn.** Pushing `main` triggers the release pipeline (version bump, GitHub release, Docker image build/push to GHCR) — treat it as a deploy action, not a routine git operation.
- When the user says to merge/ship/release, merge `dev` into `main` (fast-forward if possible) and push `main`. `dev` itself can be pushed anytime — it doesn't trigger the pipeline.
