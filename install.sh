#!/usr/bin/env bash -x

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

function bail_out() {
    echo "This server is incompatible"
    exit
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
    yum install -u redis
    yum localinstall -y elasticsearch-1.1.1.noarch.rpm
    chkconfig --add elasticsearch
    service elasticsearch start
}

function install_logstash() {
    curl -XGET https://download.elasticsearch.org/logstash/logstash/packages/centos/logstash-1.4.0-1_c82dc09.noarch.rpm > logstash-1.4.0-1_c82dc09.noarch.rpm
    yum localinstall -y logstash-1.4.0-1_c82dc09.noarch.rpm
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

function configure_goldstone() {
    hc='/etc/httpd/conf/httpd.conf'
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
    
    cp -r goldstone /opt/goldstone
    pip install -r requirements.txt
    mkdir -p /var/www/goldstone/static
    cd /opt/goldstone
    python manage.py collectstatic --settings=goldstone.settings.production
    service httpd restart
}

# pre_install_sanity
install_elasticsearch
install_logstash
install_pg
configure_goldstone
