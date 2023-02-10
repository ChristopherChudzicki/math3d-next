/* eslint-disable @typescript-eslint/ban-ts-comment */
import type { SequelizeLib, QueryInterface } from "../migration";
// Consider moving this out of src directory... ts is slow, but I think just for this file.
import sampleScenes from "./scenes_from_v1_top_100_20220112.json";

// const sampleScenes: any[] = [];

const seeder = {
  up: async (
    queryInterface: QueryInterface,
    Sequelize: SequelizeLib
  ): Promise<void> => {
    await queryInterface.bulkInsert(
      "scenes",
      sampleScenes,
      {},
      {
        // @ts-ignore https://github.com/sequelize/sequelize/pull/13945
        items: {
          // @ts-ignore
          type: new Sequelize.JSONB(),
        },
        sortableTree: {
          // @ts-ignore
          type: new Sequelize.JSONB(),
        },
      }
    );
  },
  down: async (
    queryInterface: QueryInterface,
    Sequelize: SequelizeLib
  ): Promise<void> => {
    await queryInterface.bulkDelete("scenes", {
      publicId: {
        [Sequelize.Op.any]: sampleScenes.map(
          ({ publicId }: { publicId: string }) => publicId
        ),
      },
    });
  },
};

export default seeder;
