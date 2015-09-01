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

#
# This script starts the boot2docker and OpenStack VirtualBox VMs, then
# brings up the docker containers that support Goldstone.  It is known
# to work with VirtualBox 4.3.30 or greater, and boot2docker v1.6.2.
#
# It assumes that you are running in a virtualenv, and that you have cloned
# the goldstone-docker and goldstone-server Github repos into the
# PROJECT_HOME associated with the virtual environment.
#
# Caution should be taken to ensure that the OpenStack VM is not in the
# process of shutting down when this script is executed, otherwise you
# may end up with a successful run, but the VM will be down.  If you use
# the sibling stop_dev_env.sh script to shut down, the condition will be
# rare since the script waits until the VM is powered off before exiting.
#

# builds the software dist of the django project, and extracts it to the
# goldstone-server docker container context for build. Once copied, it 
# performs a build of the docker container, and pushes it to the repo.  

TOP_DIR=${PROJECT_HOME}/goldstone-server
DIST_DIR=${TOP_DIR}/dist

GS_APP_DIR=${TOP_DIR}/docker/Dockerfiles/goldstone-app
GS_WEB_DIR=${TOP_DIR}/docker/Dockerfiles/goldstone-web
GS_SEARCH_DIR=${TOP_DIR}/docker/Dockerfiles/goldstone-search
GS_LOG_DIR=${TOP_DIR}/docker/Dockerfiles/goldstone-log
GS_DB_DIR=${TOP_DIR}/docker/Dockerfiles/goldstone-db
GS_DB_DVC_DIR=${TOP_DIR}/docker/Dockerfiles/goldstone-db-dvc
# GS_TASK_DIR=${TOP_DIR}/docker/Dockerfiles/goldstone-task
# GS_TASK_Q_DIR=${TOP_DIR}/docker/Dockerfiles/goldstone-task-queue

REGISTRY_ORG=solinea

# declare -a need_source=( $GS_APP_DIR )
declare -a need_source=( )

# declare -a to_build=( $GS_APP_DIR $GS_WEB_DIR $GS_SEARCH_DIR \
#              $GS_LOG_DIR $GS_DB_DIR $GS_DB_DVC_DIR )
declare -a to_build=( $GS_SEARCH_DIR $GS_LOG_DIR $GS_DB_DIR \
              $GS_DB_DVC_DIR )

cd $TOP_DIR || exit 1 

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
for folder in "${to_build[@]}" ; do
    cd $folder || exit 1
    echo "##########################################################"
    echo "Building ${REGISTRY_ORG}/${folder##*/}..."
    echo "##########################################################"
    docker build -t ${REGISTRY_ORG}/${folder##*/} .
    echo "Done building ${REGISTRY_ORG}/${folder##*/}."
done

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
