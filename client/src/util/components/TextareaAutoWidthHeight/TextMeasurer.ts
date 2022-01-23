export default class TextMeasurer {
  canvas: HTMLCanvasElement;

  constructor() {
    this.canvas = document.createElement("canvas");
  }

  measure(texts: string[], element: HTMLElement): TextMetrics[] {
    const style = window.getComputedStyle(element);
    const context = this.canvas.getContext("2d");
    if (context === null) {
      throw new Error("context is null");
    }
    context.font = style.font;
    return texts.map((text) => context.measureText(text));
  }
}
