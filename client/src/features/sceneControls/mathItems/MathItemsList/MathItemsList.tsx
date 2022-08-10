import React, { useEffect, useMemo, useCallback } from "react";
import { UniqueIdentifier } from "@dnd-kit/core";
import classNames from "classnames";
import { MathItemType, MathItem } from "configs";
import { useAppSelector, useAppDispatch } from "store/hooks";
import { assertIsMathItemType } from "util/predicates";
import { MultiContainerDndContext, SortableList } from "util/components/dnd";
import FolderWithContents from "./FolderWithContents";
import MathItemUI from "../MathItem";
import { select, actions } from "../mathItemsSlice";
import style from "./MathItemsList.module.css";

const MathItemsList: React.FC<{ rootId: string }> = ({ rootId }) => {
  const { children: folders = [] } = useAppSelector(select.subtree(rootId));
  const mathItems = useAppSelector(select.mathItems());
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(actions.initializeMathScope());
  }, [dispatch]);
  const itemsByFolder: Map<string, MathItem[]> = useMemo(() => {
    const entries = folders.map((subtree) => {
      const items = subtree.children?.map(({ id }) => mathItems[id]) ?? [];
      return [subtree.id, items] as const;
    });
    return new Map(entries);
  }, [folders, mathItems]);
  const renderActive = useCallback(
    (activeId: UniqueIdentifier) => {
      const item = mathItems[activeId];
      if (item.type === MathItemType.Folder) {
        const childItems = itemsByFolder.get(item.id) ?? [];
        return (
          <FolderWithContents key={item.id} folder={item} items={childItems} />
        );
      }
      return <MathItemUI key={item.id} item={item} />;
    },
    [mathItems, itemsByFolder]
  );
  return (
    <MultiContainerDndContext renderActive={renderActive}>
      <SortableList>
        {folders.map((folder, folderIndex) => {
          const childItems = itemsByFolder.get(folder.id) ?? [];
          const folderItem = mathItems[folder.id];
          assertIsMathItemType(folderItem.type, MathItemType.Folder);
          return (
            <FolderWithContents
              key={folderItem.id}
              contentsClassName={classNames({
                [style["last-folder"]]: folderIndex === folders.length - 1,
              })}
              folder={folderItem}
              items={childItems}
            />
          );
        })}
      </SortableList>
    </MultiContainerDndContext>
  );
};

export default MathItemsList;
