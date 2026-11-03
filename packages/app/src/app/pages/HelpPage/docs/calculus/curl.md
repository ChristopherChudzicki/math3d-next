---
name: curl
latex: \operatorname{curl}(\mathbf{F}, x, y, z)
keyboard: curl(F, x, y, z)
summary: Curl of the vector field \(\mathbf{F}\) at \((x, y, z)\)
tags:
  - calculus
---

- \(\mathbf{F}\) must be a function of three variables returning a 3-vector.
- Pass \(\mathbf{F}\) itself, not \(\mathbf{F}(x, y, z)\).
- A point \(P = [x, y, z]\) works in place of the coordinates: \(\operatorname{curl}(\mathbf{F}, P)\).

For example, you might define:

\[
F(x,y,z) = [-y, x, 0]
\]

\[
G(x,y,z) = \operatorname{curl}(F, x, y, z)
\]

Then \(G(x, y, z) = [0, 0, 2]\) everywhere.
