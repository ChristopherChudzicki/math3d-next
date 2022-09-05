import { mathItemConfigs as configs, MathItemType as MIT } from "@/configs";
import React from "react";

import ItemTemplate from "../../templates/ItemTemplate";
import { MathItemForm } from "../interfaces";

const Camera: MathItemForm<MIT.Camera> = ({ item }) => (
  <ItemTemplate item={item} config={configs[MIT.Camera]} />
);

export default Camera;
