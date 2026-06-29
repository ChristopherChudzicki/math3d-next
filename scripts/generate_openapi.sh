#!/usr/bin/env bash
set -eo pipefail

if [ -z "$(which docker)" ]; then
	echo "Error: Docker must be available in order to run this script"
	exit 1
fi

##################################################
# Generate OpenAPI Schemas
##################################################
# v1 (Ninja, raw 3.1) and the trimmed allauth headless browser spec.
docker compose run --rm webserver \
	uv run ./manage.py dump_openapi_v1
docker compose run --rm webserver \
	uv run ./manage.py dump_openapi_allauth

##################################################
# Generate API Clients (types-only)
##################################################
# Both clients are types-only (openapi-typescript) and consumed at runtime via
# openapi-fetch. Each emits a single index.ts of `paths`/`components`/
# `operations`; the runtime clients + CSRF middleware live in
# packages/api/src/hooks/util.ts. Runs on the host (no Docker/JVM) against the
# locally installed openapi-typescript.
#
# --default-non-nullable=false keeps fields that have a schema `default` (e.g.
# SceneCreateSchema.archived) OPTIONAL — for request bodies the server applies the
# default, so the client need not send them. (openapi-typescript otherwise marks
# defaulted fields required, which the typescript-axios client did not do.) The
# flag is global, so it also relaxes any RESPONSE field carrying a `default`; today
# no response schema has one (response fields are listed in `required` by
# Pydantic), so the effect is request-scoped in practice.
OTS_FLAGS="--default-non-nullable false"

rm -rf packages/api/src/generated-v1
mkdir -p packages/api/src/generated-v1
npx openapi-typescript webserver/openapi.v1.yaml ${OTS_FLAGS} \
	-o packages/api/src/generated-v1/index.ts

rm -rf packages/api/src/generated-allauth
mkdir -p packages/api/src/generated-allauth
npx openapi-typescript webserver/openapi.allauth.yaml ${OTS_FLAGS} \
	-o packages/api/src/generated-allauth/index.ts

# Format the generated clients via pre-commit (prettier) so a single run of this
# script leaves a clean working tree. pre-commit exits non-zero when it
# reformats, which is expected.
find packages/api/src/generated-v1 packages/api/src/generated-allauth -type f -print0 |
	xargs -0 pre-commit run --files ||
	echo "OpenAPI generation complete."
