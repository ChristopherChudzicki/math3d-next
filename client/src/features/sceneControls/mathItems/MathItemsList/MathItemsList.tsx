import React, { useEffect, useMemo, useCallback, useRef } from "react";
import classNames from "classnames";
import { MathItemType, MathItem } from "configs";
import { useAppSelector, useAppDispatch } from "store/hooks";
import { assertIsMathItemType } from "util/predicates";
import {
  MultiContainerDndContext,
  SortableList,
  SortableData,
  hasSortableData,
  Active,
  Over,
} from "util/components/dnd";
import type { UniqueIdentifier, OnDragOver } from "util/components/dnd";
import FolderWithContents from "./FolderWithContents";
import MathItemUI from "../MathItem";
import { select, actions } from "../mathItemsSlice";
import style from "./MathItemsList.module.css";

const MathItemsList: React.FC<{ rootId: string }> = ({ rootId }) => {
  const root = useAppSelector(select.subtree(rootId));
  const { children: folders = [] } = root;
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
  const actionRef = useRef<null | ReturnType<typeof actions.move>>(null);

  const reorder = useCallback(
    (active: Active, over: Over) => {
      if (!hasSortableData(active) || !hasSortableData(over)) {
        throw new Error("Should have sortable data.");
      }
      if (typeof active.id !== "string" || typeof over.id !== "string") {
        throw new Error("ids should be strings");
      }
      const activeData = active.data.current as SortableData;
      const overData = over.data.current as SortableData;
      const activeContainer = activeData.sortable.containerId;
      const newContainer = overData.sortable.containerId;
      if (
        (activeContainer === rootId || newContainer === rootId) &&
        !(activeContainer === rootId && newContainer === rootId)
      ) {
        return;
      }

      const action = actions.move({
        id: active.id,
        newParent: newContainer as string,
        newIndex: overData.sortable.index,
      });
      if (activeContainer === newContainer) {
        actionRef.current = action;
        return;
      }
      dispatch(action);
    },
    [rootId, dispatch]
  );
  const handleDragOver: OnDragOver = useCallback(
    (e) => {
      if (!e.over) return;
      reorder(e.active, e.over);
    },
    [reorder]
  );
  const handleDragEnd = useCallback(() => {
    if (actionRef.current) dispatch(actionRef.current);
    actionRef.current = null;
  }, [dispatch]);
  return (
    <MultiContainerDndContext
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      renderActive={renderActive}
    >
      <SortableList id={rootId} draggingItemClassName={style.dragging}>
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
