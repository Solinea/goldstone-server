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

# high level process:
#    - pull latest addon sdists from Jenkins
#    - determine version tag for this build
#    - build images that don't depend on source
#    - build an app-server container with the open source goldstone code
#    - collect the static files for the open source static files into a data only container
#    - build an app-server container with addons
#    - collect the static files for the enterprise static files into a data only container

DOCKER_VM=default
TOP_DIR=${GS_PROJ_TOP_DIR:-${PROJECT_HOME}/goldstone-server}
DIST_DIR=${TOP_DIR}/dist
GIT_BRANCH=$(git symbolic-ref --short HEAD)
GIT_COMMIT=$(git rev-parse --short HEAD)
TAGGED=true
TAG="latest"

GS_APP_DIR=${TOP_DIR}/docker/Dockerfiles/goldstone-app
GS_WEB_DIR=${TOP_DIR}/docker/Dockerfiles/goldstone-web
GS_SEARCH_DIR=${TOP_DIR}/docker/Dockerfiles/goldstone-search
GS_LOG_DIR=${TOP_DIR}/docker/Dockerfiles/goldstone-log
GS_DB_DIR=${TOP_DIR}/docker/Dockerfiles/goldstone-db
GS_DB_DVC_DIR=${TOP_DIR}/docker/Dockerfiles/goldstone-db-dvc
GS_TASK_Q_DIR=${TOP_DIR}/docker/Dockerfiles/goldstone-task-queue
GS_APP_E_DIR=${TOP_DIR}/docker/Dockerfiles/goldstone-app-e

REGISTRY_ORG=solinea

declare -a need_source=( $GS_APP_DIR $GS_APP_E_DIR )

declare -a to_build=( $GS_SEARCH_DIR $GS_LOG_DIR $GS_DB_DIR \
              $GS_DB_DVC_DIR $GS_APP_DIR $GS_WEB_DIR $GS_WEB_DVC_DIR \
              $GS_TASK_Q_DIR $GS_APP_E_DIR $GS_WEB_E_DIR \
              $GS_WEB_E_DVC_DIR )

cd $TOP_DIR || exit 1 

for arg in "$@" ; do
    case $arg in
        --docker-vm=*)
            DOCKER_VM="${arg#*=}"
            shift
        ;;
        --untagged)
            TAGGED=false
        ;;
        --tag=*)
            TAG="${arg#*=}"
            shift
        ;;
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
    cp -R ${TOP_DIR}/external goldstone-server
done
echo "##########################################################"

# 
# build images
#

if [[ $TAGGED == 'true' ]] ; then
    echo "##########################################################"
    echo "Building tagged containers"
    echo "##########################################################"
    for folder in "${to_build[@]}" ; do
        cd $folder || exit 1
        echo "##########################################################"
        echo "Building ${REGISTRY_ORG}/${folder##*/}..."
        echo "##########################################################"
        if [[ ${TAG} == "" ]] ; then
            if [[ ${GIT_BRANCH} == "master" ]] ; then
                NEXT_TAG=`docker-tag-naming bump ${REGISTRY_ORG}/${folder##*/} release --commit-id $GIT_COMMIT`
            else
                NEXT_TAG=`docker-tag-naming bump ${REGISTRY_ORG}/${folder##*/} develop --commit-id $GIT_COMMIT`
            fi
        else
            NEXT_TAG=${TAG}
        fi
        docker build -t ${REGISTRY_ORG}/${folder##*/}:${NEXT_TAG} .
        echo "Done building ${REGISTRY_ORG}/${folder##*/}:${NEXT_TAG}."
    done

else
    echo "##########################################################"
    echo "Building development containers"
    echo "##########################################################"
    cd $TOP_DIR || exit 1
    docker-compose -f docker-compose-dev.yml build
fi

#
# clean up the containers that need access to source
#
# echo "##########################################################"
# for folder in "${need_source[@]}" ; do
#     echo "Removing source from $folder..."
#     cd $folder || exit 1
#     rm -rf goldstone-server/*
# done
# echo "##########################################################"
# 
# echo "##########################################################"
# echo "Removing static files from $GS_WEB_DIR..."
# cd $GS_WEB_DIR
# rm -rf static/*
# echo "##########################################################"
