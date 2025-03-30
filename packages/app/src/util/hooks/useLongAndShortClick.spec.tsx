import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { getTimedEvents } from "@math3d/test-utils";
import { useLongAndShortClick } from "./useLongAndShortClick";
import type { LongAndShortClickProps } from "./useLongAndShortClick";

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
    const { timed, target, spies } = setup({ threshold: 400 });
    await timed.pointerPrimary({ target, duration: 50 });
    expect(spies.onClick).toHaveBeenCalledTimes(1);
    expect(spies.onLongClick).toHaveBeenCalledTimes(0);
  });

  test.each([
    { key: " ", label: "Spacebar" },
    { key: "Enter", label: "Enter" },
  ])(
    "Short keyboard click ($label) fires click handler only",
    async ({ key }) => {
      const { timed, target, spies } = setup({ threshold: 400 });
      await timed.keypress({ key, target, duration: 50 });
      expect(spies.onClick).toHaveBeenCalledTimes(1);
      expect(spies.onLongClick).toHaveBeenCalledTimes(0);
    },
  );

  test("Long mouse click fires longpress handler only", async () => {
    const { timed, target, spies } = setup({ threshold: 200 });
    await timed.pointerPrimary({ target, duration: 300 });
    expect(spies.onClick).toHaveBeenCalledTimes(0);
    expect(spies.onLongClick).toHaveBeenCalledTimes(1);
  });

  test.each([
    { key: " ", label: "Spacebar", duration: 201 },
    { key: "Enter", label: "Enter", duration: 201 }, // longclick triggers on keyup
    { key: "Enter", label: "Enter", duration: 500 }, // longclick triggers on repeated keydown
  ])(
    "Long keyboard press ($label) fires longpress handler only",
    async ({ key, duration }) => {
      const { timed, target, spies } = setup({ threshold: 200 });
      await timed.keypress({ key, target, duration });
      expect(spies.onClick).toHaveBeenCalledTimes(0);
      expect(spies.onLongClick).toHaveBeenCalledTimes(1);
    },
  );
});
