import os
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from scenes.models import Scene
import environ
import json


env = environ.Env(
    TEST_USER_1_EMAIL=(str, ""),
    TEST_USER_1_PASSWORD=(str, ""),
    TEST_USER_2_EMAIL=(str, ""),
    TEST_USER_2_PASSWORD=(str, ""),
)

User = get_user_model()


def create_test_user(email: str, password: str, public_nickname: str):
    user, _ = User.objects.get_or_create(email=email)
    user.is_active = True
    user.public_nickname = public_nickname
    user.set_password(password)
    user.save()
    return user


TEST_SCENE_COUNT = 100


class Command(BaseCommand):
    help = """Seed test data for e2e tests"""

    def handle(self, *args, **options):
        user_1 = create_test_user(
            email=env("TEST_USER_1_EMAIL"),
            password=env("TEST_USER_1_PASSWORD"),
            public_nickname="Static Test User",
        )
        create_test_user(
            email=env("TEST_USER_2_EMAIL"),
            password=env("TEST_USER_2_PASSWORD"),
            public_nickname="Dynamic Test User",
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
