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
    # A worktree without its generated .env would inherit TEST_APP_URL=:3000
    # from .env.development and silently test the main checkout's server.
    if [ "$(git rev-parse --path-format=absolute --git-dir)" != "$(git rev-parse --path-format=absolute --git-common-dir)" ] && [ ! -f ./.env ]; then
        echo "This worktree has no .env — run ./scripts/setup_worktree_env.sh first." >&2
        exit 1
    fi
    set -a
    source ./.env.development
    if [ -f ./.env ]; then source ./.env; fi
    set +a
    yarn test-e2e {{ args }}
