// Compile-time sync check: the generated v1 client and the frontend
// source-of-truth math-item types must stay mutually assignable. Drift fails
// `tsc`. This file is never imported or executed. (The shared eslint config
// ignores `_`-prefixed vars via varsIgnorePattern, so no eslint-disable is
// needed — verified against packages/eslint-config.)
import type { MathItem, MathItemType } from "@math3d/mathitem-configs";
import type { SceneSchema as GeneratedV1Scene } from "./generated-v1";

// The generated item union, derived from the scene's items field so it holds
// regardless of whether the generator names the union.
type GeneratedMathItem = GeneratedV1Scene["items"][number];

// GUARD THE any-REGRESSION. If the generator collapses `items` to `any[]`,
// `GeneratedMathItem` is `any` and EVERY mutual-assignability assertion below
// silently passes (any is bidirectionally assignable). This makes the check
// inert. Fail `tsc` here instead, so the compile-time gate is self-sufficient
// and not solely reliant on schema.spec.ts's runtime oneOf-length assertion.
// (type-fest's IsAny, inlined to avoid the dependency.)
type IsAny<T> = 0 extends 1 & NoInfer<T> ? true : false;
const _notAny: IsAny<GeneratedMathItem> extends false ? true : never = true;

// `MathItemType` is now a string-literal union (no longer a nominal enum), so the
// frontend item `type` is already a string literal, matching the generated
// client's discriminants. `Serialized<>` is therefore an identity transform
// today; it's retained as the seam where Phase B switches this whole check to a
// strict `Equal<>`.
type Serialized<M> = M extends { type: infer T extends MathItemType }
  ? Omit<M, "type"> & { type: `${T}` }
  : never;
type SerializedMathItem = Serialized<MathItem>;

// Item-level mutual assignability (value-consumed; `as`-casts avoid
// excess-property checks on object literals).
const _a: GeneratedMathItem = {} as SerializedMathItem;
const _b: SerializedMathItem = {} as GeneratedMathItem;

// Scene-level assignability (so envelope drift can't escape the item check).
const _items: SerializedMathItem[] = {} as GeneratedV1Scene["items"];
const _itemsBack: GeneratedV1Scene["items"] = {} as SerializedMathItem[];

// itemOrder value-shape. Guard the same any-regression as the items union above
// (an `any` value would make the shape pin below vacuous), then pin the value
// type to `string[]`. The generated client emits
// `itemOrder: { [key: string]: Array<string> }`.
type GeneratedItemOrderValue = GeneratedV1Scene["itemOrder"][string];
const _itemOrderNotAny: IsAny<GeneratedItemOrderValue> extends false
  ? true
  : never = true;
const _itemOrderShape: string[] = {} as GeneratedItemOrderValue;

// FE union-completeness: a new MathItemType with no union variant fails CI.
// (Backstop — a missing variant usually fails configs.ts first, since MathItems
// is a closed Record<MathItemType, ...>; the unique value here is catching a
// `type` value typo that still has a MathItems entry.) Kept as a `Covers<>`
// completeness diagnostic for now: with `MathItemType` a literal union,
// `Equal<MathItem["type"], MathItemType>` would hold, and Phase B replaces this
// with that strict `Equal<>`.
type Covers<U extends MathItemType, All extends MathItemType> = [All] extends [
  U,
]
  ? [U] extends [All]
    ? true
    : false
  : false;
// Must stay `= true` (value-consumed): when Covers<> is false the annotation is
// `never` and `= true` fails to compile. Do not change the literal.
const _complete: Covers<MathItem["type"], MathItemType> extends true
  ? true
  : never = true;
