# Math3d-next

[Math3d](https://math3d.org) is a web-based, 3d math visualization tool—an online 3d graphing calculator.

The repository represents the next generation of math3d, the current source code for which is at https://github.com/ChristopherChudzicki/math3d-react.

## Development

### Prerequisites

The math3d backend and database are managed by docker containers. The frontend is not currently containerized. You'll need:

- [Yarn](https://yarnpkg.com/getting-started/install), our JS package manager
- [nvm](https://github.com/nvm-sh/nvm), for managing node versions
- [Docker](https://docs.docker.com/get-docker/)

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

| Command           | Notes                                                          |
| ----------------- | -------------------------------------------------------------- |
| `make tests`      | Run tests                                                      |
| `make format-fix` | Formats python code with [`black`][black] and [`isort`][isort] |

[black]: https://github.com/psf/black
[isort]: https://github.com/PyCQA/isort

See [webserver/Makefile](./webserver/Makefile) for more `make` commands.
