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
