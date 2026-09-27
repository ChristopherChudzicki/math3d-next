from django import template

from main.management.commands.seed_test_data import SeedEnv, env

register = template.Library()


@register.simple_tag
def seeded_user() -> SeedEnv:
    """The identity `seed_test_data` gives the static E2E user."""
    return env
