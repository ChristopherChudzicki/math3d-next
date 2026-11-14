---
name: rescale
latex: \operatorname{rescale}_x(t)
keyboard: rescale_x(t)
summary: Position of \(t\) across the x-axis's range, from 0 to 1
tags:
  - axes
---

- \(\operatorname{rescale}_y(t)\) and \(\operatorname{rescale}_z(t)\) do the same for the y- and z-axes.
- They follow the axis's min and max as they change.
- Handy in color maps, which spread 0 to 1 across the gradient. A surface's default color map is \(\operatorname{rescale}_z(z)\).

For example, to color a surface by the values of \(f(x, y)\):

\[
\operatorname{rescale}_z(f(x, y))
\]

With **Wrap** on (the Color Map tab; on for a new surface), \(3\operatorname{rescale}_z(z)\) repeats the colors 3 times.

If you define your own `rescale_x`, yours is used instead. Defining your own `x_min` doesn't change `rescale_x`, which always reads the axis.
