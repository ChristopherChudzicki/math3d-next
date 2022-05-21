import React from "react";
import { MathItemType as MIT, mathItemConfigs as configs } from "configs";
import ItemTemplate from "../../templates/ItemTemplate";
import { MathItemForm } from "../interfaces";

const ImplicitSurface: MathItemForm<MIT.ImplicitSurface> = ({ item }) => (
  <ItemTemplate item={item} config={configs[MIT.ImplicitSurface]} />
);

export default ImplicitSurface;
