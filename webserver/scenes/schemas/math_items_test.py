from typing import get_args

import pytest
from pydantic import ValidationError

from scenes.schemas.math_items import (
    MATH_ITEM_LIST_ADAPTER,
    MathItemType,
    _MathItemUnion,
)


def _variant_classes():
    # _MathItemUnion == Annotated[Union[...], FieldInfo]; first get_args peels
    # the Annotated, second peels the Union into its member classes. (The public
    # `MathItem` is now a RootModel wrapping this union, so we introspect the
    # raw union directly.)
    return get_args(get_args(_MathItemUnion)[0])


def test_union_covers_every_math_item_type():
    discriminators = {
        get_args(cls.model_fields["type"].annotation)[0] for cls in _variant_classes()
    }
    assert discriminators == {m.value for m in MathItemType}
    assert len(_variant_classes()) == 16


def test_adapter_accepts_a_valid_folder():
    items = [
        {
            "id": "f1",
            "type": "FOLDER",
            "properties": {"description": "A Folder", "isCollapsed": "false"},
        }
    ]
    assert MATH_ITEM_LIST_ADAPTER.validate_python(items)[0].type == "FOLDER"


def test_adapter_rejects_extra_property():
    items = [
        {
            "id": "f1",
            "type": "FOLDER",
            "properties": {
                "description": "A Folder",
                "isCollapsed": "false",
                "surprise": "x",
            },
        }
    ]
    with pytest.raises(ValidationError):
        MATH_ITEM_LIST_ADAPTER.validate_python(items)


def test_adapter_rejects_missing_required_property():
    items = [{"id": "f1", "type": "FOLDER", "properties": {"description": "A Folder"}}]
    with pytest.raises(ValidationError):
        MATH_ITEM_LIST_ADAPTER.validate_python(items)


def test_adapter_rejects_unknown_type():
    items = [{"id": "x", "type": "NOPE", "properties": {}}]
    with pytest.raises(ValidationError):
        MATH_ITEM_LIST_ADAPTER.validate_python(items)
