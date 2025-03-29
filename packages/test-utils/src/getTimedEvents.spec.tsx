import React from "react";
import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";
import getTimedEvents from "./getTimedEvents";

describe("getTimedEvents", () => {
  const setup = () => {
    const user = userEvent.setup();
    const timed = getTimedEvents(user);
    const onPointerDown = vi.fn<React.PointerEventHandler>();
    const onPointerUp = vi.fn<React.PointerEventHandler>();
    const onClick = vi.fn<React.MouseEventHandler>();
    const onKeyDown = vi.fn<React.KeyboardEventHandler>();
    const onKeyUp = vi.fn<React.KeyboardEventHandler>();
    render(
      <button
        type="button"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onClick={onClick}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
      >
        Click me!
      </button>,
    );
    return {
      user,
      timed,
      spies: {
        onPointerDown,
        onPointerUp,
        onClick,
        onKeyDown,
        onKeyUp,
      },
    };
  };
  test("Pointer Events fire with expected timing", async () => {
    const { timed, spies } = setup();

    const button = screen.getByRole("button");

    const expectedDuration = 200;
    await timed.pointerPrimary({ target: button, duration: expectedDuration });

    expect(spies.onPointerDown).toHaveBeenCalledTimes(1);
    expect(spies.onPointerUp).toHaveBeenCalledTimes(1);
    expect(spies.onClick).toHaveBeenCalledTimes(1);
    expect(spies.onKeyDown).toHaveBeenCalledTimes(0);
    expect(spies.onKeyUp).toHaveBeenCalledTimes(0);

    const duration =
      spies.onPointerUp.mock.calls[0][0].timeStamp -
      spies.onPointerDown.mock.calls[0][0].timeStamp;
    expect(duration).approximately(expectedDuration, 50);
  });

  test.each([
    { key: "Enter", label: "Enter", repetitions: 4, expectedClicks: 4 },
    { key: " ", label: "Spacebar", repetitions: 4, expectedClicks: 1 },
    { key: "a", label: "a", repetitions: 4, expectedClicks: 0 },
    { key: "b", label: "b", repetitions: 4, expectedClicks: 0 },
  ])(
    "Keyboard Events fire with expected timing when pressing key=$label",
    async ({ key, repetitions, expectedClicks }) => {
      const { timed, spies } = setup();

      const button = screen.getByRole("button");

      const expectedDuration = 200;
      await timed.keypress({
        key,
        target: button,
        duration: expectedDuration,
        repetitions,
      });

      expect(spies.onPointerDown).toHaveBeenCalledTimes(0);
      expect(spies.onPointerUp).toHaveBeenCalledTimes(0);
      expect(spies.onKeyDown).toHaveBeenCalledTimes(repetitions);
      expect(spies.onKeyUp).toHaveBeenCalledTimes(1);
      expect(spies.onClick).toHaveBeenCalledTimes(expectedClicks);

      const duration =
        spies.onKeyUp.mock.calls[0][0].timeStamp -
        spies.onKeyDown.mock.calls[0][0].timeStamp;
      expect(duration).approximately(expectedDuration, 50);
    },
  );

  test.each([
    { defaultPrevented: true, expectedClicks: 0 },
    { defaultPrevented: false, expectedClicks: 1 },
  ])(
    "Spacebar click is not fired if keyup default is prevented (preventDefault: $defaultPrevented, expectedClicks: $expectedClicks)",
    async ({ expectedClicks, defaultPrevented }) => {
      const { timed, spies } = setup();

      const button = screen.getByRole("button");
      spies.onKeyUp.mockImplementation((event) => {
        if (defaultPrevented) {
          event.preventDefault();
        }
      });
      await timed.keypress({ key: " ", target: button, duration: 200 });

      expect(spies.onClick).toHaveBeenCalledTimes(expectedClicks);
    },
  );

  test.each([
    { defaultPrevented: true, repetitions: 2, expectedClicks: 0 },
    { defaultPrevented: false, repetitions: 2, expectedClicks: 2 },
  ])(
    "Enter click is not fired if keyup default is prevented (preventDefault: $defaultPrevented, expectedClicks: $expectedClicks)",
    async ({ expectedClicks, defaultPrevented, repetitions }) => {
      const { timed, spies } = setup();

      const button = screen.getByRole("button");
      spies.onKeyDown.mockImplementation((event) => {
        if (defaultPrevented) {
          event.preventDefault();
        }
      });
      await timed.keypress({
        key: "Enter",
        target: button,
        duration: 200,
        repetitions,
      });

      expect(spies.onClick).toHaveBeenCalledTimes(expectedClicks);
    },
  );
});
