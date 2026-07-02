# Math3d-next task runner
# Usage: just --list

# List available recipes
default:
    @just --list

# Start frontend and backend dev servers
start:
    docker compose up -d
    yarn start

# Run a backend command in Docker (just be test, just be typecheck, just be --list)
be *args:
    docker compose run --rm webserver just {{ args }}

# Run a frontend command via yarn (e.g., just fe test, just fe lint)
fe *args:
    yarn {{ args }}

# Run e2e tests with env loaded from this checkout's env files (works in worktrees)
e2e *args:
    #!/usr/bin/env bash
    set -euo pipefail
    set -a
    source ./.env.development
    if [ -f ./.env ]; then source ./.env; fi
    set +a
    # In a worktree, TEST_APP_URL must point at this checkout's own port —
    # against :3000 the suite would silently test the main checkout's server.
    # (Catches both a missing .env and a hand-copied one without TEST_APP_URL.)
    if [ "$(git rev-parse --path-format=absolute --git-dir)" != "$(git rev-parse --path-format=absolute --git-common-dir)" ] && [ "${TEST_APP_URL##*:}" = "3000" ]; then
        echo "TEST_APP_URL points at :3000, the main checkout's port. Run" >&2
        echo "./scripts/setup_worktree_env.sh — or if this worktree already has a" >&2
        echo ".env, add a TEST_APP_URL/APP_BASE_URL with its own port (3002-3009)." >&2
        exit 1
    fi
    yarn test-e2e {{ args }}
