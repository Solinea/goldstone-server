#!/bin/bash

#
# load up the standard goldstone environment vars
#

TOP_DIR=${GS_PROJ_TOP_DIR:-${PROJECT_HOME}/goldstone-server}
cd $TOP_DIR 


cat docker/config/goldstone-dev.env | sed -e '/^[#]/d' -e '/^$/d' > /var/tmp/gsenv
while read v; do 
    export $v
done < /var/tmp/gsenv
rm /var/tmp/gsenv


export ENVDIR=${HOME}/.virtualenvs/goldstone-server
export APPDIR=${ENVDIR}
export DJANGO_SETTINGS_MODULE=goldstone.settings.local_dev
export GOLDSTONE_REDIS_HOST=127.0.0.1
export GS_LOCAL_DEV=true
python manage.py migrate --noinput
python manage.py loaddata $(find goldstone -regex '.*/fixtures/.*' | xargs)
python manage.py collectstatic  --noinput
python post_install.py
exec celery worker --app goldstone --queues default --beat --purge \
            --workdir ${TOP_DIR} --config ${DJANGO_SETTINGS_MODULE} \
            --without-heartbeat --loglevel=${CELERY_LOGLEVEL} -s /var/tmp/celerybeat-schedule

