import { mathItemConfigs as configs, MathItemType as MIT } from "@/configs";
import React from "react";

import ItemTemplate from "../../templates/ItemTemplate";
import { MathItemForm } from "../interfaces";

const Grid: MathItemForm<MIT.Grid> = ({ item }) => (
  <ItemTemplate item={item} config={configs[MIT.Grid]} />
);

export default Grid;
