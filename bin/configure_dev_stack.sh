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
DOCKER_VM="default"
STACK_VM="RDO-kilo"
STARTUP_WAIT=60
APP_CONTAINER=goldstoneserver_gsappdev_1

TOP_DIR=${GS_PROJ_TOP_DIR:-~/devel/goldstone-server}
CONFIG_DIR=/home/app/docker/config/goldstone-app

function usage() {
    echo "Usage: $0 [--docker-vm=name] [--stack-vm=name] [--app-container=name]"
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
        --app-container=*)
            APP_CONTAINER="${arg#*=}"
            shift
        ;;
        --help)
            usage
            exit 0
        ;;
        *)
            # unknown option
            usage
            exit 1
        ;;
    esac
done

cd $TOP_DIR || exit 1

docker-machine start ${DOCKER_VM}
eval "$(docker-machine env ${DOCKER_VM})"

if [[ $(docker ps -f name=goldstoneserver_gsappdev_1 --format "{{.ID}}" | sed -n '$=') != "1" ]] ; then
    echo "Container ${APP_CONTAINER} must be running.  Did you run start_dev_env.sh first?"
    exit 1
fi

VboxManage list runningvms | grep \"${STACK_VM}\" ; RC=$?
if [[ $RC != 0 ]] ; then
    echo "VM ${STACK_VM} must be running.  Did you run start_dev_env.sh first?"
    exit 1
else
    echo "Waiting for services to start"
    sleep ${STARTUP_WAIT}
fi

echo "CONFIG_DIR = ${CONFIG_DIR}"
FAB_CMD="fab -f configure_stack.py -p solinea -H 172.24.4.100 configure_stack:goldstone_addr='172.24.4.1',restart_services='yes',accept='True',config_loc='${CONFIG_DIR}'"
docker exec -t ${APP_CONTAINER} bash -i -c "$FAB_CMD" || { echo "Failed to configure openstack vm"; exit 1; }

