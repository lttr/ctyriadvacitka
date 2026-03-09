# Čtyřiadvacítka

Czech-language content management website for the 24th Scout Troop (24. oddíl Junáka) in Hradec Králové. Built as a complete rewrite of the original PHP/Nette/MySQL application.

## Features

**Public website**

- News feed with pagination and search
- Articles (static pages) with rich text content
- Events schedule (Google Calendar integration)
- Contact page with form submission
- Sidebar with navigation, recent news, and login widget

**Admin panel** (editor and admin roles)

- Article management with TipTap rich text editor and image uploads
- News management
- Header image management (hero image rotation)
- User management (admin only)
- Site settings and contact configuration

## Tech Stack

- **Runtime**: Node.js 24
- **Framework**: [Nuxt 4](https://nuxt.com/) (Vue 3)
- **Database**: SQLite via [Drizzle ORM](https://orm.drizzle.team/) and [@libsql/client](https://github.com/tursodatabase/libsql-client-ts)
- **Authentication**: [better-auth](https://www.better-auth.com/) (username/password, session-based)
- **File storage**: [NuxtHub Blob](https://hub.nuxt.com/) for image uploads
- **CSS**: [@lttr/puleo](https://github.com/lttr/puleo)
- **Testing**: [Vitest](https://vitest.dev/) with [@nuxt/test-utils](https://nuxt.com/docs/getting-started/testing)
- **Analytics**: [Plausible](https://plausible.io/) (self-hosted)
- **Deployment**: [Coolify](https://coolify.io/) with [Nixpacks](https://nixpacks.com/)

## Prerequisites

- [Node.js](https://nodejs.org/) v24.13.0 (see `.node-version`)
- [pnpm](https://pnpm.io/) v10.x (`corepack enable` to activate)

## Setup

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env
# Edit .env and fill in required values (see Environment Variables below)

# Run database migrations
pnpm db:migrate

# Seed the database with test data
pnpm db:seed

# Start development server
pnpm dev
```

The app will be available at `http://localhost:3000`.

### Seed Users

The seed script creates three test users:

| Username | Password  | Role       |
| -------- | --------- | ---------- |
| admin    | admin123  | admin      |
| editor   | editor123 | editor     |
| uzivatel | user123   | registered |

## Development

```bash
pnpm dev          # Start dev server
pnpm test         # Run tests
pnpm typecheck    # TypeScript type checking
pnpm lint         # ESLint check
pnpm lint:fix     # Auto-fix lint issues
pnpm format       # Prettier formatting
pnpm verify       # Run all checks (format + lint:fix + typecheck + test)
```

### Database

```bash
pnpm db:generate  # Generate Drizzle migrations from schema changes
pnpm db:migrate   # Run pending migrations
pnpm db:seed      # Seed database with test data
pnpm db:reset     # Drop database, re-migrate, and re-seed
```

The SQLite database is stored at `.data/db/sqlite.db` (gitignored).

### Testing

Tests are organized by category:

- `tests/api/` — API endpoint tests (request/response contracts, validation, authorization)
- `tests/e2e/` — End-to-end integration tests (multi-step flows)
- `tests/components/` — Vue component tests
- `tests/composables/` — Composable unit tests
- `tests/database/` — Schema and CRUD tests

Run a specific test file:

```bash
pnpm test -- tests/api/auth.test.ts
```

## Environment Variables

| Variable                         | Required | Description                                     |
| -------------------------------- | -------- | ----------------------------------------------- |
| `BETTER_AUTH_SECRET`             | Yes      | Session signing secret (`openssl rand -hex 32`) |
| `SMTP_HOST`                      | No       | SMTP server for contact form emails             |
| `SMTP_PORT`                      | No       | SMTP port (default: 587)                        |
| `SMTP_USER`                      | No       | SMTP username                                   |
| `SMTP_PASS`                      | No       | SMTP password                                   |
| `SMTP_FROM`                      | No       | Sender email address                            |
| `NUXT_PUBLIC_PLAUSIBLE_DOMAIN`   | No       | Plausible analytics domain                      |
| `NUXT_PUBLIC_PLAUSIBLE_API_HOST` | No       | Plausible API host URL                          |
| `NUXT_PUBLIC_SITE_URL`           | No       | Public site URL for SEO                         |

## Production Build

```bash
pnpm build
pnpm start
```

### Deployment with Coolify

The project includes a `nixpacks.toml` for deployment via Coolify:

1. Set up a new application in Coolify pointing to this repository
2. Configure the environment variables listed above
3. Coolify will use Nixpacks to build and deploy automatically

The start command runs migrations before starting the server, so the database schema stays up to date on each deployment.

## Project Structure

```
app/
├── components/       # Vue components
├── composables/      # Vue composables (useAuth, useFlashMessage, etc.)
├── layouts/          # Page layouts (default, admin)
├── middleware/        # Route guards (auth, admin, guest)
├── pages/            # File-based routing
│   ├── administrace/ # Admin panel pages
│   └── ucet/         # Account management
└── plugins/          # Vue plugins (SEO defaults)

server/
├── api/              # API endpoints
├── db/               # Database schema and migrations
├── middleware/        # Server middleware
└── utils/            # Server utilities (auth, rate limiting, etc.)

shared/
├── types/            # Shared TypeScript types
└── utils/            # Shared utilities (date formatting)

scripts/              # Database seed script
tests/                # Test suite
```

## License

Private project.
