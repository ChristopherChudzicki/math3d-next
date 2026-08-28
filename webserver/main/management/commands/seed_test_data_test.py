import pytest
from allauth.socialaccount.models import SocialAccount
from django.core.management.base import CommandError

from main.management.commands.seed_test_data import create_test_user


@pytest.mark.django_db
def test_seeded_user_gets_a_matching_dummy_identity():
    user = create_test_user(
        email="seeded@example.com",
        password="irrelevant",  # pragma: allowlist secret
        public_nickname="Seeded",
        uid="4242",
    )

    account = SocialAccount.objects.get(user=user)
    assert account.provider == "dummy"
    assert account.uid == "4242"


@pytest.mark.django_db
def test_seeding_twice_leaves_one_identity():
    """Re-seeding is routine locally; it must not collide on (provider, uid)."""
    kwargs = dict(
        email="seeded@example.com",
        password="irrelevant",  # pragma: allowlist secret
        public_nickname="Seeded",
        uid="4242",
    )
    create_test_user(**kwargs)
    user = create_test_user(**kwargs)

    assert SocialAccount.objects.filter(user=user).count() == 1


@pytest.mark.django_db
def test_missing_uid_raises_instead_of_colliding():
    """An empty uid would otherwise re-point every seeded user's SocialAccount
    to the same (provider, uid) row; refuse to seed instead."""
    with pytest.raises(CommandError, match="uid"):
        create_test_user(
            email="seeded@example.com",
            password="irrelevant",  # pragma: allowlist secret
            public_nickname="Seeded",
            uid="",
        )
