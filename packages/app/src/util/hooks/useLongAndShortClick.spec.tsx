import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { UserEvent } from "@testing-library/user-event";
import { useLongAndShortClick } from "./useLongAndShortClick";
import type { LongAndShortClickProps } from "./useLongAndShortClick";

type TimedEvents = {
  pointerPrimary: (opts: {
    target: HTMLElement;
    duration: number;
  }) => Promise<void>;
  keypress: (opts: {
    target: HTMLElement;
    key: "Space" | "Enter" | string;
    duration: number;
    /**
     * duration between repeated events
     */
    interval?: number;
  }) => Promise<void>;
};
const getTimedEvents = (user: UserEvent): TimedEvents => {
  return {
    pointerPrimary: async ({ target, duration }) => {
      await user.pointer({ keys: "[MouseLeft>]", target }); // press the left mouse button
      await new Promise((res) => {
        setTimeout(res, duration);
      });
      await user.pointer({ keys: "[/MouseLeft]", target }); // release the left mouse button
    },
    keypress: async ({ key, duration, target }) => {
      target.focus();
      await user.keyboard(`{${key}>}`);
      // const intervalId = setInterval(() => {
      //   user.keyboard(`{${key}>}`);
      // }, interval);
      await new Promise((res) => {
        setTimeout(res, duration);
      });
      // clearInterval(intervalId);
      await user.keyboard(`{/${key}}`);
    },
  };
};

describe("getTimedEvents", () => {
  test("Pointer Events fire with expected timing", async () => {
    const user = userEvent.setup();
    const timed = getTimedEvents(user);
    const onPointerDown = vi.fn<[React.PointerEvent]>();
    const onPointerUp = vi.fn<[React.PointerEvent]>();
    const onClick = vi.fn<[React.MouseEvent]>();
    const onKeyDown = vi.fn<[React.KeyboardEvent]>();
    const onKeyUp = vi.fn<[React.KeyboardEvent]>();
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

    const button = screen.getByRole("button");

    const expectedDuration = 200;
    await timed.pointerPrimary({ target: button, duration: expectedDuration });

    expect(onPointerDown).toHaveBeenCalledTimes(1);
    expect(onPointerUp).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onKeyDown).toHaveBeenCalledTimes(0);
    expect(onKeyUp).toHaveBeenCalledTimes(0);

    const duration =
      onPointerUp.mock.calls[0][0].timeStamp -
      onPointerDown.mock.calls[0][0].timeStamp;
    expect(duration).approximately(expectedDuration, 50);
  });

  test.each([
    { key: "Enter", label: "'Enter'" },
    { key: " ", label: "Spacebar" },
  ])(
    "Keyboard Events fire with expected timing when pressing $label",
    async ({ key }) => {
      const user = userEvent.setup();
      const timed = getTimedEvents(user);
      const onPointerDown = vi.fn<[React.PointerEvent]>();
      const onPointerUp = vi.fn<[React.PointerEvent]>();
      const onClick = vi.fn<[React.MouseEvent]>();
      const onKeyDown = vi.fn<[React.KeyboardEvent]>();
      const onKeyUp = vi.fn<[React.KeyboardEvent]>();
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

      const button = screen.getByRole("button");

      const expectedDuration = 200;
      await timed.keypress({ key, target: button, duration: expectedDuration });

      expect(onPointerDown).toHaveBeenCalledTimes(0);
      expect(onPointerUp).toHaveBeenCalledTimes(0);
      expect(onKeyDown).toHaveBeenCalled();
      expect(onKeyUp).toHaveBeenCalledTimes(1);
      expect(onClick).toHaveBeenCalledTimes(1);

      const duration =
        onKeyUp.mock.calls[0][0].timeStamp -
        onKeyDown.mock.calls[0][0].timeStamp;
      expect(duration).approximately(expectedDuration, 50);
    },
  );
});

describe("useLongAndShortClick", () => {
  const setup = ({ threshold }: Partial<LongAndShortClickProps>) => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const onLongClick = vi.fn();

    const TestComponent: React.FC = () => {
      const { handlers } = useLongAndShortClick({
        onClick,
        onLongClick,
        threshold,
      });

      return <button type="button" {...handlers} />;
    };

    const view = render(<TestComponent />);
    const target = screen.getByRole("button");
    return {
      view,
      spies: {
        onClick,
        onLongClick,
      },
      target,
      timed: getTimedEvents(user),
    };
  };

  test("Short mouse click fires click handler only", async () => {
    const { timed, target, spies } = setup({ threshold: 200 });
    await timed.pointerPrimary({ target, duration: 150 });
    expect(spies.onClick).toHaveBeenCalledTimes(1);
    expect(spies.onLongClick).toHaveBeenCalledTimes(0);
  });

  test.each([
    { key: " ", label: "'Spacebar'" },
    { key: "Enter", label: "'Enter'" },
  ])(
    "Short keyboard click ($label) fires click handler only",
    async ({ key }) => {
      const { timed, target, spies } = setup({ threshold: 200 });
      await timed.keypress({ key, target, duration: 150 });
      expect(spies.onClick).toHaveBeenCalledTimes(1);
      expect(spies.onLongClick).toHaveBeenCalledTimes(0);
    },
  );

  test("Long mouse click fires longpress handler only", async () => {
    const { timed, target, spies } = setup({ threshold: 200 });
    await timed.pointerPrimary({ target, duration: 250 });
    expect(spies.onClick).toHaveBeenCalledTimes(0);
    expect(spies.onLongClick).toHaveBeenCalledTimes(1);
  });

  // There seems to be a bug in user-event where repeated keyboard events do not
  // have the `event.repeat` property set to `true`.
  // https://github.com/testing-library/user-event/issues/1098
  test.skip.each([
    { key: " ", label: "'Spacebar'" },
    { key: "Enter", label: "'Enter'" },
  ])(
    "Long keyboard press ($label) fires longpress handler only",
    async ({ key }) => {
      const { timed, target, spies } = setup({ threshold: 200 });
      await timed.keypress({ key, target, duration: 300 });
      expect(spies.onClick).toHaveBeenCalledTimes(0);
      expect(spies.onLongClick).toHaveBeenCalledTimes(1);
    },
  );
});
