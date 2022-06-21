import { mathItemConfigs as configs, MathItemType as MIT } from "configs";
import React from "react";

import ItemTemplate from "../../templates/ItemTemplate";
import { MathItemForm } from "../interfaces";

const Line: MathItemForm<MIT.Line> = ({ item }) => (
  <ItemTemplate item={item} config={configs[MIT.Line]} />
);

export default Line;
