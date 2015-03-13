=============================
Goldstone Installation
=============================

GOLDSTONE LICENSE
*********************

Copyright 2014 - 2015 Solinea, Inc.

Licensed under the Solinea Software License Agreement (Goldstone),
Version 1.0 (the "License"); you may not use this file except in compliance
with the License. You may obtain a copy of the License at:

    http://www.solinea.com/goldstone/LICENSE.pdf

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
See the License for the specific language governing permissions and
limitations under the License.

INSTALLING GOLDSTONE
*********************

Installing Goldstone is a two step process:

1. Install Goldstone packages
2. Direct OpenStack server logs to Goldstone server

Before installing Goldstone, your server needs to meet the following prerequesites:

* 4GB RAM
* x64 CPU (or 4 core VM on x64 host)
* 100 GB free disk space
* CentOS / RHEL 6.5 or 6.6

To view and use Goldstone, you will need a recent version of the `Google Chrome browser`_.

.. _Google Chrome browser: https://www.google.com/intl/en-US/chrome/browser/

INSTALL GOLDSTONE PACKAGES
**************************

First, enable the CentOS EPEL repositories and install some dependencies:

  .. code:: bash

    $ # run as root
    $ yum install -y  http://dl.fedoraproject.org/pub/epel/6/x86_64/epel-release-6-8.noarch.rpm
    $ yum install -y gcc gcc-c++ java-1.7.0-openjdk postgresql-server postgresql-devel git

Next, enable the elasticsearch and logstash repositories:

  .. code:: bash

    $ # run as root
    $ rpm --import http://packages.elasticsearch.org/GPG-KEY-elasticsearch

    $ cat > /etc/yum.repos.d/elasticsearch-1.4.repo <<EOF
    [elasticsearch-1.4]
    name=Elasticsearch repository for 1.4.x packages
    baseurl=http://packages.elasticsearch.org/elasticsearch/1.4/centos
    gpgcheck=1
    gpgkey=http://packages.elasticsearch.org/GPG-KEY-elasticsearch
    enabled=1
    EOF

    $ cat > /etc/yum.repos.d/logstash-1.4.repo <<EOF
    [logstash-1.4]
    name=logstash repository for 1.4.x packages
    baseurl=http://packages.elasticsearch.org/logstash/1.4/centos
    gpgcheck=1
    gpgkey=http://packages.elasticsearch.org/GPG-KEY-elasticsearch
    enabled=1
    EOF

Create a Postgres Goldstone user, and initialize the database. 
      
  .. code:: bash

    $ # run as root
    $ service postgresql initdb
    $ chkconfig postgresql on
    $ service postgresql start
    $ su - postgres -c 'createdb goldstone'
    $ su - postgres -c 'createuser goldstone -d'
    $ su - postgres -c 'psql -c "alter user goldstone password \'goldstone\'"'

Edit ``/var/lib/pgsql/data/pg_hba.conf`` as 'postgres' user, and insert these 
lines before any other uncommented local or host entries: ::

    local   all         goldstone                         password
    host    all         goldstone   127.0.0.1/32          password
    host    all         goldstone   ::1/128               password

Reload the postgres configuration.

  .. code:: bash

    $ # run as root
    $ su - postgres -c 'pg_ctl reload'


Install the Goldstone application: 

  .. code:: bash

    $ # run as root
    $ yum localinstall -y goldstone-server-{version}.rpm

This package installation may take up to 30 minutes to run, as it needs to compile a number of libraries.

If this is a re-install or update of Goldstone, the
/opt/goldstone/goldstone/settings/production.py file will not have been
updated. The new version from Solinea will be in
/opt/goldstone/goldstone/settings/production.py.rpmnew. Compare
/opt/goldstone/goldstone/settings/production.py with
/opt/goldstone/goldstone/settings/production.py.rpmnew, and migrate the Solinea
changes from the .rpmnew file into the .py file. (Or, if you did not previously
customize production.py, you can simply move
/opt/goldstone/goldstone/settings/production.py.rpmnew into
/opt/goldstone/goldstone/settings.production.py.)

To finish initializing the Goldstone installation:

  .. code:: bash

    $ cd /opt/goldstone
    $ fab goldstone_init


TEST PASSWORD RESET
*******************

Goldstone's login page includes a password-reset link. Please test it.

If the links in the password-reset e-mail do not work, you'll need to adjust the settings in /opt/goldstone/goldstone/settings/production.py. Look for the, "DJOSER," dictionary.


DIRECT LOGS TO GOLDSTONE SERVER
*******************************

With Goldstone installed, the only task left is to point the OpenStack server logs to it so that it can begin processing them. There are two tasks in this step:

    1. Configure OpenStack services to use syslog
    2. Configure syslog to forward to your Goldstone server

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

* ``/opt/goldstone/external/rsyslog/rsyslog.conf`` is an example main rsyslog configuration file. It references the Goldstone specific file below.
* ``/opt/goldstone/external/rsyslog/rsyslog.d/10-goldstone.conf`` provides specific mapping. THIS FILE NEEDS TO BE MODIFIED to replace the '@@goldstone_ip:5514' in the local0.* to local7.* lines with your Goldstone server IP address or name. For example, if your Goldstone server's IP address 10.10.10.1, then your file should be edited to read: ::

    *.*    @@10.10.10.1:5514    

If you run with selinux enabled, you will also need to configure it to allow rsyslog to use this port: ::

    # semanage port -a -t syslogd_port_t -p tcp 5514

Restart the OpenStack services and syslog or reboot the node. Repeat this on all the OpenStack servers (or better include this in your puppet scripts).

FINISHED !
*********************

Now that everything has been configured, point your browser to the Goldstone server IP address or name and begin using Goldstone.

The installation created a system administrator account with the credentials, "admin" / "changeme".

Your first task is to change your admin account password and e-mail address. You can do this from the account settings page.

The installation also created an initial tenant, with a tenant administrator. The tenant administrator is also Goldstone's default tenant administrator. You may wish to change this tenant's name, owner name, or contact information; change the tenant admin's name or password, which is "gsadmin" / "changeme"; or create more tenant admins.
