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

STACK=true
HTTP_PORT=8888

for arg in "$@" ; do
    case $arg in
        --no-stack)
            STACK=false
        ;;
        --http-port)
            HTTP_PORT="${arg#*=}"
        ;;
        --help)
            echo "Usage: $0 [--no-stack] [--http-port=int]"
            exit 0
        ;;
        *)
            # unknown option
            echo "Usage: $0 [--no-stack] [--http-port=int]"
            exit 1
        ;;
    esac
done

# install Docker 
curl -sSL https://get.docker.com/ | sh \ 
    && chkconfig docker on \
    && service docker start

# install Goldstone 


# add firewall rules
echo "Configuring firewalld to allow Goldstone traffic."
systemctl start firewalld.service \
    && default_zone=$(firewall-cmd --get-default-zone') \
    && firewall-cmd --zone $default_zone --add-port=${http_port} \
    && firewall-cmd --runtime-to-permanent \
    && systemctl restart firewalld.service

# enable and start services

