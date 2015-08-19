#!/bin/bash

#test if postgres service is up
PORT=5432
HOST=pgsql-server

status="DOWN"
i="0"

while [ "$status" == "DOWN" -a $i -lt 20 ] ; do
     status=`(echo > /dev/tcp/$HOST/$PORT) >/dev/null 2>&1 && echo "UP" || echo "DOWN"`
     echo -e "\t postgres connection status: $CONN_STATUS"
     sleep 5
     let i++
done

if [[ $status == "DOWN" ]] ; then
    echo "PostgreSQL not available.  Exiting."
    exit 1
fi

python manage.py syncdb --noinput --migrate  # Apply database migrations

if [[ ! -f /app/.gs_tenant_initialized ]] ; then
    fab -f installer_fabfile.py docker_install && touch /app/.gs_tenant_initialized
fi

echo Starting Gunicorn.
exec gunicorn --config=gunicorn-settings.py goldstone.wsgi "$@"

