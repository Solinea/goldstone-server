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

DOCKER_VM=${DOCKER_VM:-default}
TOP_DIR=${GS_PROJ_TOP_DIR:-${PROJECT_HOME}/goldstone-server}


GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD| sed -e 's/-/./g')
TAG=$(${TOP_DIR}/bin/semver.sh full)

function usage {
    echo "Usage: $0 [--tag=tagname] [--docker-vm=vmname]"
}

for arg in "$@" ; do
    case $arg in
        --docker-vm=*)
            DOCKER_VM="${arg#*=}"
            shift
        ;;
        --tag=*)
            TAG="${arg#*=}"
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

if [[ ${DOCKER_VM} != "none" ]] ; then
    docker-machine start ${DOCKER_VM}
    eval "$(docker-machine env ${DOCKER_VM})"
fi

# 
# push images
#

OPEN_REGISTRY_ORG=solinea
PRIV_REGISTRY_ORG=gs-docker-ent.bintray.io

declare -a open_to_push=( goldstone-base goldstone-search goldstone-log goldstone-db \
              goldstone-app goldstone-web goldstone-task-queue goldstone-task )

declare -a priv_to_push=( goldstone-app-e goldstone-task-e )


for name in "${open_to_push[@]}" ; do
    docker push ${OPEN_REGISTRY_ORG}/${name}:${TAG} &
done

for name in "${priv_to_push[@]}" ; do
    docker push ${PRIV_REGISTRY_ORG}/${name}:${TAG} &
done

wait

