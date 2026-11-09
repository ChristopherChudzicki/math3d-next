import { visibleLabel } from "./style";

test.each([
  { text: "P", visible: true, expected: "P" },
  { text: "P", visible: false, expected: null },
  { text: "", visible: true, expected: null },
])(
  "visibleLabel($text, $visible) is $expected",
  ({ text, visible, expected }) => {
    expect(visibleLabel(text, visible)).toBe(expected);
  },
);
