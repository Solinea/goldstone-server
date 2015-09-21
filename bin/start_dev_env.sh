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
# to work with VirtualBox 4.3.30 or greater, and Docker Toolbox.
#
# It assumes that you are running in a virtualenv, and that you have cloned 
# the goldstone-server Github repo into the PROJECT_HOME associated with 
# the virtual environment.
#

export DJANGO_SETTINGS_MODULE=goldstone.settings.docker_dev
STACK_VM="RDO-kilo"
DOCKER_VM="default"

TOP_DIR=${GS_PROJ_TOP_DIR:-${PROJECT_HOME}/goldstone-server}
DIST_DIR=${TOP_DIR}/dist

GS_APP_DIR=${TOP_DIR}/docker/Dockerfiles/goldstone-app
GS_TASK_DIR=${TOP_DIR}/docker/Dockerfiles/goldstone-task
GS_WEB_DIR=${TOP_DIR}/docker/Dockerfiles/goldstone-web

declare -a need_source=( $GS_APP_DIR $GS_TASK_DIR )

# trap ctrl-c and call ctrl_c()
trap stop_dev_env INT

function stop_dev_env() {
    #
    # clean up the containers that need access to source
    #
    for folder in "${need_source[@]}" ; do
        echo "Removing source from $folder..."
        cd $folder || exit 1
        rm -rf goldstone-server/*
    done

    echo "Removing static files from $GS_WEB_DIR..."
    cd $GS_WEB_DIR
    rm -rf static/*

    echo "Shutting down Goldstone dev env"
    $PROJECT_HOME/goldstone-server/bin/stop_dev_env.sh
    exit 0
}


for arg in "$@" ; do
    case $arg in
        --docker-vm=*)
            DOCKER_VM="${arg#*=}"
            shift
        ;;
        --stack-vm=*)
            STACK_VM="${arg#*=}"
            shift
        ;;
        --help)
            echo "Usage: $0 [--docker-vm=name] [--stack-vm=name]"
            exit 0
        ;;
        *)
            # unknown option
            echo "Usage: $0 [--docker-vm=name] [--stack-vm=name]"
            exit 1
        ;;
    esac
done

echo ""
echo "The first time this is run (or after removing docker images), it will"
echo "take several minutes to build the containers.  Subsequent runs should"
echo "be faster."
echo ""

cd $TOP_DIR || exit 1

VboxManage list runningvms | grep \"${STACK_VM}\" ; RC=$?
if [[ $RC != 0 ]] ; then
    # No matches, start the VM
    VBoxManage startvm ${STACK_VM} --type headless
else
    echo "${STACK_VM} is already running"
fi

docker-machine start ${DOCKER_VM}
eval "$(docker-machine env ${DOCKER_VM})"

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
# this is necessary to build the containers successfully.
# changes to top level files like requirements.txt, installer_fabfiles.py,
# etc. will require new container builds.
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

docker-compose up


