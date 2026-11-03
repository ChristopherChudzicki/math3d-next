/**
 * Legacy audit, pass 2a: runs evaluateNext.ts over every migrated scene.
 *
 * Input: LEGACY_EVAL_NEXT_IN, legacy.jsonl from export_legacy_audit. Output:
 * LEGACY_EVAL_NEXT_OUT, one line per input line. LEGACY_EVAL_NEXT_LIMIT stops
 * after that many scenes.
 *
 * With LEGACY_EVAL_NEXT_CONVENTION, a key of CONVENTIONS, this is a replay: it
 * evaluates with that math3d-react convention swapped in, and writes only the
 * scenes that use one of its triggers, each tagged with the convention and the
 * sha256 of its input line, which pass 2c checks against its own input.
 *
 * Skipped unless LEGACY_EVAL_NEXT_IN and LEGACY_EVAL_NEXT_OUT are set.
 */
import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as readline from "node:readline";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { CONVENTIONS, type Convention } from "./conventions";
import { evaluateScene, usesAny } from "./evaluateNext";

const input = process.env.LEGACY_EVAL_NEXT_IN;
const output = process.env.LEGACY_EVAL_NEXT_OUT;
const limit = Number(process.env.LEGACY_EVAL_NEXT_LIMIT ?? Infinity);
const convention = process.env.LEGACY_EVAL_NEXT_CONVENTION as
  | Convention
  | undefined;
if (convention && !Object.hasOwn(CONVENTIONS, convention)) {
  throw new Error(`Unknown LEGACY_EVAL_NEXT_CONVENTION: ${convention}`);
}
const replay = convention ? CONVENTIONS[convention] : undefined;

describe.skipIf(!input || !output)("legacy evaluation, math3d-next", () => {
  const { random } = Math;
  let undo = () => {};
  beforeAll(() => {
    // parser/src/evaluate.ts warns on every mathjs error.
    vi.spyOn(console, "warn").mockImplementation(() => {});
    if (replay) undo = replay.install();
  });
  afterAll(() => {
    undo();
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
    let read = 0;
    let written = 0;
    let crashes = 0;
    // eslint-disable-next-line no-restricted-syntax
    for await (const line of lines) {
      if (read >= limit) break;
      if (line) {
        read += 1;
        if (read % 1000 === 0) {
          process.stderr.write(
            `${read} scenes, ${((Date.now() - start) / 1000).toFixed(0)}s\n`,
          );
        }
        const scene = JSON.parse(line);
        const migrateError = scene.migrate_error;
        if (
          !replay ||
          (!migrateError && usesAny(scene.migrated, replay.triggers))
        ) {
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
            `${JSON.stringify({ version: 2, key: scene.key, ...(convention && { convention, legacy_sha256: createHash("sha256").update(line).digest("hex") }), ...record })}\n`,
          );
          written += 1;
        }
      }
    }
    lines.close();
    fs.closeSync(fd);
    process.stderr.write(
      `done: ${written} written of ${read} scenes, ${crashes} crashed, ${((Date.now() - start) / 1000).toFixed(1)}s\n`,
    );
    expect(written).toBeGreaterThan(0);
  }, 3_600_000);
});
