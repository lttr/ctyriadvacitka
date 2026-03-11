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
- **Article attachments/images upload UI** — PRD §7.8 and §8.9 specify a separate "Article images upload form" on the article editor page with label "Přidat nové obrázky" and text "Soubory se objeví v přílohy". The pages don't show this section.

---

## PRD §3 — News System

**Implemented Correctly:**
- News CRUD operations (`/api/news` GET, POST, PUT, DELETE)
- News listing with pagination (5 items per page)
- News display on homepage and `/novinky` pages
- Author field auto-population
- Full HTML content rendering

**Missing Entirely:**
- **News attachments/images upload UI** — PRD §8.10 specifies article images upload form should appear on news editor page too.

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

**No Issues:**
- User role management UI uses three side-by-side buttons (Uživatel / Redaktor / Administrátor) with active role highlighted in green, matching PRD §6.7.

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

**No Issues:**
- Article "Vytvořit stránku" button on error page — When showing 404 for `/clanek/[url]` and user is editor, a "Vytvořit stránku" button links to article editor pre-filled with the requested URL, matching PRD §8.3.

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

**No Issues:**
- Article/News datetime input fields use native HTML `<input type="date">` which provides built-in validation

---

## PRD §10 — SEO/Meta

**Implemented Correctly:**
- Page titles with SEO meta tags (`useSeoMeta()`)
- Meta descriptions on pages
- Semantic HTML structure

**Missing Entirely:**
- Sitemap generation (PRD §10 mentions it should exist)

---

## Recently Resolved

| # | Item | Resolution |
|---|------|------------|
| 1 | WYSIWYG editor for article/news content | Implemented with TipTap (`@tiptap/vue-3`, `@tiptap/starter-kit`, `@tiptap/extension-link`). Reusable `RichTextEditor.client.vue` component replaces plain `<textarea>` in all 4 editor forms. Toolbar: bold, italic, headings, lists, blockquote, link, undo/redo. |
| 2 | Missing datetime input in article editor | Added `<input type="date">` to both create and edit article forms. Defaults to today's date on create. Converts to ISO string for API. |
| 3 | Missing datetime input in news editor | Added `<input type="date">` to both create and edit news forms. Same approach as articles. |
| 4 | User role toggles are `<select>` not buttons | Replaced `<select>` with three side-by-side buttons (Uživatel / Redaktor / Administrátor) with active role highlighted in green. |
| 5 | Error page missing "Vytvořit stránku" button | Added button on 404 error page for editors when the URL matches `/clanek/[url]`. Links to article editor pre-filled with the requested URL slug. |

---

## Key Functional Gaps Summary

| # | Gap | Severity | PRD Reference | Status |
|---|-----|----------|---------------|--------|
| 1 | Missing datetime input in article editor | **Critical** | §7.6, §8.9 | **Resolved** |
| 2 | Missing datetime input in news editor | **Critical** | §7.7, §8.10 | **Resolved** |
| 3 | Missing article attachments upload UI | **High** | §7.8, §8.9 | Open |
| 4 | Missing news attachments upload UI | **High** | §8.10 | Open |
| 5 | User role toggles are `<select>` not buttons | **Medium** | §6.7 | **Resolved** |
| 6 | Error page missing "Vytvořit stránku" button | **Medium** | §8.3 | **Resolved** |
| 7 | No sitemap generation | **Low** | §10 | Open |

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
