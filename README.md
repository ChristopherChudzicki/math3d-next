# Next version of math3d

_TODO: Rewrite this, since I wrote it in 3 minutes._

A rewrite of [math3d-react](https://github.com/ChristopherChudzicki/math3d-react). Why rewrite? Because math3d is using a bunch of pretty old tech, some of which is not maintained or poorly maintained:

- math3d relies heavily on MathQuill, for WYSIWYG LaTeX editing. MathQuill is not maintained **and** [MathLive](https://github.com/arnog/mathlive) seems like a viable replacement
- math3d uses Flow. Let's use Typescript instead. TS is a more active project with better adoption / community support
- math3d is stuck on MathJS version 3. Let's use 10
- math3d uses a fairly old version of React

Also: math3d is not a hgue project, so a re-write is definitely viable.

### Big goals for re-write:

- update tech stack
- have user login system
