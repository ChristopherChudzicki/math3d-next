import * as creds from "./constants";

const getConfig = () => ({
  username: creds.DB_USER,
  password: creds.DB_PASS,
  database: creds.DB_NAME,
  host: creds.DB_HOST,
  port: creds.DB_PORT,
  dialect: "postgres",
});

export const development = getConfig();
