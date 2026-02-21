# Math3d-next task runner
# Usage: just --list

# List available recipes
default:
    @just --list

# Start frontend and backend dev servers
start:
    docker compose up -d
    yarn start

# Run a backend command inside Docker (e.g., just be test, just be typecheck)
be *args:
    docker compose run --rm webserver just {{ args }}

# Run a frontend command via yarn (e.g., just fe test, just fe lint)
fe *args:
    yarn {{ args }}
