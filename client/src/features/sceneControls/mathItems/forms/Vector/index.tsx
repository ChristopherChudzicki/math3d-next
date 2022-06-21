import { mathItemConfigs as configs, MathItemType as MIT } from "configs";
import React from "react";

import ItemTemplate from "../../templates/ItemTemplate";
import { MathItemForm } from "../interfaces";

const Vector: MathItemForm<MIT.Vector> = ({ item }) => (
  <ItemTemplate item={item} config={configs[MIT.Vector]} />
);

export default Vector;
