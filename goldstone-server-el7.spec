# Copyright 2015 Solinea, Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
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
Group:          Applications/System
License:        Apache2.0
URL:            https://github.com/Solinea/goldstone-server
ExclusiveArch:  x86_64
ExclusiveOS:    linux
Prefix:         /opt

Requires(pre): /usr/sbin/useradd, /usr/bin/getent, epel-release
Requires: gcc, gcc-c++, redis, python-devel, libffi-devel, openssl-devel, httpd, mod_wsgi, unzip, zip, firewalld, python-virtualenv, java-1.7.0-openjdk, postgresql-server, postgresql-devel, git
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
    virtualenv /opt/goldstone
fi
. /opt/goldstone/bin/activate
export DJANGO_SETTINGS_MODULE=goldstone.settings.production
cd /opt/goldstone
pip install -r requirements.txt

# Get all the ownerships back in shape.  No guarantee that we can su to goldstone,
# and running python during install may set some ownerships to root. This seems
# like the best approach.
chown -R goldstone:goldstone /opt/goldstone

%preun

%postun
if [[ $# == 1 && $1 == 0 ]] ; then 
    rm -rf /opt/goldstone
fi

%description
For the most up-to-date information please visit the project website
at https://github.com/solinea/goldstone-server.

To stay informed about new releases and other user related topics,
please register with the Solinea mailing list. It's a low volume
mailing list. More information how to register can be found on the
project's website.


%prep
# cleanup from previous builds
rm -rf %{buildroot}/*
rm -rf %{_rpmdir}/*
rm -f %{_sourcedir}/goldstone-server-[0-9]*.rpm
find %{_sourcedir} -type f -name '*.py[co]' -exec rm -f {} \;

%build

%install
# set up the dir structures
install -d -m 750 %{buildroot}/opt/goldstone/
install -d -m 750 %{buildroot}/opt/goldstone/external/
install -d -m 750 %{buildroot}/etc/init.d/
install -d -m 750 %{buildroot}/etc/sysconfig/
install -d -m 750 %{buildroot}/usr/lib/systemd/system/
install -d -m 750 %{buildroot}/etc/selinux/
install -d -m 750 %{buildroot}/etc/httpd/conf.d/
install -d -m 750 %{buildroot}/var/log/goldstone/
install -d -m 750 %{buildroot}/var/www/goldstone/static/
install -d -m 750 %{buildroot}/opt/logstash/patterns/
install -d -m 750 %{buildroot}/etc/logstash/conf.d/

# handle multiple and empty files
touch %{buildroot}/var/log/goldstone/goldstone.log
cp -R %{_sourcedir}/goldstone %{buildroot}/opt/goldstone
cp -R %{_sourcedir}/external/rsyslog %{buildroot}/opt/goldstone/external
cp -R %{_sourcedir}/external/logstash/conf.d/* %{buildroot}/etc/logstash/conf.d

# fix up the settings folder contents
rm -rf %{buildroot}/opt/goldstone/goldstone/settings
install -d -m 750 %{buildroot}/opt/goldstone/goldstone/settings/
install -m 640 %{_sourcedir}/goldstone/settings/__init__.py %{buildroot}/opt/goldstone/goldstone/settings/__init__.py
install -m 640 %{_sourcedir}/goldstone/settings/base.py %{buildroot}/opt/goldstone/goldstone/settings/base.py
install -m 640 %{_sourcedir}/goldstone/settings/production.py %{buildroot}/opt/goldstone/goldstone/settings/production.py

# handle the rest
install -m 640 %{_sourcedir}/requirements.txt %{buildroot}/opt/goldstone/requirements.txt
install -m 640 %{_sourcedir}/setup.cfg %{buildroot}/opt/goldstone/setup.cfg
install -m 750 %{_sourcedir}/setup.py %{buildroot}/opt/goldstone/setup.py
install -m 750 %{_sourcedir}/manage.py %{buildroot}/opt/goldstone/manage.py
install -m 640 %{_sourcedir}/README.md %{buildroot}/opt/goldstone/README.md
install -m 640 %{_sourcedir}/INSTALL.md %{buildroot}/opt/goldstone/INSTALL.md
install -m 640 %{_sourcedir}/LICENSE %{buildroot}/opt/goldstone/LICENSE
install -m 640 %{_sourcedir}/external/httpd/zgoldstone-el7.conf %{buildroot}/etc/httpd/conf.d/zgoldstone.conf
install -m 640 %{_sourcedir}/external/selinux/config %{buildroot}/etc/selinux/config
install -m 640 %{_sourcedir}/external/logstash/patterns/goldstone %{buildroot}/opt/logstash/patterns/goldstone
install -m 640 %{_sourcedir}/external/sysconfig/celery-el7 %{buildroot}/etc/sysconfig/celery
install -m 640 %{_sourcedir}/external/systemd/system/celery-el7.service %{buildroot}/usr/lib/systemd/system/celery.service
install -m 640 %{_sourcedir}/external/systemd/system/celerybeat-el7.service %{buildroot}/usr/lib/systemd/system/celerybeat.service

find %{buildroot}/opt/goldstone -type f -name '*.py[oc]' -exec rm -f {} \;

%clean
find %{_rpmdir} -type f -name '*.rpm' -exec cp {} %{_sourcedir} \;
rm -rf %{buildroot}
 
# disable the default behavior of compiling python bits
%global __os_install_post %(echo '%{__os_install_post}' | sed -e 's!/usr/lib[^[:space:]]*/brp-python-bytecompile[[:space:]].*$!!g')

%files
%defattr(-, goldstone, goldstone)
/opt/goldstone/requirements.txt
/opt/goldstone/setup.cfg
/opt/goldstone/setup.py
/opt/goldstone/manage.py
/opt/goldstone/README.md
/opt/goldstone/INSTALL.md
/opt/goldstone/LICENSE
/opt/goldstone/goldstone/
%config /opt/goldstone/goldstone/settings/base.py
%config(noreplace) /opt/goldstone/goldstone/settings/production.py
/opt/goldstone/external/
/var/log/goldstone/
/var/www/goldstone/static/
%attr(-, goldstone, logstash) /etc/logstash/conf.d/02-input-tcp5514
%attr(-, goldstone, logstash) /etc/logstash/conf.d/03-input-resubs
%attr(-, goldstone, logstash) /etc/logstash/conf.d/16-metrics-and-reports
%attr(-, goldstone, logstash) /etc/logstash/conf.d/17-filter-nova-api-stats
%attr(-, goldstone, logstash) /etc/logstash/conf.d/18-filter-nova-spawns
%attr(-, goldstone, logstash) /etc/logstash/conf.d/19-filter-nova-claims
%attr(-, goldstone, logstash) /etc/logstash/conf.d/20-basic-syslog
%attr(-, goldstone, logstash) /etc/logstash/conf.d/34-filter-opestack-syslog
%attr(-, goldstone, logstash) /etc/logstash/conf.d/38-filter-goldstone-nodeinfo
%attr(-, goldstone, logstash) /etc/logstash/conf.d/66-output-es-goldstone-metrics
%attr(-, goldstone, logstash) /etc/logstash/conf.d/67-output-es-goldstone-reports
%attr(-, goldstone, logstash) /etc/logstash/conf.d/68-output-es-logstash
%attr(-, goldstone, logstash) /etc/logstash/conf.d/69-output-es-goldstone
%attr(-, goldstone, logstash) /etc/logstash/conf.d/70-output-resubs
%attr(-, goldstone, logstash) /etc/logstash/conf.d/99-filter-last-stop
%attr(-, goldstone, logstash) /opt/logstash/patterns/goldstone
%attr(-, apache, goldstone) %config /etc/httpd/conf.d/zgoldstone.conf
%attr(-, root, root) %config /etc/selinux/config
%config /etc/sysconfig/celery
%config /usr/lib/systemd/system/celery.service
%config /usr/lib/systemd/system/celerybeat.service


%changelog
