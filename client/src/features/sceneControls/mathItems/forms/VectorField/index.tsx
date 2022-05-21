import React from "react";
import { MathItemType as MIT, mathItemConfigs as configs } from "configs";
import ItemTemplate from "../../templates/ItemTemplate";
import { MathItemForm } from "../interfaces";

const VectorField: MathItemForm<MIT.VectorField> = ({ item }) => (
  <ItemTemplate item={item} config={configs[MIT.VectorField]} />
);

export default VectorField;
