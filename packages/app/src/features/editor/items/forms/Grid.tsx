import React from "react";
import {
  mathItemConfigs as configs,
  MathItemType as MIT,
} from "@math3d/mathitem-configs";
import ItemTemplate from "@/features/editor/items/templates/ItemTemplate";
import ReadonlyMathField from "@/features/editor/items/FieldWidget/ReadonlyMathField";
import { MathItemForm } from "./interfaces";
import styles from "./Grid.module.css";

const config = configs[MIT.Grid];

const configProps = config.properties;

const Grid: MathItemForm<MIT.Grid> = ({ item }) => {
  return (
    <ItemTemplate item={item} config={config}>
      <div className={styles.row}>
        <div className={styles.labeledGroup}>
          <span>{configProps.axes.label}</span>
          <ReadonlyMathField value={item.properties.axes} />
        </div>
      </div>
    </ItemTemplate>
  );
};

export default Grid;
