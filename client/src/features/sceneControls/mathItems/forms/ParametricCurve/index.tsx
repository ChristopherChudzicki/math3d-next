import React from "react";
import { MathItemType as MIT, mathItemConfigs as configs } from "configs";
import ItemTemplate from "../../templates/ItemTemplate";
import { MathItemForm } from "../interfaces";

const ParametricCurve: MathItemForm<MIT.ParametricCurve> = ({ item }) => (
  <ItemTemplate item={item} config={configs[MIT.ParametricCurve]} />
);

export default ParametricCurve;
