#!/bin/bash

docker exec -it goldstoneserver_gsappdev_1 bash -i -c \
    "coverage run --branch --source='./goldstone' --omit='./goldstone/settings/*,*/test*' manage.py test $@ \
    && coverage html \
    && coverage report" 
pep8

