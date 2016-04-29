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

export DJANGO_SETTINGS_MODULE=${DJANGO_SETTINGS_MODULE:-goldstone.settings.docker_dev}
STACK_VM=${STACK_VM:-"RDO-kilo"}
DOCKER_VM=${DOCKER_VM:-default}
APP_LOCATION=${GS_APP_LOCATION:-container}
APP_EDITION=${GS_APP_EDITION:-oss}
TOP_DIR=${GS_PROJ_TOP_DIR:-${PROJECT_HOME}/goldstone-server}
GS_APP_DIR=${TOP_DIR}/docker/goldstone-app

# trap ctrl-c and call ctrl_c()
trap stop_dev_env INT

function stop_dev_env() {
    echo "Shutting down Goldstone dev env"
    kill -INT $COMPOSE_PID
    exit 0
}

function usage {
    echo "Usage: $0 [--app-edition=oss|gse] [--app-location=container|local] [--docker-vm=name|none] [--stack-vm=name|none]"
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

COMPOSE_FILE=compose-${APP_LOCATION}app-${APP_EDITION}.yml

echo 
echo "Running with the following settings:"

if [[ ${APP_EDITION} == "gse" ]] ; then
    echo "    APP_EDITION = $(tput setaf 190)${APP_EDITION}$(tput sgr 0)"
else 
    echo "    APP_EDITION = $(tput setaf 153)${APP_EDITION}$(tput sgr 0)"
fi
if [[ ${APP_LOCATION} == "local" ]] ; then
    echo "    APP_LOCATION = $(tput setaf 5)${APP_LOCATION}$(tput sgr 0)"
else 
    echo "    APP_LOCATION = $(tput setaf 6)${APP_LOCATION}$(tput sgr 0)"
fi
echo "    COMPOSE_FILE = ${COMPOSE_FILE}"
echo "    DOCKER_VM = ${DOCKER_VM}"
echo "    STACK_VM = ${STACK_VM}"
echo 

cd $TOP_DIR || exit 1

if [[ $STACK_VM != "none" ]] ; then
    VBoxManage list runningvms | grep \"${STACK_VM}\" ; RC=$?
    if [[ $RC != 0 ]] ; then
        # No matches, start the VM
        VBoxManage startvm ${STACK_VM} --type headless
    else
        echo "${STACK_VM} is already running"
    fi
fi

if [[ $DOCKER_VM != "none" ]] ; then
    VBoxManage list runningvms | grep \"${DOCKER_VM}\" ; RC=$?
    if [[ $RC != 0 ]] ; then
        # No matches, start the VM
        docker-machine start ${DOCKER_VM}
    else
        echo "${DOCKER_VM} is already running"
    fi

    sleep 10
    eval "$(docker-machine env ${DOCKER_VM})"
fi

# these need to exist in order to build
mkdir docker/goldstone-app/goldstone-server 2> /dev/null
mkdir docker/goldstone-app-e/goldstone-server 2> /dev/null
mkdir docker/goldstone-task/goldstone-server 2> /dev/null
mkdir docker/goldstone-task-e/goldstone-server 2> /dev/null

docker-compose -f ${COMPOSE_FILE} up &
COMPOSE_PID=$!

if [[ ${APP_LOCATION} == "local" ]] ; then
    
    # set up environment for running app server locally
    cat docker/config/goldstone-dev.env | sed -e '/^[#]/d' -e '/^$/d' > /var/tmp/gsenv
    while read v; do
       export $v
    done < /var/tmp/gsenv
    rm /var/tmp/gsenv

    export DJANGO_SETTINGS_MODULE=goldstone.settings.local_dev
    export ENVDIR=${HOME}/.virtualenvs/goldstone-server
    export APPDIR=${ENVDIR}
    DB_PORT=5432

    if [[ $DOCKER_VM != "none" ]] ; then
        DB_HOST=localhost
    else
        # wait for postgres to come up
        status="DOWN"
        while [ "$status" == "DOWN" ] ; do
            docker ps | grep _gsdb_ > /dev/null 2>&1 ; RC=$?
            if [[ $RC -eq 0 ]] ; then
                status=UP
            else
                status=DOWN
            fi
            echo -e "Database container status: $status"
            sleep 5
        done

        DB_HOST=`docker port $(docker ps | grep _gsdb_ | awk '{print $1}') 5432 | cut -f1 -d:`
        export GS_DOCKER_HOST=$DB_HOST
        echo "DB_HOST = $DB_HOST"

    fi
    
    # wait for postgres to come up
    status="DOWN"

    while [ "$status" == "DOWN" ] ; do
       status=`(echo > /dev/tcp/$DB_HOST/$DB_PORT) >/dev/null 2>&1 && echo "UP" || echo "DOWN"`
       echo -e "Database connection status: $status"
       sleep 5
    done

    # allow a little time for the initial DB setup to happen
    sleep 15

    # then set up the database
    python manage.py migrate --noinput  # Apply database migrations
    python manage.py loaddata $(find goldstone -regex '.*/fixtures/.*' | xargs)
    python manage.py collectstatic  --noinput
    python post_install.py
    
fi

wait # for the compose process to never end, but we can still trap ctrl-C

