import { Sequelize } from "sequelize";

const sequelize = new Sequelize({
  dialect: "postgres",
  host: "localhost",
  port: 5431,
  database: "math3d_next",
  username: "docker",
  password: "docker",
});

export default sequelize;
