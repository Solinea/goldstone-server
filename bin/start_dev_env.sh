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

# trap ctrl-c and call ctrl_c()
trap stop_dev_env INT

function stop_dev_env() {
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

VboxManage list runningvms | grep \"${STACK_VM}\" ; RC=$?
if [[ $RC != 0 ]] ; then
    # No matches, start the VM
    VBoxManage startvm ${STACK_VM} --type headless
else
    echo "${STACK_VM} is already running"
fi

docker-machine start ${DOCKER_VM}
eval "$(docker-machine env ${DOCKER_VM})"

(cd $PROJECT_HOME/goldstone-server;docker-compose up)
