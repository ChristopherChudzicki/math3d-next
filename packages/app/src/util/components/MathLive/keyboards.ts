import type { VirtualKeyboardLayout } from "mathlive";

const { mathVirtualKeyboard } = window;

type CustomKeyboards = "numeric";

const LAYOUTS: Record<CustomKeyboards, VirtualKeyboardLayout> = {
  numeric: {
    label: "123",
    labelClass: "MLK__tex-math",
    tooltip: "keyboard.tooltip.numeric",
    rows: [
      [
        {
          latex: "x",
          shift: "y",
          variants: [
            "y",
            "z",
            "t",
            "r",
            "x^2",
            "x^n",
            "x^{#?}",
            "x_n",
            "x_i",
            "x_{#?}",
            { latex: "f(#?)", class: "small" },
            { latex: "g(#?)", class: "small" },
          ],
        },
        { latex: "n", shift: "a", variants: ["i", "j", "p", "k", "a", "u"] },
        "[separator-5]",
        "[7]",
        "[8]",
        "[9]",
        "[/]",
        "[separator-5]",
        {
          latex: "\\exponentialE",
          shift: "\\ln",
          variants: ["\\exp", "\\ln", "\\log"],
        },
        {
          latex: "I",
          aside: "imaginary unit",
        },
        {
          latex: "\\pi",
          shift: {
            latex: "\\tau",
          },
        },
      ],
      [
        {
          label: "[",
          latex: "\\left[",
        },
        {
          label: "]",
          latex: "\\right]",
        },
        "[separator-5]",
        "[4]",
        "[5]",
        "[6]",
        "[*]",
        "[separator-5]",
        {
          class: "hide-shift",
          latex: "#@^2}",
          shift: "#@^{\\prime}}",
        },
        {
          latex: "#@^{#0}}",
          class: "hide-shift",
          shift: "#@_{#?}",
        },
        {
          class: "hide-shift",
          latex: "\\sqrt{#0}",
          shift: { latex: "\\sqrt[#0]{#?}}" },
        },
      ],
      [
        "[(]",
        "[)]",
        "[separator-5]",
        "[1]",
        "[2]",
        "[3]",
        "[-]",
        "[separator-5]",
        {
          latex: "\\hat{i}",
          aside: "[1,0,0]",
        },
        {
          latex: "\\hat{j}",
          aside: "[0,1,0]",
        },
        {
          latex: "\\hat{k}",
          aside: "[0,0,1]",
        },
      ],
      [
        { label: "[shift]", width: 2.0 },
        "[separator-5]",
        "[0]",
        "[.]",
        "[=]",
        "[+]",
        "[separator-5]",
        "[left]",
        "[right]",
        { label: "[backspace]", width: 1.0 },
      ],
    ],
  },
};

export { LAYOUTS, mathVirtualKeyboard };
export type { CustomKeyboards };
