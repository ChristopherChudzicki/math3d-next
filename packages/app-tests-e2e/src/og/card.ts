/**
 * Pure builder for the OG-image "card": an HTML page laying out the rendered
 * torus scene under a title + tagline, screenshotted by the generator into
 * `packages/app/public/og/default.png`. No browser/Node APIs here so it can be
 * exercised by the fast `unit` Playwright project.
 */

export interface CardFont {
  /** CSS font-weight the embedded face provides (e.g. 400, 500). */
  weight: number;
  /** base64-encoded woff2 bytes. */
  base64: string;
}

export interface CardOptions {
  title: string;
  tagline: string;
  /** `data:image/png;base64,...` of the (trimmed) torus scene. */
  sceneDataUri: string;
  /** Roboto faces to embed; the layout uses 500 for the title, 400 elsewhere. */
  fonts: CardFont[];
  /** Canvas size; defaults to the canonical OG card (1200x630). */
  width?: number;
  height?: number;
}

const escapeHtml = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const fontFace = (font: CardFont): string => `
  @font-face {
    font-family: "Roboto";
    font-style: normal;
    font-weight: ${font.weight};
    font-display: block;
    src: url("data:font/woff2;base64,${font.base64}") format("woff2");
  }`;

export const buildCardHtml = ({
  title,
  tagline,
  sceneDataUri,
  fonts,
  width = 1200,
  height = 630,
}: CardOptions): string => `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
${fonts.map(fontFace).join("\n")}
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { background: #ffffff; }
  .card {
    position: relative;
    width: ${width}px;
    height: ${height}px;
    background: #ffffff;
    font-family: "Roboto", "Helvetica Neue", Arial, sans-serif;
    overflow: hidden;
  }
  .text {
    position: absolute;
    top: 64px;
    left: 0;
    right: 0;
    text-align: center;
  }
  .title {
    font-size: 92px;
    font-weight: 500;
    line-height: 1;
    color: rgba(0, 0, 0, 0.85);
  }
  .tagline {
    margin-top: 22px;
    font-size: 30px;
    font-weight: 400;
    letter-spacing: 1px;
    color: rgba(0, 0, 0, 0.55);
  }
  .scene {
    position: absolute;
    left: 50%;
    bottom: 20px;
    transform: translateX(-50%);
    height: 372px;
    width: auto;
  }
</style>
</head>
<body>
  <div class="card">
    <div class="text">
      <div class="title">${escapeHtml(title)}</div>
      <div class="tagline">${escapeHtml(tagline)}</div>
    </div>
    <img class="scene" src="${sceneDataUri}" alt="" />
  </div>
</body>
</html>`;
