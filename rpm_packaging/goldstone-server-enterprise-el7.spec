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

%define version       %{getenv:GOLDSTONE_RPM_VERSION}
%define release       %{getenv:GOLDSTONE_RPM_RELEASE}
%define epoch         %{getenv:GOLDSTONE_RPM_EPOCH}

Summary:        Solinea Goldstone Server Enterprise
Name:           goldstone-server-enterprise
Version:        %{version}
Release:        %{release}%{?dist}
Epoch:          %{epoch}
Group:          Applications/System
License:        Core Server: Apache 2.0, Addons: Solinea 1.0
URL:            https://solinea.com/goldstone
ExclusiveArch:  x86_64
ExclusiveOS:    linux
Prefix:         /opt

Requires(pre): /usr/sbin/useradd, /usr/bin/getent, curl, docker-selinux
Requires(postun): /usr/sbin/userdel, /usr/sbin/groupdel

%pre
{ [ -z "$GOLDSTONE_REPO_USER" ] || [ -z "$GOLDSTONE_REPO_PASS" ] || [ -z "$GOLDSTONE_REPO_USER" ] ; }  \
    && { echo "GOLDSTONE_REPO_USER, GOLDSTONE_REPO_PASS, and GOLDSTONE_REPO_EMAIL environment var must be set" && exit 1 ; }

echo "Logging in to Goldstone enterprise docker repo"
docker login -u "${GOLDSTONE_REPO_USER}" -p "${GOLDSTONE_REPO_PASS}" -e "${GOLDSTONE_REPO_EMAIL}" gs-docker-ent.bintray.io

/usr/bin/getent group goldstone \
    || /usr/sbin/groupadd -r goldstone
/usr/bin/getent passwd goldstone \
    || /usr/sbin/useradd -r -g goldstone -d %{prefix}/goldstone -s /sbin/nologin goldstone

%post

# restart the syslog daemon
systemctl restart rsyslog

if [[ $# == 1 && $1 == 1 ]] ; then
    echo "Installing docker-compose to %{prefix}/goldstone/bin"
    echo ""
    /usr/bin/curl -# -o %{prefix}/goldstone/bin/docker-compose --create-dirs -L \
        https://github.com/docker/compose/releases/download/1.4.0/docker-compose-`uname -s`-`uname -m` \
        && chmod +x %{prefix}/goldstone/bin/docker-compose
   
fi

echo "Pulling goldstone containers"
%{prefix}/goldstone/bin/docker-compose -f %{prefix}/goldstone/docker-compose.yml pull

echo "*****************************************************************************"
echo ""
echo " Modify %{prefix}/goldstone/config/goldstone-prod.env"
echo " before starting goldstone-server. See %{prefix}/goldstone/INSTALL.md"
echo " for details."
echo ""
echo " To enable and start goldstone-server, run:"
echo ""
echo "     systemctl enable goldstone-server"
echo "     systemctl start goldstone-server"
echo ""
echo "*****************************************************************************"

%preun

# shut down service
systemctl stop goldstone-server
systemctl disable goldstone-server

# remove stopped containers
echo "Removing containers..."
docker rm -f $(docker ps -a | grep goldstone | awk '{print $1}' | xargs) || /bin/true
echo "Removing images..."
docker rmi -f $(docker images | grep goldstone | awk '{print $3}' | xargs) || /bin/true

%postun

# delete the goldstone user and group if this is the last instance
if [[ $# == 1 && $1 == 0 ]] ; then
    rm -rf /opt/goldstone/bin > /dev/null 2>&1 \
        || /bin/true
    /usr/sbin/userdel goldstone > /dev/null 2>&1 \
        || /bin/true
    /usr/sbin/groupdel goldstone > /dev/null 2>&1 \
        || /bin/true
fi

%description
For the most up-to-date information please visit the project website
at https://github.com/solinea/goldstone-server.

To stay informed about new releases and other user related topics,
please register with the Solinea mailing list. It's a low volume
mailing list. More information on how to register can be found on the
project's website.

%prep
# cleanup from previous builds
rm -rf %{buildroot}/*
rm -rf %{_rpmdir}/*
rm -f %{_sourcedir}/goldstone-server-[0-9]*.rpm

%build

%install
# set up the dir structures
install -d -m 750 %{buildroot}/opt/goldstone/
install -d -m 755 %{buildroot}/usr/lib/systemd/system/
install -d -m 755 %{buildroot}/etc/rsyslog.d/
install -d -m 755 %{buildroot}/var/log/goldstone/
install -d -m 750 %{buildroot}/opt/goldstone/config
install -d -m 750 %{buildroot}/opt/goldstone/data

# handle multiple and empty files
touch %{buildroot}/var/log/goldstone/goldstone.log
cp -R %{_sourcedir}/docker/config %{buildroot}/opt/goldstone
cp -R %{_sourcedir}/docker/data %{buildroot}/opt/goldstone

install -m 644 %{_sourcedir}/README.md %{buildroot}/opt/goldstone/README.md
install -m 644 %{_sourcedir}/docs/INSTALL.md %{buildroot}/opt/goldstone/INSTALL.md
install -m 644 %{_sourcedir}/docs/CHANGELOG.md %{buildroot}/opt/goldstone/CHANGELOG.md
install -m 644 %{_sourcedir}/LICENSE %{buildroot}/opt/goldstone/LICENSE
install -m 644 %{_sourcedir}/docker/docker-compose-enterprise.yml %{buildroot}/opt/goldstone/docker-compose.yml
install -m 644 %{_sourcedir}/external/systemd/system/goldstone-server.service %{buildroot}/usr/lib/systemd/system/goldstone-server.service
install -m 644 %{_sourcedir}/external/rsyslog/goldstone.conf %{buildroot}/etc/rsyslog.d/goldstone.conf

%clean
rm -rf %{buildroot}
 
%files
%defattr(-, goldstone, goldstone)
/opt/goldstone/README.md
/opt/goldstone/INSTALL.md
/opt/goldstone/CHANGELOG.md
/opt/goldstone/LICENSE
/opt/goldstone/docker-compose.yml
/opt/goldstone/config/
/opt/goldstone/data/
/var/log/goldstone/
%config %attr(-, root, root) /usr/lib/systemd/system/goldstone-server.service
%config %attr(-, root, root) /etc/rsyslog.d/goldstone.conf

%changelog
