import type { SequelizeLib, Migration, QueryInterface } from "../migration";

const migration: Migration = {
  up: async (queryInterface: QueryInterface, Sequelize: SequelizeLib) => {
    await queryInterface.createTable("users", {
      id: {
        type: Sequelize.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      publicId: {
        type: Sequelize.DataTypes.UUID,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
        allowNull: false,
        unique: true,
      },
      username: {
        type: Sequelize.DataTypes.TEXT(),
        allowNull: false,
        unique: true, // makes an index automatically
      },
      email: {
        type: Sequelize.DataTypes.TEXT(),
        allowNull: false,
        unique: true, // makes an index automatically
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
