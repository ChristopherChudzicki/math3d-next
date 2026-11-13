---
name: power
latex: x^a
keyboard: x^a
summary: \(x\) raised to the power \(a\); for roots of a negative \(x\), show more
tags:
  - explog
---

`pow(x, a)` is the same as \(x^a\).

For a negative \(x\) and a power that is not a whole number:

- If the exponent is written as a fraction of whole numbers whose denominator is odd in lowest terms, as in \(x^{1/3}\), \(x^{2/5}\) or \(x^{2/6}\), the result is the real root: \((-8)^{1/3} = -2\).
- Otherwise, as in \(x^{0.2}\), \(x^{1/2}\), or \(x^{a}\) even when \(a = 1/3\), the result is the complex principal root: \((-8)^{0.2} \approx 1.23 + 0.89I\). Graphs leave out complex values, so a graph of \(x^{0.2}\) stops at \(x = 0\).

For the principal root of a fraction too, make the base complex with a capital \(I\): \((x + 0I)^{1/3}\).

For a real root whose degree is a variable, use \(\operatorname{root}(x, n)\).
