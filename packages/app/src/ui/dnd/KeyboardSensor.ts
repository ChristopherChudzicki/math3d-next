import { KeyboardSensor, Activators, KeyboardCode } from "@dnd-kit/core";
import type { KeyboardSensorOptions, KeyboardCodes } from "@dnd-kit/core";

const always = () => true;

interface CustomPointerSensorOptions extends KeyboardSensorOptions {
  isDraggableElement?: (element: HTMLElement) => boolean;
}

const defaultKeyboardCodes: KeyboardCodes = {
  start: [KeyboardCode.Space, KeyboardCode.Enter],
  cancel: [KeyboardCode.Esc],
  end: [KeyboardCode.Space, KeyboardCode.Enter],
};

export default class CustomKeyboardSensor extends KeyboardSensor {
  static activators: Activators<CustomPointerSensorOptions> = [
    {
      eventName: "onKeyDown" as const,
      handler: (
        event: React.KeyboardEvent,
        {
          onActivation,
          keyboardCodes = defaultKeyboardCodes,
          isDraggableElement = always,
        },
        { active },
      ) => {
        const { code } = event.nativeEvent;

        if (keyboardCodes.start.includes(code)) {
          const activator = active.activatorNode.current;

          if (activator && event.target !== activator) {
            return false;
          }

          if (!(event.target instanceof HTMLElement)) {
            return false;
          }
          if (!isDraggableElement(event.target)) {
            return false;
          }

          event.preventDefault();

          onActivation?.({ event: event.nativeEvent });

          return true;
        }

        return false;
      },
    },
  ];
}
