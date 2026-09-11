import os
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from allauth.account.models import EmailAddress
from allauth.socialaccount.models import SocialAccount
from pydantic_settings import BaseSettings
from scenes.models import Scene
import json


class SeedEnv(BaseSettings):
    TEST_USER_STATIC_EMAIL: str = ""
    TEST_USER_STATIC_UID: str = ""


env = SeedEnv()

User = get_user_model()


def create_test_user(email: str, *, uid: str):
    if not email:
        raise CommandError("Empty email for test user. Set TEST_USER_STATIC_EMAIL.")
    if not uid:
        raise CommandError("Empty uid for test user. Set TEST_USER_STATIC_UID.")
    # The dummy provider's AuthenticateForm coerces `id` through an IntegerField
    # and extract_uid returns str() of the result, so it only ever matches a
    # normalized decimal: a uid of "02" seeds a row no token login can find.
    try:
        normalized = str(int(uid))
    except ValueError:
        raise CommandError(
            f"Non-numeric uid {uid!r} for test user. The dummy provider's uid is "
            "an integer; set TEST_USER_STATIC_UID to a decimal."
        )
    if uid != normalized:
        raise CommandError(
            f"Test user uid {uid!r} is not normalized. The dummy provider matches "
            f"on str(int(id)), so this row could never match; use {normalized!r}."
        )
    user, _ = User.objects.get_or_create(email=email)
    user.is_active = True
    # get_or_create bypasses CustomUserManager.create_user, leaving the field's default
    # ("") — which Django's is_password_usable() treats as usable, unlike a real account.
    user.set_unusable_password()
    user.save()
    EmailAddress.objects.update_or_create(
        user=user,
        email=email,
        defaults={"verified": True, "primary": True},
    )
    # E2E signs these users in through the dummy provider, which matches on
    # (provider, uid); without a row here the token login 401s.
    SocialAccount.objects.update_or_create(
        provider="dummy", uid=uid, defaults={"user": user}
    )
    return user


TEST_SCENE_COUNT = 100


class Command(BaseCommand):
    help = """Seed test data for e2e tests"""

    def add_arguments(self, parser):
        parser.add_argument("--email", default=env.TEST_USER_STATIC_EMAIL)
        parser.add_argument("--uid", default=env.TEST_USER_STATIC_UID)
        parser.add_argument("--scene-count", type=int, default=TEST_SCENE_COUNT)

    @transaction.atomic
    def handle(self, *args, email: str, uid: str, scene_count: int, **options):
        user_1 = create_test_user(email=email, uid=uid)

        dirname = os.path.dirname(__file__)
        filename = os.path.join(dirname, "./test_scene.json")
        with open(filename) as f:
            test_scene = json.load(f)

        for j in range(scene_count):
            title = f"Test Scene {j}"
            # (title, author) is not unique, so update_or_create would raise
            # MultipleObjectsReturned on a database that already holds two of
            # them. Re-seeding has to stay safe on whatever is already there.
            scene = Scene.objects.filter(title=title, author=user_1).first() or Scene(
                title=title, author=user_1
            )
            scene.items = test_scene["items"]
            scene.item_order = test_scene["itemOrder"]
            scene.save()

        self.stdout.write(
            self.style.SUCCESS(f"Seeded {email} with {scene_count} scenes.")
        )
