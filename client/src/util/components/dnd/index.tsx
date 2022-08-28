import React, { useCallback, useState } from "react";
import {
  defaultDropAnimationSideEffects,
  DndContext,
  DndContextProps,
  DragOverlay,
  DropAnimation,
  KeyboardSensor,
  UniqueIdentifier,
  useSensor,
  useSensors,
  Active,
  Over,
  Data,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  SortableData,
  hasSortableData,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import classNames from "classnames";
import PointerSensor from "./PointerSensor";

interface SortableItemProps {
  id: UniqueIdentifier;
  data?: Data;
  draggingClassName?: string;
  className?: string;
  children?: React.ReactNode;
  as?: React.ElementType;
}

const SortableItem: React.FC<SortableItemProps> = (props) => {
  const { as: Component = "div", draggingClassName, className } = props;
  const {
    isDragging,
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: props.id,
    data: props.data,
  });
  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };
  return (
    <Component
      className={classNames(
        className,
        draggingClassName
          ? {
              [draggingClassName]: isDragging,
            }
          : {}
      )}
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      {props.children}
    </Component>
  );
};

interface SortableListProps {
  items: UniqueIdentifier[];
  id?: string;
  as?: React.ElementType;
  className?: string;
  children?: React.ReactNode;
}

type KeyedElement = React.ReactElement & { key: string };

const SortableList: React.FC<SortableListProps> = (
  props: SortableListProps
) => {
  const { as: Component = "div" } = props;
  const children = props.children as KeyedElement[];
  return (
    <SortableContext
      id={props.id}
      strategy={verticalListSortingStrategy}
      items={props.items}
    >
      <Component className={props.className}>{children}</Component>
    </SortableContext>
  );
};

type OnDragStart = NonNullable<DndContextProps["onDragStart"]>;
type OnDragMove = NonNullable<DndContextProps["onDragMove"]>;
type OnDragOver = NonNullable<DndContextProps["onDragOver"]>;
type OnDragEnd = NonNullable<DndContextProps["onDragEnd"]>;
type OnDragCancel = NonNullable<DndContextProps["onDragCancel"]>;

const interactiveTags = [
  "textarea",
  "input",
  "button",
  "select",
  "option",
  "optgroup",
  "video",
  "audio",
];

const getPathToRoot = (el: HTMLElement): HTMLElement[] => {
  const path = [el];
  let current = el;
  while (current.parentElement) {
    path.push(current.parentElement);
    current = current.parentElement;
  }
  return path;
};

const isInteractive = (el: HTMLElement) => {
  if (el.isContentEditable) return true;
  return interactiveTags.includes(el.tagName.toLowerCase());
};
const isDraggableElement = (el: HTMLElement) => {
  const path = getPathToRoot(el);
  return !path.some((pathEl) => {
    if (isInteractive(pathEl)) return true;
    if (pathEl.dataset.dndkitNoDrag) return true;
    return false;
  });
};

interface MultiContainerDndContextProps {
  children?: React.ReactNode;
  renderActive: (id: UniqueIdentifier) => React.ReactNode;
  onDragStart?: DndContextProps["onDragStart"];
  onDragMove?: DndContextProps["onDragMove"];
  onDragOver?: DndContextProps["onDragOver"];
  onDragEnd?: DndContextProps["onDragEnd"];
  onDragCancel?: DndContextProps["onDragCancel"];
}

const dropAnimationConfig: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: "0.5",
      },
    },
  }),
};

const MultiContainerDndContext: React.FC<MultiContainerDndContextProps> = ({
  children,
  renderActive,
  onDragStart,
  onDragCancel,
  onDragEnd,
  onDragMove,
  onDragOver,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        tolerance: 1000,
        delay: 100,
      },
      isDraggableElement,
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  const [activeItemId, setActiveItemId] = useState<null | UniqueIdentifier>(
    null
  );
  const handleDragStart: OnDragStart = useCallback(
    (event) => {
      const { id } = event.active;
      setActiveItemId(id);
      if (onDragStart) {
        onDragStart(event);
      }
    },
    [onDragStart]
  );
  const handleDragEnd: OnDragEnd = useCallback(
    (event) => {
      setActiveItemId(null);
      if (onDragEnd) {
        onDragEnd(event);
      }
    },
    [onDragEnd]
  );
  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragMove={onDragMove}
      onDragOver={onDragOver}
      onDragCancel={onDragCancel}
    >
      {children}
      <DragOverlay dropAnimation={dropAnimationConfig}>
        {activeItemId && renderActive(activeItemId)}
      </DragOverlay>
    </DndContext>
  );
};

interface DroppableAreaProps {
  id: UniqueIdentifier;
  data?: Data;
  children: React.ReactNode;
  className?: string;
  noDrag?: boolean;
}

const DroppableArea: React.FC<DroppableAreaProps> = ({
  children,
  data,
  id,
  className,
  noDrag,
}) => {
  const { setNodeRef } = useDroppable({ id, data });
  return (
    <div data-no-drag={noDrag} className={className} ref={setNodeRef}>
      {children}
    </div>
  );
};

export {
  DroppableArea,
  SortableList,
  SortableItem,
  MultiContainerDndContext,
  hasSortableData,
};

export type {
  Data,
  Active,
  Over,
  OnDragStart,
  OnDragMove,
  OnDragOver,
  OnDragEnd,
  OnDragCancel,
  SortableData,
  UniqueIdentifier,
  SortableListProps,
  SortableItemProps,
  MultiContainerDndContextProps,
};
