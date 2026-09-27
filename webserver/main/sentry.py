# allauth's views, and the adapter hooks they call, hold the client secret, the
# PKCE verifier and the user's tokens in their locals. Matching the mount point
# instead of variable names survives allauth renaming them.
SIGN_IN_ROUTE_PREFIX = "/_allauth/"


def drop_sign_in_frame_locals(event, hint):
    """Sentry `before_send`: strip frame locals from events raised while
    serving a sign-in request.

    Keyed on the transaction, which DjangoIntegration names after the matched
    URL route by default; `event["request"]` is filled only on the WSGI path.
    """
    if event.get("transaction", "").startswith(SIGN_IN_ROUTE_PREFIX):
        for exception in event.get("exception", {}).get("values", []):
            for frame in exception.get("stacktrace", {}).get("frames", []):
                frame.pop("vars", None)
    return event
