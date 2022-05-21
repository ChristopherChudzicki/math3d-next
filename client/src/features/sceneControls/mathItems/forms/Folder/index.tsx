import React from "react";
import { MathItemType as MIT, mathItemConfigs as configs } from "configs";
import ItemTemplate from "../../templates/ItemTemplate";
import { MathItemForm } from "../interfaces";

const Folder: MathItemForm<MIT.Folder> = ({ item }) => (
  <ItemTemplate item={item} config={configs[MIT.Folder]} />
);

export default Folder;
