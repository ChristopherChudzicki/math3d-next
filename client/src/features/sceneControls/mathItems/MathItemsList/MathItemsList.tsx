import React, { useEffect, useMemo, useCallback } from "react";
import classNames from "classnames";
import { MathItemType, MathItem } from "configs";
import { useAppSelector, useAppDispatch } from "store/hooks";
import { assertIsMathItemType } from "util/predicates";
import {
  MultiContainerDndContext,
  SortableList,
  SortableData,
} from "util/components/dnd";
import type { UniqueIdentifier, OnDragOver } from "util/components/dnd";
import FolderWithContents from "./FolderWithContents";
import MathItemUI from "../MathItem";
import { select, actions } from "../mathItemsSlice";
import style from "./MathItemsList.module.css";

// const findNode = (subtree: Subtree, id: string): Subtree | undefined => {
//   if (subtree.id === id) return subtree;
//   // eslint-disable-next-line no-restricted-syntax
//   for (const child of subtree.children ?? []) {
//     const match = findNode(child, id);
//     if (match) return match;
//   }
//   return undefined;
// };
// // @ts-expect-error findNode
// window.findNode = findNode;
// const mustFindNode = (subtree: Subtree, id: string): Subtree => {
//   const node = findNode(subtree, id);
//   if (!node) {
//     throw new Error(`Could not find node id=${id}`);
//   }
//   return node;
// };
// const getDepth = (node: Subtree): number => {
//   let currentDepth = 0;
//   let current = node;
//   while (current.parent) {
//     current = current.parent;
//     currentDepth += 1;
//   }
//   return currentDepth;
// };

const MathItemsList: React.FC<{ rootId: string }> = ({ rootId }) => {
  const root = useAppSelector(select.subtree(rootId));
  // @ts-expect-error foo
  window.roo = root;
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
  const handleDragOver: OnDragOver = useCallback(
    (e) => {
      console.log(e);
      if (!e.over) return;
      const activeId = e.active.id;
      const overId = e.over?.id;
      if (overId === activeId) return;
      if (typeof activeId !== "string" || typeof overId !== "string") {
        throw new Error("should be strings");
      }
      const activeData = e.active.data.current as SortableData;
      const overData = e.over?.data.current as SortableData;
      // const activeNode = mustFindNode(root, activeId);
      // const overNode = mustFindNode(root, overId);
      // const activeDepth = getDepth(activeNode);
      // const overDepth = getDepth(overNode);
      // if (activeDepth !== overDepth) return;
      // const newIndex = overNode.parent?.children?.findIndex(
      //   (child) => child === overNode
      // );
      // const newParent = overNode.parent?.id;
      // assertNotNil(newIndex);
      // assertNotNil(newParent);
      const activeContainer = activeData.sortable.containerId;
      const newContainer = overData.sortable.containerId;
      if (
        (activeContainer === rootId || newContainer === rootId) &&
        !(activeContainer === rootId && newContainer === rootId)
      ) {
        return;
      }
      const adjust =
        overData.sortable.index < activeData.sortable.index ? 0 : 1;
      dispatch(
        actions.move({
          id: activeId,
          newParent: newContainer as string,
          newIndex: overData.sortable.index + adjust,
        })
      );
    },
    [rootId, dispatch]
  );
  return (
    <MultiContainerDndContext
      onDragOver={handleDragOver}
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
