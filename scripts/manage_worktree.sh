#!/usr/bin/env bash
# Run manage.py in a one-off container of the main checkout's compose stack,
# with THIS checkout's webserver/ mounted in place of main's. The container's
# venv is the shared venv-data volume, left as is (--no-sync): a worktree whose
# Python dependencies differ from main's gets ModuleNotFoundError here.
#
#   scripts/manage_worktree.sh load_seed_scenes
#   scripts/manage_worktree.sh seed_test_data
set -euo pipefail

root=$(git rev-parse --show-toplevel)
main_root=$(cd "$(git rev-parse --git-common-dir)/.." && pwd)

exec docker compose --project-directory "$main_root" run --rm \
	-v "$root/webserver:/src/webserver" \
	webserver uv run --no-sync ./manage.py "$@"
