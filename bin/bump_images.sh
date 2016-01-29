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

declare -a dockerfile_list=( 
                       $GS_APP_DIR/Dockerfile \
                       $GS_APP_E_DIR/Dockerfile 
    )

declare -a composefile_list=( 
                       $TOP_DIR/docker/docker-compose-enterprise.yml \
                       $TOP_DIR/docker/docker-compose-ci.yml \
                       $TOP_DIR/docker/docker-compose.yml 
    )

declare -a templatefile_list=(
                       $TOP_DIR/goldstone/templates/base.html \
                       $TOP_DIR/goldstone/templates/login.html
    )

cd $TOP_DIR || exit 1

TAG=$(${TOP_DIR}/bin/semver.sh short)
FULL_VERSION=$(${TOP_DIR}/bin/semver.sh full)

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

if [[ ${TAG} == "" || ${FULL_VERSION} == "" ]] ; then
   echo "Couldn't find a semver tag."
   exit 1
else
   echo "Bumping files to tag: $TAG and UI to version: ${FULL_VERSION}"
fi

# We're looking for two patterns:
# 
#   FROM solinea/goldstone-*:version
#       image: solinea/golstone-*:version
#
# We will replace the version with our $TAG, and if any files have changed, 
# exit with a non-zero code to make the hook fail.
for file in "${dockerfile_list[@]}" ; do
    cat $file | sed -e "s/^\(FROM solinea\/goldstone-.*:\).*$/\1${TAG}/" > ${file}.new
    RC=`diff $file $file.new`
    if [[ $RC != 0 ]] ; then
       mv ${file}.new $file
    else
       rm ${file}.new
    fi
done

for file in "${composefile_list[@]}" ; do
    cat $file | sed -e "s/^\([[:space:]]*image:[[:space:]]*solinea\/goldstone-.*:\).*$/\1${TAG}/" \
                    -e "s/^\([[:space:]]*image:[[:space:]]*gs-docker-ent.bintray.io\/goldstone-.*:\).*$/\1${TAG}/" > ${file}.new
    RC=`diff $file $file.new`
    if [[ $RC != 0 ]] ; then
       mv ${file}.new $file
    else
       rm ${file}.new
    fi
done

for file in "${templatefile_list[@]}" ; do
    cat $file | sed -e "s?\>Version:.*\<?\>Version: ${FULL_VERSION}\<?" > ${file}.new
    RC=`diff $file $file.new`
    if [[ $RC != 0 ]] ; then
       mv ${file}.new $file
    else
       rm ${file}.new
    fi
done

git status --short
