# Math3d-next

## Local Development

Prerequisites:

- Install Docker

  _Suggested: `brew install --cask docker`, then open the docker app to finish creating symlinks_

Then:

1. Run `docker-compose up -d` to start the local database server (`-d` runs in detached mode).
2. `npm install` to install node dependencies
3. `npm run start:dev` will start the nodeserver in watch mode
