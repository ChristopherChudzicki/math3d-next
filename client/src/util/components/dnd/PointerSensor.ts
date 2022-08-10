import type { PointerEvent } from "react";
import { PointerSensor } from "@dnd-kit/core";
import type { PointerSensorOptions } from "@dnd-kit/core";

const always = () => true;

interface CustomPointerSensorOptions extends PointerSensorOptions {
  isDraggableElement?: (element: HTMLElement) => boolean;
}

export default class CustomPointerSensor extends PointerSensor {
  static activators = [
    {
      eventName: "onPointerDown" as const,
      handler: (
        syntheticEvent: PointerEvent,
        {
          onActivation,
          isDraggableElement = always,
        }: CustomPointerSensorOptions
      ) => {
        const { nativeEvent: event } = syntheticEvent;
        if (!event.isPrimary || event.button !== 0) {
          return false;
        }

        if (!(event.target instanceof HTMLElement)) {
          return false;
        }
        if (!isDraggableElement(event.target)) {
          return false;
        }

        onActivation?.({ event });

        return true;
      },
    },
  ];
}
