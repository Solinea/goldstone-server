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

DOCKER_VM=default

for arg in "$@" ; do
    case $arg in
        --docker-vm=*)
            DOCKER_VM="${arg#*=}"
            shift
        ;;
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

if [[ ${DOCKER_VM} != "false" ]] ; then
    docker-machine start ${DOCKER_VM}
    eval "$(docker-machine env ${DOCKER_VM})"
fi


docker ps -a | awk '{print $1}' | tail +2 | while read c ; do
    docker rm -f $c
done
docker images | tail +2 | awk '{print $3}' | while read i ; do
    docker rmi -f $i
done
