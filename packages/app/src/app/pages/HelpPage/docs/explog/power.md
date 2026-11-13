---
name: power
latex: x^a
keyboard: x^a
summary: \(x\) raised to the power \(a\)
tags:
  - explog
---

`pow(x, a)` is the same as \(x^a\).

For a negative \(x\) and a power that is not a whole number, the result depends on how the exponent is written:

- Written as a fraction of whole numbers with an odd denominator, as in \(x^{1/3}\) or \(x^{2/5}\), the result is the real root: \((-8)^{1/3} = -2\).
- Written any other way, as in \(x^{0.2}\), \(x^{1/2}\) or \(x^{a}\), the result is the complex principal root: \((-8)^{0.2} \approx 1.23 + 0.89I\). A complex value is not drawn.

To get the principal root with a fraction too, make the base complex: \((x + 0I)^{1/3}\).
