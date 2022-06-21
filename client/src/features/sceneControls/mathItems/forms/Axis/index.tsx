import { mathItemConfigs as configs, MathItemType as MIT } from "configs";
import React from "react";

import ItemTemplate from "../../templates/ItemTemplate";
import { MathItemForm } from "../interfaces";

const Axis: MathItemForm<MIT.Axis> = ({ item }) => (
  <ItemTemplate item={item} config={configs[MIT.Axis]} />
);

export default Axis;
