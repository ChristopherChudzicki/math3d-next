from django.conf import settings


def test_headless_urls_under_app_prefix():
    urls = settings.HEADLESS_FRONTEND_URLS
    assert urls["account_confirm_email"].endswith(
        "/app/auth/activate-account?key={key}"
    )
    # Preserve the existing trailing slash before ?key= on reset-confirm.
    assert urls["account_reset_password_from_key"].endswith(
        "/app/auth/reset-password/confirm/?key={key}"
    )
