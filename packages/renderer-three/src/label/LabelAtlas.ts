export type LabelWeight = "normal" | "bold";

/** A string as drawn: the atlas holds one raster per text and weight. */
export type LabelText = { text: string; weight: LabelWeight };

/** A raster's place in the atlas, in device pixels from its top left. */
export type Slot = { x: number; y: number; width: number; height: number };

/** Where the atlas draws: a canvas in the browser, a fake in tests. */
export interface AtlasSurface {
  /** A raster's size in device pixels. */
  measure(label: LabelText, pixelRatio: number): [number, number];
  /** Replaces the surface with a blank one of that size; 0 × 0 frees it. */
  reset(width: number, height: number): void;
  draw(label: LabelText, slot: Slot, pixelRatio: number): void;
}

/** Wide enough for any one label MathBox draws at a pixel ratio of 3. */
export const ATLAS_WIDTH = 2048;
const MIN_HEIGHT = 64;
/** Blank pixels between rasters, so filtering never reads a neighbor. */
const GUTTER = 1;

type Entry = { label: LabelText; users: number; slot: Slot };
type Shelf = { y: number; height: number; x: number };

const keyOf = ({ text, weight }: LabelText) => `${weight}|${text}`;

const nextPowerOfTwo = (n: number) => 2 ** Math.ceil(Math.log2(n));

/**
 * Packs label rasters into one surface, counting the users of each so that a
 * string repeated across labels is drawn once. A string's space is reclaimed
 * by the next relayout after its last user releases it; the surface is freed
 * when no strings remain.
 */
export class LabelAtlas {
  private readonly entries = new Map<string, Entry>();

  private shelves: Shelf[] = [];

  private used = 0;

  private surfaceHeight = 0;

  private ratio = 1;

  /**
   * @param onRelayout Called after every string moved, so that users re-read
   *   their slots.
   */
  constructor(
    private readonly surface: AtlasSurface,
    private readonly onRelayout: () => void,
  ) {}

  /** The surface's size in device pixels. */
  get size(): [number, number] {
    return this.surfaceHeight === 0
      ? [0, 0]
      : [ATLAS_WIDTH, this.surfaceHeight];
  }

  /** The device pixels per CSS pixel the rasters are drawn at. */
  get pixelRatio(): number {
    return this.ratio;
  }

  acquire(label: LabelText): void {
    const key = keyOf(label);
    const entry = this.entries.get(key);
    if (entry) {
      entry.users += 1;
      return;
    }
    const added = { label, users: 1, slot: this.place(label) };
    this.entries.set(key, added);
    if (this.used > this.surfaceHeight) {
      this.relayout();
    } else {
      this.surface.draw(label, added.slot, this.ratio);
    }
  }

  release(label: LabelText): void {
    const key = keyOf(label);
    const entry = this.entries.get(key);
    if (!entry) throw new Error(`"${key}" is not in the atlas.`);
    entry.users -= 1;
    if (entry.users > 0) return;
    this.entries.delete(key);
    if (this.entries.size === 0) {
      this.shelves = [];
      this.used = 0;
      this.surfaceHeight = 0;
      this.surface.reset(0, 0);
    }
  }

  slot(label: LabelText): Slot {
    const entry = this.entries.get(keyOf(label));
    if (!entry) throw new Error(`"${keyOf(label)}" is not in the atlas.`);
    return entry.slot;
  }

  setPixelRatio(ratio: number): void {
    if (ratio === this.ratio) return;
    this.ratio = ratio;
    this.relayout();
  }

  /** Measures and draws every string again, as after a font loads. */
  relayout(): void {
    if (this.entries.size === 0) return;
    this.shelves = [];
    this.used = 0;
    this.entries.forEach((entry) => {
      // eslint-disable-next-line no-param-reassign
      entry.slot = this.place(entry.label);
    });
    this.surfaceHeight = Math.max(MIN_HEIGHT, nextPowerOfTwo(this.used));
    this.surface.reset(ATLAS_WIDTH, this.surfaceHeight);
    this.entries.forEach(({ label, slot }) =>
      this.surface.draw(label, slot, this.ratio),
    );
    this.onRelayout();
  }

  /** A slot on the first shelf of the same height with room, else on a new shelf. */
  private place(label: LabelText): Slot {
    const [measured, height] = this.surface.measure(label, this.ratio);
    const width = Math.min(measured, ATLAS_WIDTH);
    let shelf = this.shelves.find(
      (s) => s.height === height && s.x + width <= ATLAS_WIDTH,
    );
    if (!shelf) {
      shelf = { y: this.used, height, x: 0 };
      this.shelves.push(shelf);
      this.used += height + GUTTER;
    }
    const slot = { x: shelf.x, y: shelf.y, width, height };
    shelf.x += width + GUTTER;
    return slot;
  }
}
