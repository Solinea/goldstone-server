#!/usr/bin/env bash

# turn on trace
set -x 

# ken@solinea.com
# (c) Solinea, Inc  2014

# MAKE SURE YOU SDIST THE PACKAGE BEFORE YOU DO THIS !

# 0. pre sanity check
# 1. install elasticsearch schema (external)
# 2. install logstash configs
# 3. create package for syslog distribution to OS clients
# 4. create virtualenv
# 5. install pips
# 6. install apache
# 7. create mod_wsgi
# 8. post sanity tests
 

function bail_out() {
    echo "This server is incompatible"
    exit
}

function setup_epel() {
    yum install -y wget 
    wget http://dl.fedoraproject.org/pub/epel/6/x86_64/epel-release-6-8.noarch.rpm
    wget http://rpms.famillecollet.com/enterprise/remi-release-6.rpm
    yum localinstall -y remi-release-6*.rpm epel-release-6*.rpm
    
    # turn off SE Linux to troubleshoot
    echo 0 >/selinux/enforce
}

function pre_install_sanity() {
    server_os=`uname -o`
    if [[ $server_os == 'GNU/Linux' ]]; then
        bail_out
    fi
    redhat_release=`cat /etc/redhat-release`
    if [[ $redhat_release == 'CentOS release 6.5 (Final)' ]]; then
        bail_out
    fi
}

function install_elasticsearch() {
    curl -XGET https://download.elasticsearch.org/elasticsearch/elasticsearch/elasticsearch-1.1.1.noarch.rpm > elasticsearch-1.1.1.noarch.rpm
    yum install -y java-1.7.0-openjdk.x86_64
    yum install -y gcc
    yum install -y gcc-c++
    yum install -y python-devel
    yum install -y postgresql-server
    yum install -y postgresql-devel
    yum install -y libffi-devel
    yum install -y openssl-devel
    yum install -y httpd
    yum install -y mod_wsgi
    yum install -y redis
    yum localinstall -y elasticsearch-1.1.1.noarch.rpm
    chkconfig --add elasticsearch
    service elasticsearch start
}

function install_logstash() {
    curl -XGET https://download.elasticsearch.org/logstash/logstash/packages/centos/logstash-1.4.0-1_c82dc09.noarch.rpm > logstash-1.4.0-1_c82dc09.noarch.rpm
    yum localinstall -y logstash-1.4.0-1_c82dc09.noarch.rpm
    /opt/logstash/bin/plugin install contrib  # required for translate plugin
    cp external/logstash/conf.d/* /etc/logstash/conf.d/
    cp external/logstash/patterns/goldstone /opt/logstash/patterns/goldstone
    service logstash start 
}

function config_iptables() {
    # iptables -A INPUT -p tcp --dport 80 -j ACCEPT
    iptables -I INPUT -m state --state NEW -m tcp -p tcp --dport 80 -m comment --comment "httpd incoming" -j ACCEPT
    # iptables -A INPUT -p tcp --dport 9200 -j ACCEPT
    iptables -I INPUT -m state --state NEW -m tcp -p tcp --dport 9200 -m comment --comment "elastcisearch incoming" -j ACCEPT
    # iptables -A INPUT -p tcp --dport 5514 -j ACCEPT
    iptables -I INPUT -m state --state NEW -m tcp -p tcp --dport 5514 -m comment --comment "goldstone rsyslog incoming" -j ACCEPT
    service iptables save
}

function install_pg() {
    yum install postgresql
    service postgresql initdb
    chkconfig postgresql on
    service postgresql start
    createuser goldstone -s -d
    psql -c "alter user goldstone password 'goldstone'"
}

function configure_goldstone() {
    hc='/etc/httpd/conf/httpd.conf'
    echo "LoadModule wsgi_module modules/http://mod_wsgi.so" >> $hc
    echo "WSGIPythonPath /opt/goldstone:/opt/goldstone/lib/python2.6/site-packages" >> $hc
    echo "<VirtualHost *:80>" >> $hc
    echo "ServerAdmin you@example.com" >> $hc
    h=`hostname`
    echo "ServerName ${h}" >> $hc
    echo "WSGIScriptAlias / /opt/goldstone/goldstone/wsgi.py" >> $hc
    echo "Alias /static/ /var/www/goldstone/static/" >> $hc
    echo "Alias /favicon.ico /var/www/goldstone/static/images/favicon.ico" >> $hc
    echo "<Location \"/static/\">" >> $hc
    echo "    Options -Indexes" >> $hc
    echo "</Location>" >> $hc
    echo "</VirtualHost>" >> $hc
    
    cp -r . /opt/goldstone
    yum install -y python-pip
    pip install -r requirements.txt
    mkdir -p /var/www/goldstone/static
    cd /opt/goldstone
    python manage.py collectstatic --settings=goldstone.settings.production --noinput
    service httpd restart
}

function start_celery() {
    export DJANGO_SETTINGS_MODULE=goldstone.settings.production
    celery worker --app=goldstone --loglevel=info --beat
}

# pre_install_sanity
setup_epel
config_iptables
install_elasticsearch
install_logstash
install_pg
configure_goldstone
start_celery