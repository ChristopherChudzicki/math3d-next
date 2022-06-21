import { mathItemConfigs as configs, MathItemType as MIT } from "configs";
import React from "react";

import ItemTemplate from "../../templates/ItemTemplate";
import { MathItemForm } from "../interfaces";

const ImplicitSurface: MathItemForm<MIT.ImplicitSurface> = ({ item }) => (
  <ItemTemplate item={item} config={configs[MIT.ImplicitSurface]} />
);

export default ImplicitSurface;
