import React from "react";
import { mathItemConfigs as configs, MathItemType as MIT } from "@/configs";
import ItemTemplate from "../../templates/ItemTemplate";
import { MathItemForm } from "../interfaces";
import styles from "./Grid.module.css";
import ReadonlyMathField from "../../FieldWidget/ReadonlyMathField";

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
