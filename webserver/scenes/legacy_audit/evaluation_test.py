import pytest

from scenes.legacy_audit.evaluation import (
    MISSING,
    OK,
    Pair,
    PairSpec,
    Side,
    Tolerance,
    _side,
    compare,
    label,
    mark_roots,
    pair_scene,
    signature,
    template,
)

TOL = Tolerance()
NAN = {"nonfinite": "NaN"}
ERR = {"error": True}


def fn(*at, arity=1, vec=None):
    out = {"fn": arity, "at": list(at)}
    if vec is not None:
        out["vec"] = vec
    return out


def spec(rule="value", **kwargs):
    defaults = {
        "item_id": "i",
        "item_type": "POINT",
        "legacy_field": "f",
        "legacy_element": None,
        "next_field": "f",
        "next_element": None,
        "severity": "render",
        "rule": rule,
    }
    return PairSpec(**{**defaults, **kwargs})


@pytest.mark.parametrize(
    ("a", "b", "outcome"),
    [
        ([1.0, 2.0, 3.0], [1.0, 2.0, 3.0 + 1e-9], "equal"),
        ([1.0, 2.0, 3.0], [1.0, 2.0, 3.1], "differ"),
        ({"re": 2, "im": 0}, 2, "equal"),
        (NAN, {"re": {"nonfinite": "Infinity"}, "im": NAN}, "equal"),
        ([1, 2], [1, 2, 3], "differ"),
        ({"bool": True}, 1, "differ"),
        ({"other": "Unit"}, {"other": "Unit"}, "equal"),
        ({"other": "Unit"}, 1, "unsure"),
        # Non-finite entries in the same places; the norm rule for the rest.
        ([1e6, NAN, 1e-3], [1e6, NAN, 1.1e-3], "equal"),
        ([1.0, NAN], [1.0, 2.0], "differ"),
    ],
)
def test_compare_values(a, b, outcome):
    assert compare(a, b, TOL).outcome == outcome


def test_an_equal_pair_within_atol_has_no_error():
    assert compare(0.0, 5e-10, TOL).error == 0


def test_a_difference_within_the_loose_band_is_still_differ():
    v = compare(1.0, 1.0001, TOL)
    assert (v.outcome, v.loose) == ("differ", True)


VEC3_ONLY = fn(ERR, ERR, vec={"2": [ERR, ERR], "3": [1, 2]})


@pytest.mark.parametrize(
    ("a", "b", "outcome", "cause"),
    [
        (fn(1, 2), fn(1, 2, arity=2), "unsure", "arity"),
        ({"fn": 1, "at": None}, {"fn": 1, "at": None}, "unsure", "depth"),
        ({"fn": 6, "at": None}, {"fn": 6, "at": None}, "unsure", "unsampled"),
        (
            fn(1, 2, arity=5),
            {"fn": 5, "at": None, "flat_axis": True},
            "unsure",
            "flat_axis",
        ),
        (fn(ERR, 2), fn(ERR, 2), "equal", None),
        (fn(ERR, 2), fn(1, 2), "differ", None),
        (fn(ERR, ERR), fn(ERR, ERR), "unsure", "no_evidence"),
        (fn(1, 2), fn(ERR, ERR), "differ", None),
        (fn(1, NAN, NAN), fn(1, NAN, NAN), "unsure", "sparse"),
        # A function of a 3-vector: only its vec-3 points are finite.
        (VEC3_ONLY, VEC3_ONLY, "equal", None),
    ],
)
def test_compare_functions(a, b, outcome, cause):
    v = compare(a, b, TOL)
    assert (v.outcome, v.cause) == (outcome, cause)


def test_vector_retries_are_compared_when_both_sides_have_them():
    a = fn(ERR, ERR, vec={"2": [1, 2], "3": [1, 2]})
    b = fn(ERR, ERR, vec={"2": [1, 2], "3": [1, 5]})
    assert compare(a, b, TOL).outcome == "differ"


@pytest.mark.parametrize(
    ("a", "b", "expected"),
    [
        ([1.0, 2.0], [-1.0, -2.0], "sign"),
        ([1.0, 2.0], [1.0, 2.0002], "loose"),
        ([1.0, 2.0], [3.0, 6.0], "scale"),
        # One pair of numbers always has a constant ratio.
        (2.0, 6.0, "other"),
        ([1.0, 2.0], [0, 0], "zero_vs_value"),
        ([1.0, 2.0, 3.0], [3.0, 1.0, 2.0], "permuted"),
        (fn({"re": 0, "im": 2}, 1), fn(NAN, 1), "complex_vs_nan"),
        (fn({"re": 0, "im": 2}, ERR), fn(NAN, NAN), "complex_vs_nan"),
        (fn({"re": 0, "im": 2}, 1), fn(NAN, 5), "value_vs_nan"),
        (fn({"re": 2, "im": -1}, 1), fn(2, 1), "complex_vs_real"),
        # A complex value with a round-off imaginary part equals its real part.
        (fn({"re": 2, "im": 1e-17}, {"re": 0, "im": 1}), fn(2, NAN), "complex_vs_nan"),
        (fn(1, 2), fn(1, ERR), "value_vs_error"),
        (fn(NAN, 1), fn(ERR, 1), "nan_vs_error"),
        ([1.0, 2.0], [1.0, NAN], "value_vs_nan"),
        ([fn(1), 2.0], [NAN, 2.0], "other"),
        ([1.0, 2.0], [1.0, 9.0], "other"),
    ],
)
def test_signature(a, b, expected):
    v = compare(a, b, TOL)
    assert v.outcome == "differ"
    assert signature(a, b, v, TOL) == expected


NO_POINTS = "no finite value at any sample point"


@pytest.mark.parametrize(
    ("legacy", "nxt", "outcome", "detail"),
    [
        (
            Side(OK, 1),
            Side("eval", message="Undefined function min"),
            "regression",
            "eval: Undefined function min",
        ),
        (Side("parse", message="x"), Side(OK, 1), "next_only_ok", "parse: x"),
        (
            Side("parse", message="x"),
            Side("eval", message="y"),
            "both_error",
            "eval: y",
        ),
        # A function finite at no point counts as an error opposite an error.
        (Side(OK, fn(ERR, ERR)), Side("eval", message="y"), "both_error", "eval: y"),
        (
            Side("parse", message="x"),
            Side(OK, fn(ERR, ERR)),
            "both_error",
            f"eval: {NO_POINTS}",
        ),
        # A function without sample points isn't evidence of anything.
        (
            Side(OK, {"fn": 6, "at": None}),
            Side("eval", message="y"),
            "regression",
            "eval: y",
        ),
    ],
)
def test_status_table(legacy, nxt, outcome, detail):
    pair = label(spec(), legacy, nxt, TOL)
    assert (pair.outcome, pair.detail) == (outcome, detail)


def test_a_legacy_range_array_equals_a_next_domain_function_constant_at_it():
    pair = label(spec("domain"), Side(OK, [0, 1]), Side(OK, fn([0, 1], [0, 1])), TOL)
    assert pair.outcome == "equal"


@pytest.mark.parametrize("legacy", [[1, 2, 3], [[1], [2], [3]]])
def test_a_legacy_point_equals_math3d_next_one_element_list_of_it(legacy):
    pair = label(spec("coords"), Side(OK, legacy), Side(OK, [[1, 2, 3]]), TOL)
    assert pair.outcome == "equal"


@pytest.mark.parametrize(
    ("legacy", "nxt", "expected"),
    [
        (Side(OK, 1), Side(OK, {"bool": True}), ("equal", None)),
        # Both apps show an item whose calculated visibility errors.
        (Side("eval", MISSING, "e"), Side("eval", MISSING, "e"), ("equal", None)),
        (Side(OK, 0), Side("eval", MISSING, "e"), ("differ", "next_shows")),
        (Side(OK, [1, 0]), Side(OK, {"bool": False}), ("differ", "next_hides")),
        (Side(OK, {"bool": False}), Side(OK, 1), ("differ", "next_shows")),
    ],
)
def test_calculated_visibility_compares_what_each_app_draws(legacy, nxt, expected):
    pair = label(spec("truthiness"), legacy, nxt, TOL)
    assert (pair.outcome, pair.detail) == expected


def test_unused_calculated_visibility_keeps_the_status_table():
    nothing = Side("eval", MISSING, "e")
    pair = label(spec("truthiness", severity="editor"), nothing, nothing, TOL)
    assert pair.outcome == "both_error"


@pytest.mark.parametrize(
    ("message", "expected"),
    [
        ("Undefined function min", "Undefined function min"),
        ("Undefined function log10", "Undefined function log10"),
        ("Undefined symbol Revenue", "Undefined symbol X"),
        ("undefined symbols θ_x, φ", "undefined symbols X"),
        (
            "Name Revenue has been assigned multiple times.",
            "Name X has been assigned multiple times.",
        ),
        ("x_{abc} is not a function", "X is not a function"),
        ("Undefined symbol $secret", "Undefined symbol X"),
        (
            "'q' is not a function; its value is:\n  i",
            "'…' is not a function; its value is: …",
        ),
        (
            'Syntax error in part "12\'52.2"E16°42" (char 3)',
            "Syntax error in part '…'EN°N\" (char N)",
        ),
        ("Can't evaluate 'x'", "Can't evaluate '…'"),
        ("Index 3 out of range", "Index N out of range"),
        (
            "g(a, b) needs 2 inputs, or one point [a, b], but got 1",
            "… needs N inputs, or one point […], but got N",
        ),
    ],
)
def test_template_keeps_function_names_and_hides_user_names_and_numbers(
    message, expected
):
    assert template(message) == expected


# --------------------------------------------------------------------------- #
# Pairing
# --------------------------------------------------------------------------- #


def field(status=OK, value=1, **extra):
    return {"status": status, "value": value, "deps": [], **extra}


AXES = {f"axis-{a}": {"type": "AXIS", "axis": a, "scale": "1"} for a in "xyz"}


def _pairs(rehydrated, react, nxt, types=None):
    pairing = pair_scene(rehydrated, react, nxt, types or {})
    return {
        (p.legacy_field, p.legacy_element, p.next_field, p.next_element)
        for p in pairing.pairs
    }, pairing


def test_pairs_fields_through_the_expected_table_and_skips_blank_legacy_text():
    point = {
        "type": "POINT",
        "coords": "\\left[1,2,3\\right]",
        "calculatedVisibility": "",
    }
    rehydrated = {"mathGraphics": {"p": point}, "mathSymbols": {}}
    react = {"p": {"coords": field(), "calculatedVisibility": field()}}
    nxt = {"p": {"coords": field(), "calculatedVisibility": field()}}
    pairs, pairing = _pairs(rehydrated, react, nxt)
    assert pairs == {("coords", None, "coords", None)}
    assert ("react", "POINT", "calculatedVisibility", "blank") in pairing.unpaired


def test_slider_bounds_pair_with_range_elements_and_its_value_with_slider_values():
    slider = {
        "type": "VARIABLE_SLIDER",
        "name": "T",
        "min": "-5",
        "max": "5",
    }
    rehydrated = {
        "mathGraphics": {},
        "mathSymbols": {"s": slider},
        "sliderValues": {"s": 2},
    }
    react = {"s": {"value": field(), "min": field(), "max": field()}}
    nxt = {"s": {"value": field(), "range": field()}}
    pairs, _ = _pairs(rehydrated, react, nxt)
    assert pairs == {
        ("value", None, "value", None),
        ("min", None, "range", 0),
        ("max", None, "range", 1),
    }


def test_vector_field_samples_pair_element_by_element():
    vf = {
        "type": "VECTOR_FIELD",
        "samples": "\\left[4,6,8\\right]",
        "expr": "_f(x,y,z)=[x,y,z]",
    }
    rehydrated = {"mathGraphics": {"v": vf}, "mathSymbols": {}}
    react = {"v": {"samples": field()}}
    nxt = {"v": {f"samples{i}": field() for i in (1, 2, 3)}}
    pairs, _ = _pairs(rehydrated, react, nxt)
    assert pairs == {("samples", i - 1, f"samples{i}", None) for i in (1, 2, 3)}


def test_a_camera_without_use_computed_is_compared_with_numbers_from_evaluated_scales():
    camera = {
        "type": "CAMERA",
        "useComputed": False,
        "relativePosition": [2, 4, 6],
        "relativeLookAt": [0, 0, 0],
    }
    rehydrated = {"mathGraphics": {"camera": camera, **AXES}, "mathSymbols": {}}
    react = {"axis-x": {"scale": field(value=2)}, "axis-y": {}, "axis-z": {}}
    nxt = {"camera": {"position": field(), "target": field()}}
    pairing = pair_scene(rehydrated, react, nxt, {})
    position = next(p for p in pairing.pairs if p.next_field == "position")
    assert (position.rule, position.expected) == ("camera", [1.0, 4.0, 6.0])


def test_an_element_past_the_end_is_an_eval_error():
    record = {"status": OK, "value": [1], "elements": [{"status": OK}]}
    assert _side(record, 1, per_element_status=True).status == "eval"


def test_reports_a_field_neither_paired_nor_known_as_unaccounted():
    point = {"type": "POINT", "coords": "\\left[1,2,3\\right]"}
    rehydrated = {"mathGraphics": {"p": point}, "mathSymbols": {}}
    react = {"p": {"coords": field(), "newField": field()}}
    nxt = {"p": {"coords": field(), "zOrder": field()}}
    _, pairing = _pairs(rehydrated, react, nxt)
    assert ("react", "POINT", "newField", "unaccounted") in pairing.unpaired
    assert any(u[2] == "zOrder" and u[3].startswith("known") for u in pairing.unpaired)


# --------------------------------------------------------------------------- #
# Roots
# --------------------------------------------------------------------------- #


def _bad_pair(item_id):
    s = spec(item_id=item_id, legacy_field="value", next_field="value")
    return Pair(s, Side(OK, 1), Side("eval"), "regression")


def test_a_pair_downstream_of_a_bad_dependency_is_not_a_root():
    pairs = [_bad_pair("a"), _bad_pair("b")]
    items = {"a": {"value": field()}, "b": {"value": field(deps=["a-value"])}}
    mark_roots(pairs, items, items)
    assert [p.root for p in pairs] == [True, False]


@pytest.mark.parametrize(
    ("legacy", "outcome", "root"),
    [((OK, 1), "regression", True), (("eval",), "both_error", False)],
)
def test_a_dependency_failing_in_both_apps_explains_only_a_react_failure(
    legacy, outcome, root
):
    a = Pair(spec(item_id="a"), Side("eval"), Side("eval"), "both_error")
    b = Pair(spec(item_id="b"), Side(*legacy), Side("eval"), outcome)
    react = {"a": {"f": field("eval")}, "b": {"f": field(deps=["a-f"])}}
    nxt = {"a": {"f": field("eval")}, "b": {"f": field("eval", deps=["a-f"])}}
    mark_roots([a, b], react, nxt)
    assert b.root is root


def test_fields_in_a_dependency_cycle_dont_make_each_other_downstream():
    pairs = [_bad_pair("a"), _bad_pair("b")]
    items = {
        "a": {"value": field(deps=["b-value"])},
        "b": {"value": field(deps=["a-value"])},
    }
    mark_roots(pairs, items, items)
    assert [p.root for p in pairs] == [True, True]
