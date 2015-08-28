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

FROM solinea/elasticsearch
MAINTAINER Luke Heidecke <luke@solinea.com>

# Install admin plugins
RUN plugin install mobz/elasticsearch-head \
  && plugin install lukas-vlcek/bigdesk

# Overlays any files/directories to the ES config dir
# ADD config /usr/share/elasticsearch/config

ENV ES_CLUSTERNAME goldstone

# Defaults to the container's hostname
ENV ES_NODENAME \${HOSTNAME}

# Defaults to reasonable dev environment memory
ENV ES_HEAP_SIZE 256M

ENV ES_JAVA_OPTS="\
  -Des.cluster.name=\${ES_CLUSTERNAME} \
  -Des.node.name=\${ES_NODENAME} \
  -Des.index.search.slowlog.threshold.query.warn=10s \
  -Des.index.search.slowlog.threshold.query.info=5s \
  -Des.index.search.slowlog.threshold.query.debug=2s \
  -Des.index.search.slowlog.threshold.query.trace=500ms \
  -Des.index.search.slowlog.threshold.fetch.warn=1s \
  -Des.index.search.slowlog.threshold.fetch.info=800ms \
  -Des.index.search.slowlog.threshold.fetch.debug=500ms \
  -Des.index.search.slowlog.threshold.fetch.trace=200ms \
  -Des.index.indexing.slowlog.threshold.index.warn=10s \
  -Des.index.indexing.slowlog.threshold.index.info=5s \
  -Des.index.indexing.slowlog.threshold.index.debug=2s \
  -Des.index.indexing.slowlog.threshold.index.trace=500ms \
  -Des.monitor.jvm.gc.young.warn=1000ms \
  -Des.monitor.jvm.gc.young.info=700ms \
  -Des.monitor.jvm.gc.young.debug=400ms \
  -Des.monitor.jvm.gc.old.warn=10s \
  -Des.monitor.jvm.gc.old.info=5s \
  -Des.monitor.jvm.gc.old.debug=2s \
  "
