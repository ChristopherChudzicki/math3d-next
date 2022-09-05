import { mathItemConfigs as configs, MathItemType as MIT } from "@/configs";
import React from "react";

import ItemTemplate from "../../templates/ItemTemplate";
import { MathItemForm } from "../interfaces";

const VariableSlider: MathItemForm<MIT.VariableSlider> = ({ item }) => (
  <ItemTemplate item={item} config={configs[MIT.VariableSlider]} />
);

export default VariableSlider;
