import os
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from allauth.account.models import EmailAddress
from allauth.socialaccount.models import SocialAccount
from pydantic_settings import BaseSettings
from scenes.models import Scene
import json


class SeedEnv(BaseSettings):
    TEST_USER_ADMIN_EMAIL: str = ""
    TEST_USER_ADMIN_UID: str = ""
    TEST_USER_STATIC_EMAIL: str = ""
    TEST_USER_STATIC_UID: str = ""


env = SeedEnv()

User = get_user_model()


def create_test_user(email: str, *, uid: str, is_staff=False):
    if not email:
        raise CommandError(
            "Empty email for test user. Set TEST_USER_ADMIN_EMAIL and "
            "TEST_USER_STATIC_EMAIL."
        )
    if not uid:
        raise CommandError(
            "Empty uid for test user. Set TEST_USER_ADMIN_UID and TEST_USER_STATIC_UID."
        )
    user, _ = User.objects.get_or_create(email=email)
    user.is_active = True
    user.is_staff = is_staff
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

    def handle(self, *args, **options):
        if env.TEST_USER_ADMIN_UID == env.TEST_USER_STATIC_UID:
            raise CommandError(
                "TEST_USER_ADMIN_UID and TEST_USER_STATIC_UID must differ; a "
                "shared uid gives both users one dummy identity."
            )

        create_test_user(
            email=env.TEST_USER_ADMIN_EMAIL,
            uid=env.TEST_USER_ADMIN_UID,
            is_staff=True,
        )

        user_1 = create_test_user(
            email=env.TEST_USER_STATIC_EMAIL,
            uid=env.TEST_USER_STATIC_UID,
        )

        dirname = os.path.dirname(__file__)
        filename = os.path.join(dirname, "./test_scene.json")
        with open(filename) as f:
            test_scene = json.load(f)

        for j in range(TEST_SCENE_COUNT):
            title = title = f"Test Scene {j}"
            s = Scene.objects.filter(title=title, author=user_1).first()
            if s:
                s.items = test_scene["items"]
                s.item_order = test_scene["itemOrder"]
            else:
                Scene.objects.create(
                    title=title,
                    author=user_1,
                    items=test_scene["items"],
                    item_order=test_scene["itemOrder"],
                )
