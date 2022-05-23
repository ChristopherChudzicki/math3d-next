import type { MathItemType, WidgetType } from "./constants";

export type Validate = (value: unknown) => void;

export interface MathItemProperties {
  description: string;
}

export interface PropertyConfig<K> {
  readonly name: K;
  readonly widget: WidgetType;
  readonly label: string;
  /**
   * Used for parsed+evaluated properties, this validator is passed to
   * MathScope when evaluating the property.
   */
  readonly validate?: Validate;
}

export interface IMathItemConfig<
  T extends MathItemType,
  P extends MathItemProperties
> {
  type: T;
  label: string;
  properties: {
    [K in keyof P]: K extends string ? PropertyConfig<K> : never;
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
