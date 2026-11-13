---
name: power
latex: x^a
keyboard: x^a
summary: \(x\) raised to the power \(a\). For a negative \(x\), only some powers give a real root
tags:
  - explog
---

`pow(x, a)` is the same as \(x^a\).

For a negative \(x\) and a power \(a\) that is not a whole number:

- If \(a\) is a fraction whose denominator, in lowest terms, is odd and below 100, the result is the real root: \((-8)^{1/3} = -2\). That holds however \(a\) is written: \(2/5\), \(0.2\) (which is \(1/5\)), or a variable or slider set to \(1/3\).
- Otherwise, as for \(x^{1/2}\) or \(x^{0.3}\), the result is the complex principal root: \((-8)^{0.3} \approx 1.10 + 1.51I\). Graphs leave out complex values, so a graph of \(x^{0.3}\) stops at \(x = 0\). Type the fraction itself: \(x^{0.33}\) is not \(x^{1/3}\).

A moving slider is almost never exactly such a fraction, so while it plays, the part of a graph where \(x < 0\) is missing, and while you drag it, that part shows only at some positions. To avoid that, set the domain so \(x\) starts at 0.

For the complex principal root, put \(+ 0I\) in the same expression as the power: \((x + 0I)^{1/3}\). A variable set to \(x + 0I\) is stored as a real number.
