import type { MathItem, MathItemType } from "@math3d/mathitem-configs";
import React from "react";

interface MathItemProps<T extends MathItemType> {
  item: MathItem<T>;
}

type MathItemForm<T extends MathItemType> = React.FC<MathItemProps<T>>;

export type { MathItemForm };
