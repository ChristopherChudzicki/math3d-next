import React from "react";

import type { MathItem } from "types";
import ItemTemplate from '../templates/ItemTemplate'
import { PointConfig } from '../configs'

type Props = {
  item: MathItem;
};
const Point: React.FC<Props> = ({ item }) => {
  const description = `Description: ${item.id}`;
  return <ItemTemplate description={description} config={PointConfig} />;
};

export default Point;
