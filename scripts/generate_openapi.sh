#!/usr/bin/env bash
set -eo pipefail

if [ -z "$(which docker)" ]; then
	echo "Error: Docker must be available in order to run this script"
	exit 1
fi

##################################################
# Generate OpenAPI Schema
##################################################
docker compose run --rm webserver \
	uv run ./manage.py spectacular \
	--urlconf main.urls \
	--file ./openapi.yaml \
	--validate

##################################################
# Generate API Client
##################################################

GENERATOR_VERSION=v7.2.0

docker run --rm -v "${PWD}:/local" openapitools/openapi-generator-cli:${GENERATOR_VERSION} \
	generate \
	-i /local/webserver/openapi.yaml \
	-g typescript-axios \
	-o /local/packages/api/src/generated \
	--ignore-file-override /local/packages/api/.openapi-generator-ignore \
	--additional-properties=useSingleRequestParameter=true,paramNaming=original

# We expect pre-commit to exit with a non-zero status since it is reformatting
# the generated code.
git ls-files packages/api/src/generated | xargs pre-commit run --files openapi.yaml ||
	echo "OpenAPI generation complete."

##################################################
# Generate v1 OpenAPI Schema (Ninja, raw 3.1)
##################################################
docker compose run --rm webserver \
	uv run ./manage.py dump_openapi_v1

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

# Ensure the VERSION file ends with a newline (the generator omits it).
echo >>packages/api/src/generated-v1/.openapi-generator/VERSION

# Format the generated v1 client with the workspace-pinned prettier (single pin site).
yarn prettier "packages/api/src/generated-v1/**/*.ts" --write
