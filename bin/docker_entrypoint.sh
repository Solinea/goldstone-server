#!/bin/bash
python manage.py syncdb --noinput --migrate  # Apply database migrations

# uncomment when we have gunicorn figured out and settings set accordingly
# python manage.py collectstatic --noinput     # Collect static files

if [[ ! -f /.gs_tenant_initialized ]] ; then
    fab -f installer_fabfile.py docker_install && touch /.gs_tenant_initialized
fi

echo Starting Gunicorn.
exec gunicorn --config=gunicorn-settings.py goldstone.wsgi "$@"

