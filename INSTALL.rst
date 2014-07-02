=============================
Goldstone Installation
=============================

GOLDSTONE LICENSE
*********************

Copyright 2014 Solinea, Inc.

Licensed under the Solinea Software License Agreement (goldstone),
Version 1.0 (the "License"); you may not use this file except in compliance
with the License. You may obtain a copy of the License at:

    http://www.solinea.com/goldstone/LICENSE.pdf

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

INSTALLING GOLDSTONE
*********************

Installing goldstone is a two step process:

1. Install goldstone packages
2. Direct OpenStack server logs to goldstone server

Before installing goldstone, your server needs to meet the following prerequesites:

* 4GB RAM
* x64 CPU
* 100 GB free disk space
* CentOS / RHEL 6.5

To view and use goldstone, you will need a recent version of the `Google Chrome browser`_.

.. _Google Chrome browser: https://www.google.com/intl/en-US/chrome/browser/

RUN GOLDSTONE INSTALLER
***********************

First, enable the CentOS EPEL repositories and install some dependencies: ::

    # yum install -y  http://dl.fedoraproject.org/pub/epel/6/x86_64/epel-release-6-8.noarch.rpm
    # yum install -y gcc gcc-c++ mysql-server mysql-devel

After that, enable the goldstone repository: ::

    # yum install -y http://repo.solinea.com/repo/goldstone_repos-1.1-1.noarch.rpm

Finally, install the goldstone application: ::

    # yum install -y goldstone

This package installation may take up to 2 hours to run, as it needs to compile a number of libraries.

Once the goldstone rpm is installed, edit the ``/opt/goldstone/goldstone/settings/production.py`` file to add your OpenStack admin credentials. These are located at the bottom of the file: ::

    OS_USERNAME = 'admin'
    OS_PASSWORD = 'fe6ac09d85041ae384c66a83e362f565'
    OS_TENANT_NAME = 'admin'
    OS_AUTH_URL = 'http://10.10.15.230:5000/v2.0'

DIRECT LOGS TO GOLDSTONE SERVER
*******************************

With goldstone installed, the only task left is to point the OpenStack server logs to it so that it can begin processing them. There are two tasks in this step:

    1. Configure OpenStack services to use syslog
    2. Configure syslog to forward to your goldstone server

OpenStack Service Logging
---------------------------

Each OpenStack service uses one of the local syslog facilities to help with categorization of logs.  There are generally three fields to set in the configuration file for a service (i.e. ``/etc/nova/nova.conf``).  They are:

* ``verbose = True``
* ``use_syslog = True``
* ``syslog_log_facility = LOG_LOCAL{X}``

Swift has a different configuration mechanism, so inserting the following entries in swift.conf will configure the logging properly: ::

    [object-server]
    set log_facility = LOG_LOCAL4
    set log_level = INFO

    [object-replicator]
    set log_facility = LOG_LOCAL4
    set log_level = INFO

    [object-updater]
    set log_facility = LOG_LOCAL4
    set log_level = INFO

    [object-auditor]
    set log_facility = LOG_LOCAL4
    set log_level = INFO

The following service mapping is used for syslog_log_facility:

* nova => LOG_LOCAL0
* glance => LOG_LOCAL1
* neutron => LOG_LOCAL2
* ceilometer => LOG_LOCAL3
* swift => LOG_LOCAL4
* cinder => LOG_LOCAL5
* keystone => LOG_LOCAL6


Rsyslog Forwarding
-------------------

In the ``/opt/goldstone/external`` folder, there are example configuration files for rsyslog:

* ``/opt/goldstone/external/rsyslog/rsyslog.conf`` is an example main rsyslog configuration file. It references the goldstone specific file below.
* ``/opt/goldstone/external/rsyslog/rsyslog.d/10-goldstone.conf`` provides specific mapping. THIS FILE NEEDS TO BE MODIFIED to replace the '@@goldstone_ip:5514' in the local0.* to local7.* lines with your goldstone server IP address or name. For example, if your goldstone server's IP address 10.10.10.1, then your file should be edited to read: ::

        local0.*    @@10.10.10.1:5514    # nova
        local1.*    @@10.10.10.1:5514    # glance
        local2.*    @@10.10.10.1:5514    # neutron
        local3.*    @@10.10.10.1:5514    # ceilometer
        local4.*    @@10.10.10.1:5514    # swift
        local5.*    @@10.10.10.1:5514    # cinder
        local6.*    @@10.10.10.1:5514    # keystone
        local7.*    @@10.10.10.1:5514    # other 

Restart the OpenStack services and syslog or reboot the node. Repeat this on all the OpenStack servers (or better include this in your puppet scripts).

FINISHED !
*********************

Now that everything has been configured, point your browser to the goldstone server IP address or name and begin using goldstone.