import SequilizeModule, { QueryInterface } from "sequelize";

type SequelizeLib = typeof SequilizeModule;

type Migrator = (
  queryInterface: QueryInterface,
  Sequelize: SequelizeLib
) => Promise<unknown>;

type Migration = {
  up: Migrator;
  down: Migrator;
};

export { SequelizeLib, Migration, QueryInterface };
