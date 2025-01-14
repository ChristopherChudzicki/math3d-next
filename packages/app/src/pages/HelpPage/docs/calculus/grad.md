---
type: function
name: gradient
latex: \(\operatorname{grad}(f)\)
keyboard: grad(f)
summary: Total derivative of \(f\).
tags:
  - calculus
---

- This is input as `grad(f)`, **not** `grad(f(x,y,z))`, etc.
- The output is already a function: it does not need arguments specified. I.e,. `df=grad(f)` NOT `df(x,y) = grad(f)`.
- Works on scalar-, vector-, or matrix-valued functions.

For example, you might define:

\[
f(x,y,z) = x^2 + y^2 + z^2
\]

\[
df = \operatorname{grad}(f)
\]

You could then plot \(df(x,y,z)\) as a vector field.
