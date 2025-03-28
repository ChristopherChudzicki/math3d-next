import type { UserEvent } from "@testing-library/user-event";
import invariant from "tiny-invariant";
import { createEvent, fireEvent, act } from "@testing-library/react";

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

type TimedEvents = {
  pointerPrimary: (opts: {
    target: HTMLElement;
    duration: number;
  }) => Promise<void>;

  /**
   * Simulates a long press of a key:
   * 1. keydown, repeated `repetitions` times spaced evenly over `duration`
   * 2. keyup
   * 3. Click Events:
   *    - If the key is "Enter", a click event is fired after each keydown
   *    - If the key is " ", a click event is fired after the keyup
   *
   *     NOTE: In a real browser, this behavior depends on the target element.
   *     For example, a button will fire click events on space/enter but
   *     input elements will not.
   *
   *
   * NOTE: Implementation uses fireEvent, NOT userEvent, because, because of
   * https://github.com/testing-library/user-event/issues/1098
   */
  keypress: (opts: {
    target: HTMLElement;
    key: "Space" | "Enter" | string;
    duration: number;
    /**
     * How many times to repeat keydown, including the first
     */
    repetitions?: number;
  }) => Promise<void>;
};
const getTimedEvents = (user: UserEvent): TimedEvents => {
  return {
    pointerPrimary: async ({ target, duration }) =>
      act(async () => {
        await user.pointer({ keys: "[MouseLeft>]", target }); // press the left mouse button
        await new Promise((res) => {
          setTimeout(res, duration);
        });
        await user.pointer({ keys: "[/MouseLeft]", target }); // release the left mouse button
      }),
    keypress: async ({ key, duration, target, repetitions = 3 }) =>
      act(async () => {
        invariant(
          target instanceof HTMLButtonElement,
          "Click event simulation in this method is intended to mimic browser buttons",
        );

        for (let i = 0; i < repetitions; i) {
          const down = createEvent.keyDown(target, {
            key,
            bubbles: true,
            repeat: i > 0,
          });
          fireEvent(target, down);
          // eslint-disable-next-line no-await-in-loop
          await sleep(duration / repetitions);
          if (key === "Enter" && !down.defaultPrevented) {
            const click = createEvent.click(target, { bubbles: true });
            fireEvent(target, click);
          }
          i += 1;
        }
        const up = createEvent.keyUp(target, { key, bubbles: true });
        fireEvent(target, up);
        await sleep(0);
        if (key === " " && !up?.defaultPrevented) {
          const click = createEvent.click(target, { bubbles: true });
          fireEvent(target, click);
        }
        await sleep(0);
      }),
  };
};

export default getTimedEvents;
