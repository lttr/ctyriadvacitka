# Spec Review — Completeness, Contradictions & Simplification

Review of `spec.md` cross-referenced against all backward engineering documents
(01–09).

---

## Verdict

The spec is **solid and thorough**. It covers the data model, auth, all routes,
forms, visual design, business operations, and file storage. The scope decisions
are well-reasoned. What follows are the gaps, contradictions, and simplification
opportunities I found.

---

## 1. Missing Items

### 1.1 Delete operation flash messages

The spec documents flash messages for all save/create operations but omits the
flash messages for delete operations. These are present in the backward
engineering (03-business-logic.yaml, 06-views.yaml):

| Operation | Flash message | Source |
|-----------|--------------|--------|
| Article delete | `Článek byl úspěšně odstraněn.` | admin.article.remove |
| News delete | `Novinka byla úspěšně odstraněna.` | admin.news.remove |
| User delete | `Uživatel byl úspěšně odstraněn.` | admin.user.remove |
| Header image delete | `Obrázek odstraněn.` | admin.headerImages.remove |

**Recommendation:** Add these to §8 or §9.

### 1.2 Sign-in page redirect for logged-in users

The spec §7.2 (sign-up) says "Redirect if logged in: If user is already
authenticated, redirect to profile." But §7.1 (sign-in) doesn't mention this
behavior, even though the original has it (SessionPresenter redirects logged-in
users away from the sign-in page too).

**Recommendation:** Add to §7.1: "Redirect if logged in: redirect to profile."

### 1.3 Sign-out when not logged in

The spec §4.1 logout flow assumes the user IS logged in. The original also
handles the case where someone hits `/odhlasit` without being logged in: flash
`Není přihlášen žádný uživatel.` (info) and redirect to homepage.

**Recommendation:** Add this edge case to §4.1.

### 1.4 Contact photo management

§3.5 defines contact persons with a `photo` field (filename). §10.1 lists the
`contact-photos/` directory. But there's no upload form or management UI for
contact photos — the original had these as static files managed via FTP.

**Recommendation:** Explicitly state that contact photos are static assets
managed outside the CMS (uploaded manually or via deployment). Or, if you want
to make them manageable, add a contact photo upload to §7.11.

### 1.5 Google Maps embed details

§8.4 says "Embedded Google Maps iframe showing clubhouse location" but doesn't
specify the embed URL, coordinates, or whether this is configurable. In the
original, this was hardcoded in the template.

**Recommendation:** Either note that the Maps embed is hardcoded static content,
or make the embed URL a SiteSetting if you want it configurable.

### 1.6 Ownership enforcement on profile/password routes

§5.1 shows `/profil/editor/[<username>]` and `/profil/zmenit-heslo/<username>`
with "Auth: login" and §7.4/§7.5 note "Users can only edit their own profile."
But the spec doesn't describe the enforcement mechanism — what happens if user A
tries to edit user B's profile?

**Recommendation:** Add an explicit guard: "If the authenticated username does
not match the route's `<username>`, redirect with an appropriate error."

### 1.7 GIF listing gap (original bug)

§9.5 says header images are listed by scanning for `*.png` and `*.jpg`, matching
the original. But §10.2 says GIF uploads are accepted. This means uploaded GIFs
become invisible — they exist on disk but never appear in the management UI or
hero rotation.

**Recommendation:** Either add `*.gif` to the listing scan, or remove GIF from
accepted upload formats. Adding `*.gif` to the scan is the cleaner fix.

---

## 2. Contradictions

### 2.1 Date format: input vs. default

- §7.6 article editor: datetime default is `j.n.Y` format (no leading zeros,
  e.g. `5.3.2026`)
- §11 localization: input format is `d.m.Y` (with leading zeros, e.g.
  `05.03.2026`)

These are different PHP date formats. The original had the same inconsistency —
the form default was `j.n.Y` but the parser expected `d.m.Y`. Both work because
PHP's `DateTime::createFromFormat('d.m.Y', '5.3.2026')` happens to accept
single-digit day/month. But the spec should be explicit.

**Recommendation:** Unify. Use `j.n.Y` everywhere (no leading zeros) — it's
more natural for Czech dates. State that the parser should accept both formats.

### 2.2 Requestable visibility: admin vs editor

- §8.2 (public article list): "Only articles with `requestable = true` shown
  (unless user is admin)"
- §8.3 (article detail): "`requestable = false` (and user is not editor)" →
  show error page
- §8.7 (admin article list): "Non-requestable articles only visible if user is
  editor/admin"

So for the public list, it's admin-only. For the detail page, it's editor+. This
matches the original, but it's illogical — an editor can see a non-requestable
article via direct URL but not find it in the article list. Likely an oversight
in the original.

**Recommendation:** Unify to editor+ everywhere. If an editor can view the
article detail, they should also see it in the list.

### 2.3 News editor submit label

§7.7 says the news editor submit label is `Uložit článek` ("Save article").
This is a copy-paste from the article editor in the original. It should probably
say `Uložit novinku` ("Save news item") — see simplification 3.2.

---

## 3. Simplification Opportunities

### 3.1 Drop the editor landing page

`/administrace/redaktor` (§8.14) is a static page that just displays: "Toto je
rozcestník administrace pro redaktory." It has no navigation value — the admin
navbar already provides links to all editor pages.

**Recommendation:** Drop this route. After login, redirect editors directly to
`/clanky/seznam` (or `/novinky/seznam`). This removes one route, one view, and
one page with no functionality loss.

### 3.2 Fix the news editor submit label

Change `Uložit článek` → `Uložit novinku` in §7.7. This is cruft from the
original's copy-paste.

### 3.3 Make delete operations POST-only

The delete routes (`/administrace/clanky/odstranit/<url>` and
`/administrace/novinky/odstranit/<id>`) use GET requests to perform destructive
operations. This is a well-known anti-pattern (crawlers, prefetch, browser
extensions can trigger them).

**Recommendation:** Handle deletions as POST requests (or via the existing AJAX
mechanism like user delete and header image delete already do). This could
eliminate two standalone delete routes and make all destructive operations
consistent — all via POST/AJAX from the list pages.

### 3.4 Consider dropping public user profiles

`/profil/<username>` is publicly accessible (no auth) and shows name, surname,
nickname, and email. For a small scout troop site, there's no obvious use case
for public profiles — they leak personal info without clear benefit.

**Options:**
- **(a) Restrict to logged-in users only** — low effort, still allows members to
  see each other
- **(b) Drop the public-facing profile entirely** — fold "edit profile" and
  "change password" into an account settings page accessible from the footer
  (logged-in users only)

Option (b) would simplify the routing and remove one public page. The profile
editing and password change forms would remain — just no public profile view.

### 3.5 Consider dropping public registration

The `registered` role has zero permissions beyond `guest`. A registered user can
only: view their profile, edit their profile, and change their password. They
can't create or manage content.

The only value of registration is as a pipeline: public user signs up →
admin promotes them to editor. If this workflow is needed, registration makes
sense. But if editors are created rarely, admin could create accounts directly
(admin creates user with editor role from the user management page — currently
not in the spec but trivial to add).

**Options:**
- **(a) Keep registration** — it's already specified, low cost to implement
- **(b) Drop registration, add "create user" to admin** — removes sign-up form,
  one route, and the `registered` role; simplifies auth to guest/editor/admin

This is a product decision. If troop members benefit from having accounts (even
without editor access), keep registration. If only editors/admins need accounts,
(b) is cleaner.

### 3.6 Unify contact settings with web properties

§7.10 (web properties) manages `webName`, `webDescription`, `contactEmail`.
§7.11 (contact settings) manages `contactInfo` JSON. Both are SiteSettings
managed by admins. They could be a single admin settings page with sections,
rather than two separate forms.

**Recommendation:** Merge into one admin settings page. This avoids the
question of where §7.11's UI lives (currently not tied to any route — the spec
says it's "a form or section" with flexible UI).

---

## 4. Items That Are Fine As-Is

For completeness, these are things I checked and found correct:

- Scope decisions (drop scout/leader roles, drop gallery, drop vestigial
  columns, drop news detail route) — all well-reasoned
- Data model matches BE minus intentionally dropped columns
- All 22+ routes from the original are accounted for (present or explicitly
  dropped)
- Form fields, labels, validation, and flash messages match the BE (except the
  gaps noted above)
- Auth system (roles, guards, template flags) is complete
- Visual design section is detailed enough to implement from
- AJAX operations are all captured
- File storage, upload rules, and directory listing behavior are specified
- Seed data requirements are complete
- Cross-reference appendix (Appendix A) correctly maps routes → forms →
  operations

---

## Summary Table

| # | Type | Severity | Item |
|---|------|----------|------|
| 1.1 | Missing | Medium | Delete flash messages |
| 1.2 | Missing | Low | Sign-in redirect for logged-in users |
| 1.3 | Missing | Low | Sign-out when not logged in |
| 1.4 | Missing | Low | Contact photo management clarification |
| 1.5 | Missing | Low | Google Maps embed details |
| 1.6 | Missing | Medium | Ownership enforcement on profile/password |
| 1.7 | Missing | Low | GIF listing gap (fix or acknowledge) |
| 2.1 | Contradiction | Low | Date format input vs default |
| 2.2 | Contradiction | Medium | Requestable visibility admin vs editor |
| 2.3 | Contradiction | Low | News editor submit label |
| 3.1 | Simplify | Low | Drop editor landing page |
| 3.2 | Simplify | Low | Fix news submit label |
| 3.3 | Simplify | Medium | Make deletes POST-only |
| 3.4 | Simplify | Low | Consider dropping public profiles |
| 3.5 | Simplify | Low | Consider dropping public registration |
| 3.6 | Simplify | Low | Unify contact settings with web properties |
