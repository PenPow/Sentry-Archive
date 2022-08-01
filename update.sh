#!/bin/bash

# lil helper script
compare_versions() {
    [  "$1" = "`echo -e "$1\n$2" | sort -V | head -n1`" ]
}

VERSION='Loading...'

[[ -z "${SENTRY_PRODUCTION_VERSION}" ]] && VERSION='0.0.0' || VERSION="${SENTRY_PRODUCTION_VERSION}"

REQUEST=$(curl -s -H "Accept: application/vnd.github+json"  -H "Authorization: token ${GH_PAT}" "https://api.github.com/repos/PenPow/Sentry/releases/latest")

NEW_VERSION=$(jq -r 'if .draft or .prerelease then "999.999.999" else if .message? == "Not Found" then "0.0.0" else .tag_name end end' <<< $REQUEST)

UPDATE=$(compare_versions ${NEW_VERSION} ${VERSION}) && true || false


if [[ UPDATE ]] ; then
	# Time to update

	docker compose pull -f docker-compose.production.yaml && docker compose up -d -f docker-compose.production.yaml

	export SENTRY_PRODUCTION_VERSION=$NEW_VERSION
fi