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

. ${ENVDIR}/bin/activate 
echo ". ${ENVDIR}/bin/activate" > .bashrc

GS_DEV_ENV=${GS_DEV_ENV:-false}

#test if postgres service is up
PORT=5432
HOST=gsdb

status="DOWN"
i="0"

while [ "$status" == "DOWN" -a $i -lt 20 ] ; do
     status=`(echo > /dev/tcp/$HOST/$PORT) >/dev/null 2>&1 && echo "UP" || echo "DOWN"`
     echo -e "Database connection status: $status"
     sleep 5
     let i++
done

if [[ $status == "DOWN" ]] ; then
    echo "PostgreSQL not available.  Exiting."
    exit 1
fi

python manage.py syncdb --noinput --migrate  # Apply database migrations

# gather up the static files at container start if this is a dev environment
if [[ $GS_DEV_ENV == "true" ]] ; then
    touch addon-requirements.txt
    mkdir addons > /dev/null 2>&1 || /bin/true
    pip install --upgrade tox
    python manage.py collectstatic  --noinput
fi


declare -a addons=( opentrail leases )

for addon in "${addons[@]}" ; do
    if [ ! -f ${APPDIR}/.${addon}-installed ] ; then
        fab -f addon_fabfile.py \
             install_addon:name=${addon},install_dir=${APPDIR},settings=${DJANGO_SETTINGS_MODULE},interactive=False \
          && touch ${APPDIR}/.${addon}-installed
    fi
done

# this won't do anything if the django admin, goldstone tenant and cloud already
# exist.  otherwise it will use the env vars to create missing entities.
fab -f installer_fabfile.py docker_install

echo Starting Celery.
exec celery worker --app goldstone --queues default --beat --purge \
    --workdir ${GOLDSTONE_INSTALL_DIR} --config ${DJANGO_SETTINGS_MODULE} \
    --without-heartbeat --loglevel=${CELERY_LOGLEVEL} -s /tmp/celerybeat-schedule "$@" &

echo Starting Gunicorn.
exec gunicorn ${GUNICORN_RELOAD} \
    --env DJANGO_SETTINGS_MODULE=${DJANGO_SETTINGS_MODULE} \
    --config=${APPDIR}/config/gunicorn-settings.py goldstone.wsgi "$@"

