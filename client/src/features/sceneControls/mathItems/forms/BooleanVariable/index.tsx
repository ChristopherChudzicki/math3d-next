import React from "react";
import { MathItemType as MIT, mathItemConfigs as configs } from "configs";
import ItemTemplate from "../../templates/ItemTemplate";
import { MathItemForm } from "../interfaces";

const BooleanVariable: MathItemForm<MIT.BooleanVariable> = ({ item }) => (
  <ItemTemplate item={item} config={configs[MIT.BooleanVariable]} />
);

export default BooleanVariable;
