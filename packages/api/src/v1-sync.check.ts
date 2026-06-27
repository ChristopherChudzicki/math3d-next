// Compile-time sync check: the generated v1 client and the frontend
// source-of-truth math-item types must stay in sync. Drift fails `tsc`. This
// file is never imported or executed. (The shared eslint config ignores
// `_`-prefixed vars via varsIgnorePattern, so no eslint-disable is needed.)
//
// We assert an invariant `Equal` (each member structurally identical, not merely
// mutually assignable), via type-fest's `IsEqual` over `SimplifyDeep`-normalized
// types. The normalization is load-bearing:
//   - The generated client renders its discriminated union as
//     `({ type: "POINT" } & PointItem) | ...` intersections, whereas the frontend
//     type is a flat `{ id; type; properties }`. `IsEqual` compares type
//     *representation*, not assignability, so it reports the unreduced
//     intersection and the flat object as different even though they describe the
//     same values.
//   - `SimplifyDeep` materializes each intersection into a single resolved object
//     (recursively — the parametric/field members carry the mismatch nested inside
//     `properties`, so shallow `Simplify` is not enough). After deep normalization
//     both sides have identical representations and `IsEqual` matches them. This
//     is deterministic across compiler runs and assertion orderings.
// `IsEqual` also distinguishes `any` from a concrete type, so if the generator
// ever collapsed `items`/`itemOrder` to `any` the assertion fails — no separate
// any-guard needed (unlike mutual assignability, which is any-blind).
//
// Phase A (#1144) made the `type` discriminant a string-literal union and Phase B
// made the item property types validate-free (the parse-time `validate` lives on
// `ValidatedParseable`, not the stored item), removing the real asymmetries — so
// no `Serialized<>` widening or `as`-cast crutches are needed.
//
// `type-fest` is pinned to an exact version: `SimplifyDeep`/`IsEqual` are deep
// recursive type machinery, and a bump can change how they reduce the generator's
// intersection union. After any type-fest bump, re-verify this still goes RED on a
// real drift (e.g. temporarily add a field to one side) before trusting green.
import type { IsEqual, SimplifyDeep } from "type-fest";
import type { MathItem } from "@math3d/mathitem-configs";
import type { SceneSchema as GeneratedV1Scene } from "./generated-v1";

type Assert<T extends true> = T;
type DeepEqual<A, B> = IsEqual<SimplifyDeep<A>, SimplifyDeep<B>>;

// The generated item union, derived from the scene's items field so it holds
// regardless of whether the generator names the union.
type GeneratedMathItem = GeneratedV1Scene["items"][number];

// Compare the FE and generated item types per-discriminant. Mapping over the
// union of BOTH sides' `type` discriminants makes this EXHAUSTIVE: a new item
// type (a new `MathItemType` flows into `MathItem["type"]`) automatically gets an
// entry here, so one cannot be added without its FE/BE shapes being compared — and
// a type present on only one side surfaces as a drift (its counterpart extracts to
// `never`). `DriftingItemTypes` resolves to the discriminant(s) of any item type
// whose shapes differ, or `never` when all are in sync; when the assertion below
// fails, hover `DriftingItemTypes` to see exactly which item type(s) drifted.
type ItemDiscriminant = MathItem["type"] | GeneratedMathItem["type"];
type DriftingItemTypes = {
  [T in ItemDiscriminant]: DeepEqual<
    Extract<MathItem, { type: T }>,
    Extract<GeneratedMathItem, { type: T }>
  > extends true
    ? never
    : T;
}[ItemDiscriminant];
type _itemsInSync = Assert<IsEqual<DriftingItemTypes, never>>;

// itemOrder value-shape. The generated client emits
// `itemOrder: { [key: string]: Array<string> }`.
type GeneratedItemOrderValue = GeneratedV1Scene["itemOrder"][string];
type _itemOrderInSync = Assert<DeepEqual<GeneratedItemOrderValue, string[]>>;
