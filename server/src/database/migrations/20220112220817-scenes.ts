import type { SequelizeLib, Migration, QueryInterface } from "../migration";

const migration: Migration = {
  up: async (queryInterface: QueryInterface, Sequelize: SequelizeLib) => {
    await queryInterface.createTable("scenes", {
      id: {
        type: Sequelize.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      publicId: {
        type: Sequelize.DataTypes.TEXT,
        allowNull: false,
        unique: true,
      },
      title: {
        type: Sequelize.DataTypes.TEXT,
        allowNull: false,
      },
      /**
       * TODO: Consider using separate tables for the items so that data is not
       * just stored as JSONB.
       *
       * As of January 2022, math3d-react has:
       *  - about 25k saved scenes
       *  - consistently of about 500k total "items" (graphs + symbols + folders)
       *
       * Part of the reason for using JSONB for these originally was that
       * Heroku's free version of postgres had a 10k row limit. But now that
       * I'm paying for the cheapest paid postgres on Heroku, we have a 10M row
       * limit, so the above numbers are about 5% of the total. I.e., we
       * absolutely could use separate tables for the items.
       *
       * Plus, 8k of the 25k scenes have ever been viewed, so we could
       * potentially delete 2/3 of the records if we wanted to.
       *
       */
      items: {
        type: Sequelize.DataTypes.JSONB,
        allowNull: false,
      },
      sortableTree: {
        type: Sequelize.DataTypes.JSONB,
        allowNull: false,
      },
      timesAccessed: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      lastAccessed: {
        type: "TIMESTAMP WITH TIME ZONE",
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        allowNull: false,
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
    await queryInterface.dropTable("scenes");
  },
};

export default migration;
