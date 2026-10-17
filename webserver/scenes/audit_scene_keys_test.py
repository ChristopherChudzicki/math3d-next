import pytest
from django.core.management import call_command
from django.core.management.base import CommandError
from scenes.models import LegacyScene


@pytest.mark.django_db
def test_audit_passes_when_clean(capsys):
    call_command("audit_scene_keys")  # no rows → no error
    assert "No invalid keys" in capsys.readouterr().out


@pytest.mark.django_db
def test_audit_fails_on_invalid_legacy_key():
    # LegacyScene has no constraint, so it can hold an invalid key; the audit must flag it.
    LegacyScene.objects.create(key="a.b", dehydrated={})
    with pytest.raises(CommandError):
        call_command("audit_scene_keys")
