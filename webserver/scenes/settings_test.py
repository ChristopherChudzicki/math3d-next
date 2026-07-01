from django.conf import settings


def test_headless_urls_point_at_auth_overlays():
    # Activation and password-reset-confirm are cold-entry `?overlay=` dialogs
    # opened over the app, not standalone pages — the email links must match.
    urls = settings.HEADLESS_FRONTEND_URLS
    assert urls["account_confirm_email"].endswith("/?overlay=activate&key={key}")
    assert urls["account_reset_password_from_key"].endswith(
        "/?overlay=reset-confirm&key={key}"
    )
