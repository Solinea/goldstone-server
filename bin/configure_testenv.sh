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
APP_CONTAINER=goldstoneserver_gsappdev_1

TOP_DIR=${GS_PROJ_TOP_DIR:-~/devel/goldstone-server}

function usage() {
    echo "Usage: $0 [--docker-vm=name] [--app-container=name]"
}


for arg in "$@" ; do
    case $arg in
        --docker-vm=*)
            DOCKER_VM="${arg#*=}"
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

docker exec -t ${APP_CONTAINER} bash -i -c "mkdir /tmp/pip"
docker exec -t ${APP_CONTAINER} bash -i -c "pip install --download /tmp/pip -r requirements.txt"
docker exec -t ${APP_CONTAINER} bash -i -c "pip install --download /tmp/pip -r test-requirements.txt"
docker exec -t ${APP_CONTAINER} bash -i -c "pip install --no-index --find-links=file://tmp/pip -r requirements.txt"
docker exec -t ${APP_CONTAINER} bash -i -c "pip install --no-index --find-links=file://tmp/pip -r test-requirements.txt"

docker commit ${APP_CONTAINER}
