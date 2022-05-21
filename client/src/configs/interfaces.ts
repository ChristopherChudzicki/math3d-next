import type { MathItemType, WidgetType } from "./constants";

export type Validate = (value: unknown) => void;

export interface MathItemProperties {
  description: string;
}

export interface PropertyConfig<P extends MathItemProperties> {
  readonly name: keyof P;
  readonly widget: WidgetType;
  /**
   * Should this property be included in the settings overlay?
   */
  readonly primaryOnly?: boolean;
  readonly label: string;
  /**
   * Used for parsed+evaluated properties, this validator is passed to
   * MathScope when evaluating the property.
   */
  readonly validate?: Validate;
}

export interface MathItemConfig<
  T extends MathItemType,
  P extends MathItemProperties
> {
  type: T;
  label: string;
  properties: PropertyConfig<P>[];
  /**
   * Generate a new mathItem of this type with the given id.
   */
  make: MathItemGenerator<T, P>;
}

export interface MathItemGeneric<
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
> = (id: string) => MathItemGeneric<T, P>;
