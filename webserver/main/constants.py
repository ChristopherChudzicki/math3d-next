"""Project-wide constant values (non-environment, non-configurable)."""

# Identifies this backend to outbound HTTP peers. Must be a named UA, not
# urllib's default `Python-urllib`: Cloudflare's Browser Integrity Check
# 1010-blocks that at the edge, before our render Worker runs.
BACKEND_USER_AGENT = "math3d-backend"
