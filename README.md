# Math3d-next

[Math3d](https://math3d.org) is a web-based, 3d math visualization tool—an online 3d graphing calculator.

The repository represents the next generation of math3d, the current source code for which is at https://github.com/ChristopherChudzicki/math3d-react.

## Development

### Prerequisites

The math3d backend and database are managed by docker containers. The frontend is not currently containerized. You'll need:

- [Yarn](https://yarnpkg.com/getting-started/install), our JS package manager
- [nvm](https://github.com/nvm-sh/nvm), for managing node versions
- [Docker](https://docs.docker.com/get-docker/), for containerization during development
- [pre-commit](https://pre-commit.com/index.html), a framework for running pre-commit hooks
- **Environment Variables**: Additionally, you'll want some way to load environment variables for the frontend, which currently runs on the host machine. We recommend using [direnv](https://direnv.net/docs/installation.html), which a `.envrc` file along the lines of

  ```sh
  dotenv_if_exists .env.development # committed in repo
  dotenv_if_exists .env             # customizations
  ```

### Webserver Commands

> **Note**
> The commands below should be run in a `webserver` container, e.g., via
>
> ```
> # one-off
> docker compose run --rm webserver <COMMAND>
> # run commands in docker shell
> docker compose run --rm webserver bash
> ```

The backend now uses [uv](https://docs.astral.sh/uv/) for dependency management (migrated from Poetry). Dependencies are defined in `webserver/pyproject.toml` (PEP 621 format) and locked in `webserver/uv.lock` (generated locally after first sync).

Initial install (one-off) inside the container:

```
docker compose run --rm webserver make setup_python
```

Common commands:

| Command          | Notes                               |
| ---------------- | ----------------------------------- |
| `make test`      | Run tests (pytest)                  |
| `make typecheck` | Typecheck with MyPy                 |
| `make devserver` | Run Django dev server w/ autoreload |

To add a new runtime dependency (inside container):

```
uv add <package>
```

To add a dev-only dependency:

```
uv add --group dev <package>
```

After modifying dependencies, commit both `pyproject.toml` and the updated `uv.lock`.

See [webserver/Makefile](./webserver/Makefile) for more `make` commands.
