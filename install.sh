#!/usr/bin/env bash

# ken@solinea.com
# (c) Solinea, Inc  2014

# MAKE SURE YOU SDIST THE PACKAGE BEFORE YOU DO THIS !

# 0. sanity check
# 1. install elasticsearch schema (external)
# 2. install logstash configs
# 3. create package for syslog distribution to OS clients
# 4. create virtualenv
# 5. install pips
# 6. install apache
# 7. create mod_wsgi
# 8. sanity tests
# 9. 


function pre_install_sanity() {
    server_os = `uname -o`
    if [[ server_os = 'GNU/Linux' ]]; then
        bail_out("You need to be running a Linux server")
    fi
    redhat_release = `cat /etc/redhat-release`
    if [[ redhat_release = 'CentOS release 6.5 (Final)' ]]
        bail_out("You need to be running CentOS 6.5")
    fi
}

function install_elasticsearch () {
    curl -XGET https://download.elasticsearch.org/elasticsearch/elasticsearch/elasticsearch-1.1.1.noarch.rpm > elasticsearch-1.1.1.noarch.rpm
    yum install java-1.7.0-openjdk.x86_64
    yum install gcc
    yum install gcc-c++
    yum install python-devel
    yum install postgresql-server
    yum install postgresql-devel
    yum install libffi-devel
    yum install openssl-devel
    yum install httpd
    yum install mod_wsgi
    rpm -Uhv elasticsearch-1.1.1.noarch.rpm
    chkconfig --add elasticsearch
    service elasticsearch start
}

function install_logstash() {
    curl -XGET https://download.elasticsearch.org/logstash/logstash/packages/centos/logstash-1.4.0-1_c82dc09.noarch.rpm > logstash-1.4.0-1_c82dc09.noarch.rpm
    rpm -Uhv logstash-1.4.0-1_c82dc09.noarch.rpm
    /opt/logstash/bin/plugin install contrib  # required for translate plugin
    cp goldstone/external/logstash/conf.d/* /etc/logstash/conf.d/
    cp goldstone/external/logstash/patterns/goldstone /opt/logstash/patterns/goldstone
    service logstash start 
}

function install_pg() {
    yum install postgresql
    service postgresql initdb
    chkconfig postgresql on
    service postgresql start
    createuser goldstone -s -d
    psql -c "alter user goldstone password 'goldstone'"
}

function eth($line) {
    echo $line >> /etc/httpd/conf
}

function configure_goldstone() {
    eth("WSGIPythonPath /opt/goldstone:/opt/goldstone/lib/python2.6/site-packages")
    eth("<VirtualHost *:80>")
    eth("ServerAdmin you@example.com")
    h = `hostname`
    eth("ServerName ${h}")    
    eth("WSGIScriptAlias / /opt/goldstone/goldstone/wsgi.py")
    eth("Alias /static/ /var/www/goldstone/static/")
    eth("Alias /favicon.ico /var/www/goldstone/static/images/favicon.ico")
    eth("<Location \"/static/\">")
    eth("    Options -Indexes")
    eth("</Location>")
    eth("</VirtualHost>")
    
    cp -r goldstone /opt/goldstone
    pip install -r requirements.txt
    mkdir -p /var/www/goldstone/static
    cd /opt/goldstone
    python manage.py collectstatic --settings=goldstone.settings.production
    service httpd restart
}