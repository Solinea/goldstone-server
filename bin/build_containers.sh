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
GIT_BRANCH=$(git symbolic-ref --short HEAD)
GIT_COMMIT=$(git rev-parse --short HEAD)
TAGGED=false

GS_APP_DIR=${TOP_DIR}/docker/Dockerfiles/goldstone-app
GS_WEB_DIR=${TOP_DIR}/docker/Dockerfiles/goldstone-web
GS_SEARCH_DIR=${TOP_DIR}/docker/Dockerfiles/goldstone-search
GS_LOG_DIR=${TOP_DIR}/docker/Dockerfiles/goldstone-log
GS_DB_DIR=${TOP_DIR}/docker/Dockerfiles/goldstone-db
GS_DB_DVC_DIR=${TOP_DIR}/docker/Dockerfiles/goldstone-db-dvc
GS_TASK_DIR=${TOP_DIR}/docker/Dockerfiles/goldstone-task
GS_TASK_Q_DIR=${TOP_DIR}/docker/Dockerfiles/goldstone-task-queue

REGISTRY_ORG=solinea

declare -a need_source=( $GS_APP_DIR )

declare -a to_build=( $GS_SEARCH_DIR $GS_LOG_DIR $GS_DB_DIR \
              $GS_DB_DVC_DIR $GS_APP_DIR $GS_WEB_DIR \
              $GS_TASK_Q_DIR $GS_TASK_DIR )

cd $TOP_DIR || exit 1 

for arg in "$@" ; do
    case $arg in
        --docker-vm=*)
            DOCKER_VM="${arg#*=}"
            shift
        ;;
        --tagged)
            TAGGED=true
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


echo "##########################################################"
echo "Copying static files to to $GS_WEB_DIR..."
rm -rf $GS_WEB_DIR/static 2> /dev/null || /bin/true
cd $TOP_DIR
python manage.py collectstatic --noinput --settings=goldstone.settings.docker
echo "##########################################################"

# 
# build containers
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
        NEXT_TAG=`docker-tag-naming bump ${REGISTRY_ORG}/${folder##*/} $GIT_BRANCH --commit-id $GIT_COMMIT`
        docker build -t ${REGISTRY_ORG}/${folder##*/}:${NEXT_TAG} .
        echo "Done building ${REGISTRY_ORG}/${folder##*/}:${NEXT_TAG}."
    done

else
    echo "##########################################################"
    echo "Building development containers"
    echo "##########################################################"
    cd $TOP_DIR || exit 1
    docker-compose build
fi

#
# clean up the containers that need access to source
#
echo "##########################################################"
for folder in "${need_source[@]}" ; do
    echo "Removing source from $folder..."
    cd $folder || exit 1
    rm -rf goldstone-server
done
echo "##########################################################"

echo "##########################################################"
echo "Removing static files from $GS_WEB_DIR..."
cd $GS_WEB_DIR
rm -rf static
echo "##########################################################"
