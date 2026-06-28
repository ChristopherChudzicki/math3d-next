#!/usr/bin/env bash
set -uo pipefail
TMPFILE=$(mktemp)
trap 'rm -f "$TMPFILE"' EXIT

if ! uv run ./manage.py dump_openapi_allauth --output "$TMPFILE"; then
	echo "Failed to generate allauth OpenAPI spec"
	exit 1
fi

if diff "$TMPFILE" ./openapi.allauth.yaml; then
	echo "allauth OpenAPI spec is up to date!"
else
	echo "allauth OpenAPI spec is out of date. Please regenerate via ./scripts/generate_openapi.sh"
	exit 1
fi
