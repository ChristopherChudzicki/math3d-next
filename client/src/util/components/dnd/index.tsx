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
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import classNames from "classnames";
import PointerSensor from "./PointerSensor";

interface SortableItemProps {
  id: UniqueIdentifier;
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
  as?: React.ElementType;
  className?: string;
  itemClassName?: string;
  draggingItemClassName?: string;
  children: React.ReactElement[];
}

type KeyedElement = React.ReactElement & { key: string };

const SortableList: React.FC<SortableListProps> = (
  props: SortableListProps
) => {
  const { as: Component = "div" } = props;
  if (props.children.some((child) => !child.key)) {
    throw new Error(`All children of SortableList must have keys.`);
  }
  const children = props.children as KeyedElement[];
  return (
    <SortableContext
      strategy={verticalListSortingStrategy}
      items={children.map((child) => child.key)}
    >
      <Component className={props.className}>
        {children.map((child) => {
          const { key } = child;
          return (
            <SortableItem
              className={props.itemClassName}
              draggingClassName={props.draggingItemClassName}
              key={key}
              id={key}
            >
              {child}
            </SortableItem>
          );
        })}
      </Component>
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
const isInteractive = (el: HTMLElement) => {
  if (el.isContentEditable) return true;
  return interactiveTags.includes(el.tagName.toLowerCase());
};
const isNotInteractive = (el: HTMLElement) => !isInteractive(el);

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
      isDraggableElement: isNotInteractive,
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

export { SortableList, MultiContainerDndContext };

export type {
  OnDragStart,
  OnDragMove,
  OnDragOver,
  OnDragEnd,
  OnDragCancel,
  UniqueIdentifier,
  SortableListProps,
  SortableItemProps,
  MultiContainerDndContextProps,
};
