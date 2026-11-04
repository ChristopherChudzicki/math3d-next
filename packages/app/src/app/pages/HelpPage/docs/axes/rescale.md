---
name: rescale
latex: \operatorname{rescale}_x(t)
keyboard: rescale_x(t)
summary: Position of \(t\) across the x-axis's range, from 0 to 1
tags:
  - axes
---

- \(\operatorname{rescale}\_y(t)\) and \(\operatorname{rescale}\_z(t)\) do the same for the y- and z-axes.
- They follow the axis's min and max as they change.
- Handy in color maps, which need values from 0 to 1. A surface's default color map is \(\operatorname{mod}(\operatorname{rescale}\_z(z), 1)\).

For example, to color a surface by the values of \(f(x, y)\):

\[
\operatorname{mod}(\operatorname{rescale}\_z(f(x, y)), 1)
\]

If you define your own `rescale_x`, yours is used instead.
