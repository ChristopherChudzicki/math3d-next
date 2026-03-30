import os
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from allauth.account.models import EmailAddress
from scenes.models import Scene
import environ
import json


env = environ.Env(
    TEST_ADMIN_USER_EMAIL=(str, ""),
    TEST_ADMIN_USER_PASSWORD=(str, ""),
    TEST_USER_STATIC_EMAIL=(str, ""),
    TEST_USER_STATIC_PASSWORD=(str, ""),
)

User = get_user_model()


def create_test_user(
    email: str, password: str, public_nickname: str, *, is_staff=False
):
    user, _ = User.objects.get_or_create(email=email)
    user.is_active = True
    user.public_nickname = public_nickname
    user.is_staff = is_staff
    user.set_password(password)
    user.save()
    EmailAddress.objects.update_or_create(
        user=user,
        email=email,
        defaults={"verified": True, "primary": True},
    )
    return user


TEST_SCENE_COUNT = 100


class Command(BaseCommand):
    help = """Seed test data for e2e tests"""

    def handle(self, *args, **options):
        create_test_user(
            email=env("TEST_USER_ADMIN_EMAIL"),
            password=env("TEST_USER_ADMIN_PASSWORD"),
            public_nickname="Admin Test User",
            is_staff=True,
        )

        user_1 = create_test_user(
            email=env("TEST_USER_STATIC_EMAIL"),
            password=env("TEST_USER_STATIC_PASSWORD"),
            public_nickname="Static Test User",
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
