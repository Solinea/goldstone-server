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

DOCKER_VM=default
TOP_DIR=${PROJECT_HOME}/goldstone-server

GS_APP_DOCKERFILE=${TOP_DIR}/Dockerfile-goldstone-app-dev
GS_TASK_DOCKERFILE=${TOP_DIR}/Dockerfile-goldstone-task-dev

REGISTRY_ORG=solinea

declare -a to_build=( $GS_APP_DOCKERFILE $GS_TASK_DOCKERFILE )

cd $TOP_DIR || exit 1 

for arg in "$@" ; do
    case $arg in
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

docker-machine start ${DOCKER_VM}
eval "$(docker-machine env ${DOCKER_VM})"


# 
# build containers
#
for dockerfile in "${to_build[@]}" ; do
    echo "##########################################################"
    echo "Building ${REGISTRY_ORG}/${dockerfile##*Dockerfile-}..."
    echo "##########################################################"
    docker build -t ${REGISTRY_ORG}/${dockerfile##*Dockerfile-} -f $dockerfile .
    echo "Done building ${REGISTRY_ORG}/${dockerfile##*Dockerfile-}."
done
