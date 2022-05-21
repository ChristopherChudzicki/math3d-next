import React from "react";
import { MathItemType as MIT, mathItemConfigs as configs } from "configs";
import ItemTemplate from "../../templates/ItemTemplate";
import { MathItemForm } from "../interfaces";

const Camera: MathItemForm<MIT.Camera> = ({ item }) => (
  <ItemTemplate item={item} config={configs[MIT.Camera]} />
);

export default Camera;
