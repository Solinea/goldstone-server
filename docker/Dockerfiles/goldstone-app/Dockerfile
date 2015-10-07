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

FROM solinea/gunicorn:v1-b2912cf-release

MAINTAINER Luke Heidecke <luke@solinea.com>

ADD goldstone-server ${APPDIR}

WORKDIR ${APPDIR}

USER root


RUN buildReqs=' \
    python2.7-dev \
    gcc \
    g++ \
  ' \
  && preReqs=' \
    libffi-dev \
    libssl-dev \
    libpq-dev \
    git \
  ' \
  && apt-get update -y -q -q \
  && apt-get install -y -q $buildReqs \
  && apt-get install -y -q $preReqs 

USER ${APPUSER}

RUN . ${ENVDIR}/bin/activate \
  && pip install -r requirements.txt

USER root

RUN apt-get remove -y $buildReqs \
  && apt-get autoremove -y \
## Have to re-install due to python2.7-dev uninstalling libqp-dev
##   && apt-get install libpq-dev \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* 


USER ${APPUSER}

EXPOSE 8000

COPY ./docker_entrypoint.sh /
ENTRYPOINT ["/docker_entrypoint.sh"]
