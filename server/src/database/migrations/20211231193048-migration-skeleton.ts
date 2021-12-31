import type { SequelizeLib, Migration, QueryInterface } from "../migration";

const migration: Migration = {
  up: async (queryInterface: QueryInterface, Sequelize: SequelizeLib) => {
    await queryInterface.createTable("users", {
      id: {
        type: Sequelize.DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      email: {
        type: Sequelize.DataTypes.TEXT(),
        allowNull: false,
        unique: true,
      },
      createdAt: {
        type: "TIMESTAMP WITH TIME ZONE",
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        allowNull: false,
      },
      updatedAt: {
        type: "TIMESTAMP WITH TIME ZONE",
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        allowNull: false,
      },
    });
  },
  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable("users");
  },
};

export default migration;
