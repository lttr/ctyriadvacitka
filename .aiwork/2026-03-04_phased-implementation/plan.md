# Phased Implementation Strategy: Ctyriadvacitka Nuxt 4 Application

## Overview

This plan organizes the full application build into **7 phases** comprising **18 sessions** total. Each session is scoped to fit within a single Claude Code web session's context window, produces a working increment, and has clear verification steps. The phases are ordered so that each one builds on a stable foundation from the previous phase.

---

## Phase 0: Project Scaffolding and Tooling Foundation

**Goal**: Establish the Nuxt 4 project skeleton, install all dependencies, configure tooling (ESLint, Vitest, TypeScript), and set up the CLAUDE.md / SessionStart hook so all future sessions start with quality gates.

**Dependencies**: None (first phase).

### Session 0.1 — Project Initialization and Module Installation

**Scope**: Create the Nuxt 4 project, install all npm dependencies, configure `nuxt.config.ts` with all modules, set up `package.json` scripts, create the directory skeleton, and write the initial `tsconfig.json`.

**Key files created**:
- `/package.json` — all dependencies and scripts (`dev`, `build`, `start`, `preview`, `test`, `typecheck`, `lint`, `lint:fix`, `format`, `verify`, `db:generate`, `db:migrate`, `db:seed`, `db:reset`)
- `/nuxt.config.ts` — module registration for `@nuxt/eslint`, `@nuxt/fonts`, `@nuxt/icon`, `@nuxt/image`, `@nuxtjs/plausible`, `@nuxtjs/seo`, `@nuxthub/core`, `@lttr/nuxt-puleo`, `@vueuse/nuxt`, `nuxt-security`, `@nuxt/test-utils`
- `/pnpm-lock.yaml` (generated)
- `/eslint.config.mjs` — ESLint flat config using `@nuxt/eslint`
- `/vitest.config.ts` — Vitest configuration with `@nuxt/test-utils` and `happy-dom`
- `/app/app.vue` — minimal root component
- `/app/app.config.ts`
- `/server/tsconfig.json`
- Empty directory stubs: `app/components/`, `app/composables/`, `app/layouts/`, `app/pages/`, `server/api/`, `server/database/`, `server/middleware/`, `server/utils/`, `shared/types/`, `public/img/`, `scripts/`, `tests/`

**Verification**:
```bash
pnpm install
pnpm dev &  # starts without error
curl -s http://localhost:3000 | grep -q "<div"  # renders HTML
pnpm lint
pnpm typecheck
```

### Session 0.2 — CLAUDE.md Enhancement and SessionStart Hook

**Scope**: Update `CLAUDE.md` with detailed session instructions, coding conventions, and the SessionStart hook pattern. Create a `.claude/` configuration directory with hook scripts. Add a first trivial Vitest test to confirm the test pipeline works.

**Key files created/modified**:
- `/CLAUDE.md` — updated with: coding conventions (Vue 3 `<script setup lang="ts">`, composables naming, server API conventions), session workflow instructions, verification checklist template
- `/tests/setup.ts` — test setup file
- `/tests/app.test.ts` — smoke test that the Nuxt app boots
- SessionStart hook configuration

**Verification**:
```bash
pnpm test
pnpm verify
```

---

## Phase 1: Database Layer and Seed Data

**Goal**: Define the complete database schema with Drizzle ORM, generate and run migrations, create a seed script, and establish the database utility layer.

**Dependencies**: Phase 0 complete.

### Session 1.1 — Drizzle Schema, Migrations, and DB Utility

**Scope**: Define all four tables (`articles`, `news`, `users`, `siteSettings`) in Drizzle ORM schema, configure `@libsql/client` connection, create the database utility (`server/utils/db.ts`), generate Zod schemas from Drizzle tables using `drizzle-zod`, run `db:generate` and `db:migrate`.

**Key files created**:
- `/server/database/schema.ts` — full schema definition:
  - `articles`: `id` (integer PK autoincrement), `title` (text not null), `url` (text unique not null), `content` (text), `requestable` (integer/boolean default 0), `inMenu` (integer/boolean default 0), `author` (text), `datetime` (text, ISO 8601)
  - `news`: `id` (integer PK autoincrement), `title` (text not null), `content` (text), `author` (text), `datetime` (text, ISO 8601)
  - `users`: `id` (integer PK autoincrement), `username` (text unique not null), `password` (text not null), `name` (text), `surname` (text), `nickname` (text), `email` (text), `role` (text default 'registered')
  - `siteSettings`: `key` (text PK unique not null), `value` (text)
- `/server/database/migrations/` — generated migration files
- `/server/utils/db.ts` — database connection singleton, exports `useDrizzle()` composable
- `/shared/types/index.ts` — exported TypeScript types inferred from Drizzle schema
- `/shared/types/validation.ts` — Zod schemas generated via `drizzle-zod`
- `/drizzle.config.ts` — Drizzle Kit configuration

**Verification**:
```bash
pnpm db:generate
pnpm db:migrate
pnpm typecheck
```

### Session 1.2 — Seed Script and Database Tests

**Scope**: Create a comprehensive seed script that populates all tables with realistic Czech-language test data. Write Vitest tests for database operations.

**Key files created**:
- `/scripts/seed.ts` — populates:
  - 3 users (admin, editor, registered) with bcrypt-hashed passwords
  - 5+ articles (including one marked as homepage intro, some with `inMenu: true`)
  - 10+ news items with varying dates
  - Site settings: `siteName`, `contactEmail`, `contactPhone`, `contactAddress`, `googleCalendarId`, `introArticleId`
- `/tests/database/` — test files for schema validation and CRUD operations
- `/server/database/reset.ts` — utility for `db:reset` script

**Verification**:
```bash
pnpm db:reset
pnpm test -- tests/database
pnpm verify
```

---

## Phase 2: Authentication System

**Goal**: Implement `better-auth` with username/password authentication, session management (30-minute expiry), role-based access control, and the sign-in/sign-up/sign-out pages.

**Dependencies**: Phase 1 complete (users table exists and is seeded).

### Session 2.1 — better-auth Server Configuration and Auth API

**Scope**: Configure `better-auth` on the server side, integrate with the Drizzle `users` table, set up session management with 30-minute expiry, create server middleware for auth checking, and establish the auth API routes.

**Key files created**:
- `/server/utils/auth.ts` — `better-auth` instance configuration
- `/server/api/auth/[...all].ts` — catch-all route for better-auth API
- `/server/middleware/auth.ts` — server middleware that attaches session/user to event context
- `/server/utils/requireAuth.ts` — helper that throws 401 if not authenticated
- `/server/utils/requireRole.ts` — helper that checks user role and throws 403 if insufficient
- `/shared/types/auth.ts` — auth-related type definitions

**Verification**:
```bash
pnpm dev &
curl -X POST http://localhost:3000/api/auth/register -H 'Content-Type: application/json' -d '{"username":"test","password":"test1234","name":"Test"}'
curl -X POST http://localhost:3000/api/auth/login -H 'Content-Type: application/json' -d '{"username":"test","password":"test1234"}'
pnpm typecheck
```

### Session 2.2 — Auth Pages and Client Composable

**Scope**: Build the client-side auth composable and the three auth pages (sign-in, sign-up, sign-out), plus the user profile pages (view, edit, change password). All pages in Czech.

**Key files created**:
- `/app/composables/useAuth.ts` — client-side auth state
- `/app/pages/prihlaseni.vue` — sign-in page
- `/app/pages/registrace.vue` — sign-up page
- `/app/pages/odhlasit.vue` — sign-out page
- `/app/pages/profil/[username].vue` — public profile view
- `/app/pages/profil/editor/[username].vue` — profile edit form
- `/app/pages/profil/zmenit-heslo/[username].vue` — password change form
- `/server/api/users/[username].get.ts` — get user profile
- `/server/api/users/[username].put.ts` — update user profile
- `/server/api/users/[username]/password.put.ts` — change password
- `/app/composables/useFlash.ts` — flash message composable (Czech messages)
- `/app/components/ui/FlashMessage.vue` — flash message display component

**Verification**:
```bash
pnpm dev &
# Manual: navigate to /prihlaseni, /registrace, test login flow
pnpm typecheck
pnpm test
```

---

## Phase 3: Layout, Navigation, and Public Pages

**Goal**: Build the site layouts (public + admin), sidebar with navigation/recent news/login status, and all public-facing read-only pages.

**Dependencies**: Phase 2 complete (auth works, flash messages work).

### Session 3.1 — Layouts, Sidebar, and Homepage

**Scope**: Create the default layout with header (hero image rotation area), sidebar (navigation from `inMenu` articles, recent news, login status widget), and footer. Build the homepage that displays the intro article from site settings. Set up the `@lttr/nuxt-puleo` CSS framework integration.

**Key files created**:
- `/app/layouts/default.vue` — main layout with header, sidebar, content area, footer
- `/app/components/ui/AppHeader.vue` — header with hero image rotation
- `/app/components/ui/AppSidebar.vue` — sidebar wrapper
- `/app/components/ui/SidebarNav.vue` — navigation links from articles with `inMenu: true`
- `/app/components/ui/SidebarNews.vue` — recent news (latest 5)
- `/app/components/ui/SidebarLogin.vue` — login status widget
- `/app/components/ui/AppFooter.vue` — footer with site info
- `/app/pages/index.vue` — homepage displaying the intro article
- `/server/api/articles/menu.get.ts` — returns articles with `inMenu: true`
- `/server/api/news/recent.get.ts` — returns latest 5 news items
- `/server/api/settings/[key].get.ts` — get a site setting by key
- `/server/api/settings/index.get.ts` — get all site settings
- `/app/composables/useSiteSettings.ts` — client-side composable for site settings

**Verification**:
```bash
pnpm db:reset
pnpm dev &
# Manual: visit /, verify layout, sidebar content, intro article
pnpm typecheck
pnpm lint
```

### Session 3.2 — Public Content Pages (News, Articles, Contact, Events)

**Scope**: Build all remaining public pages: news list (paginated), article list, article detail (by slug), events page (Google Calendar embed), contact page with form.

**Key files created**:
- `/app/pages/novinky.vue` — paginated news list
- `/app/pages/clanky.vue` — article list
- `/app/pages/clanky/[url].vue` — article detail by slug
- `/app/pages/terminy.vue` — events page with Google Calendar iframe embed
- `/app/pages/kontakt.vue` — contact page with contact form
- `/app/pages/[url].vue` — catch-all route for articles (loads article by slug)
- `/server/api/articles/index.get.ts` — list all articles
- `/server/api/articles/[url].get.ts` — get article by slug
- `/server/api/news/index.get.ts` — list news (paginated)
- `/server/api/contact.post.ts` — handle contact form submission
- `/server/utils/email.ts` — nodemailer SMTP configuration
- `/app/composables/usePagination.ts` — pagination composable
- `/app/components/ui/Pagination.vue` — pagination UI component
- `/app/components/ui/ArticleCard.vue` — article list item
- `/app/components/ui/NewsCard.vue` — news list item

**Verification**:
```bash
pnpm db:reset
pnpm dev &
# Manual: visit /novinky, /clanky, /clanky/some-slug, /terminy, /kontakt
pnpm typecheck
pnpm test
```

---

## Phase 4: Admin Foundation and Article/News CRUD

**Goal**: Build the admin layout, admin dashboard, and full CRUD for articles and news (editor+ role required).

**Dependencies**: Phase 3 complete (public pages work, layout exists).

### Session 4.1 — Admin Layout, Dashboard, and Route Protection

**Scope**: Create the admin layout, admin route middleware (requires editor or admin role), admin dashboard page, and the admin navigation.

**Key files created**:
- `/app/layouts/admin.vue` — admin layout with admin navigation sidebar
- `/app/middleware/admin.ts` — client-side route middleware
- `/app/pages/administrace/index.vue` — admin dashboard
- `/app/components/admin/AdminNav.vue` — admin navigation links
- `/server/api/admin/stats.get.ts` — returns counts for dashboard

**Verification**:
```bash
pnpm dev &
# Manual: try /administrace without login -> redirect
# Login as editor -> access granted
# Login as registered -> access denied
pnpm typecheck
```

### Session 4.2 — Article CRUD (Admin)

**Scope**: Build article management pages: list, create, edit. Introduce TipTap as the rich text editor.

**Key files created**:
- `/app/pages/administrace/clanky/index.vue` — article list with edit/delete links
- `/app/pages/administrace/clanky/editor.vue` — create new article form
- `/app/pages/administrace/clanky/editor/[url].vue` — edit existing article form
- `/app/components/forms/ArticleForm.vue` — article form component
- `/app/components/forms/RichTextEditor.vue` — TipTap editor wrapper component
- `/server/api/articles/index.post.ts` — create article
- `/server/api/articles/[url].put.ts` — update article
- `/server/api/articles/[url].delete.ts` — delete article
- `/server/api/articles/[url]/toggle-menu.patch.ts` — AJAX toggle `inMenu` flag

**Note**: TipTap dependencies: `@tiptap/vue-3`, `@tiptap/starter-kit`, `@tiptap/extension-link`, `@tiptap/extension-image`, `@tiptap/extension-placeholder`, `@tiptap/pm`.

**Verification**:
```bash
pnpm dev &
# Manual: login as editor, navigate to /administrace/clanky
# Create article, edit article, toggle menu, delete article
pnpm typecheck
pnpm test
```

### Session 4.3 — News CRUD (Admin)

**Scope**: Build news management pages. Simpler than articles (no slug, no menu toggle, no requestable flag).

**Key files created**:
- `/app/pages/administrace/novinky/index.vue` — news list with edit/delete links
- `/app/pages/administrace/novinky/editor.vue` — create new news
- `/app/pages/administrace/novinky/editor/[id].vue` — edit existing news
- `/app/components/forms/NewsForm.vue` — news form
- `/server/api/news/index.post.ts` — create news
- `/server/api/news/[id].put.ts` — update news
- `/server/api/news/[id].delete.ts` — delete news

**Verification**:
```bash
pnpm dev &
# Manual: login as editor, /administrace/novinky — create, edit, delete
pnpm typecheck
pnpm test
```

---

## Phase 5: Admin Features — Users, Header Images, Settings

**Goal**: Complete all remaining admin functionality: user management (admin only), header image management, site settings, and contact settings.

**Dependencies**: Phase 4 complete.

### Session 5.1 — User Management (Admin Only)

**Scope**: Build the user management page where admins can view all users, change roles, and delete users (via AJAX).

**Key files created**:
- `/app/pages/administrace/uzivatele.vue` — user list with role dropdowns and delete buttons
- `/server/api/users/index.get.ts` — list all users (admin only)
- `/server/api/users/[username].delete.ts` — delete user (admin only, AJAX)
- `/server/api/users/[username]/role.patch.ts` — change user role (admin only)
- `/app/components/admin/UserRow.vue` — user row with role selector and delete confirmation

**Verification**:
```bash
pnpm dev &
# Manual: login as admin, /administrace/uzivatele
# Change role, delete user, verify non-admin cannot access
pnpm typecheck
```

### Session 5.2 — Header Images, Site Settings, Contact Settings

**Scope**: Build header image management (upload, list, delete via AJAX, hero rotation), site settings page, and contact settings page. Integrate NuxtHub Blob Storage for image uploads.

**Key files created**:
- `/app/pages/administrace/hlavicka.vue` — header image management
- `/app/pages/administrace/web.vue` — site settings form
- `/app/pages/administrace/kontakty.vue` — contact settings form
- `/server/api/upload/header-image.post.ts` — upload header image to NuxtHub Blob
- `/server/api/upload/header-images.get.ts` — list header images
- `/server/api/upload/header-image/[id].delete.ts` — delete header image
- `/server/api/settings/index.put.ts` — bulk update site settings (admin only)
- `/app/components/admin/HeaderImageCard.vue` — image card with delete button
- `/app/components/forms/ImageUpload.vue` — reusable image upload component

**Note**: Update `AppHeader.vue` (from Phase 3) to fetch header images from blob storage and rotate them.

**Verification**:
```bash
pnpm dev &
# Manual: login as admin
# /administrace/hlavicka — upload image, verify rotation, delete image
# /administrace/web — edit settings, verify on public site
# /administrace/kontakty — edit contact info, verify on /kontakt
pnpm typecheck
pnpm test
```

---

## Phase 6: Article Image Uploads and Remaining Integration

**Goal**: Add image upload support within the article rich text editor, implement remaining cross-cutting features, and ensure all AJAX interactions work correctly.

**Dependencies**: Phase 5 complete.

### Session 6.1 — Article Image Uploads and Editor Polish

**Scope**: Add image upload capability to the TipTap rich text editor (upload via button, insert into content).

**Key files created/modified**:
- `/server/api/upload/article-image.post.ts` — upload article image to NuxtHub Blob
- Update `/app/components/forms/RichTextEditor.vue` — add image upload button
- `/app/components/forms/ImageUploadDialog.vue` — modal for selecting and uploading an image

**Verification**:
```bash
pnpm dev &
# Manual: create/edit article, upload image via editor, verify it displays
pnpm typecheck
```

### Session 6.2 — Integration Testing and Edge Cases

**Scope**: Write comprehensive integration tests, handle edge cases (404 pages, error boundaries, empty states), add SEO meta tags.

**Key files created**:
- `/app/error.vue` — custom error page (404, 500)
- `/app/components/ui/EmptyState.vue` — empty state component
- `/tests/integration/` — integration tests:
  - `auth.test.ts` — registration, login, logout flow
  - `articles.test.ts` — article CRUD API tests
  - `news.test.ts` — news CRUD API tests
  - `permissions.test.ts` — role-based access control tests
- Update page components with `useHead()` / `useSeoMeta()` for SEO meta tags
- `/app/plugins/seo.ts` — global SEO defaults

**Verification**:
```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm build  # verify production build succeeds
```

---

## Phase 7: Production Readiness and Deployment

**Goal**: Final polish, security hardening, deployment configuration, and comprehensive verification.

**Dependencies**: Phase 6 complete.

### Session 7.1 — Security, Performance, and Deployment Config

**Scope**: Configure `nuxt-security` module headers, set up Coolify + nixpacks deployment configuration, add environment variable documentation, configure Plausible analytics.

**Key files created**:
- `/nixpacks.toml` — deployment configuration for Coolify
- `/.env.example` — documented environment variables
- Update `/nuxt.config.ts` — `nuxt-security` configuration
- `/server/middleware/rateLimit.ts` — rate limiting for auth and contact form endpoints
- Update `CLAUDE.md` — final version with complete development workflow

**Verification**:
```bash
pnpm verify  # lint + typecheck + test
pnpm build
pnpm preview &
# Manual: verify all pages work in production mode
```

### Session 7.2 — Final Walkthrough and Documentation

**Scope**: Comprehensive manual testing of all flows, fix any remaining issues, write a README.md with setup instructions.

**Key files created/modified**:
- `/README.md` — project README with setup instructions, development workflow, deployment guide
- Final CLAUDE.md updates

**Verification**:
```bash
pnpm verify
pnpm build
```

---

## Cross-Cutting Concerns and Design Decisions

### SessionStart Hook Strategy

The SessionStart hook (configured in Session 0.2) should:
1. Run `pnpm install` if `node_modules` is missing.
2. Run `pnpm db:migrate` to ensure the database schema is current.
3. Run `pnpm typecheck` to verify the codebase compiles.
4. Read the CLAUDE.md for session-specific instructions.

### Rich Text Editor Approach

TipTap is introduced in Session 4.2 as a self-contained component:
- **Why Session 4.2**: The editor is only needed when article CRUD is built.
- **Why TipTap**: Most widely used Vue 3 rich text editor, excellent TypeScript support, modular.
- **Isolation**: `RichTextEditor.vue` encapsulates all TipTap logic. Other components interact via `v-model`.
- **Image upload in editor**: Deferred to Session 6.1 to keep Session 4.2 focused.

### Database Seeding Strategy

Seed data (Session 1.2):
- 3 users covering all roles with known passwords for testing.
- Sufficient articles and news to test pagination.
- All site settings pre-populated.
- Czech-language content throughout.

The `db:reset` script enables any session to start with a clean, known state.

### CLAUDE.md Evolution

Updated at three key points:
1. **Session 0.2**: Initial coding conventions and session workflow.
2. **Session 4.1**: Admin-specific patterns.
3. **Session 7.2**: Final version with complete documentation.

### Session Sizing Rationale

- **Schema/infrastructure sessions** (0.1, 0.2, 1.1, 1.2, 2.1): Many small files, well-documented patterns.
- **Page-heavy sessions** (3.1, 3.2, 4.2): Multiple Vue components and pages, 4-8 components per session.
- **Feature sessions** (5.1, 5.2, 6.1): Well-bounded features, smaller scope.
- **Polish sessions** (6.2, 7.1, 7.2): Cross-cutting work, small focused changes across many files.

---

## Summary Table

| Phase | Sessions | Focus | Key Outcome |
|-------|----------|-------|-------------|
| 0 | 0.1, 0.2 | Project scaffolding, tooling | Empty Nuxt app that builds and passes lint/typecheck/test |
| 1 | 1.1, 1.2 | Database schema, seed data | 4 tables, migrations, seed script, DB tests |
| 2 | 2.1, 2.2 | Authentication | Login/register/logout, profiles, role checking |
| 3 | 3.1, 3.2 | Layouts and public pages | Full public site with all pages, sidebar, pagination |
| 4 | 4.1, 4.2, 4.3 | Admin CRUD | Admin layout, article CRUD with rich text, news CRUD |
| 5 | 5.1, 5.2 | Admin features | User management, header images, site/contact settings |
| 6 | 6.1, 6.2 | Integration and polish | Editor image uploads, integration tests, SEO, error pages |
| 7 | 7.1, 7.2 | Production readiness | Security, deployment config, documentation |

**Total: 7 phases, 18 sessions.**

---

## Critical Files for Implementation

- `/server/database/schema.ts` — Core data model; all 4 tables defined here; referenced by every API route and validation schema
- `/nuxt.config.ts` — Central configuration for all Nuxt modules; modified in nearly every phase
- `/app/composables/useAuth.ts` — Client-side auth state management; gates access to admin routes
- `/app/components/forms/RichTextEditor.vue` — TipTap editor wrapper; most complex single component; reused by both article and news editors
- `/CLAUDE.md` — Session orchestration file; coding conventions, verification checklists, and session-specific instructions
