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

FROM solinea/goldstone-app:0.7.3

MAINTAINER John Stanford <john@solinea.com>

ENV GS_PROJ_TOP_DIR ${APPDIR}

ADD ./addons /tmp/addons
ADD ./docker_entrypoint.sh /

WORKDIR ${APPDIR}

USER ${APPUSER}

RUN . ${ENVDIR}/bin/activate \
  && find /tmp/addons/* -exec pip install {} \;

USER root
RUN  rm -rf /tmp/addons

EXPOSE 8000

USER ${APPUSER}

ENTRYPOINT ["/docker_entrypoint.sh"]
