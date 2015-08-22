#!/bin/bash
python manage.py syncdb --noinput --migrate  # Apply database migrations

if [[ ! -f /app/.gs_tenant_initialized ]] ; then
    fab -f installer_fabfile.py docker_install && touch /app/.gs_tenant_initialized
fi

echo Starting Gunicorn.
exec gunicorn --config=gunicorn-settings.py goldstone.wsgi "$@"

