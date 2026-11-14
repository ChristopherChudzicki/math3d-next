import json
from pathlib import Path

import pytest

from scenes.legacy_scene_utils.strip_mod import ModRewrite, rewrite_color_mod

# Shared with the frontend, whose parser checks that each rewrite evaluates as
# its original does (`packages/parser/src/colorModRewrite.spec.ts`).
CASES = json.loads(
    (Path(__file__).parent / "strip_mod_cases.json").read_text(encoding="utf-8")
)


@pytest.mark.parametrize(
    "case", CASES["rewritten"], ids=[c["original"] for c in CASES["rewritten"]]
)
def test_rewrites_an_outer_mod_the_wrap_setting_draws_the_same(case):
    assert rewrite_color_mod(case["original"]) == ModRewrite(
        case["rewritten"], case["wraps"]
    )


@pytest.mark.parametrize("rhs", CASES["kept"])
def test_leaves_anything_else(rhs):
    assert rewrite_color_mod(rhs) is None
