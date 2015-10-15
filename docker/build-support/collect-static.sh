#!/bin/bash

. ${ENVDIR}/bin/activate && python manage.py collectstatic --noinput
