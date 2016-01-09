#!/bin/bash

# Return package version, release or epoch based on git tags and commits
# Based on https://datasift.github.io/gitflow/Versioning.html AND
# https://datasift.github.io/gitflow/Versioning.html
# Git tags should always be X.Y.Z (major.minor.patch)
# Builds from master should end up being X.Y.Z-B where B is build number
# Builds from any other branch end up being X.Y.Z-SNAPSHOT-B-GH-GB where
#       GH is git commit hash (like g88e2ebb)
#       GB is git branch (like versioning)
# Example builds:
#       release version from master: 2.2.0-1
#       rebuild version from master: 2.2.0-5
#       dev version from feature : 2.2.0-SNAPSHOT.35.g88e2ebb.versioning

EPOCH=$(date +%s)
GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
VERSION=$(git describe --tags | cut -f1 -d'-')
if [[ $GIT_BRANCH == 'master' ]] ; then
  RELEASE=$(git describe --tags | cut -f2 -d'-')
else
  COMMIT_DETAIL=$(git describe --long --tags --always | cut -f2- -d'-' | sed -e 's/-/./g')
  RELEASE="SNAPSHOT.${COMMIT_DETAIL}.${GIT_BRANCH}"
fi
BINARY_NAME=${2:-goldstone-agent}

case $1 in
  full)
    echo "$VERSION-$RELEASE"
    ;;
  version)
    echo $VERSION
    ;;
  release)
    echo $RELEASE
    ;;
  epoch)
    echo $EPOCH
    ;;
  rpmname)
    echo ${BINARY_NAME}-${VERSION}-${RELEASE}.x86_64.rpm
    ;;
  debname)
    echo ${BINARY_NAME}_${VERSION}-${RELEASE}_amd64.deb
    ;;
  *)
    echo $"Usage: $0 {version|release|epoch|full|rpmname|debname}"
    exit 1
esac
