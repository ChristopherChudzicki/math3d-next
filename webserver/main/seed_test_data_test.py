import pytest
from allauth.socialaccount.models import SocialAccount
from django.core.management import call_command
from django.core.management.base import CommandError

from main.management.commands.seed_test_data import create_test_user
from scenes.models import Scene


@pytest.mark.django_db
def test_seeded_user_gets_a_matching_dummy_identity():
    user = create_test_user(email="seeded@example.com", uid="4242")

    account = SocialAccount.objects.get(user=user)
    assert account.provider == "dummy"
    assert account.uid == "4242"
    # Matches every account the provider flow creates (see models_test.py).
    assert not user.has_usable_password()


@pytest.mark.django_db
def test_seeding_twice_leaves_one_identity():
    """Re-seeding is routine locally; it must not collide on (provider, uid)."""
    kwargs = dict(email="seeded@example.com", uid="4242")
    create_test_user(**kwargs)
    user = create_test_user(**kwargs)

    assert SocialAccount.objects.filter(user=user).count() == 1


@pytest.mark.django_db
def test_missing_uid_raises_instead_of_colliding():
    """An empty uid would otherwise re-point every seeded user's SocialAccount
    to the same (provider, uid) row; refuse to seed instead."""
    with pytest.raises(CommandError, match="uid"):
        create_test_user(email="seeded@example.com", uid="")


@pytest.mark.django_db
def test_unnormalized_uid_raises_instead_of_seeding_an_unmatchable_row():
    """The provider matches on str(int(id)), so "02" would seed a row the token
    login can never find — a red suite with a misleading cause."""
    with pytest.raises(CommandError, match="normalized"):
        create_test_user(email="seeded@example.com", uid="02")


@pytest.mark.django_db
def test_missing_email_raises_instead_of_colliding():
    """An empty email would otherwise collapse every seeded user into one
    `get_or_create(email="")` row; refuse to seed instead."""
    with pytest.raises(CommandError, match="email"):
        create_test_user(email="", uid="1")


@pytest.mark.django_db
def test_reseeding_applies_edits_to_existing_scenes():
    """Re-seeding is how an edited test_scene.json reaches a database that
    already holds the scenes; skipping the write leaves the old copy in place."""
    seed = dict(email="seeded@example.com", uid="4242", scene_count=1)
    call_command("seed_test_data", **seed)

    scene = Scene.objects.get(title="Test Scene 0")
    stale_order = {"main": []}
    scene.item_order = stale_order
    scene.save()

    call_command("seed_test_data", **seed)

    scene.refresh_from_db()
    assert scene.item_order != stale_order
