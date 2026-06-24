#!/usr/bin/env bash
TMPFILE=$(mktemp)

uv run ./manage.py dump_openapi_v1 --output "$TMPFILE"

diff "$TMPFILE" ./openapi.v1.yaml

if [ $? -eq 0 ]; then
	echo "v1 OpenAPI spec is up to date!"
	exit 0
else
	echo "v1 OpenAPI spec is out of date. Please regenerate via ./scripts/generate_openapi.sh"
	exit 1
fi
