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
