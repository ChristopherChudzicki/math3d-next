/**
 * Legacy audit, pass 2a: runs evaluateNext.ts over every migrated scene.
 *
 * Input: LEGACY_EVAL_NEXT_IN, legacy.jsonl from export_legacy_audit. Output:
 * LEGACY_EVAL_NEXT_OUT, one line per input line. LEGACY_EVAL_NEXT_LIMIT stops
 * after that many scenes.
 *
 * Skipped unless LEGACY_EVAL_NEXT_IN and LEGACY_EVAL_NEXT_OUT are set.
 */
import * as fs from "node:fs";
import * as readline from "node:readline";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { evaluateScene } from "./evaluateNext";

const input = process.env.LEGACY_EVAL_NEXT_IN;
const output = process.env.LEGACY_EVAL_NEXT_OUT;
const limit = Number(process.env.LEGACY_EVAL_NEXT_LIMIT ?? Infinity);

describe.skipIf(!input || !output)("legacy evaluation, math3d-next", () => {
  const { random } = Math;
  beforeAll(() => {
    // parser/src/evaluate.ts warns on every mathjs error.
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterAll(() => {
    Math.random = random;
    vi.restoreAllMocks();
  });

  it("evaluates every scene", async () => {
    const fd = fs.openSync(output!, "w");
    const lines = readline.createInterface({
      input: fs.createReadStream(input!),
      crlfDelay: Infinity,
    });
    const start = Date.now();
    let count = 0;
    let crashes = 0;
    // eslint-disable-next-line no-restricted-syntax
    for await (const line of lines) {
      if (count >= limit) break;
      if (line) {
        const scene = JSON.parse(line);
        const migrateError = scene.migrate_error;
        let record: object;
        try {
          record = migrateError
            ? {
                crashed: `migrate_error: ${migrateError.type}: ${migrateError.message}`,
                items: {},
              }
            : { crashed: null, items: evaluateScene(scene.migrated) };
        } catch (err) {
          crashes += 1;
          record = { crashed: (err as Error).message, items: {} };
        }
        fs.writeSync(
          fd,
          `${JSON.stringify({ version: 2, key: scene.key, ...record })}\n`,
        );
        count += 1;
        if (count % 1000 === 0) {
          process.stderr.write(
            `${count} scenes, ${((Date.now() - start) / 1000).toFixed(0)}s\n`,
          );
        }
      }
    }
    lines.close();
    fs.closeSync(fd);
    process.stderr.write(
      `done: ${count} scenes, ${crashes} crashed, ${((Date.now() - start) / 1000).toFixed(1)}s\n`,
    );
    expect(count).toBeGreaterThan(0);
  }, 3_600_000);
});
