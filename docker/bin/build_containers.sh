#!/bin/bash

# builds the software dist of the django project, and extracts it to the
# goldstone-server docker container context for build. Once copied, it 
# performs a build of the docker container, and pushes it to the repo.  

TOP_DIR=${PROJECT_HOME}/goldstone-server
DIST_DIR=${TOP_DIR}/dist
GS_DOCKER_DIR=${TOP_DIR}/docker/Dockerfiles/goldstone-django
NGINX_DOCKER_DIR=${TOP_DIR}/docker/Dockerfiles/goldstone-nginx
ES_DOCKER_DIR=${TOP_DIR}/docker/Dockerfiles/goldstone-elasticsearch
LOGSTASH_DOCKER_DIR=${TOP_DIR}/docker/Dockerfiles/goldstone-logstash
POSTGRES_DOCKER_DIR=${TOP_DIR}/docker/Dockerfiles/goldstone-postgres
CELERY_DOCKER_DIR=${TOP_DIR}/docker/Dockerfiles/goldstone-celery

cd $TOP_DIR || exit 1 

if [[ -d $DIST_DIR ]] ; then
    rm -rf ${DIST_DIR}/*
fi

python setup.py sdist || exit 1
DIST_FILE=$(ls -1rt $DIST_DIR | head -1)
echo "Unpacking $DIST_FILE to the Django container context"

cd $GS_DOCKER_DIR || exit 1
tar xf ${DIST_DIR}/${DIST_FILE}
rm -rf goldstone-server
mv ${DIST_FILE%%.tar.gz} goldstone-server

cd $NGINX_DOCKER_DIR || exit 1
tar xf ${DIST_DIR}/${DIST_FILE}
rm -rf goldstone-server
mv ${DIST_FILE%%.tar.gz} goldstone-server
docker build -t solinea/goldstone-nginx .

cd $GS_DOCKER_DIR || exit 1
docker build -t solinea/goldstone .

cd $ES_DOCKER_DIR || exit 1
docker build -t solinea/goldstone-elasticsearch .

cd $LOGSTASH_DOCKER_DIR || exit 1
docker build -t solinea/goldstone-logstash .

cd $POSTGRES_DOCKER_DIR || exit 1
docker build -t solinea/goldstone-postgres .

# cd $CELERY_DOCKER_DIR || exit 1
# docker build -t solinea/goldstone-celery .
