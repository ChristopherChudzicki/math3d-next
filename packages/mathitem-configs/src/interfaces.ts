import type * as mjs from "mathjs";
import type { MathItemType, WidgetType } from "./constants";

export type Validate<V> = (value: unknown, node: mjs.MathNode) => V;

export interface MathItemProperties {
  description: string;
}

export interface PropertyConfig<K, V = never> {
  readonly name: K;
  /**
   * The default widget used to display/edit the property in UI.
   *
   * If the widge is a MathWidget, the property will additionally be parsed and
   * evaluated via MathScope.
   */
  readonly widget: WidgetType;
  readonly label: string;
  /**
   * Used for parsed+evaluated properties.
   *
   * The default type for `V` is "never", meaning no validation.
   * Appropriate for un-evaluated properties like `description` or `label`.
   */
  readonly validate?: Validate<V>;
  readonly description?: string;
}

export interface IMathItemConfig<
  T extends MathItemType,
  P extends MathItemProperties,
  E extends Partial<Record<keyof P, unknown>>,
> {
  type: T;
  label: string;
  properties: {
    [K in keyof P]: K extends string
      ? PropertyConfig<K, K extends keyof E ? E[K] : never>
      : never;
  };
  settingsProperties: (keyof P & string)[];
  /**
   * Generate a new mathItem of this type with the given id.
   */
  make: MathItemGenerator<T, P>;
}

export interface IMathItem<
  T extends MathItemType,
  P extends MathItemProperties,
> {
  id: string;
  type: T;
  properties: P;
}

export type MathItemGenerator<
  T extends MathItemType,
  P extends MathItemProperties,
> = (id: string) => IMathItem<T, P>;
