import React from "react";
import { MathItemType as MIT, mathItemConfigs as configs } from "configs";
import ItemTemplate from "../../templates/ItemTemplate";
import { MathItemForm } from "../interfaces";

const ParametricSurface: MathItemForm<MIT.ParametricSurface> = ({ item }) => (
  <ItemTemplate item={item} config={configs[MIT.ParametricSurface]} />
);

export default ParametricSurface;
