# vim:set ft=dockerfile:
# Copyright 2015 Solinea, Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

#
# This script starts the boot2docker and OpenStack VirtualBox VMs, then
# brings up the docker containers that support Goldstone.  It is known
# to work with VirtualBox 4.3.30 or greater, and boot2docker v1.6.2.
#
# It assumes that you are running in a virtualenv, and that you have cloned
# the goldstone-docker and goldstone-server Github repos into the
# PROJECT_HOME associated with the virtual environment.
#
# Caution should be taken to ensure that the OpenStack VM is not in the
# process of shutting down when this script is executed, otherwise you
# may end up with a successful run, but the VM will be down.  If you use
# the sibling stop_dev_env.sh script to shut down, the condition will be
# rare since the script waits until the VM is powered off before exiting.
#

FROM solinea/gunicorn

MAINTAINER Luke Heidecke <luke@solinea.com>

ADD goldstone-server ${APPDIR}

WORKDIR ${APPDIR}

USER root

# ENV DJANGO_SETTINGS_MODULE goldstone.settings.docker
# ENV GOLDSTONE_INSTALL_DIR /app
# ENV DJANGO_ADMIN_USER admin
# ENV DJANGO_ADMIN_PASSWORD goldstone
# ENV DJANGO_ADMIN_EMAIL root@localhost
# ENV GOLDSTONE_TENANT_ADMIN_PASSWORD goldstone
# ENV OS_TENANT_NAME admin
# ENV OS_USERNAME admin
# ENV OS_PASSWORD solinea
# ENV OS_AUTH_URL http://172.24.4.100:5000/v2.0/

RUN buildReqs=' \
    python2.7-dev \
    gcc \
    g++ \
  ' \
  && preReqs=' \
    libffi-dev \
    libssl-dev \
    libpq-dev \
  ' \
  && apt-get update -y -q -q \
  && apt-get install -y -q $buildReqs \
  && apt-get install -y -q $preReqs \
  && pip install -r requirements.txt \
  && apt-get remove -y $buildReqs \
  && apt-get autoremove -y \
## Have to re-install due to python2.7-dev uninstalling libqp-dev
  && apt-get install libpq-dev \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

USER ${APPUSER}

EXPOSE 8000

COPY ./docker_entrypoint.sh /
ENTRYPOINT ["/docker_entrypoint.sh"]
