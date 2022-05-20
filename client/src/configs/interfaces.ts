import type { MathItemType, WidgetType } from "./constants";

export type Validate = (value: unknown) => void;

type PropertyValue = string | number | boolean | null;

export interface MathItemProperties {
  description: string;
}

export interface PropertyConfig<P extends MathItemProperties> {
  readonly name: keyof P;
  readonly widget: WidgetType;
  readonly primaryOnly?: boolean;
  readonly label: string;
  readonly validate?: Validate;
}

export interface MathItemConfig<
  T extends MathItemType,
  P extends MathItemProperties
> {
  type: T;
  label: string;
  properties: PropertyConfig<P>[];
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
