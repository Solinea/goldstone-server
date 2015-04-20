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

=================
Deploying Goldstone Index Server
=================

Tested environment::
* CentOS 6.5 +
* ElasticSearch 1.1.1 + 
* Logstash 1.4.0-1

Install procedure::

    $ curl -XGET https://download.elasticsearch.org/elasticsearch/elasticsearch/elasticsearch-1.1.1.noarch.rpm \
            > elasticsearch-1.1.1.noarch.rpm
    $ curl -XGET https://download.elasticsearch.org/logstash/logstash/packages/centos/logstash-1.4.0-1_c82dc09.noarch.rpm \
            > logstash-1.4.0-1_c82dc09.noarch.rpm
    $ sudo yum install java-1.7.0-openjdk.x86_64
    $ sudo yum install gcc
    $ sudo yum install gcc-c++
    $ sudo yum install python-devel
    $ sudo yum install postgresql-server
    $ sudo yum install postgresql-devel
    $ sudo yum install libffi-devel
    $ sudo yum install openssl-devel
    $ sudo yum install httpd
    $ sudo yum install mod_wsgi
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

    -A INPUT -m state --state NEW -m tcp -p tcp --dport 80 -m comment --comment "httpd incoming" -j ACCEPT
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

Configure postgresql::

    $ sudo service postgresql initdb
    $ sudo chkconfig postgresql on
    $ sudo service postgresql start
    $ su - postgres
    (postgres) $ createuser goldstone -d
    (postgres) $ psql -c "alter user goldstone password 'goldstone'"
    $ exit

    * edit /var/lib/pgsql/data/pg_hba.conf 
    * update the IPv4 section so it looks roughly like the following:
    host    goldstone         goldstone         127.0.0.1/32          password
    host    all         all         127.0.0.1/32          ident
   
    
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

    * if you have SElinux enabled, add access to the tcp port used by goldstone:

    $ sudo semanage port -a -t syslogd_port_t -p tcp 5514
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

* Restart the openstack services or reboot the node.

Notes::
    * future versions will leverage the configuration setting to insert the appname into the outgoing message.
    * glance-cache.conf does not have a syslog_log_facility by default, check to see if it is a valid setting.


Installing goldstone
==================================
    * deploy the goldstone tree to /opt/goldstone
    * update settings in goldstone/settings/base.py and goldstone/settings/production.py (should templatize)

    Install dependencies::

    $ sudo pip install -r requirements.txt

Configuring goldstone under Apache
==================================

    Edit httpd.conf, append the following config::

    WSGIPythonPath /opt/goldstone:/opt/goldstone/lib/python2.6/site-packages

    <VirtualHost *:80>
        ServerAdmin you@example.com
        ServerName goldstone.example.com
        WSGIScriptAlias / /opt/goldstone/goldstone/wsgi.py
        Alias /static/ /var/www/goldstone/static/
        Alias /favicon.ico /var/www/goldstone/static/images/favicon.ico
        <Location "/static/">
            Options -Indexes
        </Location>
    </VirtualHost>

    Install the static files::

    $ sudo mkdir -p /var/www/goldstone/static
    $ cd /opt/goldstone
    $ sudo python manage.py collectstatic --settings=goldstone.settings.production

    Start/restart the server::

    $ sudo service httpd restart

    Verify that goldstone is running::

    * point browser at http://{addr} to get to the top level discovery screen

