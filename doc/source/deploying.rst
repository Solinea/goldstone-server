Copyright 2014 Solinea, Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

Author: John Stanford

=================
Deploying Goldstone Index Server
=================

Tested environment::
* Centos 6.5
* ElasticSearch 1.1.1
* Logstash 1.4.0-1

Install procedure::

    $ curl -XGET https://download.elasticsearch.org/elasticsearch/elasticsearch/elasticsearch-1.1.1.noarch.rpm \
            > elasticsearch-1.1.1.noarch.rpm
    $ curl -XGET https://download.elasticsearch.org/logstash/logstash/packages/centos/logstash-1.4.0-1_c82dc09.noarch.rpm \
            > logstash-1.4.0-1_c82dc09.noarch.r
    $ sudo yum install java-1.7.0-openjdk.x86_64
    $ sudo rpm -Uhv elasticsearch-1.1.1.noarch.rpm
    $ sudo chkconfig --add elasticsearch
    $ sudo service elasticsearch start
    $ sudo rpm -Uhv logstash-1.4.0-1_c82dc09.noarch.rpm
    $ cd /opt/logstash
    $ sudo bin/plugin install contrib  # required for translate plugin
    
IpTables configuration::

Add the following lines to /etc/sysconfig/iptables in the ":OUTPUT ACCEPT [0:0]" section before the line
starting with "-A INPUT -j REJECT".  You may want to review and customize these settings to meet your own
security requirements:

    -A INPUT -m state --state NEW -m tcp -p tcp --dport 9200 -m comment --comment "elastcisearch incoming" -j ACCEPT
    -A INPUT -m state --state NEW -m tcp -p tcp --dport 5514 -m comment --comment "goldstone rsyslog incoming" -j ACCEPT

Restart iptables::

    $ sudo service iptables restart

Install logstash configuration files::

    * The processing rules are in the directory goldstone/external/logstash/conf.d and 
      should be placed in /etc/logstash/conf.d.
    * The custom patterns are in the file goldstone/external/logstash/patterns/goldstone and 
      should be copied to /opt/logstash/patterns/goldstone

Start logstash::

    $ sudo service logstash start


=================
Configuring Goldstone Clients
=================

Tested environment::
    * Centos 6.5
    * RedHat RDO / OpenStack Icehouse

Configure Rsyslog::

Goldstone uses rsyslog to ship logs from clients to the Goldstone server.  The default rsyslog.conf file is
generally sufficient, but there an example one in goldstone/external/rsyslog for comparison.  It is important
that the configuration file is configured to read files from /etc/rsyslog.d/conf.d folder.  The following 
customization should be applied:

    * copy goldstone/external/rsyslog/conf.d/10-goldstone.conf /etc/rsyslog.d/conf.d

    $ sudo service rsyslog restart

Configure OpenStack services::

Each OpenStack service uses one of the local syslog facilities to help with categorization of logs.  There are generally
three fields to set in the configuration file for a service (i.e. /etc/nova/nova.conf).  They are:

    * verbose = True
    * use_syslog = True
    * syslog_log_facility = LOG_LOCAL{X}

Swift has a different configuration mechanism, so inserting the following entries in swift.conf 
will configure the logging properly:

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

Notes::
    * future versions will leverage the configuration setting to insert the appname into the outgoing message.
    * glance-cache.conf does not have a syslog_log_facility by default, check to see if it is a valid setting.



How to run the tests
====================

Install libraries::

    $ sudo pip install -r requirements.txt

Set SECRET KEY environment variable::

    $ set SECRET_KEY="fsaafkjsdfiojsoivjfvoj"

You can generate strong SECRET_KEYS at http://www.miniwebtool.com/django-secret-key-generator/

Start the server::

    $ python manage.py runserver --settings=goldstone.settings.production

This will be better serverd through a true webserver like Apache.
