#!/bin/bash

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

#
# this won't do anything if the django admin, goldstone tenant and cloud already
# exist.  otherwise it will use the env vars to create missing entities.
#
fab -f installer_fabfile.py docker_install

echo Starting Gunicorn.
exec gunicorn --config=gunicorn-settings.py goldstone.wsgi "$@"

