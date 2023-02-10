# Server

## Local Setup

The backend server for math3d is a NodeJS Express server written in Typescript. It uses PostgresSQL as its database. For local development, we run Postgres in a Docker container.

Prerequisites:

- Node 16. This README assumes [Nvm](https://github.com/nvm-sh/nvm) is installed for managing Node versions.

- Docker

  _Suggested: On a mac, `brew install --cask docker`, then open the docker app to finish creating symlinks_

Then:

1. All directions below assume you are in the `math3d-next/server` directory.
2. Start the docker container:

   ```sh
   # The `-d` flag is optional; it tells docker to run in detached
   # mode so it does not require its own terminal window in which to run.
   docker-compose up -d
   ```

   When you run `docker-compose up`, Docker will build the image _if it does not already exist_ and start a container using that image _if it is not already running_.

3. Install the server node dependencies:

   ```sh
   npm install
   ```

4. Sart the Typescript compiler in watch mode:

   ```sh
   npm run build:watch
   ```

5. In a new terminal, run the database migrations using
   ```
   npm run migrate:local
   ```
6. Run the unit tests in watch mode using Node 16
   ```sh
   nvm use # This will use the .nvmrc file in server directory
   npm run test:watch
   ```
7. In a third terminal, start the server using Node 16:

   ```sh
   nvm use # This will use the .nvmrc file in server directory
   npm run start:dev
   ```

The server should now be accepting requests at `http://localhost:3001`.

## The Database

We use a PostgresSQL database run locally in a docker container; see above. The credentials in `.env.development.local` can be used to connect to the database from the host machine (i.e., from outside the docker container).

Locally, you can seed the database with some scenes via

```sh
npm run seed:all:local
```
