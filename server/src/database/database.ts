import { Sequelize } from "sequelize";
import * as creds from "./constants";

const sequelize = new Sequelize({
  dialect: "postgres",
  host: creds.DB_HOST,
  port: creds.DB_PORT,
  database: creds.DB_NAME,
  username: creds.DB_USER,
  password: creds.DB_PASS,
});

export default sequelize;
