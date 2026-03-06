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

## Vue/Nuxt Code Conventions

Rules sourced from [lttr/vue-nuxt-rules](https://github.com/lttr/vue-nuxt-rules).

### Vue SFC Structure

- ALWAYS place the `<template>` section at the top of Vue SFC files, before `<script>` and `<style>` sections
- ALWAYS use `<script setup lang="ts">` for component's script section
- PREFER to group by logical concerns rather than grouping by type (data, methods, computed) within components
- ALWAYS use multi-word component names except for Nuxt pages and layouts

### Props & State

- ALWAYS use TypeScript type-based syntax for `defineProps()` instead of runtime PropType declarations
- ALWAYS use type-based syntax for `defineEmits` in TypeScript instead of runtime array syntax
- ALWAYS destructure props directly from `defineProps()` to maintain reactivity and enable inline defaults; if no props are used in the script, call `defineProps()` without destructuring
- ALWAYS use same-name shorthand `:propName` instead of `:propName="propName"`
- NEVER mutate props directly or nested properties; emit changes to parent instead
- ALWAYS keep computed properties pure (no mutations, no async, no logging)
- USE `defineModel()` for two-way binding instead of manual prop+emit pairs
- PREFER `ref()` over `reactive()` for state
- PREFER VueUse composables over custom implementations for common browser/DOM/state tasks

### Template Directives

- ALWAYS use `v-for="item of items"` instead of `v-for="item in items"` to match JavaScript `for...of` syntax
- ALWAYS use key in v-for loops

### Styles

- ALWAYS use `<style scoped>` for component styles

### Composables

- ALWAYS call composables in `<script setup>` or `setup()` only — never in callbacks, utils, or async contexts
- ALWAYS prefix names with `use` (e.g. `useMouse`). One composable per file, named `useFeatureName.ts`
- ALWAYS return a plain object of refs — never wrap return in `reactive()`
- ALWAYS clean up side effects via `onUnmounted()`; use `onMounted()` for DOM access
- ALWAYS expose `loading`/`error` refs from async composables; use `watchEffect` for reactive data fetching
- PREFER `toValue()` to accept refs, getters, or plain values as input in shared composables
- PREFER grouping composable code by concern/feature, not by Vue API type (refs, computed, watchers)
- PREFER extracting calculations to pure helper functions; composable only handles reactivity
- PREFER plain utility functions over composables unless you need reactivity or lifecycle hooks
- PREFER splitting large composables by concern (e.g. `useCart` → `useAddToCart` + `useFetchCart`)
- PREFER inline composables; extract to shared `composables/` only when a second consumer exists

## Git Workflow

After pushing changes to a branch, always provide the PR URL in this format:

[https://github.com/lttr/ctyriadvacitka/compare/<branch-name>](https://github.com/lttr/ctyriadvacitka/compare/<branch-name>)
