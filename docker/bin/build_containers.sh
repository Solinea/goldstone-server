#!/bin/bash

# builds the software dist of the django project, and extracts it to the
# goldstone-server docker container context for build. Once copied, it 
# performs a build of the docker container, and pushes it to the repo.  

TOP_DIR=${PROJECT_HOME}/goldstone-server
DIST_DIR=${TOP_DIR}/dist

GS_APP_DIR=${TOP_DIR}/docker/Dockerfiles/goldstone-app
GS_WEB_DIR=${TOP_DIR}/docker/Dockerfiles/goldstone-web
GS_SEARCH_DIR=${TOP_DIR}/docker/Dockerfiles/goldstone-search
GS_LOG_DIR=${TOP_DIR}/docker/Dockerfiles/goldstone-log
GS_DB_DIR=${TOP_DIR}/docker/Dockerfiles/goldstone-db
GS_DB_DVC_DIR=${TOP_DIR}/docker/Dockerfiles/goldstone-db-dvc
# GS_TASK_DIR=${TOP_DIR}/docker/Dockerfiles/goldstone-task
# GS_TASK_Q_DIR=${TOP_DIR}/docker/Dockerfiles/goldstone-task-queue

REGISTRY_ORG=solinea

# declare -a need_source=( $GS_APP_DIR )
declare -a need_source=( )

# declare -a to_build=( $GS_APP_DIR $GS_WEB_DIR $GS_SEARCH_DIR \
#              $GS_LOG_DIR $GS_DB_DIR $GS_DB_DVC_DIR )
declare -a to_build=( $GS_SEARCH_DIR $GS_LOG_DIR $GS_DB_DIR \
              $GS_DB_DVC_DIR )

cd $TOP_DIR || exit 1 

if [[ -d $DIST_DIR ]] ; then
    rm -rf ${DIST_DIR}/*
fi

#
# create source distribution and get the filename.
#
python setup.py sdist || exit 1
DIST_FILE=$(ls -1rt $DIST_DIR | head -1)

#
# set up the containers that need access to source
#
echo "##########################################################"
for folder in "${need_source[@]}" ; do
    echo "Copying source to $folder..."
    cd $folder || exit 1
    rm -rf goldstone-server 2> /dev/null || /bin/true
    tar xf ${DIST_DIR}/${DIST_FILE}
    mv ${DIST_FILE%%.tar.gz} goldstone-server
done
echo "##########################################################"


echo "##########################################################"
echo "Copying static files to to $GS_WEB_DIR..."
rm -rf $GS_WEB_DIR/static 2> /dev/null || /bin/true
cd $TOP_DIR
python manage.py collectstatic --noinput --settings=goldstone.settings.docker
echo "##########################################################"

# 
# build containers
#
for folder in "${to_build[@]}" ; do
    cd $folder || exit 1
    echo "##########################################################"
    echo "Building ${REGISTRY_ORG}/${folder##*/}..."
    echo "##########################################################"
    docker build -t ${REGISTRY_ORG}/${folder##*/} .
    echo "Done building ${REGISTRY_ORG}/${folder##*/}."
done

#
# clean up the containers that need access to source
#
echo "##########################################################"
for folder in "${need_source[@]}" ; do
    echo "Removing source from $folder..."
    cd $folder || exit 1
    rm -rf goldstone-server
done
echo "##########################################################"

echo "##########################################################"
echo "Removing static files from $GS_WEB_DIR..."
cd $GS_WEB_DIR
rm -rf static
echo "##########################################################"
