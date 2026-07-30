# Todo

A simple, self-hosted todo app with per-user lists, tasks, subtasks, priorities, due dates, and tags — logged in via Authelia (OIDC). Built with Next.js, designed to run as a Docker container alongside your existing self-hosted stack.

## Features

- **Lists** — multiple todo lists per user, reorderable.
- **Tasks** — title, notes, due date, priority (none/low/medium/high), completion, drag-and-drop reordering within a list.
- **Subtasks** — a small checklist inside any task.
- **Tags** — free-form labels, filterable across all lists (no "My Day"-style smart views).
- **Per-user data** — every list/task/tag is scoped to the logged-in user.
- **Login via Authelia (OIDC)** — the app is a real OIDC client with its own login/session, not proxy header-trust. Portable if you ever swap identity providers.
- Simple, mobile-friendly UI.

## Stack

| Layer | Tech |
|---|---|
| Framework | [Next.js 15](https://nextjs.org/) App Router |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) |
| Data fetching | [SWR](https://swr.vercel.app/) |
| Database | SQLite via [Drizzle ORM](https://orm.drizzle.team/) + better-sqlite3 |
| Auth | [Auth.js (NextAuth v5)](https://authjs.dev/) — custom OIDC provider pointed at Authelia |
| Drag & drop | [dnd-kit](https://dndkit.com/) |
| Runtime image | `node:22-alpine` |

## Quick start

```bash
cp .env.example .env   # fill in your values (see below)
docker compose up -d
```

The app is available at `http://<host>:3011`.

## Authelia OIDC client setup

This app is an OIDC Relying Party — you need to register it as a client in your Authelia configuration (`configuration.yml`, under `identity_providers.oidc.clients`) **before** logging in:

| Setting | Value |
|---|---|
| Client ID | `todo` (or your choice — must match `AUTH_AUTHELIA_ID`) |
| Client secret | generate one; put it in `AUTH_AUTHELIA_SECRET` (Authelia expects the **hash** in its config and the **plaintext** in this app's env) |
| Redirect URI | `https://todo.denereaz.net/api/auth/callback/authelia` |
| Scopes | `openid`, `profile`, `email` |
| Response type | `code` |
| PKCE | required (`S256`) |

Example Authelia client config:

```yaml
identity_providers:
  oidc:
    clients:
      - client_id: todo
        client_name: Todo
        client_secret: "$pbkdf2-sha512$..."  # hash of your chosen secret
        public: false
        authorization_policy: one_factor
        redirect_uris:
          - https://todo.denereaz.net/api/auth/callback/authelia
        scopes:
          - openid
          - profile
          - email
        response_types:
          - code
        grant_types:
          - authorization_code
        token_endpoint_auth_method: client_secret_basic
```

Set `AUTH_AUTHELIA_ISSUER` to your Authelia base URL (e.g. `https://auth.denereaz.net`) — the app discovers the rest via `/.well-known/openid-configuration`.

## Environment variables

| Variable | Description |
|---|---|
| `PORT` | Server port (default `3000`) |
| `AUTH_URL` | Public URL of this app (e.g. `https://todo.denereaz.net`) |
| `AUTH_SECRET` | Session encryption secret — generate with `openssl rand -base64 33` |
| `AUTH_AUTHELIA_ISSUER` | Authelia base URL |
| `AUTH_AUTHELIA_ID` | OIDC client ID registered in Authelia |
| `AUTH_AUTHELIA_SECRET` | OIDC client secret (plaintext) |
| `DATABASE_PATH` | Path to the SQLite file (default `/app/data/todo.db`, matches the compose volume) |
| `LOG_LEVEL` | `trace`\|`debug`\|`info`\|`warn`\|`error`\|`fatal`\|`silent` — defaults to `debug`. Structured JSON logs to stdout (`docker logs` / Portainer): every API request, every SQL query, every auth event including raw OIDC claims. |

## docker-compose.yml

```yaml
services:
  todo:
    image: ghcr.io/juldenereaz/todo:latest
    container_name: todo
    restart: unless-stopped
    ports:
      - "3011:3000"
    env_file:
      - .env
    volumes:
      - ./data:/app/data
```

## Development

```bash
npm install
npm run db:migrate   # create/update the local SQLite schema
npm run dev           # http://localhost:3000
npm run build          # production build
npm run lint
```

To log in locally against your real Authelia instance, add `http://localhost:3000/api/auth/callback/authelia` as a second `redirect_uris` entry on the same Authelia client.

To change the schema, edit `src/db/schema.ts`, then run `npm run db:generate` to create a migration and `npm run db:migrate` to apply it.

The CI pipeline builds and pushes the image to GHCR on every push to `main`.
