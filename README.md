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

| Command          | Notes               |
| ---------------- | ------------------- |
| `make tests`     | Run tests           |
| `make typecheck` | Typecheck with Mypy |

See [webserver/Makefile](./webserver/Makefile) for more `make` commands.
