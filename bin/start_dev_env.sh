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

export DJANGO_SETTINGS_MODULE=goldstone.settings.docker_dev
STACK_VM="RDO-kilo"
DOCKER_VM="default"
APP_LOCATION="container"
APP_EDITION="oss"

TOP_DIR=${GS_PROJ_TOP_DIR:-${PROJECT_HOME}/goldstone-server}

GS_APP_DIR=${TOP_DIR}/docker/goldstone-app

# trap ctrl-c and call ctrl_c()
trap stop_dev_env INT

function stop_dev_env() {
    echo "Shutting down Goldstone dev env"
    ${TOP_DIR}/bin/stop_dev_env.sh
    exit 0
}

function usage {
    echo "Usage: $0 [--app-edition=oss|gse] [--app-location=container|local] [--docker-vm=name] [--stack-vm=name]"
    echo "    --app-edition defaults to 'oss'"
    echo "    --app-location defaults to 'container'"
    echo "    --docker-vm defaults to 'default'"
    echo "    --stack-vm defaults to 'RDO-kilo'"
    exit 255
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
        --app-location=*)
            APP_LOCATION="${arg#*=}"
            shift
        ;;
        --app-edition=*)
            APP_EDITION="${arg#*=}"
            shift
        ;;
        --help)
            usage
        ;;
        *)
            # unknown option
            usage
        ;;
    esac
done

if [[ ${APP_LOCATION} != "local" && ${APP_LOCATION} != "container" ]] ; then
    usage
fi

if [[ ${APP_EDITION} != "oss" && ${APP_EDITION} != "gse" ]] ; then
    usage
fi

if [[ ${APP_LOCATION} == "local" ]] ; then
    export DJANGO_SETTINGS_MODULE=goldstone.settings.local_dev
else
    export DJANGO_SETTINGS_MODULE=goldstone.settings.docker_dev
fi

COMPOSE_FILE=compose-${APP_LOCATION}app-${APP_EDITION}.yml

echo 
echo "Running with the following settings:"
echo "    APP_EDITION = ${APP_EDITION}"
echo "    APP_LOCATION = ${APP_LOCATION}"
echo "    COMPOSE_FILE = ${COMPOSE_FILE}"
echo "    DOCKER_VM = ${DOCKER_VM}"
echo "    STACK_VM = ${STACK_VM}"
echo 

cd $TOP_DIR || exit 1

VBoxManage list runningvms | grep \"${STACK_VM}\" ; RC=$?
if [[ $RC != 0 ]] ; then
    # No matches, start the VM
    VBoxManage startvm ${STACK_VM} --type headless
else
    echo "${STACK_VM} is already running"
fi

VBoxManage list runningvms | grep \"${DOCKER_VM}\" ; RC=$?
if [[ $RC != 0 ]] ; then
    # No matches, start the VM
    docker-machine start ${DOCKER_VM}
else
    echo "${DOCKER_VM} is already running"
fi

sleep 10
eval "$(docker-machine env ${DOCKER_VM})"

# this dir must exist for the app container to start
if [[ ${APP_LOCATION} == "local" && ! -d docker/goldstone-app/goldstone-server ]] ; then
    mkdir docker/goldstone-app/goldstone-server
fi

docker-compose -f ${COMPOSE_FILE} up

