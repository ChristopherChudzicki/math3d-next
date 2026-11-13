---
name: power
latex: x^a
keyboard: x^a
summary: \(x\) raised to the power \(a\); for roots of a negative \(x\), show more
tags:
  - explog
---

`pow(x, a)` is the same as \(x^a\).

For a negative \(x\) and a power \(a\) that is not a whole number:

- If \(a\) is a fraction whose denominator is odd, as \(1/3\), \(2/5\) and \(0.2 = 1/5\) are, the result is the real root: \((-8)^{1/3} = -2\). The same holds for a variable: \(x^a\) with \(a = 1/3\).
- Otherwise, as for \(x^{1/2}\) or \(x^{0.3}\), the result is the complex principal root: \((-8)^{0.3} \approx 1.10 + 1.51I\). Graphs leave out complex values, so a graph of \(x^{0.3}\) stops at \(x = 0\).

A denominator of 100 or more counts as "otherwise".

When a slider sets \(a\), the part of a graph where \(x < 0\) appears only at the values that are such fractions, so it flickers as the slider moves. Restricting the graph to \(x \geq 0\) avoids that.

For the principal root of a fraction too, make the base complex with a capital \(I\): \((x + 0I)^{1/3}\).
