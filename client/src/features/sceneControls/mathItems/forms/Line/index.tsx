import React from "react";
import { MathItemType as MIT, mathItemConfigs as configs } from "configs";
import ItemTemplate from "../../templates/ItemTemplate";
import { MathItemForm } from "../interfaces";

const Line: MathItemForm<MIT.Line> = ({ item }) => (
  <ItemTemplate item={item} config={configs[MIT.Line]} />
);

export default Line;
