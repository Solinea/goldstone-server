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
python manage.py collectstatic --noinput

#
# this won't do anything if the django admin, goldstone tenant and cloud already
# exist.  otherwise it will use the env vars to create missing entities.
#
fab -f installer_fabfile.py docker_install

echo Starting Gunicorn.
exec gunicorn --reload --env DJANGO_SETTINGS_MODULE=${DJANGO_SETTINGS_MODULE} --config=gunicorn-settings.py goldstone.wsgi "$@"

