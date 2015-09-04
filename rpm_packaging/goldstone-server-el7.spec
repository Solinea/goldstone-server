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
URL:            https://github.com/solinea/goldstone-server
ExclusiveArch:  x86_64
ExclusiveOS:    linux
Prefix:         /opt

Requires: docker

%post
echo "*****************************************************************************"
echo " Modify your config before starting goldstone-server."
echo "*****************************************************************************"

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
install -d -m 750 %{buildroot}/usr/lib/systemd/system/
install -d -m 750 %{buildroot}/var/log/goldstone/

# handle multiple and empty files
touch %{buildroot}/var/log/goldstone/goldstone.log
cp -R %{_sourcedir}/docker %{buildroot}/opt/goldstone

install -m 640 %{_sourcedir}/docs/README.md %{buildroot}/opt/goldstone/README.md
install -m 640 %{_sourcedir}/docs/INSTALL.md %{buildroot}/opt/goldstone/INSTALL.md
install -m 640 %{_sourcedir}/docs/CHANGELOG.md %{buildroot}/opt/goldstone/CHANGELOG.md
install -m 640 %{_sourcedir}/LICENSE %{buildroot}/opt/goldstone/LICENSE
install -m 640 %{_sourcedir}/external/systemd/system/goldstone-server.service %{buildroot}/usr/lib/systemd/system/goldstone-server.service

%clean
rm -rf %{buildroot}
 
%files
%defattr(-, goldstone, goldstone)
/opt/goldstone/README.md
/opt/goldstone/INSTALL.md
/opt/goldstone/CHANGELOG.md
/opt/goldstone/LICENSE
/opt/goldstone/docker/
/var/log/goldstone/
%config /usr/lib/systemd/system/goldstone-server.service

%changelog
