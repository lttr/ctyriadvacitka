# PRD vs Implementation — Gap Analysis

Date: 2026-03-11

## Overview

Comprehensive audit of the PRD (`.aiwork/2026-03-03_specification/prd.md`) against the current codebase to identify functional gaps, missing features, and deviations from specification.

---

## PRD §2 — Article System

**Implemented Correctly:**
- Article CRUD operations via `/api/articles` endpoints (GET, POST, PUT, DELETE)
- Requestable flag support (`requestable` boolean field)
- Menu visibility toggle (`inMenu` flag) with `/api/articles/[url]/toggle-menu` endpoint
- Article listing with pagination (10 items per page, configurable)
- Article detail page showing full HTML content
- Editor-only access controls via middleware (`editor`, `admin` roles)
- Menu articles fetching (`/api/articles/menu` endpoint)
- Non-requestable articles hidden from non-editors
- Three default URL slugs work: `uvod`, `chyba`, and others

**Missing Entirely:**
- **Article datetime input field** in article editor forms (`/administrace/clanky/novy`, `/administrace/clanky/[url]`) — PRD §7.6 requires a "Datum" field with `j.n.Y` format (e.g., `5.3.2026`). Currently, the form has no datetime input; the API receives `new Date().toISOString()` (current timestamp) automatically from the frontend.
- **Article attachments/images upload UI** — PRD §7.8 and §8.9 specify a separate "Article images upload form" on the article editor page with label "Přidat nové obrázky" and text "Soubory se objeví v přílohy". The pages don't show this section.

**Partially Implemented:**
- Article creation form — Missing datetime input field (§7.6)
- Edit article form — Same datetime field missing

---

## PRD §3 — News System

**Implemented Correctly:**
- News CRUD operations (`/api/news` GET, POST, PUT, DELETE)
- News listing with pagination (5 items per page)
- News display on homepage and `/novinky` pages
- Author field auto-population
- Full HTML content rendering

**Missing Entirely:**
- **News datetime input field** — PRD §7.7 specifies "Datum" field with `j.n.Y` format. The news editor forms (`/administrace/novinky/novy`, `/administrace/novinky/[id]`) do not include a datetime input. Currently, `new Date().toISOString()` is sent from the frontend (current timestamp).
- **News attachments/images upload UI** — PRD §8.10 specifies article images upload form should appear on news editor page too.

**Partially Implemented:**
- News editor forms — Missing datetime input field entirely

---

## PRD §4 — Header Images

**Implemented Correctly:**
- Header image management page at `/administrace/hlavicka` works
- Upload functionality with file input and FormData handling
- List display with previews and delete buttons
- AJAX deletion with flash messages (`"Obrázek odstraněn."`)
- File filtering accepts JPEG, PNG, WebP, GIF (PRD says JPEG, PNG, GIF; WebP is extra)
- Random image selection endpoint (`/api/header-images/random`)

**Deviations from Spec:**
- WebP format accepted (not in PRD, but likely intentional enhancement)

---

## PRD §5 — User Management

**Implemented Correctly:**
- Registration (`/registrace`) with username, password, email validation
- Sign-in (`/prihlaseni`) with username/password
- Account settings (`/ucet`) — profile edit with all required fields
- Password change (`/ucet/zmenit-heslo`) with current password verification
- Admin user management (`/administrace/uzivatele`) with role toggles
- User deletion endpoint
- User role change endpoint (`/api/users/[username]/role` PATCH)
- Three-role system: registered, editor, admin

**Minor Issues:**
- User role management UI uses `<select>` dropdown instead of the "three side-by-side buttons" described in PRD §6.7. PRD specifies: "Three side-by-side buttons: `Uživatel` / `Redaktor` / `Administrátor`" with active role highlighted in green. Implementation uses a `<select>` element instead.

---

## PRD §6 — Layout/Navigation

**Implemented Correctly:**
- Navbar component (`AppNavbar.vue`) with logo and dynamic article links
- Hero section with random image rotation
- Footer (`AppFooter.vue`) with links
- Flash messages with 5-second auto-dismiss
- Sponsor logos section
- Responsive layouts (sidebars, main content)
- Mobile hamburger menu support in navbar

**Missing Entirely:**
- **Article "Vytvořit stránku" button** — PRD §8.3 specifies: "If showing error page and user is editor: show 'Vytvořit stránku' button linking to article editor pre-filled with the requested URL". The error page (`chyba` article) display doesn't show this button when no article is found.

---

## PRD §7 — Admin Panel

**Implemented Correctly:**
- Admin dashboard (`/administrace`) with stats cards
- Web properties form (web name, description, contact email)
- Contact settings form (contact persons with name, role, nickname, phone, email, photo)
- Header images management
- Article list management
- News list management
- User management

---

## PRD §8 — Access Control

**Implemented Correctly:**
- `loginRequired` middleware (`auth.ts`)
- `editorRequired` middleware (`admin.ts`) — checks for editor OR admin
- `adminRequired` middleware (`admin.ts`) — checks for admin only
- Proper role checks in API endpoints
- Session-based authentication via `/api/auth/session`

---

## PRD §9 — Forms & Validation

**Implemented Correctly:**
- Sign-in form validation (required username, password)
- Registration form validation (username min 3, password min 6, email required)
- Contact form validation (name, email, message required; message min 10 chars via schema)
- Account settings form validation (username, email required)
- Password change form validation (all fields required, password match)
- Article editor form validation (title, URL required)
- News editor form validation (title required)
- Header image upload validation (JPEG/PNG/GIF, max 4MB)

**Missing Entirely:**
- Article/News datetime validation — No datetime input field exists, so no validation possible

---

## PRD §10 — SEO/Meta

**Implemented Correctly:**
- Page titles with SEO meta tags (`useSeoMeta()`)
- Meta descriptions on pages
- Semantic HTML structure

**Missing Entirely:**
- Sitemap generation (PRD §10 mentions it should exist)

---

## Key Functional Gaps Summary

| # | Gap | Severity | PRD Reference |
|---|-----|----------|---------------|
| 1 | Missing datetime input in article editor | **Critical** | §7.6, §8.9 |
| 2 | Missing datetime input in news editor | **Critical** | §7.7, §8.10 |
| 3 | Missing article attachments upload UI | **High** | §7.8, §8.9 |
| 4 | Missing news attachments upload UI | **High** | §8.10 |
| 5 | User role toggles are `<select>` not buttons | **Medium** | §6.7 |
| 6 | Error page missing "Vytvořit stránku" button | **Medium** | §8.3 |
| 7 | No sitemap generation | **Low** | §10 |

---

## What Works Well

1. Core CRUD operations for articles and news
2. User authentication and role-based access control
3. Responsive layout with navbar, hero, footer, sidebars
4. Admin dashboard with statistics
5. Contact form with leader cards
6. Pagination on news and article lists
7. Flash message system with auto-dismiss
8. File uploads (header images) working correctly
9. Schema correctly set up with all required fields
10. Settings stored as key-value pairs in SiteSetting table
