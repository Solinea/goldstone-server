#!/bin/bash
# Copyright 2015 Solinea, Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# uses the semver.sh script to replace the image tags in Dockerfiles
# and compose files.

TOP_DIR=${GS_PROJ_TOP_DIR:-${PROJECT_HOME}/goldstone-server}
GS_APP_DIR=${TOP_DIR}/docker/goldstone-app
GS_APP_E_DIR=${TOP_DIR}/docker/goldstone-app-e
GS_TASK_DIR=${TOP_DIR}/docker/goldstone-task
GS_TASK_E_DIR=${TOP_DIR}/docker/goldstone-task-e

declare -a dockerfile_list=( 
                       $GS_APP_DIR/Dockerfile \
                       $GS_APP_E_DIR/Dockerfile \
                       $GS_TASK_DIR/Dockerfile \
                       $GS_TASK_E_DIR/Dockerfile
    )

declare -a composefile_list=( 
                       $TOP_DIR/docker/docker-compose-enterprise.yml \
                       $TOP_DIR/docker/docker-compose-ci.yml \
                       $TOP_DIR/docker/docker-compose.yml 
    )

declare -a settingsfile_list=(
                       $TOP_DIR/goldstone/settings/base.py 
    )

cd $TOP_DIR || exit 1

GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD| sed -e 's/-/./g')
TAG=$(${TOP_DIR}/bin/semver.sh full)

for arg in "$@" ; do
    case $arg in
        --help)
            echo "Usage: $0"
            exit 0
        ;;
        *)
            # unknown option
            echo "Usage: $0"
            exit 1
        ;;
    esac
done

if [[ ${TAG} == "" ]] ; then
   echo "Couldn't find a semver tag."
   exit 1
else
   echo "Bumping files to tag: $TAG"
fi

# We're looking for two patterns:
# 
#   FROM solinea/goldstone-*:version
#       image: solinea/golstone-*:version
#
# We will replace the version with our $TAG, and if any files have changed, 
# exit with a non-zero code to make the hook fail.
for file in "${dockerfile_list[@]}" ; do
    sed -i.bak -e "s/^\(FROM solinea\/goldstone-.*:\).*$/\1${TAG}/" ${file}
    rm -f ${file}.bak
done

for file in "${composefile_list[@]}" ; do
    sed -i.bak -e "/[[:space:]]*image:[[:space:]]*.*\/goldstone-svc-.*:.*$/b" \
             -e "s/^\([[:space:]]*image:[[:space:]]*solinea\/goldstone-.*:\).*$/\1${TAG}/" \
             -e "s/^\([[:space:]]*image:[[:space:]]*gs-docker-ent.bintray.io\/goldstone-.*:\).*$/\1${TAG}/" ${file}
    rm -f ${file}.bak
done

for file in "${settingsfile_list[@]}" ; do
    sed -i.bak -e "s/GOLDSTONE_VERSION = \('\).*\('\)/GOLDSTONE_VERSION = \1${TAG}\2/" ${file}
    rm -f ${file}.bak
done

git status --short
