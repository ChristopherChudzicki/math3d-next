import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const DOCS_ROOT = path.resolve(__dirname, "../../src/app/pages/HelpPage/docs");

const docs = readdirSync(DOCS_ROOT, { recursive: true, encoding: "utf8" })
  .filter((file) => file.endsWith(".md"))
  .map((file) => ({
    file,
    text: readFileSync(path.join(DOCS_ROOT, file), "utf8"),
  }));

const mathSpans = (text: string) =>
  [...text.matchAll(/\\\(([\s\S]*?)\\\)|\\\[([\s\S]*?)\\\]/g)].map(
    (match) => match[1] ?? match[2],
  );

// Math reaches MathLive as written, so a Markdown formatter's escapes (`\_`
// for `_`, `*` for an emphasis `_`) would render literally.
test.each(docs)("$file's math has no Markdown escapes", ({ text }) => {
  mathSpans(text).forEach((math) => {
    expect(math).not.toMatch(/\\_|\*\{/);
  });
});
