import { mathItemConfigs as configs, MathItemType as MIT } from "configs";
import React from "react";

import ItemTemplate from "../../templates/ItemTemplate";
import { MathItemForm } from "../interfaces";

const VectorField: MathItemForm<MIT.VectorField> = ({ item }) => (
  <ItemTemplate item={item} config={configs[MIT.VectorField]} />
);

export default VectorField;
