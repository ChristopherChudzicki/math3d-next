import fs from "fs";
import { rehydrate } from "./hydrate";

const GRAPHS_v1 = "/Users/cchudzicki/Documents/graphs_v1.json";
const GRAPHS_v2 = "/Users/cchudzicki/Documents/graphs_v2.json";

const run = () => {
  const rowsV1 = JSON.parse(fs.readFileSync(GRAPHS_v1, "utf8")).map(
    (row: any) => ({
      ...row,
      dehydrated: JSON.parse(row.dehydrated),
    })
  );

  let failed = 0;
  const rowsV2 = rowsV1
    .map((row: any, i) => {
      if (i % 1000 === 0) {
        console.log(`total: ${i}, failed: ${failed}`);
      }
      try {
        return {
          ...row,
          dehydrated: rehydrate(row.dehydrated),
        };
      } catch (e) {
        failed += 1;
        return null;
      }
    })
    .filter((r: any) => r !== null);

  fs.writeFileSync(GRAPHS_v2, JSON.stringify(rowsV2), "utf8");
};

run();
