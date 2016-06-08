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

if [[ $GS_LOCAL_DEV != "true" ]] ; then
    . ${ENVDIR}/bin/activate 
    echo ". ${ENVDIR}/bin/activate" > .bashrc
fi

GS_DEV_ENV=${GS_DEV_ENV:-false}
GS_INSTALL_TESTLIBS=${GS_INSTALL_TESTLIBS:-false}
GS_DEV_DJANGO_PORT=${GS_DEV_DJANGO_PORT:-8000}
GS_DB_HOST=${GS_DB_HOST:-gsdb}
GS_START_RUNSERVER=${GS_START_RUNSERVER:-${GS_DEV_ENV}}
GS_START_GUNICORN=${GS_START_GUNICORN:-true}

export PYTHONPATH=$PYTHONPATH:`pwd`

#test if postgres service is up
PORT=5432
HOST=${GS_DB_HOST}

status="DOWN"
i="0"

while [ "$status" == "DOWN" -a $i -lt 120 ] ; do
     status=`(echo > /dev/tcp/$HOST/$PORT) >/dev/null 2>&1 && echo "UP" || echo "DOWN"`
     echo -e "Database connection status: $status"
     sleep 5
     let i++
done

if [[ $status == "DOWN" ]] ; then
    echo "PostgreSQL not available.  Exiting."
    exit 1
fi

if [[ $GS_INSTALL_TESTLIBS == 'true' ]] ; then
    if [ ! -f /var/tmp/goldstone-testlibs ] ; then
        pip install -r ${APPDIR}/config/test-requirements.txt
        touch /var/tmp/goldstone-testlibs
    fi
fi

if [ ! -f /var/tmp/goldstone-migrated ] ; then
    python manage.py migrate --noinput  # Apply database migrations
    touch /var/tmp/goldstone-migrated
fi

if [ ! -f /var/tmp/goldstone-fixtured ] ; then
    python manage.py loaddata $(find goldstone -regex '.*/fixtures/.*' | xargs)
    touch /var/tmp/goldstone-fixtured
fi

# gather up the static files at container start if this is a dev environment
if [[ $GS_DEV_ENV != "false" ]] ; then
    python manage.py collectstatic  --noinput
fi

# only do this one time
if [ ! -f /var/tmp/goldstone-postinstall ] ; then
    python post_install.py
    touch /var/tmp/goldstone-postinstall
fi

if [[ $GS_START_RUNSERVER == 'true' && $GS_DEV_ENV == 'true' ]] ; then
    echo "Starting Django server"
    exec python manage.py runserver --settings=${DJANGO_SETTINGS_MODULE} 0.0.0.0:${GS_DEV_DJANGO_PORT} "$@"
fi


if [[ $GS_START_GUNICORN == 'true' && $GS_DEV_ENV == 'false' ]] ; then
    echo Starting Gunicorn.
    exec gunicorn ${GUNICORN_RELOAD} \
        --env DJANGO_SETTINGS_MODULE=${DJANGO_SETTINGS_MODULE} \
        --config=${APPDIR}/config/gunicorn-settings.py goldstone.wsgi "$@"
fi
