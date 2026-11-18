---
name: map
latex: \operatorname{map}(L, f)
keyboard: map(L, f)
summary: Applies the function \(f\) to each entry of the list \(L\)
tags:
  - lists
---

For example, a Point's coordinates can be a list of points. To draw 48 points around a circle, define

\[
f(k) = [\cos(2\pi k/48), \sin(2\pi k/48), 0]
\]

and give a Point the coordinates

\[
\operatorname{map}(1:48, f)
\]

If \(f\) takes a second parameter, it gets the entry's position as a one-entry list, like \([2]\).
