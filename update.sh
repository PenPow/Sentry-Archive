#!/bin/bash

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

echo $VERSION

REQUEST=$(curl -s -H "Accept: application/vnd.github+json"  -H "Authorization: token ${GH_PAT}" "https://api.github.com/repos/PenPow/Sentry/releases/latest")

NEW_VERSION=$(jq -r 'if .draft or .prerelease then "999.999.999" else if .message? == "Not Found" then "0.0.0" else .tag_name end end' <<< $REQUEST)

UPDATE=$(compare_versions ${NEW_VERSION} ${VERSION}) && true || false

if [[ UPDATE ]] && [[ $VERSION != $NEW_VERSION ]]; then
	# Time to update

	echo Updating from $VERSION to $NEW_VERSION
	docker compose pull -f docker-compose.production.yaml && docker compose up -d -f docker-compose.production.yaml

	echo $NEW_VERSION > "$VERSION_FILE"
else
	echo No Version Bump Needed
fi