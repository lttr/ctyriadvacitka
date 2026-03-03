# Čtyřiadvacítka — Application Specification

Tech-agnostic specification for a complete reimplementation. Derived from the
backward engineering in `.aiwork/2026-03-02_backward-engineering/`, with scope
decisions applied.

---

## 1. Product Overview

A **Czech-language content management website** for the 24th Scout Troop in
Hradec Králové. The site serves two purposes:

1. **Public website** — news, articles (static pages), events schedule, contact
   information
2. **Admin panel** — content editors and administrators manage articles, news,
   header images, users, and site settings

The site is primarily informational with low traffic. The target audience is
troop members, parents, and the general public.

---

## 2. Scope Decisions

Changes from the original application (documented in backward engineering):

| Decision | Rationale |
|----------|-----------|
| **Drop** scout/leader roles and parents resource | Dead code from a reverted feature. Simplify to 3 active roles. |
| **Drop** vestigial DB columns: Article.description, News.url, News.description | Never used by application code. |
| **Drop** photo gallery feature | No admin UI; manual server-side management. Can be added later. |
| **Drop** news detail route (`/novinky/<url>`) | Was non-functional in original. News shown only in paginated list. |
| **Add** configurable contact information | Original had hardcoded leader names, phones, emails, and admin email addresses. |
| **Add** configurable admin email recipients | Contact form email recipients should be manageable, not hardcoded. |
| **Keep** events page with Google Calendar integration | Static page with external web component. |
| **Keep** Czech localization throughout | All UI labels, flash messages, and error messages in Czech. |

---

## 3. Data Model

### 3.1 Article

A content page in the CMS. Publicly addressed by its URL slug.

| Field | Type | Required | Unique | Notes |
|-------|------|----------|--------|-------|
| id | integer | auto | yes | Primary key |
| title | string(255) | yes | no | Display title |
| url | string(255) | yes | yes | URL slug — public identifier, used for routing |
| content | text | yes | no | HTML body (rich text) |
| requestable | boolean | no | no | Default true. When false, hidden from public lists (only visible to editors/admins) |
| in_menu | boolean | no | no | Default false. When true, appears in site navigation |
| author | string(255) | no | no | Username of creating/editing user (not a FK) |
| datetime | datetime | yes | no | Publication date. Used for ordering (newest first) |

**Indexes:** PRIMARY(id), UNIQUE(url)

**Behaviors:**
- Articles are always listed ordered by `datetime` DESC
- The `url` field is the primary public identifier (used in routing, deletion,
  menu-visibility toggle)
- Two special articles exist by convention: `uvod` (intro page) and `chyba`
  (not-found error page)
- The `author` field is set automatically to the logged-in user's username on
  save

### 3.2 News

A short news/announcement entry. Simpler than articles — no slug routing, no
menu visibility, no requestability.

| Field | Type | Required | Unique | Notes |
|-------|------|----------|--------|-------|
| id | integer | auto | yes | Primary key |
| title | string(255) | yes | no | Headline |
| content | text | yes | no | HTML body (rich text) |
| author | string(255) | no | no | Username of creating/editing user (not a FK) |
| datetime | datetime | yes | no | Publication date. Used for ordering (newest first) |

**Indexes:** PRIMARY(id)

**Behaviors:**
- News items are always listed ordered by `datetime` DESC
- Lookup and deletion operate by primary key (id)
- The `author` field is set automatically on save

### 3.3 User

A registered user of the system.

| Field | Type | Required | Unique | Notes |
|-------|------|----------|--------|-------|
| id | integer | auto | yes | Primary key |
| username | string(255) | yes | yes | Login name, also used as lookup key |
| password | string(255) | yes | no | Bcrypt hash, never stored in plaintext |
| role | string(255) | yes | no | One of: `registered`, `editor`, `admin`. Default: `registered` |
| name | string(255) | no | no | First name |
| surname | string(255) | no | no | Last name |
| nickname | string(255) | no | no | Informal name / scout name |
| email | string(255) | no | yes | Email address. Unique when provided, nullable |

**Indexes:** PRIMARY(id), UNIQUE(username), UNIQUE(email)

**Behaviors:**
- Password hashing uses bcrypt
- Deletion is by username
- Role display names (Czech): registered → `uživatel`, editor → `redaktor`,
  admin → `administrátor`

### 3.4 SiteSetting

Key-value configuration store for site-wide settings editable at runtime.

| Field | Type | Required | Unique | Notes |
|-------|------|----------|--------|-------|
| key | string(255) | yes | yes | Setting name (logical primary key) |
| value | text | no | no | Setting value |

**Indexes:** UNIQUE(key) or PRIMARY(key)

**Known keys:**

| Key | Purpose | Managed via |
|-----|---------|-------------|
| `webName` | Site title displayed in page `<title>` and header | Web properties form |
| `webDescription` | Site tagline | Web properties form |
| `contactEmail` | Comma-separated email addresses for contact form recipients | Web properties form |
| `contactInfo` | JSON blob of contact persons (see §3.5) | Contact settings form |

### 3.5 Contact Person (embedded in SiteSetting)

Stored as JSON in `SiteSetting.contactInfo`. Array of objects:

```
[
  {
    "name": "Jan Pouchlý",
    "role": "hlavní vedoucí oddílu, vedoucí vlčat",
    "nickname": "Poulík",
    "phone": "+420 ...",
    "email": "...",
    "photo": "poulik.jpg"
  },
  ...
]
```

This replaces the hardcoded contact information from the original.

---

## 4. Authentication & Authorization

### 4.1 Authentication

- **Method:** Username + password form-based login
- **Password storage:** Bcrypt hash (cost 10+)
- **Session:** Server-side, 30-minute inactivity expiration
- **Session identity data:** user id, role, username

**Login flow:**
1. User submits username and password via sign-in form
2. System looks up user by username
3. If not found → error: `Uživatel nenalezen.`
4. Verify password against stored hash
5. If mismatch → error: `Špatné heslo!`
6. On success → create session, redirect to admin dashboard
7. Flash: `Přihlášení proběhlo úspěšně.`

**Logout flow:**
1. Destroy session
2. Flash: `Uživatel úspěšně odhlášen.`
3. Redirect to homepage

### 4.2 Roles

Three active roles with single inheritance:

```
guest (unauthenticated)
  └── registered (default for new accounts)
        └── editor
              └── admin
```

### 4.3 Permissions

| Role | Resource | Actions | Notes |
|------|----------|---------|-------|
| guest | article | view | Public article and news viewing |
| guest | user | view | Public user profiles |
| editor | article | add | Create new articles and news |
| admin | article | edit | Edit/delete any article or news; toggle menu visibility |
| admin | web | edit | Edit site settings, manage header images |
| admin | user | remove | Delete user accounts, change user roles |

### 4.4 Access Guards

Three levels of access protection applied at route level:

1. **loginRequired** — Checks if user is authenticated
   - Failure: redirect to sign-in with flash `Nejste přihlášen!`
2. **editorRequired** — Checks if user has `editor` or `admin` role
   - Failure: redirect with flash `Na tuto akci musíte být redaktor.`
3. **adminRequired** — Checks if user has `admin` role
   - Failure: redirect with flash `Na tuto akci musíte být administrátor.`

### 4.5 Template Flags

These boolean/object values must be available in every page render:

| Flag | Logic | Purpose |
|------|-------|---------|
| `isLoggedIn` | user is authenticated | Show/hide login-dependent UI |
| `loggedUser` | identity object (id, role, username) | Display username, check ownership |
| `isUserAdmin` | role == admin | Show/hide admin-only UI |
| `isUserEditor` | role == editor OR admin | Show/hide editor UI |

---

## 5. Pages & Routes

### 5.1 Public Pages

| Route | Title | Description | Auth |
|-------|-------|-------------|------|
| `/` | Novinky | Homepage — paginated news list (page 1) | none |
| `/novinky[/<page>]` | Novinky | Paginated news list, 5 items per page | none |
| `/clanky[/<page>]` | Články | Paginated article list, 10 items per page | none |
| `/<url>` | *dynamic* | Single article by URL slug (catch-all) | none |
| `/kontakt` | Kontakt | Contact page with form and leader info | none |
| `/terminy` | Termíny akcí | Events page with Google Calendar widget | none |
| `/prihlasit` | Přihlásit | Sign-in form | none |
| `/registrovat` | Registrovat | Registration form | none |
| `/odhlasit` | — | Sign-out (action only, no page) | none |
| `/profil/[<username>]` | *dynamic* | User profile page | none |
| `/profil/editor/[<username>]` | *dynamic* | Edit own profile | login |
| `/profil/zmenit-heslo/<username>` | Změna hesla | Change own password | login |

### 5.2 Admin Pages

| Route | Title | Description | Auth |
|-------|-------|-------------|------|
| `/administrace` | Administrace webu | Admin dashboard — site settings form | admin |
| `/administrace/redaktor` | Rozcestník | Editor landing page (static) | editor |
| `/administrace/obrazky-zahlavi` | Obrázky záhlaví | Header image management | admin |
| `/administrace/uzivatele` | Oprávnění uživatelů | User management (roles, deletion) | admin |
| `/clanky/seznam` | Seznam článků | Article list with management controls | editor |
| `/novinky/seznam` | Seznam novinek | News list with management controls | editor |
| `/administrace/clanky/editor[/<url>]` | Editor článků | Create/edit article | editor |
| `/administrace/clanky/odstranit/<url>` | — | Delete article (action only) | editor |
| `/administrace/novinky/editor/[<id>]` | Editor novinek | Create/edit news | editor |
| `/administrace/novinky/odstranit/<id>` | — | Delete news (action only) | editor |

### 5.3 AJAX Operations

These are inline operations triggered from existing pages (no separate URL):

| Parent page | Operation | Effect |
|-------------|-----------|--------|
| `/clanky/seznam` | Toggle menu visibility | Update article `in_menu` flag |
| `/administrace/uzivatele` | Change user role | Update user `role` |
| `/administrace/uzivatele` | Remove user | Delete user |
| `/administrace/obrazky-zahlavi` | Remove header image | Delete image file |

---

## 6. Layouts & Navigation

### 6.1 Base Layout

The root HTML layout wrapping all pages.

**Contains:**
- HTML `<head>` with meta tags (charset, viewport), Open Sans font, CSS
- Page `<title>`: `{page title} | {webName}`
- Flash message display area (Bulma notification styling by type:
  success/warning/danger/info)
- Main content area (centered column, responsive)
- Sponsor logos section (Královéhradecký kraj, Město Hradec Králové, Nadace
  ČEZ)
- Footer with three navigation columns:
  - Čtyřiadvacítka: links to public pages + dynamic article menu items
  - Organizace: external links (Junák, Skaut HK, Facebook, etc.)
  - Administrace: conditional links based on user role
- Copyright footer
- JavaScript includes
- Analytics integration (Plausible)

### 6.2 Public Layout (extends Base)

- **Navbar**: Logo (logo24.svg) + hamburger menu toggle for mobile
  - Links: Novinky, Termíny, *dynamic article menu items*, Kontakty
- **Hero section**: Random header image from the header images pool, overlaid
  with text "Skautský oddíl" / "Čtyřiadvacítka"

### 6.3 Admin Layout (extends Base)

- **Navbar**: Logo + "Administrace" text
  - Always visible: Články, Novinky
  - Admin-only: Web, Obrázky záhlaví, Uživatelé
  - Back link: "Zpět" → public site
- **Hero section**: Same random header image as public layout

### 6.4 Header Image Rotation

On every page load, one image from the header images pool is randomly selected
and used as the hero background. The pool is managed via the admin header images
page.

### 6.5 Dynamic Menu Items

Articles with `in_menu = true` appear as links in:
- The public navbar (between static nav items)
- The base layout footer navigation

These are loaded on every page render.

---

## 7. Forms

### 7.1 Sign In (`/prihlasit`)

| Field | Type | Label | Validation |
|-------|------|-------|------------|
| username | text | Přihlašovací jméno | required |
| password | password | Heslo | required |

- **Submit label:** Přihlásit
- **On success:** Flash `Přihlášení proběhlo úspěšně.` → redirect to admin
  dashboard
- **On error:** Flash the authentication error message

### 7.2 Sign Up (`/registrovat`)

| Field | Type | Label | Validation |
|-------|------|-------|------------|
| username | text | Přihlašovací jméno | required |
| password | password | Heslo | required |
| passwordAgain | password | Heslo znovu | required, must match `password` |
| email | email | E-mail | required, valid email |

- **Submit label:** Registrovat
- **On success:** Flash `Registrace proběhla úspěšně, nyní se přihlašte.` →
  redirect to sign-in page
- **On error (duplicate):** Flash `Uživatel s tímto přihlašovacím jménem nebo
  e-mailem již existuje.`
- **Password mismatch message:** `Hesla se neschodují!`
- **Behavior:** Hash password, create user with role `registered`
- **Redirect if logged in:** If user is already authenticated, redirect to
  profile

### 7.3 Contact (`/kontakt`)

| Field | Type | Label | Validation |
|-------|------|-------|------------|
| username | text | Vaše jméno | required |
| email | email | Email | required |
| message | textarea | Zpráva | required, min length 10 |

- **Submit label:** Odeslat
- **On success:** Flash `E-mail byl úspěšně odeslán.` → redirect to self
- **On error:** Flash `E-mail se nepodařilo odeslat.`
- **Behavior:** Send email to configured admin recipients (from
  `SiteSetting.contactEmail`). Subject: `Email z BasicRS`. Sender: form email.
- **Min length message:** `Zpráva musí být minimálně %d znaků dlouhá.`
- **Textarea placeholder:** `Vaše zpráva`

### 7.4 User Editor (`/profil/editor/<username>`)

| Field | Type | Label | Validation |
|-------|------|-------|------------|
| user_id | hidden | — | — |
| name | text | Jméno | — |
| surname | text | Příjmení | — |
| nickname | text | Přezdívka | — |
| username | text | Přihlašovací jméno | required |
| email | email | E-mail | required, valid email |
| role | hidden | — | — |

- **Submit label:** Uložit
- **On success:** Flash `Uživatel byl úspěšně editován.` → redirect to user
  profile
- **On error (duplicate):** Flash `Uživatel s tímto jménem nebo emailem již
  existuje.`
- **Pre-filled:** All fields populated from current user data
- **Access:** Users can only edit their own profile

### 7.5 Change Password (`/profil/zmenit-heslo/<username>`)

| Field | Type | Label | Validation |
|-------|------|-------|------------|
| currentPassword | password | Aktuální heslo | required |
| newPassword | password | Nové heslo | required |
| newPasswordAgain | password | Nové heslo znovu | required, must match `newPassword` |

- **Submit label:** Změnit heslo
- **On success:** Flash `Heslo bylo úspěšně změněno.` → redirect to profile
- **On error (wrong current):** Flash `Současné heslo neodpovídá zadanému
  současnému heslu!`
- **Password mismatch message:** `Hesla se neschodují!`
- **Access:** Users can only change their own password

### 7.6 Article Editor (`/administrace/clanky/editor[/<url>]`)

| Field | Type | Label | Validation |
|-------|------|-------|------------|
| article_id | hidden | — | — |
| title | text | Titulek | required |
| url | text | URL | required |
| datetime | text | Datum | required. Default: current date in `j.n.Y` format |
| requestable | checkbox | Zobrazovat v seznamu | Default: true |
| content | textarea (rich text) | Obsah | required |

- **Submit label:** Uložit článek
- **On success:** Flash `Článek byl úspěšně uložen.` → redirect to article
  public page
- **Behavior:** Auto-set author to logged-in user's username. If `article_id`
  is empty → insert new; otherwise → update existing.
- **Rich text:** Content field must use a WYSIWYG editor (e.g. CKEditor,
  TipTap, ProseMirror)
- **Pre-filled:** When editing existing article, all fields populated from DB
- **Date format:** Input as `d.m.Y` (Czech format, e.g. `5.3.2026`), stored
  as datetime

### 7.7 News Editor (`/administrace/novinky/editor/[<id>]`)

| Field | Type | Label | Validation |
|-------|------|-------|------------|
| news_id | hidden | — | — |
| title | text | Titulek | required |
| datetime | text | Datum | required. Default: current date in `j.n.Y` format |
| content | textarea (rich text) | Obsah | required |

- **Submit label:** Uložit článek
- **On success:** Flash `Novinka byla úspěšně uložena.` → redirect to news
  list
- **Behavior:** Same insert/update logic as article editor. Auto-set author.
- **Rich text:** Same WYSIWYG requirement as article editor.
- **Pre-filled:** When editing existing news, all fields populated from DB

### 7.8 Image Upload (Article Attachments)

| Field | Type | Label | Validation |
|-------|------|-------|------------|
| newPictures | multi-file | Přidat nové obrázky (lze více najednou) | required (min 1), JPEG/PNG/GIF only |

- **Submit label:** Přidat
- **Storage:** Files saved to attachments directory under a year-based
  subdirectory (e.g. `attachments/2026/`)
- **Naming:** Original filename preserved
- **Validation message:** `Musíte vybrat nejméně 1 obrázek!` /
  `Obrázek musí být ve formátu JPEG, PNG nebo GIF.`
- **Used on:** Article editor page and news editor page
- **AJAX:** Form submission should not require full page reload

### 7.9 Header Images Upload (`/administrace/obrazky-zahlavi`)

Same fields and validation as §7.8, but:
- **Storage:** Files saved to header images directory
- **On success:** Flash `Obrázek přidán.`
- **AJAX:** Redraws image list and flash messages without full page reload

### 7.10 Web Properties (`/administrace`)

| Field | Type | Label | Validation |
|-------|------|-------|------------|
| webName | text | Jméno webu | required |
| webDescription | text | Popis webu | required |
| contactEmail | text | E-maily pro kontaktní formulář | required |

- **Submit label:** Uložit
- **On success:** Flash `Údaje byly upraveny.`
- **Behavior:** Each field is saved as a key-value pair in SiteSetting
- **Pre-filled:** Current values loaded from SiteSetting
- **AJAX:** Form submission should not require full page reload

### 7.11 Contact Settings (admin)

A form or section for managing the contact persons displayed on the contact
page. Must allow editing the JSON-structured contact data
(`SiteSetting.contactInfo`). The exact UI is flexible — could be a structured
form with repeatable groups or a simpler textarea for the JSON.

**Per contact person:**
- name (string)
- role (string, Czech description of their role)
- nickname (string)
- phone (string)
- email (string)
- photo (string, filename of photo in contacts directory)

---

## 8. Page Behaviors

### 8.1 Homepage / News List (`/`, `/novinky[/<page>]`)

- Display paginated list of news items, 5 per page
- Each item shows: title (h2), formatted date (`j. n. Y`), full HTML content
- Pagination: Previous/Next links (hidden when not applicable)
- Horizontal rule between items

### 8.2 Article List (`/clanky[/<page>]`)

- Display paginated list of article titles as links, 10 per page
- Only articles with `requestable = true` shown (unless user is admin)
- Pagination: Previous/Next links

### 8.3 Article Detail (`/<url>`)

- Display article content as raw HTML
- If article not found or `requestable = false` (and user is not editor):
  show the `chyba` (error) article instead
- If user is editor/admin: show "Edit" button linking to article editor
- If showing error page and user is editor: show "Vytvořit stránku" button
  linking to article editor pre-filled with the requested URL

### 8.4 Contact Page (`/kontakt`)

- Contact form (§7.3)
- Section "Vedení oddílu" with leader cards loaded from
  `SiteSetting.contactInfo`:
  - Each card: photo, name, role description, nickname, phone, email
  - Email addresses should be obfuscated against scrapers (JS-based or
    similar)
- Section "Klubovny" with scout house photo
- Embedded Google Maps iframe showing clubhouse location

### 8.5 Events Page (`/terminy`)

- Static text: `Schůzky jsou každé pondělí od 17:00 do 18:30.`
- Google Calendar events widget (`@lttr/skaut-google-events-table` web
  component or equivalent) displaying events from
  `ctyriadvacitka@gmail.com` calendar with categories: vlčata, skauti, roveři

### 8.6 User Profile (`/profil/<username>`)

- Display: name + surname, nickname, email
- If viewing own profile (logged in, username matches): show action buttons:
  - Upravit údaje → profile editor
  - Změnit heslo → change password
  - Odhlásit → sign out
- If no username provided: redirect to logged-in user's profile, or to news
  list if not logged in

### 8.7 Admin Article List (`/clanky/seznam`)

- "Add new article" button → article editor
- Table of all articles with columns:
  - Title + date + URL
  - View button → article public page
  - Edit button → article editor (visible if admin OR user is the author)
  - Delete button → delete action (visible if admin OR user is the author)
  - Menu visibility toggle (visible if admin OR user is the author):
    - Green "Zobrazeno v menu" when `in_menu = true`
    - Blue "Nezobrazeno v menu" when `in_menu = false`
- Menu toggle is AJAX — updates without full page reload
- Non-requestable articles only visible if user is editor/admin

### 8.8 Admin News List (`/novinky/seznam`)

- "Add new news item" button → news editor
- Table of all news with columns:
  - Title + date
  - Edit button → news editor (visible if admin OR user is the author)
  - Delete button → delete action (visible if admin OR user is the author)

### 8.9 Admin Article Editor (`/administrace/clanky/editor[/<url>]`)

- Article editor form (§7.6)
- Article images upload form (§7.8) below the main form
- Text: `Soubory se objeví v přílohy` with link to attachments directory

### 8.10 Admin News Editor (`/administrace/novinky/editor/[<id>]`)

- News editor form (§7.7)
- Article images upload form (§7.8) below the main form
- Text: `Soubory se objeví v přílohy` with link to attachments directory

### 8.11 Admin Header Images (`/administrace/obrazky-zahlavi`)

- Table of current header images, each row showing:
  - Image preview thumbnail
  - Filename
  - Delete button (AJAX — removes file, redraws list)
- Section "Přidat nové obrázky" with upload form (§7.9)

### 8.12 Admin User Management (`/administrace/uzivatele`)

- Table of all users, each row showing:
  - Username (h2)
  - View profile button → user profile
  - Delete button (AJAX, with ACL check for `user:remove`)
  - Three role toggle buttons: Uživatel / Redaktor / Administrátor
    - Active role highlighted in green, others in blue
    - Clicking a role button changes the user's role (AJAX)
    - Flash message confirms: `Uživatel {username} má nyní roli {czech role
      name}.`

### 8.13 Admin Dashboard (`/administrace`)

- Welcome text: `Vítejte v administraci`
- Web properties form (§7.10)
- Access: admin only

### 8.14 Editor Landing Page (`/administrace/redaktor`)

- Static text: `Toto je rozcestník administrace pro redaktory`
- Access: editor or admin

---

## 9. Business Operations

### 9.1 Article Operations

| Operation | Type | Auth | Behavior |
|-----------|------|------|----------|
| List all articles | read | none | Ordered by datetime DESC |
| List paginated | read | none | Ordered by datetime DESC, with limit/offset |
| Count articles | read | none | Total count for pagination |
| Get by URL slug | read | none | Returns single article or null |
| Save (create/update) | write | editor | Parse datetime from `d.m.Y`, auto-set author. Insert if no id, update if id present |
| Delete | delete | editor | Delete by URL slug |
| Toggle menu visibility | update | editor | Set `in_menu` to given boolean value by URL |
| Get articles in menu | read | none | Return `url → title` map for articles with `in_menu = true` |

### 9.2 News Operations

| Operation | Type | Auth | Behavior |
|-----------|------|------|----------|
| List all news | read | none | Ordered by datetime DESC |
| List paginated | read | none | Ordered by datetime DESC, with limit/offset |
| Count news | read | none | Total count for pagination |
| Get by ID | read | none | Returns single news item or null |
| Save (create/update) | write | editor | Parse datetime from `d.m.Y`, auto-set author. Insert if no id, update if id present |
| Delete | delete | editor | Delete by primary key |

### 9.3 User Operations

| Operation | Type | Auth | Behavior |
|-----------|------|------|----------|
| List all users | read | admin | All users |
| Get by username | read | none | Returns single user or null |
| Get by ID | read | none | Returns single user or null |
| Save (create/update) | write | varies | Insert if no id (registration), update if id present (profile edit) |
| Delete | delete | admin | Delete by username. Requires ACL `user:remove` permission |
| Change password | update | login | Verify current password first. Error if mismatch |
| Change role | update | admin | Update role field by looking up user by username |

### 9.4 Site Setting Operations

| Operation | Type | Auth | Behavior |
|-----------|------|------|----------|
| Get setting | read | none | Fetch value by key. Return null/false if not found |
| Save setting | write | admin | Upsert: insert if key doesn't exist, update if it does |

### 9.5 Header Image Operations

| Operation | Type | Auth | Behavior |
|-----------|------|------|----------|
| List images | read | admin | Scan header images directory for *.png and *.jpg files |
| Upload images | write | admin | Save uploaded file(s) to header images directory. Original filename preserved |
| Delete image | delete | admin | Delete file from disk by filename |

### 9.6 Article Attachment Operations

| Operation | Type | Auth | Behavior |
|-----------|------|------|----------|
| Upload attachments | write | editor | Save file(s) to `attachments/{current_year}/` directory. Create year subdir if needed. Original filename preserved |

### 9.7 Contact Email

| Operation | Type | Auth | Behavior |
|-----------|------|------|----------|
| Send contact email | write | none | Send email from form-provided address to recipients configured in `SiteSetting.contactEmail`. Subject: `Email z BasicRS` |

---

## 10. File Storage

### 10.1 Directories

| Directory | Purpose | Access |
|-----------|---------|--------|
| `header-images/` | Hero/banner images for site header | Public (direct URL). Admin-managed |
| `contact-photos/` | Contact person portrait photos | Public (direct URL). Static |
| `attachments/` | Article attachment images in year subdirs (e.g. `attachments/2026/`) | Public (direct URL). Directory listing enabled |
| `static/` | Logos, favicon, CSS, JS | Public (direct URL). Static |

### 10.2 Upload Rules

- **Accepted formats:** JPEG, PNG, GIF only
- **Size limits:** No application-level limit (server defaults apply)
- **Naming:** Original filename preserved as-is. Files with same name
  silently overwritten
- **Multi-upload:** Supported for both header images and article attachments

### 10.3 Attachments Directory Listing

The attachments directory must have directory listing enabled so that users
can browse to `/attachments/` or `/attachments/2026/` and see a file listing.
This is how editors find attachment URLs to embed in articles.

---

## 11. Localization

The application is entirely in Czech. All UI strings are documented in the
forms section (§7) and page behaviors section (§8).

**Required form-level message:**
- Generic required field: `Povinné pole.`

**Date format:**
- Input: `d.m.Y` (e.g. `5.3.2026`)
- Display: `j. n. Y` (e.g. `5. 3. 2026`)
- Timezone: Europe/Prague

---

## 12. Non-functional Requirements

### 12.1 Design System

- The original uses Skaut Design (a Bulma-based CSS framework for Czech
  Scout organizations). The reimplementation should use a Bulma-compatible
  CSS framework or equivalent that produces the same visual style.
- Responsive design: mobile-first with hamburger menu
- Font: Open Sans (Google Fonts)
- Form styling: Bulma `field`/`control` wrappers, `is-medium` inputs,
  `is-primary` buttons

### 12.2 Analytics

- Plausible Analytics integration (script tag in base layout)

### 12.3 SEO

- Proper `<title>` tags: `{page title} | {webName}`
- Meta viewport, charset
- Semantic HTML

### 12.4 Security

- Bcrypt password hashing (cost 10+)
- Session-based auth with 30-min expiry
- CSRF protection on all forms
- No direct access to application source code (server config)
- File upload validation (MIME type checking for images)
- Email address obfuscation on contact page
- Sanitize header image filenames in delete operations to prevent path
  traversal

### 12.5 Error Handling

- Custom error page using the `chyba` article content
- Maintenance mode capability (503 response with Retry-After header)
- Flash messages for all user-facing operations (styled as Bulma
  notifications)

### 12.6 Deployment

- Must support containerized deployment (Docker/Docker Compose for dev)
- Production deployment target is flexible (the original used Kubernetes
  on `pa200hw2.hailstone.cz` with Let's Encrypt TLS)
- Database seeding with initial data (admin user, intro page, error page,
  default site settings)

---

## 13. Seed Data

The application requires initial data to function:

### 13.1 Required Articles

| URL slug | Title | Purpose |
|----------|-------|---------|
| `uvod` | Úvod | Default intro/landing page |
| `chyba` | Stránka nebyla nalezena | Shown when a URL doesn't match any article |

### 13.2 Required Site Settings

| Key | Default value |
|-----|---------------|
| `webName` | `Čtyřiadvacítka` |
| `webDescription` | `Skautský oddíl` |
| `contactEmail` | *(must be configured)* |
| `contactInfo` | `[]` (empty array) |

### 13.3 Initial Admin User

One admin account must be seeded for first access to the admin panel.

---

## Appendix A: Route → Form → Operation Cross-Reference

| Route | Form(s) | Operations |
|-------|---------|------------|
| `/` | — | news.list_paginated, news.count |
| `/novinky/<page>` | — | news.list_paginated, news.count |
| `/clanky/<page>` | — | article.list_paginated, article.count |
| `/<url>` | — | article.get_by_url |
| `/kontakt` | contact | contact.send_email |
| `/terminy` | — | — |
| `/prihlasit` | sign_in | session.sign_in |
| `/odhlasit` | — | session.sign_out |
| `/registrovat` | sign_up | session.sign_up |
| `/profil/<username>` | — | user.get_by_username |
| `/profil/editor/<username>` | user_editor | user.save |
| `/profil/zmenit-heslo/<username>` | change_password | user.change_password |
| `/administrace` | web_properties | setting.get, setting.save |
| `/administrace/redaktor` | — | — |
| `/administrace/obrazky-zahlavi` | header_images | image.list, image.upload, image.delete |
| `/administrace/uzivatele` | — | user.list_all, user.change_role, user.delete |
| `/clanky/seznam` | — | article.list_all, article.toggle_menu |
| `/novinky/seznam` | — | news.list_all |
| `/administrace/clanky/editor/<url>` | article_editor, article_images | article.get_by_url, article.save, attachment.upload |
| `/administrace/clanky/odstranit/<url>` | — | article.delete |
| `/administrace/novinky/editor/<id>` | news_editor, article_images | news.get_by_id, news.save, attachment.upload |
| `/administrace/novinky/odstranit/<id>` | — | news.delete |
