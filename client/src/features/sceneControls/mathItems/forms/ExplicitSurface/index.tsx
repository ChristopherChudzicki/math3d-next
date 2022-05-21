import React from "react";
import { MathItemType as MIT, mathItemConfigs as configs } from "configs";
import ItemTemplate from "../../templates/ItemTemplate";
import { MathItemForm } from "../interfaces";

const ExplicitSurface: MathItemForm<MIT.ExplicitSurface> = ({ item }) => (
  <ItemTemplate item={item} config={configs[MIT.ExplicitSurface]} />
);

export default ExplicitSurface;
