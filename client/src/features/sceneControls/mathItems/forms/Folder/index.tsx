import { mathItemConfigs as configs, MathItemType as MIT } from "configs";
import React from "react";

import ItemTemplate from "../../templates/ItemTemplate";
import { MathItemForm } from "../interfaces";

const Folder: MathItemForm<MIT.Folder> = ({ item }) => (
  <ItemTemplate item={item} config={configs[MIT.Folder]} />
);

export default Folder;
