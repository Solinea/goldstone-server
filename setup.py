# Copyright 2014 Solinea, Inc.
#
# Licensed under the Solinea Software License Agreement (goldstone),
# Version 1.0 (the "License"); you may not use this file except in compliance
# with the License. You may obtain a copy of the License at:
#
#     http://www.solinea.com/goldstone/LICENSE.pdf
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

__author__ = 'Ken Pepple'

import setuptools

import sys
sys.prefix = "/opt/goldstone"

setuptools.setup(
    setup_requires=['pbr'],
    data_files = [('external/rsyslog','external/rsyslog/rsyslog.conf'),
                  ('external/rsyslog/rsyslog.d/', 'external/rsyslog/rsyslog.d/10-goldstone.conf'),
                  ('external/logstash/patterns/', 'external/logstash/patterns/goldstone'),
                  ('external/logstash/conf.d/', ['external/logstash/conf.d/02-input-tcp5514',
                   'external/logstash/conf.d/34-filter-openstack-syslog', 'external/logstash/conf.d/35-filter-nova-claims',
                   'external/logstash/conf.d/36-filter-nova-spawns', 'external/logstash/conf.d/37-filter-nova-api-stats',
                   'external/logstash/conf.d/38-filter-goldstone-nodeinfo', 'external/logstash/conf.d/50-filter-generic-syslog',
                   'external/logstash/conf.d/67-output-debug', 'external/logstash/conf.d/68-ouput-elasticsearch']),
                  ("",['install_goldstone.sh', 'requirements.txt', 'setup.cfg', 'setup.py', 'manage.py',
                        'README.rst', 'INSTALL.rst', 'OSS_LICENSE_DISCLOSURE.pdf'])],
    pbr=True)
