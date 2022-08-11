/* eslint-disable no-param-reassign */
import React from "react";
import { MathItem, MathItemType } from "configs";
import classNames from "classnames";
import { useCollapsible } from "util/hooks";
import { SortableList } from "util/components/dnd";
import MathItemComponent from "../MathItem";
import { useMathResults } from "../mathScope";
import style from "./MathItemsList.module.css";
import { useMathScope } from "../mathItemsSlice";

interface Props {
  folder: MathItem<MathItemType.Folder>;
  items: MathItem[];
  contentsClassName?: string;
}

const EVALUATED_PROPS = ["isCollapsed"];

const FolderWithContents: React.FC<Props> = ({
  folder,
  items,
  contentsClassName,
}) => {
  const mathScope = useMathScope();
  const evaluated = useMathResults(mathScope, folder.id, EVALUATED_PROPS);
  const isOpen = !evaluated.isCollapsed;
  const hasEvaluated = evaluated.isCollapsed !== undefined;
  const collapseRef = useCollapsible(isOpen);
  return (
    <>
      <MathItemComponent item={folder} />
      {hasEvaluated && (
        <div
          ref={collapseRef}
          className={classNames(style.folder, contentsClassName)}
        >
          <SortableList id={folder.id} draggingItemClassName={style.dragging}>
            {items.map((item) => (
              <MathItemComponent key={item.id} item={item} />
            ))}
          </SortableList>
        </div>
      )}
    </>
  );
};

export default FolderWithContents;
