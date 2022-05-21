import React from "react";
import { MathItemType as MIT, mathItemConfigs as configs } from "configs";
import ItemTemplate from "../../templates/ItemTemplate";
import { MathItemForm } from "../interfaces";

const Grid: MathItemForm<MIT.Grid> = ({ item }) => (
  <ItemTemplate item={item} config={configs[MIT.Grid]} />
);

export default Grid;
