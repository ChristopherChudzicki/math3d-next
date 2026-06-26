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

// The frontend item `type` is a MathItemType enum member; the generated client
// emits string literals. Widen the source union's discriminant to its literal
// value so both sides are string literals, preserving per-variant fidelity.
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
// itemOrder value-shape (string[]) is NOT asserted here: openapi-generator v7.2.0
// emits `itemOrder` as `{ [key: string]: any }`, so any assignability check is vacuous
// (`any` is bidirectionally assignable). The runtime ajv check in schema.spec.ts covers
// the spec shape; tightening the generated type is tracked for #1125.

// FE union-completeness: a new MathItemType with no union variant fails CI.
// (Backstop — a missing variant usually fails configs.ts first, since MathItems
// is a closed Record<MathItemType, ...>; the unique value here is catching an
// enum *value* typo that still has a MathItems entry.) NOT Equal<> — under
// tsc --strict the enum-member union is a distinct identity from the enum type,
// so Equal<> is false even on a complete union.
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
