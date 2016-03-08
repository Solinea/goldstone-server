#!/bin/bash

cd ${PROJECT_HOME}/goldstone-server
. docker/config/goldstone-dev.env
cat docker/config/goldstone-dev.env | sed -e '/^[#]/d' -e '/^$/d' | cut -f1 -d'=' | while read v 
do  
    export $v
done
export ENVDIR=${HOME}/.virtualenvs/goldstone-server
export APPDIR=${ENVDIR}
export GS_DB_HOST=127.0.0.1
export DJANGO_SETTINGS_MODULE=goldstone.settings.local_dev
export GS_LOCAL_DEV=true
export GS_DEV_DJANGO_PORT=8001
export GS_START_RUNSERVER=false
. docker/goldstone-base/docker-entrypoint.sh

