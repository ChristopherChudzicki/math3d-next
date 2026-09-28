# Math3d-next

[Math3d](https://math3d.org) is a web-based, 3d math visualization tool—an online 3d graphing calculator.

The repository represents the next generation of math3d, the current source code for which is at https://github.com/ChristopherChudzicki/math3d-react.

## Development

### Prerequisites

The math3d backend and database are managed by docker containers. The frontend is not currently containerized. You'll need:

- [just](https://github.com/casey/just), our task runner (`brew install just`)
- [Yarn](https://yarnpkg.com/getting-started/install), our JS package manager
- [nvm](https://github.com/nvm-sh/nvm), for managing node versions
- [Docker](https://docs.docker.com/get-docker/), for containerization during development
- [pre-commit](https://pre-commit.com/index.html), a framework for running pre-commit hooks

Environment variables come from `.env.development` (committed) and `.env` (gitignored, your overrides). No loader such as direnv is needed:

- **Frontend:** `yarn start`, `yarn test` and `yarn test-e2e` load both files themselves, and variables already set in your shell take precedence. `yarn build` deliberately loads neither, so dev-only values can't reach a production bundle.
- **Backend:** docker compose passes both files to the container (`env_file`); your shell's variables don't reach it. A container's environment is fixed at creation, so run `docker compose up -d` after editing either file.

### Local Domain Setup

Like production, the dev environment serves the frontend and API from separate subdomains — here, of `localhost`. No `/etc/hosts` entries are needed: Chrome, and macOS's system resolver (which Node and curl use), map every `*.localhost` name to the loopback address. If yours doesn't (e.g. Linux without `systemd-resolved`), add `/etc/hosts` entries for `math3d.localhost` and `api.math3d.localhost`.

- **Frontend**: http://math3d.localhost:3000
- **API**: http://api.math3d.localhost:8000

### Signing in during development

The sign-in dialog's "Sign in as dev user" (`VITE_ENABLE_DUMMY_AUTH`) opens
allauth's `dummy` provider form, prefilled with the user `seed_test_data`
creates; submit it to sign in as that user. For another user, enter a new
integer Account ID and an email no other account uses (a taken one is refused
as `email_taken`), and leave Email verified ticked, or the sign-in is refused as
an unverified address.

### Testing Google sign-in locally

Day-to-day development signs in through the `dummy` provider and never reaches
Google. To exercise the real flow by hand, move both servers to bare `localhost`
and turn off CSRF — Google accepts a redirect URI outside a public TLD only on
bare `localhost` (it refuses `math3d.localhost`), and `localhost` cannot carry
the domain cookie the SPA reads the CSRF token from. See
[ADR-0005](docs/adr/0005-local-google-sign-in-testing.md).

Add to `.env` (gitignored), using a dev OAuth web client from the Google
console whose only authorized redirect URI is
`http://localhost:8000/_allauth/google/login/callback/` (it needs no JavaScript
origins):

```sh
APP_BASE_URL=http://localhost:3000
VITE_API_BASE_URL=http://localhost:8000
VITE_SITE_ORIGIN=http://localhost:3000
CSRF_COOKIE_DOMAIN=
DISABLE_CSRF=True
VITE_DISPLAY_AUTH_FLOWS=true
GOOGLE_CLIENT_ID=<dev client id>
GOOGLE_CLIENT_SECRET=<dev client secret>
```

Then `docker compose up -d` to recreate the backend (a container's environment
is fixed at creation) and restart the dev server.

Delete the block and recreate to switch back. While it is in place, no local
checkout enforces CSRF, and the dev CORS origins are derived from
`APP_BASE_URL`'s hostname — so every `math3d.localhost` frontend is CORS-blocked,
anonymous reads included. Don't leave it on. `DISABLE_CSRF` refuses to boot on
a deployment.

The backend test suite is unaffected — `main/test_settings.py` pins its own
environment. `yarn test-e2e` cannot run against this configuration, though:
global setup fails with `Expected csrftoken from provider/token`, because with
the middleware removed Django sets no CSRF cookie for the suite to read.

### Task Runner

We use [just](https://github.com/casey/just) as a task runner. Run `just` to see available commands.

```bash
just start          # Start frontend + backend dev servers
just be <command>   # Run a backend command in Docker (delegates to webserver/justfile)
just fe <command>   # Run a frontend command via yarn
```

Examples:

| Command             | Notes                               |
| ------------------- | ----------------------------------- |
| `just start`        | Start frontend + backend            |
| `just be test`      | Run backend tests (pytest)          |
| `just be typecheck` | Typecheck backend with MyPy         |
| `just be devserver` | Run Django dev server w/ autoreload |
| `just fe test`      | Run frontend tests (Vitest)         |
| `just fe lint`      | Lint frontend                       |

Extra args are forwarded: `just be test -k my_test` runs `pytest -sv -k my_test`.

### Backend Setup

The backend uses [uv](https://docs.astral.sh/uv/) for dependency management. Dependencies are defined in `webserver/pyproject.toml` (PEP 621 format) and locked in `webserver/uv.lock`.

Initial install (one-off):

```
just be setup_python
```

To add a new runtime dependency (inside container):

```
uv add <package>
```

To add a dev-only dependency:

```
uv add --group dev <package>
```

After modifying dependencies, commit both `pyproject.toml` and the updated `uv.lock`.

See [webserver/justfile](./webserver/justfile) for all backend recipes.

## License

MIT — see [LICENSE](./LICENSE).
