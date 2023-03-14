import jtd  # type: ignore
from django.core.exceptions import ValidationError
from django.core.validators import BaseValidator

options = jtd.ValidationOptions(max_errors=1)


class JtdValidator(BaseValidator):
    """
    Validate a Django field against a JSON Type Def schema.

    See https://jsontypedef.com/ for more.
    """

    def compare(self, value, schema):
        errors = jtd.validate(schema=schema, instance=value, options=options)
        if errors:
            raise ValidationError(f"{value} failed JTD schema check")

    def deconstruct(self):
        return (
            "scenes.validators.JtdValidator",
            (),
            {"limit_value": str(self.limit_value)},
        )

    def __eq__(self, other):
        return (
            isinstance(other, self.__class__) and self.limit_value == other.limit_value
        )
