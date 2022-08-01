#!/bin/bash

if [[ -z "$GH_PAT" ]]; then
	echo "Run this with the GH PAT env variable set"
	exit 1
fi

# lil helper script
compare_versions() {
    [  "$1" = "`echo -e "$1\n$2" | sort -V | head -n1`" ]
}

VERSION='Loading...'

VERSION_FILE="/tmp/sentry_version.dat"

if [ ! -f "$VERSION_FILE" ]; then
    VERSION='0.0.0'
else
	VERSION=$(cat $VERSION_FILE)
fi

REQUEST=$(curl -s -H "Accept: application/vnd.github+json"  -H "Authorization: token ${GH_PAT}" "https://api.github.com/repos/PenPow/Sentry/releases/latest")

NEW_VERSION=$(jq -r 'if .draft or .prerelease then "999.999.999" else if .message? == "Not Found" or .message? == "Bad Credentials" then "0.0.0" else .tag_name end end' <<< $REQUEST)

UPDATE=$(compare_versions ${NEW_VERSION} ${VERSION}) && true || false

if [[ UPDATE ]] && [[ $VERSION != $NEW_VERSION ]]; then
	# Time to update

	echo Updating from $VERSION to $NEW_VERSION
	docker compose -f docker-compose.production.yaml pull && docker compose -f docker-compose.production.yaml up -d

	echo $NEW_VERSION > "$VERSION_FILE"
else
	echo No Version Bump Needed
fi