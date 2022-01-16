import React from "react";
import type { MathItem } from "types";

type Props = {
  item: MathItem;
};
const MathItemComponent: React.FC<Props> = ({ item }) => {
  const { properties } = item;
  return (
    <div>
      {item.id}: {properties.description}
    </div>
  );
};

export default MathItemComponent;
