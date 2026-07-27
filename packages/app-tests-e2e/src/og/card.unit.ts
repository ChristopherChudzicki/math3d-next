import { test, expect } from "@playwright/test";
import { buildCardHtml, type CardOptions } from "./card";

const opts: CardOptions = {
  title: "Math3d.org",
  tagline: "create • animate • share",
  sceneDataUri: "data:image/png;base64,AAAA",
  fonts: [
    { weight: 400, base64: "Zm9udDQwMA==" },
    { weight: 500, base64: "Zm9udDUwMA==" },
  ],
};

test("card html embeds the title, tagline, scene image, and fonts at OG size", () => {
  const html = buildCardHtml(opts);
  expect(html).toContain("Math3d.org");
  expect(html).toContain("create • animate • share");
  expect(html).toContain(opts.sceneDataUri);
  // 1200x630 is the canonical OG size and is the default.
  expect(html).toContain("1200px");
  expect(html).toContain("630px");
  opts.fonts.forEach((font) => {
    expect(html).toContain(font.base64);
  });
});

test("card html escapes markup in the title and tagline", () => {
  const html = buildCardHtml({ ...opts, title: "a<b>&c" });
  expect(html).toContain("a&lt;b&gt;&amp;c");
  expect(html).not.toContain("a<b>&c");
});
