import os
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from scenes.models import Scene
import environ
import json


env = environ.Env(
    TEST_ADMIN_USER_EMAIL=(str, ""),
    TEST_ADMIN_USER_PASSWORD=(str, ""),
    TEST_USER_STATIC_EMAIL=(str, ""),
    TEST_USER_STATIC_PASSWORD=(str, ""),
    TEST_USER_DYNAMIC_EMAIL=(str, ""),
    TEST_USER_DYNAMIC_PASSWORD=(str, ""),
    TEST_USER_EDITABLE_EMAIL=(str, ""),
    TEST_USER_EDITABLE_PASSWORD=(str, ""),
    TEST_USER_DELETABLE_EMAIL=(str, ""),
    TEST_USER_DELETABLE_PASSWORD=(str, ""),
    TEST_USER_NOT_CREATED_EMAIL=(str, ""),
    TEST_USER_NOT_CREATED_PASSWORD=(str, ""),
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
    return user


def delete_test_user(email: str):
    try:
        user = User.objects.get(email=email)
        user.delete()
    except User.DoesNotExist:
        pass


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
        create_test_user(
            email=env("TEST_USER_DYNAMIC_EMAIL"),
            password=env("TEST_USER_DYNAMIC_PASSWORD"),
            public_nickname="Dynamic Test User",
        )
        create_test_user(
            email=env("TEST_USER_EDITABLE_EMAIL"),
            password=env("TEST_USER_EDITABLE_PASSWORD"),
            public_nickname="Editable Test User",
        )
        create_test_user(
            email=env("TEST_USER_DELETABLE_EMAIL"),
            password=env("TEST_USER_DELETABLE_PASSWORD"),
            public_nickname="Deletable Test User",
        )

        delete_test_user(env("TEST_USER_NOT_CREATED_EMAIL"))

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
