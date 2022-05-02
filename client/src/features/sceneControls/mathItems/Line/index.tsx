import React from "react";
import { MathItem, MathItemType as MT } from "types";
import ItemTemplate from "../templates/ItemTemplate";
import configs from "../configs";

type Props = {
  item: MathItem;
};
const Line: React.FC<Props> = ({ item }) => (
  <ItemTemplate item={item} config={configs[MT.Line]} />
);

export default Line;
