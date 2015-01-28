=============================
Goldstone Installation
=============================

GOLDSTONE LICENSE
*********************

Copyright 2014 - 2015 Solinea, Inc.

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
* CentOS / RHEL 6.5 or 6.6

To view and use goldstone, you will need a recent version of the `Google Chrome browser`_.

.. _Google Chrome browser: https://www.google.com/intl/en-US/chrome/browser/

INSTALL GOLDSTONE PACKAGES
**************************

First, enable the CentOS EPEL repositories and install some dependencies: ::

    # yum install -y  http://dl.fedoraproject.org/pub/epel/6/x86_64/epel-release-6-8.noarch.rpm
    # yum install -y gcc gcc-c++ java-1.7.0-openjdk

Next, enable the elasticsearch and logstash repositories: ::

    # rpm --import http://packages.elasticsearch.org/GPG-KEY-elasticsearch
    # cat > /etc/yum.repos.d/elasticsearch-1.3.repo <<EOF
    [elasticsearch-1.3]
    name=Elasticsearch repository for 1.3.x packages
    baseurl=http://packages.elasticsearch.org/elasticsearch/1.3/centos
    gpgcheck=1
    gpgkey=http://packages.elasticsearch.org/GPG-KEY-elasticsearch
    enabled=1
    EOF
    # cat > /etc/yum.repos.d/logstash-1.4.repo <<EOF
    [logstash-1.4]
    name=logstash repository for 1.4.x packages
    baseurl=http://packages.elasticsearch.org/logstash/1.4/centos
    gpgcheck=1
    gpgkey=http://packages.elasticsearch.org/GPG-KEY-elasticsearch
    enabled=1
    EOF

Set OpenStack-related environment variables.  This will enable the RPM installer to 
configure Goldstone without a reboot.  ::

    # export OS_USERNAME=admin
    # export OS_TENANT_NAME=admin
    # export OS_PASSWORD=password
    # export OS_AUTH_URL=http://10.10.10.10::5000/v2.0/

Install PostgreSQL, create a Postgres goldstone user, and initialize the database. ::
      
    $ yum install -y postgresql-server postgresql-devel

    $ sudo service postgresql initdb
    $ sudo chkconfig postgresql on
    $ sudo service postgresql start

    $ su - postgres
    (postgres) $ createuser goldstone -d
    (postgres) $ psql -c "alter user goldstone password 'goldstone'"

    (postgres) $ # Edit /var/lib/pgsql/data/pg_hba.conf and insert these lines before
    (postgres) $ # any other entries:
    local   all         goldstone                         password
    host    all         goldstone   127.0.0.1/32          password
    host    all         goldstone   ::1/128               password

    (postgres) $ pg_ctl reload

    (postgres) $ exit

Install the goldstone application: ::

    # yum localinstall -y goldstone-server-{version}.rpm

This package installation may take up to 30 minutes to run, as it needs to compile a number of libraries.

If you did not set the OpenStack envrironment variables, you can configure Goldstone by editing
``/opt/goldstone/goldstone/settings/production.py`` to add required OpenStack settings.  Example: ::

    OS_USERNAME = 'admin'
    OS_TENANT_NAME = 'admin'
    OS_PASSWORD = 'password'
    OS_AUTH_URL = 'http://10.10.10.10:5000/v2.0'

The goldstone application will be started at next boot. 


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

    *.*    @@10.10.10.1:5514    

If you run with selinux enabled, you will also need to configure it to allow rsyslog to use this port: ::

    # semanage port -a -t syslogd_port_t -p tcp 5514

Restart the OpenStack services and syslog or reboot the node. Repeat this on all the OpenStack servers (or better include this in your puppet scripts).

FINISHED !
*********************

Now that everything has been configured, point your browser to the goldstone server IP address or name and begin using goldstone.
