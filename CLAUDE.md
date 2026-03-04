# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

Čtyřiadvacítka — backward engineering and rewrite of a PHP/Nette/MySQL web application.

## Project Structure

- `.aiwork/` — AI work artifacts (plans, research, specs)
- `run-backward-engineering.sh` — automated backward engineering runner (uses Claude Code headless sessions)
- `source/` — original PHP application source (cloned from GitLab, gitignored)

## AI Work

The `.aiwork/` folder follows the aiwork folder protocol for organizing AI artifacts by task.

Do not ignore the `.aiwork/` directory — it is committed for traceability.

## Git Workflow

After pushing changes to a branch, always provide the PR URL in this format:

`https://github.com/lttr/ctyriadvacitka/compare/claude/<branch-name>`
