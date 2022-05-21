import React from "react";
import { MathItemType as MIT, mathItemConfigs as configs } from "configs";
import ItemTemplate from "../../templates/ItemTemplate";
import { MathItemForm } from "../interfaces";

const Vector: MathItemForm<MIT.Vector> = ({ item }) => (
  <ItemTemplate item={item} config={configs[MIT.Vector]} />
);

export default Vector;
