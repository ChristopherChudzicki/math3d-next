import pytest
from django.core.management import call_command
from django.core.management.base import CommandError
from scenes.models import LegacyScene


@pytest.mark.django_db
def test_audit_passes_when_clean(capsys):
    call_command("audit_reserved_keys")  # no rows → no error
    assert "No reserved keys" in capsys.readouterr().out


@pytest.mark.django_db
def test_audit_fails_on_short_legacy_key():
    # LegacyScene has no constraint, so it can hold a reserved key; the audit must flag it.
    LegacyScene.objects.create(key="a", dehydrated={})
    with pytest.raises(CommandError):
        call_command("audit_reserved_keys")


@pytest.mark.django_db
def test_audit_fails_on_legacy_app_key():
    # The `app` reservation is a distinct branch from the length check; cover it
    # so dropping the `Q(key="app")` clause would be caught.
    LegacyScene.objects.create(key="app", dehydrated={})
    with pytest.raises(CommandError):
        call_command("audit_reserved_keys")
