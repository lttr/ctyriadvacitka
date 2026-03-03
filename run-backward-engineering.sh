#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# Backward Engineering Runner
# Executes the full backward-engineering process from .aiwork/2026-03-02_backward-engineering/plan.md
# Each step runs as a separate Claude Code session (fresh context window).
# ==============================================================================

WORKDIR="$(cd "$(dirname "$0")" && pwd)"
DOCS_DIR="$WORKDIR/.aiwork/2026-03-02_backward-engineering"
SOURCE_DIR="$WORKDIR/source"
LOG_DIR="$WORKDIR/logs"
STATE_FILE="$WORKDIR/.backward-engineering-state"

# Tunable parameters
MAX_TURNS="${MAX_TURNS:-50}"
MAX_BUDGET="${MAX_BUDGET:-}"  # e.g., "5.00" — empty means no limit

mkdir -p "$LOG_DIR" "$DOCS_DIR"

# --- Helpers ---

log() { echo "[$(date '+%H:%M:%S')] $*"; }

run_claude() {
  local step_name="$1"
  local prompt="$2"
  local log_file="$LOG_DIR/${step_name}.log"
  local budget_flag=""

  if [[ -n "$MAX_BUDGET" ]]; then
    budget_flag="--max-budget-usd $MAX_BUDGET"
  fi

  log "Starting: $step_name"
  log "  Log: $log_file"

  claude -p "$prompt" \
    --dangerously-skip-permissions \
    --max-turns "$MAX_TURNS" \
    --output-format text \
    $budget_flag \
    > "$log_file" 2>&1

  local exit_code=$?
  if [[ $exit_code -ne 0 ]]; then
    log "FAILED: $step_name (exit code $exit_code). Check $log_file"
    return 1
  fi

  log "Completed: $step_name"
  echo "$step_name" >> "$STATE_FILE"
}

is_done() {
  local step_name="$1"
  [[ -f "$STATE_FILE" ]] && grep -qxF "$step_name" "$STATE_FILE"
}

require_file() {
  local file="$1"
  local step="$2"
  if [[ ! -f "$file" ]]; then
    log "ERROR: Expected $file from step $step, but it doesn't exist."
    log "  Check logs/$step.log for details."
    exit 1
  fi
}

# --- Steps ---

step_0_1_clone() {
  local step="0.1-clone"
  is_done "$step" && { log "Skipping $step (already done)"; return 0; }

  if [[ -d "$SOURCE_DIR/.git" ]]; then
    log "Source repo already cloned at $SOURCE_DIR — skipping clone"
    echo "$step" >> "$STATE_FILE"
    return 0
  fi

  log "Cloning repository..."
  git clone https://gitlab.com/krouma/Ctyriadvacitka.git "$SOURCE_DIR"
  echo "$step" >> "$STATE_FILE"
  log "Completed: $step"
}

step_0_2_inventory() {
  local step="0.2-file-inventory"
  is_done "$step" && { log "Skipping $step (already done)"; return 0; }

  run_claude "$step" "$(cat <<'PROMPT'
You are executing Phase 0.2 of a backward-engineering process.

Read the plan file at .aiwork/2026-03-02_backward-engineering/plan.md — specifically the
"0.2 Build Complete File Inventory" section.

The source code has been cloned into source/.

Your task:
1. List every file in source/ (excluding .git/)
2. For each file, open it and read enough to write an accurate one-line purpose
3. Categorize each file by type and category as specified in the plan
4. Assign each file to one or more output documents (data-model, business-logic,
   auth, routes, forms, views, file-operations, config-and-infra)
5. Write the result to .aiwork/2026-03-02_backward-engineering/00-file-inventory.yaml

Follow the exact YAML structure from the plan. Do NOT guess purposes from
filenames — open every file. The verification rule: every file must map to at
least one output document or have an explicit justification for "none".

At the end, verify the file count matches.
PROMPT
  )"

  require_file "$DOCS_DIR/00-file-inventory.yaml" "$step"
}

step_0_3_git_history() {
  local step="0.3-git-history"
  is_done "$step" && { log "Skipping $step (already done)"; return 0; }

  run_claude "$step" "$(cat <<'PROMPT'
You are executing Phase 0.3 of a backward-engineering process.

Read the plan file at .aiwork/2026-03-02_backward-engineering/plan.md — specifically the
"0.3 Mine Git History" section.

The source code is in source/. Run all git commands inside that directory.

Your task:
1. git log --oneline --all — get the full commit list
2. git log --stat — understand what changed per commit
3. git log --diff-filter=D --summary — find all deleted files
4. git branch -a — check for feature branches
5. git tag — check for version tags
6. For significant commits, git show <hash> to read actual diffs
7. Write the result to .aiwork/2026-03-02_backward-engineering/00-git-history.yaml

Follow the exact YAML structure from the plan. Every commit must be accounted
for. Every deleted file must appear in deleted_or_replaced. Include an
evolution_notes narrative describing how the app evolved over time.
PROMPT
  )"

  require_file "$DOCS_DIR/00-git-history.yaml" "$step"
}

step_0_4_read_batch() {
  local batch_num="$1"
  local batch_desc="$2"
  local batch_files="$3"
  local step="0.4-read-batch-${batch_num}"
  is_done "$step" && { log "Skipping $step (already done)"; return 0; }

  run_claude "$step" "$(cat <<PROMPT
You are executing Phase 0.4 (batch $batch_num of 7) of a backward-engineering process.

Read the plan file at .aiwork/2026-03-02_backward-engineering/plan.md — specifically the
"0.4 Read Every File" section. Also read .aiwork/2026-03-02_backward-engineering/00-file-inventory.yaml
to understand all files.

Batch $batch_num: $batch_desc

Read IN FULL every non-binary file in this batch from source/:
$batch_files

For each file:
1. Read the entire content — do not skip or skim
2. Note anything surprising, notable, or non-obvious
3. Note cross-file dependencies (what injects what, what includes what)
4. Note any hardcoded values, magic strings, implicit behaviors

Write your findings to: .aiwork/2026-03-02_backward-engineering/00-batch-${batch_num}-notes.yaml

Structure per file:
  - path: <file path>
    findings:
      - <notable finding>
    dependencies:
      - <cross-file dependency>
    hardcoded_values:
      - <any magic strings, hardcoded paths, etc.>

Be thorough. This is the foundation for all subsequent documentation.
PROMPT
  )"

  require_file "$DOCS_DIR/00-batch-${batch_num}-notes.yaml" "$step"
}

step_phase_1() {
  local step="phase-1-data-model-and-auth"
  is_done "$step" && { log "Skipping $step (already done)"; return 0; }

  run_claude "$step" "$(cat <<'PROMPT'
You are executing Phase 1 of a backward-engineering process.

Read these files to understand the full context:
1. .aiwork/2026-03-02_backward-engineering/plan.md — the master plan
2. .aiwork/2026-03-02_backward-engineering/00-file-inventory.yaml — all files
3. .aiwork/2026-03-02_backward-engineering/00-git-history.yaml — git history
4. All batch notes: .aiwork/2026-03-02_backward-engineering/00-batch-*-notes.yaml

Now produce TWO documents following the exact structures in the plan:

1. .aiwork/2026-03-02_backward-engineering/01-data-model.yaml
   - Read source/sql/lamp.sql and all *Manager.php model files from source/
   - Capture every entity, field, type, constraint, relationship
   - Use tech-agnostic types (string, not VARCHAR)
   - Verify: every column in every CREATE TABLE appears; every column constant
     in every Manager maps to a documented field

2. .aiwork/2026-03-02_backward-engineering/02-auth.yaml
   - Read AuthenticatorManager.php, AuthorizatorManager.php, BasePresenter.php,
     and config files from source/
   - Capture authentication flow, role hierarchy, full permission matrix
   - Verify: every role, resource, and action appears; every access check in
     presenters maps to a permission

Cross-reference between the two documents where they overlap. Run the
verification checklists. Flag any gaps.
PROMPT
  )"

  require_file "$DOCS_DIR/01-data-model.yaml" "$step"
  require_file "$DOCS_DIR/02-auth.yaml" "$step"
}

step_phase_2() {
  local step="phase-2-business-logic-and-routes"
  is_done "$step" && { log "Skipping $step (already done)"; return 0; }

  run_claude "$step" "$(cat <<'PROMPT'
You are executing Phase 2 of a backward-engineering process.

Read these files first:
1. .aiwork/2026-03-02_backward-engineering/plan.md — the master plan
2. .aiwork/2026-03-02_backward-engineering/01-data-model.yaml — entity definitions (Phase 1)
3. .aiwork/2026-03-02_backward-engineering/02-auth.yaml — auth/permissions (Phase 1)
4. All batch notes: .aiwork/2026-03-02_backward-engineering/00-batch-*-notes.yaml

Now produce TWO documents following the exact structures in the plan:

1. .aiwork/2026-03-02_backward-engineering/03-business-logic.yaml
   - Read ALL Manager model files and ALL presenter action methods from source/
   - Capture every operation: inputs, behavior, side effects, auth required,
     error cases
   - Reference entities from 01-data-model.yaml and permissions from 02-auth.yaml
   - Verify: every public method in every Manager is documented; every presenter
     action that modifies data is captured

2. .aiwork/2026-03-02_backward-engineering/04-routes.yaml
   - Read RouterFactory.php and all presenter action/render methods from source/
   - Capture every URL pattern, what it does, auth requirements
   - Reference permissions from 02-auth.yaml
   - Verify: every route in RouterFactory appears; every presenter action maps
     to at least one route

Cross-reference between documents. Run verification checklists.
PROMPT
  )"

  require_file "$DOCS_DIR/03-business-logic.yaml" "$step"
  require_file "$DOCS_DIR/04-routes.yaml" "$step"
}

step_phase_3() {
  local step="phase-3-forms-and-views"
  is_done "$step" && { log "Skipping $step (already done)"; return 0; }

  run_claude "$step" "$(cat <<'PROMPT'
You are executing Phase 3 of a backward-engineering process.

Read these files first:
1. .aiwork/2026-03-02_backward-engineering/plan.md — the master plan
2. .aiwork/2026-03-02_backward-engineering/01-data-model.yaml
3. .aiwork/2026-03-02_backward-engineering/03-business-logic.yaml
4. .aiwork/2026-03-02_backward-engineering/04-routes.yaml
5. All batch notes: .aiwork/2026-03-02_backward-engineering/00-batch-*-notes.yaml

Now produce TWO documents following the exact structures in the plan:

1. .aiwork/2026-03-02_backward-engineering/05-forms.yaml
   - Read ALL form factory files in source/app/factories/
   - Capture every form: fields, types, labels, validation, submit behavior,
     success/error handling
   - Reference operations from 03-business-logic.yaml and routes from
     04-routes.yaml
   - Verify: every form factory produces exactly one documented form; every
     field appears

2. .aiwork/2026-03-02_backward-engineering/06-views.yaml
   - Read ALL .latte template files and all presenter render methods from source/
   - Capture every page: layout, data dependencies, UI components, conditionals,
     AJAX behaviors, navigation links
   - Reference routes from 04-routes.yaml and forms from 05-forms.yaml
   - Verify: every .latte file maps to a view; every template variable appears
     in data_dependencies

Cross-reference between documents. Run verification checklists.
PROMPT
  )"

  require_file "$DOCS_DIR/05-forms.yaml" "$step"
  require_file "$DOCS_DIR/06-views.yaml" "$step"
}

step_phase_4() {
  local step="phase-4-files-and-infra"
  is_done "$step" && { log "Skipping $step (already done)"; return 0; }

  run_claude "$step" "$(cat <<'PROMPT'
You are executing Phase 4 of a backward-engineering process.

Read these files first:
1. .aiwork/2026-03-02_backward-engineering/plan.md — the master plan
2. .aiwork/2026-03-02_backward-engineering/00-file-inventory.yaml
3. All batch notes: .aiwork/2026-03-02_backward-engineering/00-batch-*-notes.yaml

Now produce TWO documents following the exact structures in the plan:

1. .aiwork/2026-03-02_backward-engineering/07-file-operations.yaml
   - Read ImageManager.php and all image/upload-related form factories and
     templates from source/
   - Check source/www/img/ and source/www/prilohy/ directory structures
   - Capture all upload/delete/serve operations, directories, naming, restrictions
   - Verify: every file operation in ImageManager documented; every upload
     directory listed

2. .aiwork/2026-03-02_backward-engineering/08-config-and-infra.yaml
   - Read all config files (.neon), Dockerfile, docker-compose.yml, k8s/,
     package.json, composer.json from source/
   - Capture environment requirements, DI container wiring, frontend build,
     deployment setup, DB parameters
   - Verify: every service in config.neon appears; every K8s manifest summarized

Cross-reference between documents. Run verification checklists.
PROMPT
  )"

  require_file "$DOCS_DIR/07-file-operations.yaml" "$step"
  require_file "$DOCS_DIR/08-config-and-infra.yaml" "$step"
}

step_phase_5() {
  local step="phase-5-completeness-matrix"
  is_done "$step" && { log "Skipping $step (already done)"; return 0; }

  run_claude "$step" "$(cat <<'PROMPT'
You are executing Phase 5 (final validation) of a backward-engineering process.

Read ALL documents produced so far:
1. .aiwork/2026-03-02_backward-engineering/plan.md — the master plan
2. .aiwork/2026-03-02_backward-engineering/00-file-inventory.yaml
3. .aiwork/2026-03-02_backward-engineering/00-git-history.yaml
4. .aiwork/2026-03-02_backward-engineering/01-data-model.yaml
5. .aiwork/2026-03-02_backward-engineering/02-auth.yaml
6. .aiwork/2026-03-02_backward-engineering/03-business-logic.yaml
7. .aiwork/2026-03-02_backward-engineering/04-routes.yaml
8. .aiwork/2026-03-02_backward-engineering/05-forms.yaml
9. .aiwork/2026-03-02_backward-engineering/06-views.yaml
10. .aiwork/2026-03-02_backward-engineering/07-file-operations.yaml
11. .aiwork/2026-03-02_backward-engineering/08-config-and-infra.yaml

Now produce: .aiwork/2026-03-02_backward-engineering/09-completeness-matrix.yaml

This is the final cross-reference that validates everything:

1. file_coverage: Every source file from 00-file-inventory.yaml → which
   document(s) captured it. Flag any file not captured.
2. route_connections: Every route → the form + view + operation it connects to.
   Flag any route missing a connection.
3. entity_field_coverage: Every entity field → which forms write to it, which
   views display it. Flag fields that are never written or never displayed.
4. permission_enforcement: Every permission → which routes enforce it. Flag
   permissions that are defined but never enforced.
5. git_history_gaps: Anything from 00-git-history.yaml (deleted features,
   evolution notes) that isn't addressed in the other documents.

For every gap found, write a concrete note about what's missing and which
document should be updated to fix it.
PROMPT
  )"

  require_file "$DOCS_DIR/09-completeness-matrix.yaml" "$step"
}

# --- Main ---

main() {
  log "=== Backward Engineering Runner ==="
  log "Working directory: $WORKDIR"
  log "Max turns per step: $MAX_TURNS"
  [[ -n "$MAX_BUDGET" ]] && log "Budget limit per step: \$$MAX_BUDGET"
  echo ""

  # Phase 0
  step_0_1_clone

  step_0_2_inventory

  step_0_3_git_history

  # Phase 0.4 — Read every file in batches
  # Batch definitions (file patterns are hints; the prompt tells Claude to check
  # the inventory and read matching files)
  step_0_4_read_batch 1 "Config files + SQL + infra" \
    "app/config/, app/CoreModule/config/, sql/, docker-compose.yml, Dockerfile, k8s/, .htaccess, app/.htaccess, composer.json, package.json"

  step_0_4_read_batch 2 "Models / managers (data layer)" \
    "app/model/, app/CoreModule/model/, app/AdminModule/model/"

  step_0_4_read_batch 3 "Presenters (control layer)" \
    "app/presenters/, app/CoreModule/presenters/, app/AdminModule/presenters/, app/router/"

  step_0_4_read_batch 4 "Form factories (input layer)" \
    "app/factories/"

  step_0_4_read_batch 5 "Templates (view layer)" \
    "app/templates/, app/CoreModule/templates/, app/AdminModule/templates/"

  step_0_4_read_batch 6 "Frontend assets (JS, CSS)" \
    "www/js/, www/css/"

  step_0_4_read_batch 7 "Everything else (images, attachments, docs, misc)" \
    "www/img/, www/prilohy/, www/index.php, README.md, LICENCE.md, .gitignore, app/bootstrap.php, app/renderers/"

  # Phase 1–5
  step_phase_1
  step_phase_2
  step_phase_3
  step_phase_4
  step_phase_5

  log ""
  log "=== DONE ==="
  log "All documents are in: $DOCS_DIR/"
  log "Logs are in: $LOG_DIR/"
  log ""
  log "Produced documents:"
  ls -1 "$DOCS_DIR/"
}

main "$@"
