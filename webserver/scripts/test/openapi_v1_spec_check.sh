#!/usr/bin/env bash
set -uo pipefail
TMPFILE=$(mktemp)
trap 'rm -f "$TMPFILE"' EXIT

if ! uv run ./manage.py dump_openapi_v1 --output "$TMPFILE"; then
	echo "Failed to generate v1 OpenAPI spec"
	exit 1
fi

if diff "$TMPFILE" ./openapi.v1.yaml; then
	echo "v1 OpenAPI spec is up to date!"
else
	echo "v1 OpenAPI spec is out of date. Please regenerate via ./scripts/generate_openapi.sh"
	exit 1
fi
