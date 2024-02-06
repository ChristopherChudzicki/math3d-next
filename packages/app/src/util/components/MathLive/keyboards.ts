import type { VirtualKeyboardLayout } from "mathlive";

const { mathVirtualKeyboard } = window;

type CustomKeyboards = "numeric" | "functions";

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
          latex: "e^{#0}",
          shift: "\\ln(#0)",
          class: "hide-shift",
          variants: ["\\exp(#0)", "\\ln(#0)", "\\log(#0)"],
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
        {
          latex: "\\cdot",
          insert: "\\cdot",
        },
        "[separator-5]",
        {
          latex: "#@^2}",
        },
        {
          latex: "#@^{#0}}",
          class: "hide-shift",
          shift: "#@_{#?}",
        },
        {
          latex: "\\sqrt{#0}",
        },
      ],
      [
        { latex: "(", insert: "\\left(" },
        { latex: ")", insert: "\\right)" },
        "[separator-5]",
        "[1]",
        "[2]",
        "[3]",
        { latex: "-" },
        "[separator-5]",
        {
          latex: "\\mathbf{\\hat{i}}",
          insert: "\\uniti",
          aside: "[1,0,0]",
          shift: {
            latex: "\\mathbf{\\hat{x}}",
            insert: "\\unitx",
          },
        },
        {
          latex: "\\mathbf{\\hat{j}}",
          insert: "\\uniti",
          aside: "[1,0,0]",
          shift: {
            latex: "\\mathbf{\\hat{y}}",
            insert: "\\unitx",
          },
        },
        {
          latex: "\\mathbf{\\hat{k}}",
          insert: "\\uniti",
          aside: "[1,0,0]",
          shift: {
            latex: "\\mathbf{\\hat{z}}",
            insert: "\\unitx",
          },
        },
      ],
      [
        { label: "[shift]", width: 2.0 },
        "[separator-5]",
        { latex: "0" },
        "[separator-20]",
        { latex: "+" },
        "[separator-5]",
        "[left]",
        "[right]",
        { label: "[backspace]", width: 1.0 },
      ],
    ],
  },
  functions: {
    label: "f(x)",
    labelClass: "MLK__tex-math",
    tooltip: "keyboard.tooltip.numeric",
    rows: [
      [
        { latex: "e^{#0}" },
        { latex: "\\ln(#0)" },
        "[separator-5]",
        { latex: "\\sin(#0)" }, // middle
        { latex: "\\cos(#0)" },
        { latex: "\\tan(#0)" },
        "[separator-5]",
        // right
        { latex: "\\frac{\\differentialD #0}{\\differentialD #1}", width: 1.5 },
        { latex: "\\frac{\\partial #0}{\\partial #1}", width: 1.5 },
      ],
      [
        { latex: "\\sqrt{#0}" },
        { latex: "\\operatorname{sign}(#0)" },
        "[separator-5]",
        { latex: "\\arcsin(#0)", class: "small" }, // middle
        { latex: "\\arccos(#0)", class: "small" },
        { latex: "\\arctan(#0)", class: "small" },
        "[separator-5]",
        {
          latex: "\\operatorname{unitT}(\\vec{r},t)",
          insert: "\\operatorname{unitT}(#0, #1)",
          width: 1.0,
          class: "small",
        },
        {
          latex: "\\operatorname{unitN}(\\vec{r},t)",
          insert: "\\operatorname{unitN}(#0, #1)",
          width: 1.0,
          class: "small",
        },
        {
          latex: "\\operatorname{unitB}(\\vec{r},t)",
          insert: "\\operatorname{unitB}(#0, #1)",
          width: 1.0,
          class: "small",
        },
      ],
      [
        { latex: "\\operatorname{floor}(#0)", class: "small" },
        { latex: "\\operatorname{ceil}(#0)", class: "small" },
        "[separator-5]",
        { latex: "\\sinh(#0)" }, // middle
        { latex: "\\cosh(#0)" },
        { latex: "\\tanh(#0)" },
        "[separator-5]",
        { latex: "\\operatorname{Im}(#0)" },
        { latex: "\\operatorname{Re}(#0)" },
        { latex: "\\operatorname{abs}(#0)" },
      ],
      [
        { label: "[shift]", width: 2.0 },
        "[separator-5]",
        {
          latex: "\\operatorname{arcsinh}(#0)",
          class: "small",
          insert: "\\arcsinh",
        }, // middle
        {
          latex: "\\operatorname{arccosh}(#0)",
          class: "small",
          insert: "\\arccosh",
        },
        {
          latex: "\\operatorname{arctanh}(#0)",
          class: "small",
          insert: "\\arctanh",
        },
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
