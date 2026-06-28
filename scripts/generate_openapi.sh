#!/usr/bin/env bash
set -eo pipefail

if [ -z "$(which docker)" ]; then
	echo "Error: Docker must be available in order to run this script"
	exit 1
fi

GENERATOR_VERSION=v7.23.0

##################################################
# Generate OpenAPI Schemas
##################################################
# v1 (Ninja, raw 3.1) and the trimmed allauth headless browser spec.
docker compose run --rm webserver \
	uv run ./manage.py dump_openapi_v1
docker compose run --rm webserver \
	uv run ./manage.py dump_openapi_allauth

##################################################
# Generate v1 API Client
##################################################
docker run --rm -v "${PWD}:/local" openapitools/openapi-generator-cli:${GENERATOR_VERSION} \
	generate \
	-i /local/webserver/openapi.v1.yaml \
	-g typescript-axios \
	-o /local/packages/api/src/generated-v1 \
	--ignore-file-override /local/packages/api/.openapi-generator-ignore \
	--additional-properties=useSingleRequestParameter=true,paramNaming=original

##################################################
# Generate allauth API Client
##################################################
docker run --rm -v "${PWD}:/local" openapitools/openapi-generator-cli:${GENERATOR_VERSION} \
	generate \
	-i /local/webserver/openapi.allauth.yaml \
	-g typescript-axios \
	-o /local/packages/api/src/generated-allauth \
	--ignore-file-override /local/packages/api/.openapi-generator-ignore \
	--additional-properties=useSingleRequestParameter=true,paramNaming=original

# Format the generated clients via pre-commit (prettier over .ts + .md docs,
# end-of-file-fixer on VERSION) so a single run of this script leaves a clean
# working tree. pre-commit exits non-zero when it reformats, which is expected.
find packages/api/src/generated-v1 packages/api/src/generated-allauth -type f -print0 |
	xargs -0 pre-commit run --files ||
	echo "OpenAPI generation complete."
