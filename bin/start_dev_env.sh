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

TOP_DIR=${GS_PROJ_TOP_DIR:-${PROJECT_HOME}/goldstone-server}

GS_APP_DIR=${TOP_DIR}/docker/goldstone-app

# trap ctrl-c and call ctrl_c()
trap stop_dev_env INT

function stop_dev_env() {
    echo "Shutting down Goldstone dev env"
    ${TOP_DIR}/bin/stop_dev_env.sh
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

VboxManage list runningvms | grep \"${DOCKER_VM}\" ; RC=$?
if [[ $RC != 0 ]] ; then
    # No matches, start the VM
    docker-machine start ${DOCKER_VM}
else
    echo "${DOCKER_VM} is already running"
fi

sleep 5
eval "$(docker-machine env ${DOCKER_VM})"

# this dir must exist for the app container to start
if [ ! -d docker/goldstone-app/goldstone-server ] ; then
    mkdir docker/goldstone-app/goldstone-server

docker-compose -f docker-compose-dev.yml up

