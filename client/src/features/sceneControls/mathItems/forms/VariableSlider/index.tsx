import React from "react";
import { MathItemType as MIT, mathItemConfigs as configs } from "configs";
import ItemTemplate from "../../templates/ItemTemplate";
import { MathItemForm } from "../interfaces";

const VariableSlider: MathItemForm<MIT.VariableSlider> = ({ item }) => (
  <ItemTemplate item={item} config={configs[MIT.VariableSlider]} />
);

export default VariableSlider;
