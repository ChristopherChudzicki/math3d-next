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
- **Environment Variables**: Additionally, you'll want some way to load environment variables for the frontend, which currently runs on the host machine. We recommend using [direnv](https://direnv.net/docs/installation.html), which a `.envrc` file along the lines of

  ```sh
  dotenv_if_exists .env.development # committed in repo
  dotenv_if_exists .env             # customizations
  ```

### Local Domain Setup

The dev environment uses custom local domains to better emulate the production setup, where the frontend and API live on separate subdomains. Add these entries to `/etc/hosts` (one-time setup):

```bash
sudo sh -c 'printf "127.0.0.1 math3d.localdev\n127.0.0.1 api.math3d.localdev\n::1 math3d.localdev\n::1 api.math3d.localdev\n" >> /etc/hosts'
```

After this, access the app at:

- **Frontend**: http://math3d.localdev:3000
- **API**: http://api.math3d.localdev:8000

### Testing Google sign-in locally

Day-to-day development signs in through the `dummy` provider and never reaches
Google. To exercise the real flow by hand, move both servers to bare `localhost`
and turn off CSRF — Google rejects `.localdev` (its TLD is not on the public
suffix list), and `localhost` cannot carry the domain cookie the SPA reads the
CSRF token from. See [ADR-0005](docs/adr/0005-local-google-sign-in-testing.md).

Add to `.env` (gitignored), using a dev OAuth client from the Google console
with `http://localhost:3000` as an authorized JavaScript origin:

```sh
APP_BASE_URL=http://localhost:3000
VITE_API_BASE_URL=http://localhost:8000
VITE_SITE_ORIGIN=http://localhost:3000
CSRF_COOKIE_DOMAIN=
DISABLE_CSRF=True
VITE_DISPLAY_AUTH_FLOWS=true
GOOGLE_CLIENT_ID=<dev client id>
VITE_GOOGLE_CLIENT_ID=<dev client id>
```

Then `docker compose up -d` to recreate the backend (a container's environment
is fixed at creation) and restart the dev server. The two client-ID variables
must match, or the sign-in POST fails with `client_id_mismatch`.

Delete the block and recreate to switch back. While it is in place, no local
checkout enforces CSRF and worktrees on `.localdev` cannot authenticate, so
don't leave it on. `DISABLE_CSRF` refuses to boot unless `IS_DEVELOPMENT` is
set.

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
