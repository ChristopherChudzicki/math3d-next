import copy
from pathlib import Path

import yaml
from allauth.headless.spec.internal.schema import get_schema
from django.conf import settings
from django.core.management.base import BaseCommand

DEFAULT_OUTPUT = Path(settings.BASE_DIR) / "openapi.allauth.yaml"

# (path, http_method) -> operationId.
# Only these operations are vendored into our client; everything else allauth's
# get_schema() exposes for the browser client (2FA, phone, reauthenticate,
# email/phone management, login-by-code, config, verify-resend, ...) is dropped.
# The frontend uses exactly these seven flows (see
# packages/api/src/hooks/auth/index.ts). Paths are already client-pinned to
# `/browser/` by get_schema(), so we key on the resolved browser paths.
ENABLED = {
    ("/_allauth/browser/v1/auth/login", "post"): "login",
    ("/_allauth/browser/v1/auth/signup", "post"): "signup",
    ("/_allauth/browser/v1/auth/email/verify", "post"): "verifyEmail",
    ("/_allauth/browser/v1/auth/password/request", "post"): "requestPassword",
    ("/_allauth/browser/v1/auth/password/reset", "post"): "resetPassword",
    ("/_allauth/browser/v1/auth/session", "delete"): "logout",
    ("/_allauth/browser/v1/account/password/change", "post"): "changePassword",
}

# Param $refs to strip from kept operations. `SessionToken` is the
# `X-Session-Token` header that only the non-browser (app) client uses — the
# browser flow is cookie-based, so it is pure noise in the generated method
# signatures. (get_schema() already drops the `Client` path param for us.)
DROP_PARAM_REFS = {
    "#/components/parameters/SessionToken",
}

# Collapse every operation under a single tag so the generator emits one
# `AllauthApi` class instead of one per allauth tag grouping.
TAG = "allauth"

# We do not override any request schema. allauth models `Login` as
# password + anyOf[username|email|phone]; openapi-typescript renders that as a
# faithful union, and we narrow it to our supported identifier (email) at the
# single consuming call site — `useLogin` in packages/api/src/hooks/auth/index.ts
# — where TypeScript enforces the narrowing (and surfaces any upstream Login
# reshape as a compile error). `Signup` likewise needs no override: get_schema()
# already injects our custom-form `public_nickname` (optional, maxLength 64) and
# the required email/password from ACCOUNT_SIGNUP_FIELDS.


def _strip_examples(node):
    """Recursively drop OpenAPI `example`/`examples` keys. allauth's example
    token values (sample JWTs / session tokens) trip secret scanners and bloat
    the spec, and the generator ignores examples entirely. Safe for our trimmed
    surface: no schema here has a property literally named example/examples."""
    if isinstance(node, dict):
        node.pop("example", None)
        node.pop("examples", None)
        for value in node.values():
            _strip_examples(value)
    elif isinstance(node, list):
        for item in node:
            _strip_examples(item)


def _iter_refs(node):
    """Yield every "#/components/..." $ref string reachable within `node`."""
    if isinstance(node, dict):
        for key, value in node.items():
            if key == "$ref" and isinstance(value, str):
                yield value
            else:
                yield from _iter_refs(value)
    elif isinstance(node, list):
        for item in node:
            yield from _iter_refs(item)


def _prune_components(spec, roots):
    """Return a components dict containing only the transitive closure of
    component $refs reachable from `roots` (the trimmed paths object)."""
    components = spec.get("components", {})
    reachable: set[tuple[str, str]] = set()
    frontier = [ref for ref in _iter_refs(roots) if ref.startswith("#/components/")]
    while frontier:
        ref = frontier.pop()
        _, _, group, name = ref.split("/")
        if (group, name) in reachable:
            continue
        reachable.add((group, name))
        subtree = components.get(group, {}).get(name)
        if subtree is None:
            raise ValueError(f"Dangling component reference: {ref}")
        frontier.extend(r for r in _iter_refs(subtree) if r.startswith("#/components/"))

    pruned: dict[str, dict] = {}
    for group, name in sorted(reachable):
        pruned.setdefault(group, {})[name] = components[group][name]
    return pruned


class Command(BaseCommand):
    help = (
        "Vendor a trimmed django-allauth headless OpenAPI spec for the browser "
        "client (deterministic). Sources allauth's own get_schema() (which pins "
        "the browser client, drops the client param, and injects our custom "
        "signup fields), then trims to the enabled flows, injects operationIds, "
        "collapses tags, and prunes."
    )

    def add_arguments(self, parser):
        parser.add_argument("--output", default=None)

    def handle(self, *args, output=None, **options):
        # allauth's own spec builder: loads its bundled spec, pins the single
        # (browser) client into the paths, drops the client param, trims to the
        # enabled endpoints, sets the signup required fields, and injects our
        # custom signup form's `public_nickname`.
        # Two dependencies worth knowing: (1) get_schema lives in allauth's
        # `internal` package, so an upgrade could move it — a loud ImportError,
        # acceptable for a build-time tool. (2) The client-pinning above only
        # happens because HEADLESS_CLIENTS has exactly one entry ("browser"); a
        # second client would reintroduce `{client}` paths + the Client param,
        # and the resolved-path keys in ENABLED would stop matching (loud
        # KeyError, not silent drift).
        source = get_schema()
        _strip_examples(source)

        paths: dict[str, dict] = {}
        for (path, method), operation_id in ENABLED.items():
            operation = copy.deepcopy(source["paths"][path][method])
            operation["operationId"] = operation_id
            operation["tags"] = [TAG]
            operation["parameters"] = [
                param
                for param in operation.get("parameters", [])
                if param.get("$ref") not in DROP_PARAM_REFS
            ]
            if not operation["parameters"]:
                operation.pop("parameters")
            paths.setdefault(path, {})[method] = operation

        spec = {
            "openapi": source["openapi"],
            # allauth's full info.description documents the entire (app + 2FA +
            # provider) API; replace it with a short string scoped to our subset.
            "info": {
                "title": source["info"]["title"],
                "version": source["info"]["version"],
                "description": (
                    "Trimmed django-allauth headless browser API. "
                    "Vendored via `manage.py dump_openapi_allauth`."
                ),
            },
            "paths": paths,
            "components": _prune_components(source, paths),
        }

        text = yaml.safe_dump(
            spec,
            sort_keys=True,
            allow_unicode=True,
            default_flow_style=False,
            width=float("inf"),
        )
        target = Path(output) if output else DEFAULT_OUTPUT
        target.write_text(text)
        self.stdout.write(self.style.SUCCESS(f"Wrote {target}"))
