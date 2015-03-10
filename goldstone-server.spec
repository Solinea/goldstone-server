# Copyright 2014 - 2015 Solinea, Inc.
#
# Licensed under the Solinea Software License Agreement (goldstone),
# Version 1.0 (the "License"); you may not use this file except in compliance
# with the License. You may obtain a copy of the License at:
#
#     http://www.solinea.com/goldstone/LICENSE.pdf
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

%define version %{getenv:GOLDSTONE_RPM_VERSION}
%define release %{getenv:GOLDSTONE_RPM_RELEASE}
%define epoch   %{getenv:GOLDSTONE_RPM_EPOCH}

Summary:        Solinea Goldstone server
Name:           goldstone-server
Version:        %{version}
Release:        %{release}%{?dist}
Epoch:          %{epoch}
# Copyright:      Copyright 2015 Solinea, Inc.
Group:          Applications/System
License:        Solinea Software License Agreement (version 1)
URL:            http://www.solinea.com/goldstone
ExclusiveArch:  x86_64
ExclusiveOS:    linux
Prefix:         /opt

Requires(pre): /usr/sbin/useradd, /usr/bin/getent, elasticsearch == 1.4.3, gcc, gcc-c++, redis, logstash == 1.4.2, logstash-contrib == 1.4.2, python-devel, libffi-devel, openssl-devel, httpd, mod_wsgi, wget, python-pip, unzip, zip
Requires(postun): /usr/sbin/userdel, /usr/sbin/groupdel

%pre
/usr/bin/getent group goldstone || /usr/sbin/groupadd -r goldstone
/usr/bin/getent passwd goldstone || /usr/sbin/useradd -r -g goldstone -d /opt/goldstone -s /sbin/nologin goldstone

%post
# $1 if present will be the target number of installs of this package
# on this system. 
#     1 --> first install
#     0 --> removal of last installed version
#    >1 --> upgrade
if [[ $# == 1 && $1 == 1 ]] ; then
    # post install for initial case

    # turn SE Linux to permissive for logging
    echo 0 >/selinux/enforce
    if [ ! -f /etc/selinux/config.bak ]; then
        cp /etc/selinux/config /etc/selinux/config.bak
    fi
    sed 's/SELINUX=enforcing/SELINUX=permissive/' /etc/selinux/config.bak > /etc/selinux/config
    setsebool -P httpd_can_network_connect 1

    # set up iptables
    iptables -I INPUT -m state --state NEW -m tcp -p tcp --dport 80 \
        -m comment --comment "httpd incoming" -j ACCEPT
    iptables -I INPUT -m state --state NEW -m tcp -p tcp --dport 9200 \
        -m comment --comment "elastcisearch incoming" -j ACCEPT
    iptables -I INPUT -m state --state NEW -m tcp -p tcp --dport 5514 \
        -m comment --comment "goldstone rsyslog incoming" -j ACCEPT
    iptables -I INPUT -m state --state NEW -m tcp -p tcp --dport 5515 \
        -m comment --comment "goldstone event resubmission" -j ACCEPT
    service iptables save
 
    # set up services
    chkconfig --add redis
    chkconfig redis on
    service redis start

    chkconfig --add elasticsearch
    chkconfig elasticsearch on
    service elasticsearch start

    chkconfig --add logstash
    chkconfig logstash on
    service logstash start
else
    # post install for upgrade case
    service redis restart
    service elasticsearch restart
    service logstash restart

fi

# if credentials are set in the local environment, put them into the goldstone configuration
if [[ $# == 1 && $1 == 1 ]] ; then
    if [[ "X$OS_USERNAME" != "X" ]] ; then
        echo "OS_USERNAME = \"$OS_USERNAME\"" >> /opt/goldstone/goldstone/settings/production.py
    else
        ENV_NOT_SET=1
    fi

    if [[ "X$OS_PASSWORD" != "X" ]] ; then
        echo "OS_PASSWORD = \"$OS_PASSWORD\"" >> /opt/goldstone/goldstone/settings/production.py
    else
        ENV_NOT_SET=1
    fi

    if [[ "X$OS_TENANT_NAME" != "X" ]] ; then
        echo "OS_TENANT_NAME = \"$OS_TENANT_NAME\"" >> /opt/goldstone/goldstone/settings/production.py
    else
        ENV_NOT_SET=1
    fi

    if [[ "X$OS_AUTH_URL" != "X" ]] ; then
        echo "OS_AUTH_URL = \"$OS_AUTH_URL\"" >> /opt/goldstone/goldstone/settings/production.py
    else
        ENV_NOT_SET=1
    fi
fi

cd /opt/goldstone
pip install -r requirements.txt
export DJANGO_SETTINGS_MODULE=goldstone.settings.production

# Initialize agent and model templates. We'll use the lower-level functions,
# for maximum future flexibility.
python manage.py shell <<EOF
from goldstone.initial_load import _put_all_templates, _create_agent_index, _create_model_index
from goldstone.apps.core.tasks import create_daily_index 
_put_all_templates()
create_daily_index()
_create_agent_index()
_create_model_index()
EOF

python manage.py collectstatic --noinput
python manage.py syncdb <<EOF
no
EOF
python manage.py migrate

# Create a Django superuser, a.k.a. Goldstone system administrator.
python manage.py shell <<EOF
from django.contrib.auth import get_user_model
get_user_model().objects.create_superuser('admin', 'a@b.com', 'changeme')
EOF

# Create the default (only) Goldstone tenant, and a tenant_admin account that
# is also the system's default tenant admin for all new tenants.
python manage.py shell <<EOF
from fabfile import tenant_init
tenant_init(settings="production")
EOF


# Get all the ownerships back in shape.  No guarantee that we can su to apache,
# and running python during install may set some ownerships to root. This seems
# like the best approach.
chown -R apache:apache /opt/goldstone


if [[ $# == 1 && $1 == 1 ]] ; then
    ln -s /opt/goldstone /usr/lib/python2.6/site-packages/goldstone
    ln -s /etc/init.d/celeryd-default /etc/init.d/celeryd-host-stream
    ln -s /etc/init.d/celeryd-default /etc/init.d/celeryd-event-stream

    chkconfig httpd on

    chkconfig --add celerybeat
    chkconfig celerybeat on

    chkconfig --add celeryd-default
    chkconfig celeryd-default on

    chkconfig --add celeryd-host-stream
    chkconfig celeryd-host-stream on

    chkconfig --add celeryd-event-stream
    chkconfig celeryd-event-stream on

    if [[ $ENV_NOT_SET != 1 ]] ; then
        service httpd restart
        service celerybeat start
        service celeryd-default start
        service celeryd-host-stream start
        service celeryd-event-stream start
    else 
        echo "***********************************************************************"
        echo "*  To configure goldstone, add the following OpenStack parameters to  *"
        echo "*  /opt/goldstone/goldstone/settings/production.py and reboot after:   *"
        echo "*  installation has completed:                                        *"
	    echo "*     OS_USERNAME                                                     *"
	    echo "*     OS_TENANT_NAME                                                  *"
	    echo "*     OS_PASSWORD                                                     *"
	    echo "*     OS_AUTH_URL                                                     *"
        echo "***********************************************************************"
    fi
else
    service httpd restart
    service celerybeat restart
    service celeryd-default restart
    service celeryd-host-stream restart
    service celeryd-event-stream restart
fi

%preun
if [[ $# == 1 && $1 == 0 ]] ; then
    service httpd stop
    service celerybeat stop
    service celeryd-default stop
    service celeryd-host-stream stop
    service celeryd-event-stream stop
    chkconfig --del celerybeat
    chkconfig --del celeryd-default
    chkconfig --del celeryd-host-stream
    chkconfig --del celeryd-event-stream
    rm -f /usr/lib/python2.6/site-packages/goldstone 
    rm -f /etc/init.d/celeryd-host-stream
    rm -f /etc/init.d/celeryd-event-stream
fi

%postun
if [[ $# == 1 && $1 == 0 ]] ; then
    /usr/sbin/userdel goldstone
    /usr/sbin/groupdel goldstone
    rm -rf /var/run/celery
    rm -rf /var/log/celery
    # rm -rf /opt/goldstone
fi


%description
For the most up-to-date information please visit the project website
at http://www.solinea.com/goldstone.

To stay informed about new releases and other user related topics,
please register with the Solinea mailing list. It's a low volume
mailing list. More information how to register can be found on the
project's website.


%prep
# cleanup from previous builds
rm -rf %{_rpmdir}/*
rm -f %{_sourcedir}/goldstone-server*.rpm

# set up the dir structures
install -d -m 750 %{buildroot}/opt/goldstone/
install -d -m 750 %{buildroot}/opt/goldstone/external/
install -d -m 750 %{buildroot}/etc/init.d/
install -d -m 750 %{buildroot}/etc/sysconfig/
install -d -m 750 %{buildroot}/etc/httpd/conf.d/
install -d -m 750 %{buildroot}/var/log/goldstone/
install -d -m 750 %{buildroot}/var/www/goldstone/static/
install -d -m 750 %{buildroot}/opt/logstash/lib/logstash/outputs/
install -d -m 750 %{buildroot}/opt/logstash/patterns/
install -d -m 750 %{buildroot}/etc/logstash/conf.d/

# handle multiple and empty files
touch %{buildroot}/var/log/goldstone/goldstone.log
cp -R %{_sourcedir}/goldstone %{buildroot}/opt/goldstone
cp -R %{_sourcedir}/external/rsyslog %{buildroot}/opt/goldstone/external
cp -R %{_sourcedir}/external/logstash/outputs/* %{buildroot}/opt/logstash/lib/logstash/outputs
cp -R %{_sourcedir}/external/logstash/conf.d/* %{buildroot}/etc/logstash/conf.d

# fix up the settings folder contents
rm -rf %{buildroot}/opt/goldstone/goldstone/settings
install -d -m 750 %{buildroot}/opt/goldstone/goldstone/settings/
install -m 640 %{_sourcedir}/goldstone/settings/base.py %{buildroot}/opt/goldstone/goldstone/settings/__init__.py
install -m 640 %{_sourcedir}/goldstone/settings/base.py %{buildroot}/opt/goldstone/goldstone/settings/base.py
install -m 640 %{_sourcedir}/goldstone/settings/production.py %{buildroot}/opt/goldstone/goldstone/settings/production.py

# handle the rest
install -m 750 %{_sourcedir}/fabfile.py %{buildroot}/opt/goldstone/fabfile.py
install -m 640 %{_sourcedir}/requirements.txt %{buildroot}/opt/goldstone/requirements.txt
install -m 640 %{_sourcedir}/setup.cfg %{buildroot}/opt/goldstone/setup.cfg
install -m 750 %{_sourcedir}/setup.py %{buildroot}/opt/goldstone/setup.py
install -m 750 %{_sourcedir}/manage.py %{buildroot}/opt/goldstone/manage.py
install -m 640 %{_sourcedir}/README.rst %{buildroot}/opt/goldstone/README.rst
install -m 640 %{_sourcedir}/INSTALL.rst %{buildroot}/opt/goldstone/INSTALL.rst
install -m 640 %{_sourcedir}/OSS_LICENSE_DISCLOSURE.pdf %{buildroot}/opt/goldstone/OSS_LICENSE_DISCLOSURE.pdf
install -m 640 %{_sourcedir}/LICENSE.pdf %{buildroot}/opt/goldstone/LICENSE.pdf
install -m 640 %{_sourcedir}/external/httpd/zgoldstone.conf %{buildroot}/etc/httpd/conf.d/zgoldstone.conf
install -m 750 %{_sourcedir}/external/init.d/celerybeat %{buildroot}/etc/init.d/celerybeat
install -m 750 %{_sourcedir}/external/init.d/celeryd-default %{buildroot}/etc/init.d/celeryd-default
install -m 640 %{_sourcedir}/external/sysconfig/celerybeat %{buildroot}/etc/sysconfig/celerybeat
install -m 640 %{_sourcedir}/external/sysconfig/celeryd-default %{buildroot}/etc/sysconfig/celeryd-default
install -m 640 %{_sourcedir}/external/sysconfig/celeryd-host-stream %{buildroot}/etc/sysconfig/celeryd-host-stream
install -m 640 %{_sourcedir}/external/sysconfig/celeryd-event-stream %{buildroot}/etc/sysconfig/celeryd-event-stream
install -m 640 %{_sourcedir}/external/logstash/patterns/goldstone %{buildroot}/opt/logstash/patterns/goldstone

echo -n "buildroot = "
echo "%{buildroot}"
ls -R %{buildroot}
%build

%install

%clean
find %{_rpmdir} -type f -name '*.rpm' -exec cp {} %{_sourcedir} \;
rm -rf %{buildroot}

%files
%defattr(-, apache, apache)
/opt/goldstone/fabfile.py
/opt/goldstone/requirements.txt
/opt/goldstone/setup.cfg
/opt/goldstone/setup.py
/opt/goldstone/manage.py
/opt/goldstone/README.rst
/opt/goldstone/INSTALL.rst
/opt/goldstone/OSS_LICENSE_DISCLOSURE.pdf
/opt/goldstone/LICENSE.pdf
/opt/goldstone/goldstone/
%config /opt/goldstone/goldstone/settings/base.py
%config(noreplace) /opt/goldstone/goldstone/settings/production.py
/opt/goldstone/external/
/var/log/goldstone/
/var/www/goldstone/static/
%attr(-, root, goldstone) /etc/init.d/celerybeat
%attr(-, root, goldstone) /etc/init.d/celeryd-default
%attr(-, goldstone, logstash) /etc/logstash/conf.d/02-input-tcp5514
%attr(-, goldstone, logstash) /etc/logstash/conf.d/03-input-resubs
%attr(-, goldstone, logstash) /etc/logstash/conf.d/16-metrics-and-reports
%attr(-, goldstone, logstash) /etc/logstash/conf.d/17-filter-nova-api-stats
%attr(-, goldstone, logstash) /etc/logstash/conf.d/18-filter-nova-spawns
%attr(-, goldstone, logstash) /etc/logstash/conf.d/19-filter-nova-claims
%attr(-, goldstone, logstash) /etc/logstash/conf.d/20-basic-syslog
%attr(-, goldstone, logstash) /etc/logstash/conf.d/34-filter-opestack-syslog
%attr(-, goldstone, logstash) /etc/logstash/conf.d/38-filter-goldstone-nodeinfo
%attr(-, goldstone, logstash) /etc/logstash/conf.d/60-output-host-stream
%attr(-, goldstone, logstash) /etc/logstash/conf.d/61-output-event-stream
%attr(-, goldstone, logstash) /etc/logstash/conf.d/67-output-es-goldstone-agent
%attr(-, goldstone, logstash) /etc/logstash/conf.d/68-output-es-logstash
%attr(-, goldstone, logstash) /etc/logstash/conf.d/69-output-es-goldstone
%attr(-, goldstone, logstash) /etc/logstash/conf.d/70-output-resubs
%attr(-, goldstone, logstash) /etc/logstash/conf.d/99-filter-last-stop
%attr(-, goldstone, logstash) /opt/logstash/patterns/goldstone
%attr(-, goldstone, logstash) /opt/logstash/lib/logstash/outputs/celery_redis_task.rb
%config /etc/httpd/conf.d/zgoldstone.conf
%attr(-, goldstone, goldstone) %config /etc/sysconfig/celerybeat
%attr(-, goldstone, goldstone) %config /etc/sysconfig/celeryd-default
%attr(-, goldstone, goldstone) %config /etc/sysconfig/celeryd-host-stream
%attr(-, goldstone, goldstone) %config /etc/sysconfig/celeryd-event-stream


%changelog
