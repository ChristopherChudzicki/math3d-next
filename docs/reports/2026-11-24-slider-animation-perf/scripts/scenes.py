"""The benchmark scenes, in math3d-react's (legacy) format.

Every scene animates a slider T on load. They are saved on production already
(keys in scene_keys.json); post_scenes.py saves new copies.
"""


def slider(name, lo, hi, value, speed=1):
    return {
        "type": "VARIABLE_SLIDER",
        "name": name,
        "min": lo,
        "max": hi,
        "isAnimating": True,
        "speedMultiplier": speed,
        "description": f"Slider {name}",
    }, value


def scene(title, graphics, symbols=None, slider_spec=("T", "0", "2\\pi", 0.0)):
    sym, value = slider(*slider_spec)
    math_symbols = {"s1": sym, **(symbols or {})}
    return {
        "folders": {},
        "metadata": {
            "title": title,
            "creationDate": '"2026-11-20T12:00:00.000Z"',
            "versionAtCreation": "1.0.0",
        },
        "mathSymbols": math_symbols,
        "mathGraphics": graphics,
        "sliderValues": {"s1": value},
        "sortableTree": {
            "root": ["mainFolder"],
            "mainFolder": ["s1", *(symbols or {}).keys(), *graphics.keys()],
        },
    }


def explicit(expr, n, color="#3090FF", color_expr=None, rng="\\left[-4,4\\right]"):
    g = {
        "type": "EXPLICIT_SURFACE",
        "expr": f"_f(x,y)={expr}",
        "rangeU": rng,
        "rangeV": rng,
        "uSamples": str(n),
        "vSamples": str(n),
        "color": color,
        "opacity": "1",
    }
    if color_expr:
        g["colorExpr"] = f"_f(X, Y, Z, x, y)={color_expr}"
    return g


def parametric(expr, ru, rv, n, color="#3090FF", color_expr=None):
    g = {
        "type": "PARAMETRIC_SURFACE",
        "expr": f"_f(u,v)={expr}",
        "rangeU": ru,
        "rangeV": rv,
        "uSamples": str(n),
        "vSamples": str(n),
        "color": color,
        "opacity": "1",
    }
    if color_expr:
        g["colorExpr"] = f"_f(X, Y, Z, u, v)={color_expr}"
    return g


def implicit(lhs, rhs, samples, rng):
    return {
        "type": "IMPLICIT_SURFACE",
        "lhs": f"_f(x,y,z)={lhs}",
        "rhs": f"_f(x,y,z)={rhs}",
        "samples": str(samples),
        "rangeX": rng,
        "rangeY": rng,
        "rangeZ": rng,
        "opacity": "1",
    }


def field(expr, samples, scale, rng="\\left[-3,3\\right]"):
    return {
        "type": "VECTOR_FIELD",
        "expr": f"_f(x,y,z)={expr}",
        "samples": samples,
        "scale": scale,
        "rangeX": rng,
        "rangeY": rng,
        "rangeZ": "\\left[-2,2\\right]",
    }


RIPPLE = "\\frac{\\sin\\left(2\\sqrt{x^2+y^2}-T\\right)}{1+0.3\\left(x^2+y^2\\right)}"
RIPPLE_COLOR = "\\frac{1+\\sin\\left(2\\sqrt{x^2+y^2}-T\\right)}{2}"
TORUS = (
    "\\left[\\left(2+\\cos\\left(v\\right)\\right)\\cos\\left(u\\right),"
    "\\left(2+\\cos\\left(v\\right)\\right)\\sin\\left(u\\right),"
    "\\sin\\left(v\\right)+0.4\\sin\\left(3u+T\\right)\\right]"
)
TORUS_COLOR = "\\frac{1+\\sin\\left(3u+T\\right)}{2}"
SHELL_F = {
    "f1": {
        "type": "VARIABLE",
        "name": "f\\left(u,v\\right)",
        "value": (
            "e^{0.12u}\\cdot\\left[\\left(1+A\\cos\\left(v\\right)\\right)\\cos\\left(u\\right),"
            "\\left(1+A\\cos\\left(v\\right)\\right)\\sin\\left(u\\right),"
            "A\\sin\\left(v\\right)+0.3u\\right]"
        ),
        "description": "Shell",
    },
    "f2": {"type": "VARIABLE", "name": "A", "value": "0.6+0.3\\sin\\left(T\\right)"},
}
GYROID = (
    "\\sin\\left(T\\cdot x\\right)\\cos\\left(y\\right)+\\sin\\left(y\\right)\\cos\\left(z\\right)"
    "+\\sin\\left(z\\right)\\cos\\left(x\\right)"
)
FIELD = (
    "\\left[-y+0.5\\sin\\left(z+T\\right),\\ x,\\ 0.5\\cos\\left(x+T\\right)\\right]"
)

GYROID_SLIDER = ("T", "0.6", "1.4", 1.0)
SPHERE_SLIDER = ("T", "-1", "1", 0.0)

SCENES = {
    "ripple_64": scene("Ripple 64x64", {"g1": explicit(RIPPLE, 64)}),
    "ripple_128_cmap": scene(
        "Ripple 128x128, color map",
        {"g1": explicit(RIPPLE, 128, "rainbow", RIPPLE_COLOR)},
    ),
    "ripple_256_cmap": scene(
        "Ripple 256x256, color map",
        {"g1": explicit(RIPPLE, 256, "rainbow", RIPPLE_COLOR)},
    ),
    "torus_96_cmap": scene(
        "Torus 96x96, color map",
        {
            "g1": parametric(
                TORUS,
                "\\left[0,2\\pi\\right]",
                "\\left[0,2\\pi\\right]",
                96,
                "temperature",
                TORUS_COLOR,
            )
        },
    ),
    "shell_128": scene(
        "Shell 128x128, user function",
        {
            "g1": parametric(
                "f\\left(u,v\\right)",
                "\\left[0,4\\pi\\right]",
                "\\left[0,2\\pi\\right]",
                128,
            )
        },
        symbols=SHELL_F,
    ),
    "implicit_sphere_20": scene(
        "Implicit sphere, 20 samples",
        {
            "g1": implicit(
                "\\left(x-T\\right)^2+y^2+z^2", "4", 20, "\\left[-3.5,3.5\\right]"
            )
        },
        slider_spec=SPHERE_SLIDER,
    ),
    "implicit_sphere_40": scene(
        "Implicit sphere, 40 samples",
        {
            "g1": implicit(
                "\\left(x-T\\right)^2+y^2+z^2", "4", 40, "\\left[-3.5,3.5\\right]"
            )
        },
        slider_spec=SPHERE_SLIDER,
    ),
    "gyroid_20": scene(
        "Gyroid, 20 samples",
        {"g1": implicit(GYROID, "0", 20, "\\left[-\\pi,\\pi\\right]")},
        slider_spec=GYROID_SLIDER,
    ),
    "gyroid_40": scene(
        "Gyroid, 40 samples",
        {"g1": implicit(GYROID, "0", 40, "\\left[-\\pi,\\pi\\right]")},
        slider_spec=GYROID_SLIDER,
    ),
    "field_10": scene(
        "Vector field 10x10x5",
        {"g1": field(FIELD, "\\left[10,10,5\\right]", "0.3")},
    ),
    "field_20": scene(
        "Vector field 20x20x10",
        {"g1": field(FIELD, "\\left[20,20,10\\right]", "0.15")},
    ),
}
