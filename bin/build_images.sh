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

# builds the software dist of the django project, and extracts it to the
# goldstone-server docker container context for build. Once copied, it
# performs a build of the docker container, and pushes it to the repo.

DOCKER_VM=default
TOP_DIR=${GS_PROJ_TOP_DIR:-${PROJECT_HOME}/goldstone-server}
DIST_DIR=${TOP_DIR}/dist

GS_APP_DIR=${TOP_DIR}/docker/goldstone-app
GS_WEB_DIR=${TOP_DIR}/docker/goldstone-web
GS_SEARCH_DIR=${TOP_DIR}/docker/goldstone-search
GS_LOG_DIR=${TOP_DIR}/docker/goldstone-log
GS_DB_DIR=${TOP_DIR}/docker/goldstone-db
GS_TASK_Q_DIR=${TOP_DIR}/docker/goldstone-task-queue
GS_APP_E_DIR=${TOP_DIR}/docker/goldstone-app-e

OPEN_REGISTRY_ORG=solinea
PRIV_REGISTRY_ORG=gs-docker-ent.bintray.io

declare -a need_source=( $GS_APP_DIR )

declare -a open_to_build=( $GS_SEARCH_DIR $GS_LOG_DIR $GS_DB_DIR \
              $GS_APP_DIR $GS_WEB_DIR $GS_TASK_Q_DIR )

declare -a priv_to_build=( $GS_APP_E_DIR )

cd $TOP_DIR || exit 1

for arg in "$@" ; do
    case $arg in
        --docker-vm=*)
            DOCKER_VM="${arg#*=}"
            shift
        ;;
        --tag=*)
            TAG="${arg#*=}"
            shift
        ;;
        --help)
            echo "Usage: $0 --tag=tagname [--docker-vm=vmname]"
            exit 0
        ;;
        *)
            # unknown option
            echo "Usage: $0 --tag=tagname [--docker-vm=vmname]"
            exit 1
        ;;
    esac
done

if [[ ${TAG} == "" ]] ; then
   echo "Usage: $0 --tag=tagname [--docker-vm=vmname]"
   exit 1
fi

if [[ ${DOCKER_VM} != "false" ]] ; then
    docker-machine start ${DOCKER_VM}
    eval "$(docker-machine env ${DOCKER_VM})"
fi

if [[ -d $DIST_DIR ]] ; then
    rm -rf ${DIST_DIR}/*
fi

#
# create source distribution and get the filename.
#
python setup.py sdist || exit 1
DIST_FILE=$(ls -1rt $DIST_DIR | head -1)

#
# set up the containers that need access to source
#
echo "##########################################################"
for folder in "${need_source[@]}" ; do
    echo "Copying source to $folder..."
    cd $folder || exit 1
    rm -rf goldstone-server 2> /dev/null || /bin/true
    tar xf ${DIST_DIR}/${DIST_FILE}
    mv ${DIST_FILE%%.tar.gz} goldstone-server
done

#
# build images
#

echo "Building open source containers"
for folder in "${open_to_build[@]}" ; do
    cd $folder || exit 1
    docker build -t ${OPEN_REGISTRY_ORG}/${folder##*/}:${TAG} .
done

echo "Building private containers"
for folder in "${priv_to_build[@]}" ; do
    cd $folder || exit 1
    docker build -t ${PRIV_REGISTRY_ORG}/${folder##*/}:${TAG} .
done

#
# clean up the containers that need access to source
#
echo "##########################################################"
for folder in "${need_source[@]}" ; do
    echo "Removing source from $folder..."
    cd $folder || exit 1
    rm -rf goldstone-server/*
done
echo "##########################################################"

