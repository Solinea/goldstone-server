Name:           goldstone-ui
# Need to talk to Ken or John about Version and Release numbering.
Version:        2014.1
Release:        2.20130120gd1c71d3
# Get clarification on project summary. For now use this to build srpm.
Summary:        Goldstone

# Use this holder license to build srpm until clarified.
License:        Proprietary
URL:            http://solinea.com/
Source0:        %{name}-%{version}.dev292.gd1c71d3.tar.bz2

BuildArch:      noarch
BuildRequires:  python2-devel
BuildRequires:  python-setuptools
BuildRequires:  python-pbr

Requires:       Django14
# Will need to pull python-celery from fedora master. el6 is at 2.2.8
Requires:       python-celery >= 3.1.7
Requires:       python-django-celery
Requires:       python-novaclient
Requires:       python-psycopg2
Requires:       python-wsgiref >= 0.1.2
# Has been built for epel6 and is currently in the updates-testing repo
Requires:       python-django-south >= 0.8.4
Requires:       python-django-admin-bootstrapped
Requires:       python-django-crispy-forms


%description


%prep
%setup -q -n %{name}-%{version}.dev292.gd1c71d3


%build
%{__python} setup.py build


%install
rm -rf $RPM_BUILD_ROOT
%{__python} setup.py install -O1 --skip-build --root $RPM_BUILD_ROOT --prefix=/opt/goldstone


%files
# Any documentation should be packaged? AUTHORS?
%doc
#%{python_sitelib}/*
%dir /opt/goldstone
%dir /opt/goldstone/lib
%dir /opt/goldstone/lib/python2.6
%dir /opt/goldstone/lib/python2.6/site-packages
/opt/goldstone/lib/python2.6/site-packages/*


%changelog
* Tue Jan 21 2014 Brian Pepple <bpepple@fedoraproject.org> - 2014.1-2.20130120gd1c71d3
- Build for latest git commit.

* Sat Jan 11 2014 Brian Pepple <bpepple@fedoraproject.org> - 2014.1-1
- Initial spec file.
