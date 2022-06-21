import { mathItemConfigs as configs, MathItemType as MIT } from "configs";
import React from "react";

import ItemTemplate from "../../templates/ItemTemplate";
import { MathItemForm } from "../interfaces";

const BooleanVariable: MathItemForm<MIT.BooleanVariable> = ({ item }) => (
  <ItemTemplate item={item} config={configs[MIT.BooleanVariable]} />
);

export default BooleanVariable;
