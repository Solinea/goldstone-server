#!/usr/bin/env bash

# ken@solinea.com
# (c) Solinea, Inc  2014

function setup_epel() {
    yum -y update
    yum install -y wget
    wget http://dl.fedoraproject.org/pub/epel/6/x86_64/epel-release-6-8.noarch.rpm
    wget http://rpms.famillecollet.com/enterprise/remi-release-6.rpm
    yum localinstall -y remi-release-6*.rpm epel-release-6*.rpm
    
    # turn SE Linux to permissive for logging
    echo 0 >/selinux/enforce
    cp /etc/selinux/config /etc/selinux/config.bak
    sed 's/SELINUX=enforcing/SELINUX=permissive/' /etc/selinux/config.bak > /etc/selinux/config
    setsebool -P httpd_can_network_connect 1
}

function install_elasticsearch() {
    yum install -y zip unzip
    # Pull these out and have people hand install them
    # Add this to the README
    # yum install -y java-1.7.0-openjdk.x86_64
    # yum install -y gcc
    # yum install -y gcc-c++
    yum install -y python-devel libffi-devel openssl-devel
    yum install -y httpd mod_wsgi
    yum install -y redis
    service redis start
    chkconfig --add redis
    chkconfig redis on
    curl -k -XGET https://download.elasticsearch.org/elasticsearch/elasticsearch/elasticsearch-1.1.1.noarch.rpm > elasticsearch-1.1.1.noarch.rpm
    yum localinstall -y elasticsearch-1.1.1.noarch.rpm
    chkconfig --add elasticsearch
    chkconfig elasticsearch on
    service elasticsearch start
}

function install_logstash() {
    curl -k -XGET https://download.elasticsearch.org/logstash/logstash/packages/centos/logstash-1.4.0-1_c82dc09.noarch.rpm > logstash-1.4.0-1_c82dc09.noarch.rpm
    yum localinstall -y logstash-1.4.0-1_c82dc09.noarch.rpm
    cd /opt/logstash
    ./bin/plugin install contrib  # required for translate plugin
    cd -
    cp external/logstash/conf.d/* /etc/logstash/conf.d/
    cp external/logstash/patterns/goldstone /opt/logstash/patterns/goldstone
    chkconfig --add logstash
    chkconfig logstash on
    service logstash restart 
}

function config_iptables() {
    iptables -I INPUT -m state --state NEW -m tcp -p tcp --dport 80 -m comment --comment "httpd incoming" -j ACCEPT
    iptables -I INPUT -m state --state NEW -m tcp -p tcp --dport 9200 -m comment --comment "elastcisearch incoming" -j ACCEPT
    iptables -I INPUT -m state --state NEW -m tcp -p tcp --dport 5514 -m comment --comment "goldstone rsyslog incoming" -j ACCEPT
    service iptables save
}

function install_mysql() {
    # yum install -y mysql-server mysql-devel
    service mysqld restart
    chkconfig mysqld on
    mysqladmin -u root password 'goldstone'
    mysqladmin -u root -pgoldstone create goldstone
    mysql -uroot -pgoldstone -e "GRANT ALL PRIVILEGES ON goldstone.* TO goldstone@localhost IDENTIFIED BY 'goldstone'"
    mysql -uroot -pgoldstone -e "FLUSH PRIVILEGES"
    service mysqld restart
}

function configure_apache() {
    hc='/etc/httpd/conf/httpd.conf'
    echo "LoadModule wsgi_module modules/http://mod_wsgi.so" >> $hc
    echo "WSGIPythonPath /opt/goldstone/:/usr/lib/python2.6/site-packages/" >> $hc
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
    
    yum install -y python-pip
    pip install -r requirements.txt
    mkdir -p /var/www/goldstone/static
    cd /opt/goldstone
    ln -s /usr/lib/python2.6/site-packages/goldstone goldstone
    chown -R goldstone:goldstone .
    python manage.py collectstatic --settings=goldstone.settings.production --noinput
    chkconfig httpd on
    service httpd restart
}

function start_celery() {
    useradd -m goldstone
    chown goldstone /opt/goldstone
    cd /opt/goldstone
    python -c 'from goldstone.apps.core.tasks import create_daily_index; create_daily_index()'
    # export DJANGO_SETTINGS_MODULE=goldstone.settings.production; celery worker --app=goldstone --loglevel=warn --beat --uid=goldstone &
    chkconfig --add celeryd
    chkconfig celeryd on
    service celeryd restart
}

function set_logging() {
    # set django production logging to /var/log/goldstone
    # set ownership to apache:apache
    mkdir -p /var/log/goldstone
    chown apache /var/log/goldstone
    chgrp apache /var/log/goldstone
    touch /var/log/goldstone/goldstone.log
    chown apache /var/log/goldstone/goldstone.log
    chgrp apache /var/log/goldstone/goldstone.log
    # Allow apache and celery to log here
    chmod 777 /var/log/goldstone/goldstone.log
}

function report_status() {
    d=`date`
    echo -e "${d}	${stage}         ${green_text}[ DONE ]${txtrst}"
}

function datestamp() {
    d=`date`
    echo -e "${d} 	INSTALLING ${stage} ...."
}


red_text=${txtbld}$(tput setaf 1) #  red
green_text=${txtbld}$(tput setaf 2) #  green
txtrst=$(tput sgr0) # reset

logrunname="install.log"

stage="EPEL"; datestamp; result=$(setup_epel >> $logrunname 2>&1 ); report_status
stage="IPTABLES"; datestamp; result=$(config_iptables >> $logrunname 2>&1); report_status
stage="ELASTICSEARCH"; datestamp; result=$(install_elasticsearch >> $logrunname 2>&1); report_status
stage="LOGSTASH"; datestamp; result=$(install_logstash >> $logrunname 2>&1); report_status
stage="LOGGING"; datestamp; result=$(set_logging >> $logrunname 2>&1); report_status
stage="MySQL"; datestamp; result=$(install_mysql >> $logrunname 2>&1); report_status
stage="GOLDSTONE"; datestamp; result=$(configure_apache >> $logrunname 2>&1); report_status
stage="CELERY"; datestamp; result=$(start_celery >> $logrunname 2>&1 ); report_status
d=`date`
echo -e "${d}	${green_text}[ FINISHED ]${txtrst}"
