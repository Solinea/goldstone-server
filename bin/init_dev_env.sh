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
WIPE=false

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
        --wipe)
            WIPE=true
        ;;
        --help)
            echo "Usage: $0 [--docker-vm=name] [--stack-vm=name] [--no-clean]"
            exit 0
        ;;
        *)
            # unknown option
            echo "Usage: $0 [--docker-vm=name] [--stack-vm=name] [--no-clean]"
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

cd $PROJECT_HOME/goldstone-server

if [[ $WIPE == 'true' ]] ; then
    echo "Cleaning out old docker images and containers"
    ./bin/wipe_docker.sh 
fi 

fab -f installer_fabfile.py -p solinea -H 172.24.4.100 configure_stack:goldstone_addr='172.24.4.1',restart_services='yes',accept='True'

docker-machine stop ${DOCKER_VM}
