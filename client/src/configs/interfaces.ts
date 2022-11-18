import type { MathItemType, WidgetType } from "./constants";

export type Validate<V> = (value: unknown) => V;

export interface MathItemProperties {
  description: string;
}

export interface PropertyConfig<K, V = never> {
  readonly name: K;
  readonly widget: WidgetType;
  readonly label: string;
  /**
   * Used for parsed+evaluated properties.
   *
   * The default type for `V` is "never", meaning no validation.
   * Appropriate for un-evaluated properties like `description` or `label`.
   */
  readonly validate?: Validate<V>;
}

export interface IMathItemConfig<
  T extends MathItemType,
  P extends MathItemProperties,
  E extends Partial<Record<keyof P, unknown>>
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
  P extends MathItemProperties
> {
  id: string;
  type: T;
  properties: P;
}

export type MathItemGenerator<
  T extends MathItemType,
  P extends MathItemProperties
> = (id: string) => IMathItem<T, P>;
