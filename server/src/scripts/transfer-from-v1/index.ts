import fs from "fs";
import minimist from "minimist";
import { rehydrate } from "./hydrate";

const transfer = (inPath: string, outPath: string) => {
  const rowsV1 = JSON.parse(fs.readFileSync(inPath, "utf8"))
    .slice(0, 10)
    .map((row: any) => ({
      ...row,
      dehydrated: JSON.parse(row.dehydrated),
    }));

  let failed = 0;
  const rowsV2 = rowsV1
    .map((row: any, i: number) => {
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

  fs.writeFileSync(outPath, JSON.stringify(rowsV2), "utf8");
};

const getCliArgs = () => {
  const args = minimist(process.argv.slice(2));
  const { in: inFile, out: outFile } = args;
  if (!inFile) {
    throw new Error(`arg --in is required`);
  }
  if (!outFile) {
    throw new Error(`arg --out is required`);
  }
  fs.statSync(inFile);
  return { inFile, outFile };
};

const main = () => {
  const { inFile, outFile } = getCliArgs();
  transfer(inFile, outFile);
};

main();
