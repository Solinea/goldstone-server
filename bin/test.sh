#!/bin/bash

docker ps | grep goldstoneserver_gsapp_1 > /dev/null 2>&1
RC=$?

if [[ $RC != 0 ]] ; then
    # try to run locally
    coverage run --branch --source='./goldstone' --omit='./goldstone/settings/*,*/test*' manage.py test $@ \
        && coverage html \
        && coverage report \
        && pep8 
else
    # try to run in the docker container
    docker exec -it goldstoneserver_gsapp_1 bash -i -c \
        "coverage run --branch --source='./goldstone' --omit='./goldstone/settings/*,*/test*' manage.py test $@ \
        && coverage html \
        && coverage report \
        && pep8" 
fi

