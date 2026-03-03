# Čtyřiadvacítka

Backward-engineering documentation project for a PHP/Nette CMS application. This repository contains tech-agnostic specifications extracted from the original source code — not the source code itself.

## Repository Structure

- `docs/backward-engineering/` — YAML specifications (data model, auth, routes, forms, views, etc.)
- `BACKWARD_ENGINEERING_PLAN.md` — methodology and master plan
- `run-backward-engineering.sh` — automated extraction script (clones source to `source/`)

## Original Application

- **Framework**: Nette 3.0 (PHP 7.4)
- **Database**: MariaDB
- **Architecture**: Multi-module CMS (Core + Admin) with articles, news, users, images

## Principles

- Completeness over brevity — capture everything
- Tech-agnostic — describe _what_, not _how_ in PHP/Nette
- Verifiable — each document includes checklists
- Cross-referenced — documents link by ID
- Machine-readable — YAML for structured data, prose for behavior

## AI-Generated Artifacts

Save plans and work artifacts to `.aiwork/{task-folder}/` per @aiwork-protocol.md.
