import React, { useEffect, useMemo, useCallback, useRef } from "react";
import classNames from "classnames";
import { MathItemType, MathItem } from "@math3d/mathitem-configs";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import {
  MultiContainerDndContext,
  SortableList,
  SortableItem,
  hasSortableData,
  DroppableArea,
} from "@/util/components/dnd";
import type {
  SortableData,
  Active,
  Over,
  Data,
  UniqueIdentifier,
  OnDragOver,
} from "@/util/components/dnd";
import { useCollapsible } from "@/util/hooks";
import invariant from "tiny-invariant";
import MathItemUI from "../MathItem";
import { select, actions, useMathScope } from "../mathItemsSlice";
import style from "./MathItemsList.module.css";
import { useMathItemResults } from "../mathScope";

type TypeData =
  | {
      readonly type: "item" | "folder";
    }
  | {
      readonly type: "placeholder";
      for: string;
    };
const itemData: TypeData = {
  type: "item",
};
const folderData: TypeData = {
  type: "folder",
};

const assertTyped: <T extends Active | Over>(
  target: T,
) => asserts target is T & {
  data: { current: Data<TypeData> };
} = (target) => {
  if (target.data.current && "type" in target.data.current) return;
  throw new Error("Data should have property 'type'");
};

const assertSortable: <T extends Active | Over>(
  target: T,
) => asserts target is T & {
  target: { current: Data<SortableData & TypeData> };
} = (target) => {
  if (!hasSortableData(target)) {
    throw new Error("Should have SortableData");
  }
};

const placeholderId = (folderId: string) => `placeholder-${folderId}`;

interface FolderProps {
  folder: MathItem<MathItemType.Folder>;
  items: MathItem[];
  contentsClassName?: string;
}

const EVALUATED_PROPS = ["isCollapsed"] as const;

const FolderWithContents: React.FC<FolderProps & { permanent?: boolean }> = ({
  folder,
  items,
  contentsClassName,
  permanent,
}) => {
  const mathScope = useMathScope();
  const evaluated = useMathItemResults(mathScope, folder, EVALUATED_PROPS);
  const isOpen = !evaluated.isCollapsed;
  const hasEvaluated = evaluated.isCollapsed !== undefined;
  const collapseRef = useCollapsible(isOpen);
  const itemIds = useMemo(() => items.map((item) => item.id), [items]);
  return (
    <>
      <MathItemUI item={folder} />
      {hasEvaluated && (
        <div
          ref={collapseRef}
          className={classNames(style.folder, contentsClassName)}
        >
          <SortableList id={folder.id} items={itemIds}>
            {items.length === 0 && (
              <DroppableArea
                data={{
                  type: "placeholder",
                  for: folder.id,
                }}
                noDrag
                className={style.placeholder}
                id={placeholderId(folder.id)}
              >
                <em>Empty folder</em>
              </DroppableArea>
            )}
            {items.map((item) => (
              <SortableItem
                key={item.id}
                id={item.id}
                disabled={permanent}
                data={itemData}
                draggingClassName={style.dragging}
              >
                <MathItemUI item={item} />
              </SortableItem>
            ))}
          </SortableList>
        </div>
      )}
    </>
  );
};

const MathItemsList: React.FC<{ rootId: string }> = ({ rootId }) => {
  const root = useAppSelector((state) => select.subtree(state, rootId));
  const permanent = useAppSelector(select.isPermanent(rootId));
  const { children: folders = [] } = root;
  const mathItems = useAppSelector(select.mathItems);
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
    [mathItems, itemsByFolder],
  );
  const actionRef = useRef<null | ReturnType<typeof actions.move>>(null);

  const handleDragOver: OnDragOver = useCallback(
    (e) => {
      const { active, over } = e;
      if (!over) return;
      assertTyped(active);
      assertTyped(over);
      if (typeof active.id !== "string" || typeof over.id !== "string") {
        throw new Error("ids should be strings");
      }

      assertSortable(active);
      const activeData = active.data.current;
      const activeContainer = activeData.sortable.containerId;

      let newContainer: string;
      let newIndex: number;
      if (over.data.current.type === "placeholder") {
        newContainer = over.data.current.for;
        newIndex = 0;
      } else {
        assertSortable(over);
        const overData = over.data.current;
        newContainer = overData.sortable.containerId;
        if (overData.type !== activeData.type) {
          return;
        }
        newIndex = overData.sortable.index;
      }

      const action = actions.move({
        id: active.id,
        newParent: newContainer as string,
        newIndex,
      });

      if (activeContainer === newContainer) {
        /**
         * dnd-kit's "sortingStrategy" takes care of UI transitions within a
         * container. So if the draggable didn't change containers, we can wait
         * until dragEnd to dispatch the action that actually reorders stuff in
         * the store.
         *
         * This prevents some jumping that I encountered, and also reduces the
         * overall number of redux actions. (Which isn't really important,
         * except for decluttering the logs.)
         *
         * We store the action in a ref for use onDragEnd because the endEvent
         * might have over:null if cursor is moved off of a droppable.
         */
        actionRef.current = action;
        return;
      }
      dispatch(action);
    },
    [dispatch],
  );
  const handleDragEnd = useCallback(() => {
    if (actionRef.current) dispatch(actionRef.current);
    actionRef.current = null;
  }, [dispatch]);
  const folderIds = useMemo(
    () => folders.map((folder) => folder.id),
    [folders],
  );
  return (
    <MultiContainerDndContext
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      renderActive={renderActive}
    >
      <SortableList id={rootId} items={folderIds}>
        {folders.map((folder, folderIndex) => {
          const childItems = itemsByFolder.get(folder.id) ?? [];
          const folderItem = mathItems[folder.id];
          invariant(folderItem.type === MathItemType.Folder);
          return (
            <SortableItem
              disabled={permanent}
              key={folderItem.id}
              id={folderItem.id}
              data={folderData}
              draggingClassName={style.dragging}
            >
              <FolderWithContents
                contentsClassName={classNames({
                  [style["last-folder"]]: folderIndex === folders.length - 1,
                })}
                folder={folderItem}
                items={childItems}
                permanent={permanent}
              />
            </SortableItem>
          );
        })}
      </SortableList>
    </MultiContainerDndContext>
  );
};

export default MathItemsList;
