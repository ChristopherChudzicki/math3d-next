import { mathItemConfigs as configs, MathItemType as MIT } from "configs";
import React from "react";

import ItemTemplate from "../../templates/ItemTemplate";
import { MathItemForm } from "../interfaces";

const ExplicitSurface: MathItemForm<MIT.ExplicitSurface> = ({ item }) => (
  <ItemTemplate item={item} config={configs[MIT.ExplicitSurface]} />
);

export default ExplicitSurface;
