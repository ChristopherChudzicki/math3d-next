from django.core.exceptions import ValidationError
from pydantic import ValidationError as PydanticValidationError

from scenes.schemas.math_items import MATH_ITEM_LIST_ADAPTER


def validate_math_items(value):
    """Validate Scene.items against the Pydantic math-item union.

    Runs as a model-field validator via Scene.save() -> full_clean(), so it
    guards both the v0 (DRF) and v1 (Ninja) write paths. Re-raises Pydantic's
    error as a Django ValidationError so full_clean() collects it.
    """
    try:
        MATH_ITEM_LIST_ADAPTER.validate_python(value)
    except PydanticValidationError as exc:
        raise ValidationError(str(exc)) from exc
