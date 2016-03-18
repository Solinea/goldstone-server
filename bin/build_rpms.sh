#/bin/bash

TOP_DIR=${GS_PROJ_TOP_DIR:-${PROJECT_HOME}/goldstone-server}

mkdir -p ${TOP_DIR}/dist/ubuntu 
mkdir -p ${TOP_DIR}/dist/redhat
docker build -t gss.rpm -f ${TOP_DIR}/rpm_packaging/Dockerfile.rpm .
docker rm gss-rpm
docker run --name gss-rpm gss.rpm make rpm_native
docker cp gss-rpm:/tmp/goldstone-server/`${TOP_DIR}/bin/semver.sh rpmname goldstone-server` ${TOP_DIR}/dist/redhat/
docker rm gsse-rpm
docker run --name gsse-rpm gss.rpm make gse_native
docker cp gsse-rpm:/tmp/goldstone-server/`${TOP_DIR}/bin/semver.sh rpmname goldstone-server-enterprise` ${TOP_DIR}/dist/redhat/
