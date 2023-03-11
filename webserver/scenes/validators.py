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
