---
name: power
latex: x^a
keyboard: x^a
summary: \(x\) raised to the power \(a\). A negative \(x\) can take a real root, \((-8)^{1/3} = -2\)
tags:
  - explog
---

`pow(x, a)` is the same as \(x^a\).

For a negative \(x\) and a power \(a\) that is not a whole number:

- If \(a\) is a fraction whose denominator, in lowest terms, is odd and below 100, the result is the real root: \((-8)^{1/3} = -2\). That holds however \(a\) is written: \(2/5\), \(0.2 = 1/5\), or a variable \(a\) set to \(1/3\).
- Otherwise, as for \(x^{1/2}\) or \(x^{0.3}\), the result is the complex principal root: \((-8)^{0.3} \approx 1.10 + 1.51I\). Graphs leave out complex values, so a graph of \(x^{0.3}\) stops at \(x = 0\).

When a slider sets \(a\), the part of a graph where \(x < 0\) shows only while \(a\) is such a fraction, so it flickers as the slider moves. Restricting the graph to \(x \geq 0\) avoids that.

To get the complex principal root instead, make the base complex with a capital \(I\): \((x + 0I)^{1/3}\).
