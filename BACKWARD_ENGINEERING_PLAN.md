# Backward Engineering Plan — Čtyřiadvacítka

## Goal

Capture **everything** about the current PHP/Nette/MySQL application in a
tech-agnostic way, so that:

- Any developer could rebuild the app in any stack without access to the
  original source
- Nothing is lost — every behavior, rule, edge case, and implicit convention is
  recorded
- Each document is small enough to fit in a single context window (~50-80 KB)
- Machine-readable parts (schema, routes, permissions) use YAML for precision
- Behavioral descriptions use prose for nuance

---

## Principles

1. **Completeness over brevity** — if in doubt, capture it
2. **Tech-agnostic** — no PHP/Nette/MySQL-specific concepts; describe *what*,
   not *how it's implemented*
3. **Verifiable** — each document includes a checklist to confirm nothing was
   missed
4. **Cross-referenced** — documents reference each other by ID where concepts
   overlap (e.g., a form references the route it lives on and the data entity
   it modifies)

---

## Documents to Produce

Each document lives in `docs/backward-engineering/` as a separate file.

### 1. `data-model.yaml` — Database Schema & Entities

Captures every table, column, type, constraint, relationship, and default.

```
Structure per entity:
  - entity name (tech-agnostic, e.g., "Article" not "article table")
  - fields:
      - name
      - type (generic: string, text, integer, boolean, datetime, email)
      - constraints (required, unique, max_length, default, etc.)
      - description (what this field represents)
  - relationships (if any foreign keys or implicit references exist)
  - indexes
  - notes (any implicit behavior, e.g., "url is used as slug for routing")
```

**Source files to inspect:**
- `sql/lamp.sql`
- All `*Manager.php` model files (they may reveal implicit relationships or
  column usage not visible in the schema)

**Verification:** Every column in every CREATE TABLE must appear. Every column
constant in every Manager must map to a documented field.

---

### 2. `business-logic.yaml` — Operations & Services

Captures every operation the application can perform on data.

```
Structure per operation:
  - id (e.g., "article.create", "user.change_password")
  - entity it operates on
  - type: create | read | update | delete | other
  - inputs (what data it needs, with types and validation)
  - behavior (step-by-step what happens, including edge cases)
  - side effects (e.g., "converts date format from DD.MM.YYYY to datetime")
  - authorization required (reference to permission in auth doc)
  - error cases (what can go wrong and what happens)
```

**Source files to inspect:**
- `app/CoreModule/model/ArticleManager.php`
- `app/CoreModule/model/NewsManager.php`
- `app/CoreModule/model/UserManager.php`
- `app/AdminModule/model/ImageManager.php`
- `app/model/BaseManager.php`
- All presenter action methods (they sometimes contain logic beyond the model)

**Verification:** Every public method in every Manager must map to a documented
operation. Every presenter action that modifies data must also be captured.

---

### 3. `auth.yaml` — Authentication & Authorization

Captures the full auth system: how users log in, how roles work, what each role
can do.

```
Structure:
  authentication:
    - method (username + password)
    - password hashing approach (bcrypt via framework)
    - session duration
    - login flow (step by step)
    - error cases

  roles:
    - role name
    - inherits from
    - description

  permissions:
    - role
    - resource
    - allowed actions
    - notes

  role_hierarchy_diagram: (text-based tree)
```

**Source files to inspect:**
- `app/CoreModule/model/AuthenticatorManager.php`
- `app/CoreModule/model/AuthorizatorManager.php`
- `app/presenters/BasePresenter.php` (logInRequired, editorPermissionsRequired,
  adminPermissionsRequired)
- `app/config/config.neon` (session config)

**Verification:** Every role in AuthorizatorManager must appear. Every
resource+action permission must appear. Every access control check in presenters
must map to a documented permission.

---

### 4. `routes.yaml` — URL Structure & Navigation

Captures every URL the application responds to and what happens.

```
Structure per route:
  - url pattern
  - method (GET/POST)
  - description (what the user sees/does at this URL)
  - requires_auth (true/false)
  - required_role (if restricted)
  - references:
      - form (if the page contains a form → reference to forms doc)
      - operation (if the page triggers an operation → reference to
        business-logic doc)
      - view (reference to views doc)
```

**Source files to inspect:**
- `app/router/RouterFactory.php`
- All presenter action/render methods (to understand what each route does)

**Verification:** Every route in RouterFactory must appear. Every presenter
action method must map to at least one route.

---

### 5. `forms.yaml` — Forms & User Input

Captures every form in the application.

```
Structure per form:
  - id (e.g., "article_editor", "sign_in")
  - purpose
  - fields:
      - name
      - type (text, textarea, password, email, file, select, checkbox, hidden)
      - label
      - required (true/false)
      - validation rules
      - default value
  - submit_action (what operation is triggered → reference business-logic doc)
  - success_behavior (redirect? flash message? what text?)
  - error_behavior
  - used_on_routes (→ reference routes doc)
```

**Source files to inspect:**
- All files in `app/factories/`:
    - ArticleEditorFormFactory.php
    - ArticleImagesFormFactory.php
    - ChangePasswordFormFactory.php
    - ContactFormFactory.php
    - HeaderImagesFormFactory.php
    - ImageUploadFormFactory.php
    - NewsEditorFormFactory.php
    - SignInFormFactory.php
    - SignUpFormFactory.php
    - UserEditorFormFactory.php
    - WebPropertiesFormFactory.php
    - BaseFormFactory.php

**Verification:** Every form factory file must produce exactly one documented
form. Every form field in the factory must appear in the doc.

---

### 6. `views.yaml` — Pages & UI Structure

Captures what every page displays, its layout, and data dependencies.

```
Structure per view:
  - id (e.g., "article.detail", "admin.article_list")
  - route (→ reference routes doc)
  - layout (which layout template it extends)
  - data_dependencies (what data from the backend it needs)
  - ui_components:
      - description of each visual block
      - dynamic content (what variables are rendered)
      - conditional rendering (what's shown/hidden based on role, state, etc.)
  - interactive_behaviors (AJAX calls, JS interactions)
  - links_to (what other views this page links to)
```

**Source files to inspect:**
- All `.latte` template files in:
    - `app/CoreModule/templates/`
    - `app/AdminModule/templates/`
    - `app/templates/`
- All presenter `render*` and `beforeRender` methods (they set template
  variables)

**Verification:** Every `.latte` file must map to a documented view. Every
template variable set in a presenter must appear in the view's
data_dependencies.

---

### 7. `file-operations.yaml` — File System & Media Handling

Captures all file upload, storage, and serving behavior.

```
Structure:
  - directories used (and what they store)
  - upload operations:
      - what can be uploaded
      - file type restrictions
      - size limits
      - where files are stored
      - naming conventions
  - delete operations
  - how files are served (direct URL? through PHP?)
```

**Source files to inspect:**
- `app/AdminModule/model/ImageManager.php`
- `app/factories/HeaderImagesFormFactory.php`
- `app/factories/ArticleImagesFormFactory.php`
- `app/factories/ImageUploadFormFactory.php`
- `www/img/` directory structure
- `www/prilohy/` directory

**Verification:** Every file operation in ImageManager must be documented. Every
directory under `www/` that stores uploaded content must be listed.

---

### 8. `config-and-infra.yaml` — Configuration & Deployment

Captures how the app is configured, wired, and deployed.

```
Structure:
  environment:
    - required services (database, web server, PHP version)
    - environment variables / config values needed
  di_container:
    - all registered services and their dependencies
  frontend_build:
    - JS/CSS dependencies and how they're bundled
    - build commands
  deployment:
    - Docker setup (Dockerfile, docker-compose)
    - Kubernetes manifests
    - FTP deployment config
  parameters:
    - key-value parameters stored in DB (parameters table)
    - what each one controls
```

**Source files to inspect:**
- `app/config/config.neon`
- `app/CoreModule/config/config.neon`
- `docker-compose.yml`
- `Dockerfile`
- `k8s/*.yaml`
- `package.json`
- `composer.json`

**Verification:** Every service in config.neon must appear. Every K8s manifest
must be summarized.

---

## Execution Order

The documents have dependencies — some reference others. Produce them in this
order:

```
Phase 1 (no dependencies):
  1. data-model.yaml        — foundation, referenced by everything
  2. auth.yaml              — referenced by routes and forms

Phase 2 (depends on Phase 1):
  3. business-logic.yaml    — references data-model, auth
  4. routes.yaml            — references auth

Phase 3 (depends on Phase 2):
  5. forms.yaml             — references business-logic, routes
  6. views.yaml             — references routes, forms, data-model

Phase 4 (independent, can be done anytime):
  7. file-operations.yaml   — mostly standalone
  8. config-and-infra.yaml  — mostly standalone
```

---

## Process per Document

For each document:

1. **List source files** — identify every source file that contributes to this
   document
2. **Read systematically** — go through each source file, extracting relevant
   information line by line
3. **Draft** — write the YAML/prose document
4. **Cross-reference** — add references to other documents where concepts
   overlap
5. **Verify** — run through the verification checklist specific to that document
6. **Gap check** — explicitly ask: "What could be missing? What implicit
   behavior might not be in the source code?"

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Implicit behavior not in code (e.g., `.htaccess` rewrite rules, server config) | Check all non-PHP files: `.htaccess`, Apache config, Docker entrypoint |
| Template logic that affects behavior (conditionals, loops) | Read every `.latte` file, not just the presenters |
| JavaScript behavior not captured | Check all `.js` files and inline scripts in templates |
| Database-level defaults or triggers | Check the full SQL dump, not just CREATE TABLE |
| Form validation that happens client-side only | Check both form factory PHP and any JS validation |
| Hardcoded values in code (magic strings, URLs, paths) | Grep for hardcoded strings during business-logic extraction |
| The `parameters` table (key-value config in DB) | Document every known key and what it controls |

---

## Completeness Matrix

After all documents are produced, create a final cross-reference matrix:

```
completeness-matrix.yaml:
  - Every source file → which document(s) captured it
  - Every route → form + view + operation it connects to
  - Every entity field → which forms write to it, which views display it
  - Every permission → which routes enforce it
```

Any gap in this matrix = something was missed.
