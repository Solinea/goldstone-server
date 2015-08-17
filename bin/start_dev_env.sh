#!/bin/bash
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

export STACK_VM_NAME="RDO-kilo"
export DJANGO_SETTINGS_MODULE=goldstone.settings.local_docker

VboxManage list runningvms | grep \"${STACK_VM_NAME}\" ; RC=$?
if [[ $RC != 0 ]] ; then
    # No matches, start the VM
    VBoxManage startvm ${STACK_VM_NAME} --type headless
else
    echo "${STACK_VM_NAME} is already running"
fi

boot2docker up
eval $(boot2docker shellinit)
(cd $PROJECT_HOME/goldstone-docker;docker-compose up -d)

echo "starting celery"
(cd $PROJECT_HOME/goldstone-server ; \
 celery worker --app=goldstone --loglevel=info --queues=default \
               --beat --without-heartbeat > \
               /tmp/goldstone-server-celery.log 2>&1 &)

echo "starting flower on port 5555"
(cd $PROJECT_HOME/goldstone-server ; \
 celery flower -A goldstone --address=127.0.0.1 --port=5555 > \
                            /tmp/goldstone-server-flower.log 2>&1 &)
