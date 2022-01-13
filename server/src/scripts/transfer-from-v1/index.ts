import fs from "fs";
import minimist from "minimist";
import { rehydrate } from "./hydrate";

const reformatRehydrated = (rehydrated: any) => {
  const {
    mathGraphics = {},
    mathSymbols = {},
    folders = {},
    sliderValues = {},
    sortableTree,
    metadata,
  } = rehydrated;
  Object.values(folders).forEach((f: any) => {
    f.type = "FOLDER";
  });
  Object.entries(sliderValues).forEach(([k, value]) => {
    if (mathSymbols[k]) {
      // There's a bug in math3d where deleting a slider does not
      // delete its sliderValue, so sometimes there's a sliderValue
      // entry but no slider object
      mathSymbols[k].value = value;
    }
  });
  const items = [mathGraphics, mathSymbols, folders]
    .flatMap(Object.entries)
    .map(([id, item]: [string, any]) => {
      const { type, ...properties } = item;
      return { id, type, properties };
    });

  const { title, creationDate: creationDateQuoted } = metadata;
  const creationDate = creationDateQuoted.replaceAll('"', "");
  return { items, sortableTree, creationDate, title };
};

const transfer = (inPath: string, outPath: string) => {
  const rowsV1 = JSON.parse(fs.readFileSync(inPath, "utf8"))
    // .slice(0, 10)
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
        const rehydrated = rehydrate(row.dehydrated);
        const { items, sortableTree, creationDate, title } =
          reformatRehydrated(rehydrated);
        const {
          id,
          last_accessed: lastAccessed,
          times_accessed: timesAccessed,
          url_key: publicId,
        } = row;
        return {
          // id, // omit this; db can pick its own new pk id
          publicId,
          lastAccessed,
          timesAccessed,
          items,
          sortableTree,
          createdAt: creationDate,
          updatedAt: creationDate,
          title,
        };
      } catch (e) {
        console.log(row);
        throw e;
        failed += 1;
        return null;
      }
    })
    .filter((r: any) => r !== null);

  console.log(`Failed: ${failed}`);

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
