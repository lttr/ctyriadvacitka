# Čtyřiadvacítka — Technical Specification

Technology choices for the reimplementation. Based on the product requirements
in `prd.md` and aligned with the author's existing stack from
[chrono-albums-2](https://github.com/lttr/chrono-albums-2).

---

## 1. Architecture Overview

Full-stack Nuxt 4 application with server-side rendering. Single deployable
unit — no separate API server, no separate frontend build.

```
┌─────────────────────────────────────────────────┐
│  Nuxt 4 Application                             │
│                                                 │
│  ┌──────────────┐    ┌───────────────────────┐  │
│  │  Vue 3 SFC   │    │  Nitro Server         │  │
│  │  Pages        │    │  API Routes           │  │
│  │  Components   │    │  Auth Middleware       │  │
│  │  Layouts      │    │  Email (SMTP)         │  │
│  │  Composables  │    │  File Storage (disk)  │  │
│  └──────┬───────┘    └──────────┬────────────┘  │
│         │                       │                │
│         └───────────┬───────────┘                │
│                     │                            │
│              ┌──────┴──────┐                     │
│              │  SQLite DB  │                     │
│              │  (Drizzle)  │                     │
│              └─────────────┘                     │
└─────────────────────────────────────────────────┘
```

---

## 2. Runtime & Package Manager

| Component | Choice | Notes |
|-----------|--------|-------|
| Runtime | Node.js (LTS) | Pin via `.node-version` |
| Package manager | pnpm | Consistent with chrono-albums-2 |
| Language | TypeScript | Strict mode |

---

## 3. Framework

| Component | Package | Notes |
|-----------|---------|-------|
| Meta-framework | Nuxt 4 | SSR mode, file-based routing |
| Frontend | Vue 3 | SFC with `<script setup>` |
| Server engine | Nitro | API routes, middleware, server utils |

### Nuxt Modules — Adopted from chrono-albums-2

| Module | Purpose | Applies? |
|--------|---------|----------|
| `@nuxt/eslint` | ESLint integration | Yes |
| `@nuxt/fonts` | Font management | Yes |
| `@nuxt/icon` | Icon components (Iconify) | Yes |
| `@nuxt/image` | Image optimization | Yes — header images |
| `@nuxtjs/color-mode` | Dark/light theme | **No** — original has no dark mode |
| `@nuxtjs/plausible` | Analytics | **No** — low-traffic scout site, not needed initially |
| `@nuxtjs/seo` | SEO meta/sitemap | Yes — public content site benefits from SEO |
| `@nuxthub/core` | Blob storage, DB, tasks | **No** — using plain SQLite + disk storage (simpler) |
| `@lttr/nuxt-puleo` | Custom CSS framework | Yes |
| `@vueuse/nuxt` | VueUse composables | Yes |
| `@sentry/nuxt` | Error tracking | **Defer** — add later if needed |

### Additional Modules

| Module | Purpose |
|--------|---------|
| `nuxt-security` | Security headers (CSP, HSTS, etc.) |

---

## 4. Database

| Component | Package | Notes |
|-----------|---------|-------|
| Engine | SQLite | Single file, zero config, sufficient for low-traffic CMS |
| ORM | Drizzle ORM | Type-safe queries, same as chrono-albums-2 |
| Migrations | Drizzle Kit | `drizzle-kit generate` + `drizzle-kit migrate` |
| Validation | drizzle-zod | Generate Zod schemas from Drizzle tables |
| Seeding | drizzle-seed | Seed data for development |

### Schema Mapping (from PRD §3)

The PRD defines 4 entities. Mapped to Drizzle tables:

```typescript
// Illustrative — actual schema in server/database/schema.ts

articles     // §3.1 — id, title, url (unique), content, requestable, inMenu, author, datetime
news         // §3.2 — id, title, content, author, datetime
users        // §3.3 — id, username (unique), password (bcrypt), name, surname, nickname, email, role
siteSettings // §3.4 — key (unique), value — key-value store for webName, webDescription, contactEmail, contactInfo
```

Session table managed by better-auth (see §5).

---

## 5. Authentication & Authorization

| Component | Package | Notes |
|-----------|---------|-------|
| Auth library | better-auth | Session-based auth, same as chrono-albums-2 |
| Password hashing | bcrypt (via better-auth) | PRD §4 specifies bcrypt |
| Session storage | SQLite (via better-auth) | Server-side sessions |

### Differences from chrono-albums-2

- **No Google OAuth** — the scout site uses username/password login (PRD §4)
- **No invitation system** — users register or are created by admin
- **3 roles**: registered, editor, admin (PRD §4.2) — not owner/editor/viewer

### Auth Architecture

```
better-auth configured with:
  - Email+password provider (username as identifier)
  - Role stored in user record
  - Session expiration: 30 minutes (PRD §4.1, matching original)
  - Nuxt middleware checks role on protected routes
```

### Route Protection (from PRD §5)

| Guard | Routes |
|-------|--------|
| Guest only | `/prihlaseni`, `/registrace` |
| Any logged-in | `/profil/*`, `/odhlasit` |
| Editor+ | `/administrace/clanky/*`, `/administrace/novinky/*` |
| Admin only | `/administrace/uzivatele/*`, `/administrace/hlavicka/*`, `/administrace/web/*`, `/administrace/kontakty/*` |

---

## 6. Frontend UI

| Component | Package | Notes |
|-----------|---------|-------|
| CSS framework | `@lttr/puleo` | Author's own framework, used in chrono-albums-2 |
| Icons | `@iconify-json/uil` | Unicons via `@nuxt/icon` |
| Composables | `@vueuse/core` | Utility composables |
| Rich text editor | TBD | For article content editing (HTML body). Evaluate: Tiptap, ProseMirror, or simple textarea with markdown. |

### Layout Structure (from PRD §6)

```
┌─────────────────────────────────────────┐
│ Header: hero image rotation + site name │
├──────────┬──────────────────────────────┤
│ Sidebar  │ Main Content                 │
│ - Nav    │                              │
│ - News   │                              │
│ - Login  │                              │
│          │                              │
├──────────┴──────────────────────────────┤
│ Footer: troop name, login/profile link  │
└─────────────────────────────────────────┘
```

Two layouts:
1. **Public layout** — header with hero rotation, sidebar, footer
2. **Admin layout** — admin navbar (role-dependent links), no sidebar/hero

### Forms

Nuxt/Vue forms with Zod validation (shared client+server schemas via
drizzle-zod). Flash messages via a composable or Nuxt's `useState`.

Original uses AJAX for:
- User deletion (PRD §9.4)
- Header image deletion (PRD §9.5)
- Menu-visibility toggle on articles (PRD §9.6)

These become API calls from Vue components to Nitro endpoints.

---

## 7. File Storage

| Feature | Approach | Notes |
|---------|----------|-------|
| Header images | Disk (`public/uploads/header-images/`) | PRD §10.1 — PNG/JPG/GIF, no resize |
| Article images | Disk (`public/uploads/article-images/`) | PRD §10.2 — inserted into content HTML |
| Contact photos | Static assets (`public/img/contacts/`) | PRD §10.3 — managed outside CMS |
| Attachments | Disk (`public/uploads/attachments/`) | PRD §10.4 — directory listing enabled |

**Not using NuxtHub Blob Storage** — unnecessary for a self-hosted site with
simple file uploads. Plain disk storage is simpler and matches the original
behavior.

---

## 8. Email

| Component | Approach | Notes |
|-----------|----------|-------|
| Contact form email | SMTP via nodemailer or similar | PRD §9.1 — sends to configured admin email(s) |
| Template | Plain text | Matches original (name, email, subject, message body) |

Configuration via environment variables: `SMTP_HOST`, `SMTP_PORT`,
`SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`.

---

## 9. Validation

| Component | Package | Notes |
|-----------|---------|-------|
| Runtime validation | Zod | Shared schemas between client and server |
| DB schema → Zod | drizzle-zod | Auto-generate validation from DB schema |

All form inputs validated both client-side (Vue) and server-side (Nitro API
handler). Czech error messages (PRD §11).

---

## 10. Development Tooling

Adopted from chrono-albums-2:

| Tool | Package | Purpose |
|------|---------|---------|
| Type checking | TypeScript + vue-tsc | `nuxi typecheck` |
| Type reset | `@total-typescript/ts-reset` | Stricter built-in types |
| Testing | Vitest + `@nuxt/test-utils` + `@vue/test-utils` + happy-dom | Unit and integration tests |
| Linting | ESLint 9 + `@lttr/nuxt-config-eslint` | Code quality |
| Import lint | `eslint-plugin-import-x` | Dependency hygiene |
| Formatting | Prettier | Code formatting |
| Script runner | tsx | TypeScript scripts (seeding, etc.) |

### NPM Scripts

```json
{
  "dev": "nuxt dev",
  "build": "nuxt build",
  "start": "node .output/server/index.mjs",
  "preview": "nuxt preview",
  "test": "vitest run",
  "typecheck": "nuxi typecheck",
  "lint": "eslint",
  "lint:fix": "eslint --fix",
  "format": "prettier --list-different --write .",
  "verify": "npm run format && npm run lint:fix && npm run typecheck && npm test",
  "db:generate": "drizzle-kit generate",
  "db:migrate": "drizzle-kit migrate",
  "db:seed": "npx tsx scripts/seed.ts",
  "db:reset": "rm -f .data/db/sqlite.db && npm run db:migrate && npm run db:seed"
}
```

---

## 11. Deployment

| Component | Choice | Notes |
|-----------|--------|-------|
| Platform | Coolify | Self-hosted PaaS on VPS, same as chrono-albums-2 |
| Build tool | nixpacks | Detects Node.js, runs build |
| Start command | `pnpm run db:migrate && node .output/server/index.mjs` | Auto-migrate on start |
| TLS | Managed by Coolify | Let's Encrypt |
| Domain | TBD | Currently `ctyriadvacitka.skauting.cz` (original FTP host) |

### Environment Variables

```
# Database
DATABASE_URL=file:./data/sqlite.db

# Auth
BETTER_AUTH_SECRET=<random-secret>
NUXT_SESSION_EXPIRATION=1800

# Email
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=

# App
NUXT_PUBLIC_SITE_URL=https://ctyriadvacitka.skauting.cz
```

---

## 12. Project Structure

```
├── app/
│   ├── components/          # Vue components
│   │   ├── admin/           # Admin-specific components
│   │   ├── forms/           # Form components (article, news, user, etc.)
│   │   └── ui/              # Shared UI components (flash, pagination, etc.)
│   ├── composables/         # Vue composables (useAuth, useFlash, etc.)
│   ├── layouts/             # default.vue (public), admin.vue
│   ├── pages/               # File-based routing
│   │   ├── index.vue        # Homepage (intro article)
│   │   ├── clanky/          # Public article routes
│   │   ├── novinky.vue      # Public news list
│   │   ├── kontakt.vue      # Contact page + form
│   │   ├── prihlaseni.vue   # Sign in
│   │   ├── registrace.vue   # Sign up
│   │   ├── odhlasit.vue     # Sign out
│   │   ├── profil/          # User profile routes
│   │   └── administrace/    # Admin routes
│   │       ├── clanky/      # Article management
│   │       ├── novinky/     # News management
│   │       ├── uzivatele/   # User management (admin)
│   │       ├── hlavicka/    # Header images (admin)
│   │       ├── web.vue      # Web properties (admin)
│   │       └── kontakty.vue # Contact settings (admin)
│   └── app.vue              # Root component
├── server/
│   ├── api/                 # Nitro API routes
│   │   ├── auth/            # better-auth endpoints
│   │   ├── articles/        # Article CRUD
│   │   ├── news/            # News CRUD
│   │   ├── users/           # User management
│   │   ├── upload/          # File upload handlers
│   │   ├── contact.post.ts  # Contact form submission
│   │   └── settings/        # Site settings
│   ├── database/
│   │   ├── schema.ts        # Drizzle schema definitions
│   │   └── migrations/      # Generated migrations
│   ├── middleware/           # Server middleware (auth checks)
│   └── utils/               # Server utilities (db client, email, etc.)
├── shared/                  # Code shared between app/ and server/
│   └── types/               # Shared TypeScript types
├── public/
│   ├── uploads/             # User-uploaded files (gitignored)
│   └── img/                 # Static images (contact photos, etc.)
├── scripts/
│   └── seed.ts              # Database seeding
├── tests/                   # Test files
├── drizzle.config.ts        # Drizzle Kit configuration
├── nuxt.config.ts           # Nuxt configuration
├── vitest.config.ts         # Vitest configuration
├── eslint.config.js         # ESLint configuration
├── tsconfig.json            # TypeScript configuration
├── nixpacks.toml            # Deployment build config
├── .env.example             # Environment variable template
├── .node-version            # Node.js version pin
├── .prettierrc              # Prettier configuration
└── package.json             # Dependencies and scripts
```

---

## 13. Tech Stack Not Adopted from chrono-albums-2

Components from chrono-albums-2 that **do not apply** to this project:

| Component | Reason |
|-----------|--------|
| `@nuxthub/core` | No need for managed blob storage — plain disk is simpler for self-hosted |
| `@nuxtjs/color-mode` | Original has no dark mode; out of scope |
| `@nuxtjs/plausible` | Low-traffic scout site; analytics not in requirements |
| `@sentry/nuxt` | Can add later; not needed for initial launch |
| PhotoSwipe, justified-layout | No photo gallery feature (dropped in PRD §2) |
| Sharp, FFmpeg, ExifReader | No image/video processing needed — images stored as-is |
| heic2any, CompressorJS | No client-side media processing needed |
| Google OAuth / better-auth invitations | Scout site uses username+password auth |
| `@libsql/client` | Using plain SQLite driver (better-sqlite3 via Drizzle) instead of LibSQL |
| date-fns | Evaluate need — may use native `Intl.DateTimeFormat` for Czech date formatting |

---

## 14. Migration Path from Original

| Original (PHP/Nette) | New (Nuxt 4) |
|----------------------|--------------|
| Nette Presenters | Nuxt pages + Nitro API routes |
| Latte templates | Vue SFC templates |
| Nette Forms | Vue form components + Zod validation |
| Nette Database (raw SQL) | Drizzle ORM |
| MariaDB | SQLite |
| Nette Security (sessions) | better-auth sessions |
| Nette DI Container | Nuxt auto-imports + Nitro utils |
| `nette.ajax.js` | Native Vue reactivity + `useFetch`/`$fetch` |
| jQuery DOM manipulation | Vue reactivity |
| `@lttr/skaut-design` CSS | `@lttr/puleo` CSS |
| Apache `.htaccess` routing | Nuxt file-based routing |
| FTP / Docker / K8s deploy | Coolify + nixpacks |
| PHP `mail()` / Nette Mail | nodemailer via SMTP |
