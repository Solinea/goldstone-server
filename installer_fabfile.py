"""Fabric file for Goldstone installation."""
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
from __future__ import print_function
from contextlib import contextmanager, nested

import os
import platform
import subprocess
from time import sleep

from fabric.api import task, local, settings as fab_settings
from fabric.colors import green, cyan, red
from fabric.utils import abort, fastprint
from fabric.operations import prompt
from fabric.context_managers import lcd, hide


ES_REPO_FILENAME = "/etc/yum.repos.d/elasticsearch-1.4.repo"

ES_REPO_TEXT = "[elasticsearch-1.4]\n" + \
    "name=Elasticsearch repository for 1.4.x packages\n" + \
    "baseurl=http://packages.elasticsearch.org/" + \
    "elasticsearch/1.4/centos\n" + \
    "gpgcheck=1\n" + \
    "gpgkey=http://packages.elasticsearch.org/GPG-KEY-elasticsearch\n" + \
    "enabled=1\n"

LOGSTASH_REPO_FILENAME = "/etc/yum.repos.d/logstash-1.4.repo"

LOGSTASH_REPO_TEXT = "[logstash-1.4]\n" + \
    "name=Logstash repository for 1.4.x packages\n" + \
    "baseurl=http://packages.elasticsearch.org/" + \
    "logstash/1.4/centos\n" + \
    "gpgcheck=1\n" + \
    "gpgkey=http://packages.elasticsearch.org/GPG-KEY-elasticsearch\n" + \
    "enabled=1\n"

BREW_PGDATA = '/usr/local/var/postgres'
CENTOS_PGDATA = '/var/lib/pgsql/data'
CENTOS_PG_HBA = CENTOS_PGDATA + "/pg_hba.conf"
CENTOS_PG_HBA_BACKUP = CENTOS_PGDATA + "/pg_hba.conf.bak"

REQUIRED_RPMS = ['gcc', 'java-1.7.0-openjdk', 'postgresql-server',
                 'postgresql-devel', 'git']

REQUIRED_PORTS = ['80/tcp', '9200/tcp', '5514/tcp', '5514/udp', '5515/tcp',
                  '5515/udp', '5516/tcp', '5516/udp']

# The Goldstone install dir
INSTALL_DIR = '/opt/goldstone'

# The Goldstone settings path, relative to the Goldstone root where we're
# executing from.
PROD_SETTINGS = "goldstone.settings.production"

# used to collect configuration data, then presented at completion
# of install.
final_report = {    # pylint: disable=C0103
    'django_admin_user': None,
    'django_admin_pass': None,
    'goldstone_admin_user': None,
    'goldstone_admin_pass': None
}


def _is_supported_centos6():
    """Return True if this is a CentOS 6.5 or 6.6 server."""

    try:
        dist = platform.linux_distribution()
        return dist[0] == 'CentOS' and dist[1] in ['6.5', '6.6']
    except Exception:  # pylint: disable=W0703
        return False

def _is_supported_centos7():
    """Return True if this a CentOS 7.0 or 7.1 server."""

    try:
        dist = platform.linux_distribution()
        return dist[0] == 'CentOS Linux' and dist[1].startswith('7.')
    except Exception:  # pylint: disable=W0703
        return False


def _is_development_mac():
    """Return True if this is a Mac."""

    try:
        dist = platform.mac_ver()
        return dist[2] == 'x86_64'
    except Exception:  # pylint: disable=W0703
        return False


def _is_rpm_installed(name):
    """Return True if an RPM is installed."""

    cmd = 'yum list installed ' + name
    with nested(hide('warnings', 'stdout', 'stderr'),
                fab_settings(warn_only=True)):
        result = local(cmd)

    return not result.failed


def _verify_required_rpms(rpms):
    """Verify that a list of RPMs is installed on the system.

    Returns the list of missing dependencies (empty list if all satisfied).

    """

    print(green("\nChecking for prerequisite RPMs."))

    missing = [name for name in rpms if not _is_rpm_installed(name)]
    return missing


def _install_epel_centos6():
    """install the epel repo."""
    if not _is_rpm_installed('epel-release'):
        local('yum install -y  '
              'http://dl.fedoraproject.org/pub/epel/6/'
              'x86_64/epel-release-6-8.noarch.rpm')


def _install_epel_centos7():
    """install the epel repo."""
    if not _is_rpm_installed('epel-release'):
        local('yum install -y  epel-release')


def _install_additional_repos():
    """Sets up yum repos used by goldstone installer."""

    print(green("\nInstalling epel, logstash, and elasticsearch repos."))

    if _is_supported_centos6():
        _install_epel_centos6()

    if _is_supported_centos7():
        _install_epel_centos7()

    local('rpm --import http://packages.elasticsearch.org/'
          'GPG-KEY-elasticsearch')

    if not os.path.isfile(ES_REPO_FILENAME):
        es_repo = open(ES_REPO_FILENAME, 'w')
        print(ES_REPO_TEXT, file=es_repo)
        es_repo.close()

    if not os.path.isfile(LOGSTASH_REPO_FILENAME):
        logstash_repo = open(LOGSTASH_REPO_FILENAME, 'w')
        print(LOGSTASH_REPO_TEXT, file=logstash_repo)
        logstash_repo.close()


def _centos6_configure_postgres_service():
    """configure postgres to start on boot and initialized the DB"""
    print(green("\nConfiguring PostgreSQL (CentOS 6)."))

    if not os.path.exists(CENTOS_PG_HBA):
        subprocess.call('service postgresql initdb'.split())

    subprocess.call('chkconfig postgresql on'.split())
    subprocess.call('service postgresql start'.split())


def _centos7_configure_postgres_service():
    """configure postgres to start on boot and initialized the DB"""
    
    print(green("\nConfiguring PostgreSQL (CentOS 7)."))
    if not os.path.exists(CENTOS_PG_HBA):
        subprocess.call('postgresql-setup initdb'.split())

    subprocess.call('systemctl enable postgresql'.split())
    subprocess.call('systemctl start postgresql'.split())


def _centos_setup_postgres(pg_passwd):
    """Configure postgresql on a CentOS 6.x system."""
    from os import rename
    from time import sleep

    if _is_supported_centos6():
        _centos6_configure_postgres_service()

    if _is_supported_centos7():
        _centos7_configure_postgres_service()

    # ugly, but using pg_ctl reload doesn't wait, and pg_ctl restart
    # puts it out of sync with service control.
    sleep(10)
    subprocess.call('su - postgres -c "createdb goldstone"', shell=True)

    print(green("\nCreating the PostgreSQL goldstone user."))

    remote_cmd = "createuser goldstone -s -d -P<<EOF\n" + \
                 pg_passwd + "\n" + \
                 pg_passwd + "\nEOF\n"
    subprocess.call('su - postgres -c "' + remote_cmd + '"', shell=True)

    # grep returns 0/False if a match is found, 1/True if not.
    cmd = "grep -q goldstone " + CENTOS_PG_HBA
    if subprocess.call(cmd.split()):

        # edit the pg_hba.conf if not goldstone entry was found.
        rename(CENTOS_PG_HBA, CENTOS_PG_HBA_BACKUP)
        with nested(open(CENTOS_PG_HBA, 'w'), open(CENTOS_PG_HBA_BACKUP, 'r')) \
                as (pg_hba_fd, infile):

            print("local\tall\tgoldstone\tpassword", file=pg_hba_fd)
            print("host\tall\tgoldstone\t127.0.0.1/32\tpassword",
                  file=pg_hba_fd)
            print("host\tall\tgoldstone\t::1/128\tpassword", file=pg_hba_fd)
            # now tack on the original file
            pg_hba_fd.write(infile.read())

        # reload the config
        subprocess.call('service postgresql force-reload'.split())
        # ugly, but using pg_ctl reload doesn't wait, and pg_ctl restart
        # puts it out of sync with service control.
        sleep(10)


def _is_root_user():
    """Return True if the user is running as root."""
    import getpass

    return getpass.getuser() == "root"


def _fix_setuptools():
    """Workaround for https://bugs.launchpad.net/pbr/+bug/1369179"""

    print(green("\nUpdating distribute and setuptools modules."))

    with nested(hide('warnings', 'stdout', 'stderr'),
                fab_settings(warn_only=True)):
        local('pip install --upgrade distribute')
        local('pip install --upgrade setuptools')

@task
def _centos_preinstall(pg_passwd):
    """Perform the pre-installation steps on CentOS."""

    if not _is_root_user():
        abort(red('\nThis task must be run as root. Exiting...'))

    missing = _verify_required_rpms(REQUIRED_RPMS)
    if missing:
        abort(red("\nPlease rerun this task after the following RPMs are "
              "installed: %s" % str(missing)))

    _install_additional_repos()
    _centos_setup_postgres(pg_passwd)
    _fix_setuptools()


def _development_mac_preinstall():
    """Verify/set up Goldstone dev environment on MacOS."""
    pass


def _validate_path(path):
    """Return the path if it exists, otherwise raise an exception."""

    if not os.path.exists(path):
        raise ValueError("File does not exist.")

    return path


def _install_rpm(rpm_file):
    """Install the downloaded RPM."""

    print()
    print(green("Installing the Goldstone server RPM."))

    if rpm_file is None:
        rpm_file = prompt(cyan("Enter path to the goldstone-server RPM: "),
                          default="./goldstone-server.rpm")

    cmd = 'yum localinstall -y ' + rpm_file
    result = not local(cmd)

    # if not _is_rpm_installed('goldstone-server'):
    #     abort(red("Failed to install the goldstone-server RPM."))

    return result


def _django_manage(command,
                   target='',
                   proj_settings=None,
                   install_dir=INSTALL_DIR,
                   daemon=False):
    """Run manage.py <command>.

    :param command: The command to send to manage. E.g., test
    :type command: str
    :keyword target:A subcommand to send to manage. E.g., test user
    :type target: str
    :keyword proj_settings: The project settings to use
    :type proj_settings: str
    :keyword install_dir: The path to the Goldstone installation directory.
    :type install_dir: str
    :keyword daemon: True if the command should be run in a background process
    :type daemon: bool

    """

    # Create the --settings argument, if requested.
    settings_opt = '' if proj_settings is None \
                   else " --settings=%s " % proj_settings

    # Run this command as a background process, if requested.
    daemon_opt = "&" if daemon else ''

    with nested(lcd(install_dir), hide('stdout', 'stderr', 'warnings')):
        local("./manage.py %s %s %s %s" %
              (command, target, settings_opt, daemon_opt))


@contextmanager
def _django_env(proj_settings, install_dir):
    """Load a new context into DJANGO_SETTINGS_MODULE."""
    import sys

    sys.path.append(install_dir)
    old_settings = os.environ.get('DJANGO_SETTINGS_MODULE')
    os.environ['DJANGO_SETTINGS_MODULE'] = proj_settings

    # Yield control.
    yield

    # Restore state.
    sys.path.remove(install_dir)
    if old_settings is None:
        del os.environ['DJANGO_SETTINGS_MODULE']
    else:
        os.environ['DJANGO_SETTINGS_MODULE'] = old_settings


def _collect_static(proj_settings, install_dir):
    """Collect static files if settings.STATIC_ROOT is defined."""

    with _django_env(proj_settings, install_dir):
        from django.conf import settings

        if settings.STATIC_ROOT is not None:
            print(green("Collecting the static files under the web server.\n"))
            _django_manage("collectstatic --noinput",
                           proj_settings=proj_settings,
                           install_dir=install_dir)


def _reconcile_hosts(proj_settings, install_dir):
    """Build the initial entries in the Hosts table from agg of loggers."""

    with _django_env(proj_settings, install_dir):
        from goldstone.nova.tasks import reconcile_hosts

        print(green("Collecting information about Openstack resources."))
        reconcile_hosts()


@task
def cloud_init(gs_tenant,
               stack_tenant,
               stack_user,
               stack_password,
               stack_auth_url,
               settings=PROD_SETTINGS,
               install_dir=INSTALL_DIR):
    """Create a single OpenStack cloud under the tenant.

    :keyword gs_tenant: The name of the tenant to be created. If not specified,
                        a default is used.
    :type gs_tenant: str
    :keyword stack_tenant: The openstack tenant to associate with this tenant
    :type stack_tenant: str
    :keyword stack_admin: The openstack username to authenticate with
    :type stack_admin: str
    :keyword stack_password: The openstack password to authenticate with
    :type stack_password: str
    :keyword stack_auth_url: The openstack auth url (without version)
    :type stack_auth_url: str
    :keyword settings: The path of the Django settings file to use.
    :type settings: str
    :keyword install_dir: The path to the Goldstone installation directory.
    :type install_dir: str

    """

    # The OpenStack identity authorization URL has a version number segment.
    # This is the authorization version we use. It should end with a slash, but
    # maybe that's not necessary.
    CLOUD_AUTH_URL_VERSION = "v3/"

    with _django_env(settings, install_dir):
        from goldstone.tenants.models import Cloud
        from django.core.exceptions import ObjectDoesNotExist

        try:
            # unique constraint on (tenant, tenant_name, and username)
            Cloud.objects.get(tenant=gs_tenant, tenant_name=stack_tenant,
                              username=stack_user)
        except ObjectDoesNotExist:
            if stack_tenant is None:
                stack_tenant = prompt(cyan("Enter Openstack tenant name: "),
                                      default='admin')
            if stack_user is None:
                stack_user = prompt(cyan("Enter Openstack user name: "),
                                    default='admin')
            if stack_password is None:
                stack_password = prompt(
                    cyan("Enter Openstack user password: "))
            if stack_auth_url is None:
                stack_auth_url = prompt(
                    cyan("Enter Openstack auth url base, without the version "
                         "(ex: http://10.10.10.10:5000/): "))
            stack_auth_url = os.path.join(stack_auth_url,
                                          CLOUD_AUTH_URL_VERSION)
            Cloud.objects.create(tenant=gs_tenant,
                                 tenant_name=stack_tenant,
                                 username=stack_user,
                                 password=stack_password,
                                 auth_url=stack_auth_url)
        else:
            fastprint("\nCloud entry already exists.")


def _configure_centos7_firewalld():

    print(green("\nConfiguring firewalld to allow Goldstone traffic.\n"))
    # make sure firewall is started
    local('systemctl start firewalld.service')
    default_zone = local('firewall-cmd --get-default-zone', capture=True)
    for port in REQUIRED_PORTS:
        local('firewall-cmd --zone ' + default_zone + ' --add-port=' + port)

    local('firewall-cmd --runtime-to-permanent')
    local('systemctl restart firewalld.service')


def _configure_centos7_services():
    """Configure required services to start on boot, and start them now."""

    with nested(hide('warnings', 'stderr', 'stdout'),
                fab_settings(warn_only=True)):

        # set selinux to permissive mode for this boot
        local('setenforce permissive')
        local('systemctl enable firewalld.service')

        _configure_centos7_firewalld()
        local('systemctl enable elasticsearch.service')
        local('systemctl restart elasticsearch.service')
        local('systemctl enable redis.service')
        local('systemctl restart redis.service')
        local('systemctl enable httpd.service')
        local('systemctl restart httpd.service')
        local('service logstash enable')
        local('service logstash restart')
        local('systemctl enable celery.service')
        local('systemctl restart celery.service')
        local('systemctl enable celerybeat.service')
        local('systemctl restart celerybeat.service')


    # need to wait for ES to start.
    sleep(15)


def _configure_services():
    """Configure required services to start on boot, and start them now."""

    if _is_supported_centos6():
        # TODO currently handled by the RPM, but we should move that logic here
        pass
    elif _is_supported_centos7():
        _configure_centos7_services()


def _final_report():
    """Output the key configuration data for the installation."""

    print(green("\nConfiguration details:\n"
                "\tDjango admin: " + final_report['django_admin_user'] +
                "\n\tDjango admin password: " +
                final_report['django_admin_pass'] + "\n"
                "\n\tGoldstone admin: " +
                final_report['goldstone_admin_user'] +
                "\n\tGoldstone admin password: " +
                final_report['goldstone_admin_pass']))


@task
def django_admin_init(username='admin',
                      password=None,
                      email='root@localhost',
                      settings=PROD_SETTINGS,
                      install_dir=INSTALL_DIR):
    """Create the Django admin user in a non-interactive way.

    :keyword username: the django admin user name
    :type username: str
    :keyword password: the django admin password
    :type password: str
    :keyword email: the django admin email
    :type email: str
    :keyword settings: The path of the Django settings file to use.
    :type settings: str
    :keyword install_dir: The path to the Goldstone installation directory.
    :type install_dir: str

    """

    with _django_env(settings, install_dir):
        from django.contrib.auth import get_user_model
        from django.core.exceptions import ObjectDoesNotExist

        try:
            get_user_model().objects.get(username=username)
        except ObjectDoesNotExist:
            fastprint(green("Creating Django admin account.\n"))
            if password is None:
                password = prompt(cyan("Enter Django admin password: "))

            get_user_model().objects.create_superuser(
                username, email, password)
            final_report['django_admin_user'] = username
            final_report['django_admin_pass'] = password
            fastprint("done.\n")
        else:
            # The tenant_admin already exists. Print a message.
            fastprint("Account %s already exists. We will use it.\n" %
                      username)
            final_report['django_admin_user'] = username
            final_report['django_admin_pass'] = 'previously defined'


@task
def syncmigrate(settings=PROD_SETTINGS, install_dir=INSTALL_DIR):
    """Do a manage.py syncdb and migrate.

    :keyword settings: The path of the Django settings file to use.
    :type settings: str
    :keyword install_dir: The path to the Goldstone installation directory.
    :type install_dir: str

    """

    print(green("\nPopulating the database.\n"))

    _django_manage("syncdb --noinput --migrate",
                   proj_settings=settings,
                   install_dir=install_dir)


@task
def tenant_init(gs_tenant='default',
                gs_tenant_owner='None',
                gs_tenant_admin='gsadmin',
                gs_tenant_admin_password=None,
                settings=PROD_SETTINGS,
                install_dir=INSTALL_DIR):
    """Create a tenant and default_tenant_admin, or use existing ones; and
    create a cloud under the tenant.

    If the tenant doesn't exist, we create it.  If the admin doesn't exist, we
    create it as the default_tenant_admin, and the tenant's tenant_admin.

    If the tenant already exists, we print an informational message and leave
    it alone.

    If the admin already exists, we print an informational message. If he/she
    is not a tenant admin of the new tenant, we make him/her it. He/she gets
    made the (a) default_tenant_admin.

    :keyword gs_tenant: The name of the tenant to be created. If not specified,
                        a default is used.
    :type gs_tenant: str
    :keyword gs_tenant_owner: The tenant owner. If unspecified, a default is
                              used
    :type gs_tenant_owner: str
    :keyword gs_tenant_admin: The name of the tenant_admin to be created.  If
                              unspecified, a default is used
    :type gs_tenant_admin: str
    :keyword gs_tenant_admin_password: The admin account's password, *if* we
                                       create it
    :type gs_tenant_admin_password: str
    :keyword settings: The path of the Django settings file to use.
    :type settings: str
    :keyword install_dir: The path to the Goldstone installation directory.
    :type install_dir: str

    """

    print(green(
        "\nInitializing the Goldstone tenant and OpenStack connection."))

    with _django_env(settings, install_dir):
        # It's important to do these imports here, after DJANGO_SETTINGS_MODULE
        # has been changed!
        from django.contrib.auth import get_user_model
        from django.core.exceptions import ObjectDoesNotExist
        from goldstone.tenants.models import Tenant

        # Process the tenant.
        try:
            tenant = Tenant.objects.get(name=gs_tenant)
            fastprint("\nTenant %s already exists.\n" % tenant)
        except ObjectDoesNotExist:
            # The tenant does not already exist. Create it.
            tenant = Tenant.objects.create(name=gs_tenant,
                                           owner=gs_tenant_owner)

        # Process the tenant admin.
        try:
            user = get_user_model().objects.get(username=gs_tenant_admin)
            # The tenant_admin already exists. Print a message.
            fastprint("\nAdmin account %s already exists.\n\n" %
                      gs_tenant_admin)
            final_report['goldstone_admin_user'] = gs_tenant_admin
            final_report['goldstone_admin_pass'] = 'previously defined'
        except ObjectDoesNotExist:
            fastprint("Creating Goldstone tenant admin account.")
            if gs_tenant_admin_password is None:
                gs_tenant_admin_password = prompt(
                    cyan("\nEnter Goldstone admin password: "))

            user = get_user_model().objects.create_user(
                username=gs_tenant_admin, password=gs_tenant_admin_password)
            final_report['goldstone_admin_user'] = gs_tenant_admin
            final_report['goldstone_admin_pass'] = gs_tenant_admin_password

        # Link the tenant_admin account to this tenant.
        user.tenant = tenant
        user.tenant_admin = True
        user.default_tenant_admin = True
        user.save()

    return tenant


@task
def load(proj_settings=PROD_SETTINGS, install_dir=INSTALL_DIR):
    """Initialize the system's Elasticsearch templates.

    This is the last installation step before executing a runserver command.

    :keyword proj_settings: The path of the Django settings file to
                            use.
    :type proj_settings: str
    :keyword install_dir: Thie path to the Goldstone installation directory.
    :type install_dir: str

    """

    print(green("\nInitializing Goldstone's Elasticsearch templates."))

    with _django_env(proj_settings, install_dir):
        from goldstone.initial_load import initialize_elasticsearch

        initialize_elasticsearch()


@task
def goldstone_init(django_admin_user='admin',    # pylint: disable=R0913
                   django_admin_password=None,
                   django_admin_email='root@localhost',
                   gs_tenant='default',
                   gs_tenant_owner='None',
                   gs_tenant_admin='gsadmin',
                   gs_tenant_admin_password=None,
                   stack_tenant=None,
                   stack_user=None,
                   stack_password=None,
                   stack_auth_url=None,
                   settings=PROD_SETTINGS,
                   install_dir=INSTALL_DIR):
    """Configure goldstone after the RPM has been installed.

    :keyword django_admin_user: username for django admin
    :type django_admin_user: str
    :keyword django_admin_password: password for django admin user
    :type django_admin_password: str
    :keyword django_admin_email: email for django admin user
    :type django_admin_email: str
    :keyword gs_tenant: goldstone default tenant name
    :type gs_tenant: str
    :keyword gs_tenant_owner: goldstone default tenant owner (don't change)
    :type gs_tenant_owner: str
    :keyword gs_tenant_admin: goldstone default tenant admin username
    :type gs_tenant_admin: str
    :keyword gs_tenant_admin_password: goldstone default tenant admin's
             password
    :type gs_tenant_admin_password: str
    :keyword stack_tenant: Openstack admin tenant that this goldstone instance
                           will manage (usually admin)
    :type stack_tenant: str
    :keyword stack_user: Openstack tenant user (usually admin)
    :type stack_user: str
    :keyword stack_password: Openstack user's password
    :type stack_password: str
    :keyword stack_auth_url: Openstack auth URL without the version suffix (
                             ex: http://10.10.10.10:5000/)
    :type stack_auth_url: str
    :keyword settings: The settings file to import, relative to the current
                       directory
    :type settings: str
    :keyword install_dir: The directory where Goldstone is installed.
    :type install_dir: str

    """

    syncmigrate(settings=settings, install_dir=install_dir)

    django_admin_init(username=django_admin_user,
                      password=django_admin_password,
                      email=django_admin_email,
                      settings=settings,
                      install_dir=install_dir)

    tenant = tenant_init(gs_tenant,
                         gs_tenant_owner,
                         gs_tenant_admin,
                         gs_tenant_admin_password,
                         settings=settings,
                         install_dir=install_dir)
    cloud_init(tenant,
               stack_tenant,
               stack_user,
               stack_password,
               stack_auth_url,
               settings)

    _collect_static(settings, install_dir)
    _reconcile_hosts(settings, install_dir)
    _configure_services()
    load(proj_settings=settings)

    _final_report()


@task
def install(pg_passwd='goldstone', rpm_file=None,    # pylint: disable=R0913
            django_admin_user='admin',
            django_admin_password=None,
            django_admin_email='root@localhost',
            gs_tenant='default',
            gs_tenant_owner='None', gs_tenant_admin='gsadmin',
            gs_tenant_admin_password=None, stack_tenant=None,
            stack_user=None, stack_password=None,
            stack_auth_url=None):
    """Check prerequisites, and install Goldstone server.

    For non-interactive installation, the following parameters must be supplied
    on the command line: rpm_file, django_admin_password,
    gs_tenant_admin_password, stack_tenant, stack_user, stack_password,
    stack_auth_url.  Other parameters can be supplied to override defaults.

    Example:

    root> fab -f installer_fabfile.py install:rpm_file=goldstone-server.rpm,\
    stack_password=xyz,stack_auth_url=http://10.10.10.10:5000/,\
    stack_tenant=admin,stack_user=admin,django_admin_password=goldstone,\
    gs_tenant_admin_password=goldstone

    :keyword django_admin_user: username for django admin
    :type django_admin_user: str
    :keyword django_admin_password: password for django admin user
    :type django_admin_password: str
    :keyword django_admin_email: email for django admin user
    :type django_admin_email: str
    :keyword gs_tenant: goldstone default tenant name
    :type gs_tenant: str
    :keyword gs_tenant_owner: goldstone default tenant owner (don't change)
    :type gs_tenant_owner: str
    :keyword gs_tenant_admin: goldstone default tenant admin username
    :type gs_tenant_admin: str
    :keyword gs_tenant_admin_password: goldstone default tenant admin's
                                       password
    :type gs_tenant_admin_password: str
    :keyword stack_tenant: Openstack admin tenant that this goldstone instance
                           will manage (usually admin)
    :type stack_tenant: str
    :keyword stack_user: Openstack tenant user (usually admin)
    :type stack_user: str
    :keyword stack_password: Openstack user's password
    :type stack_password: str
    :keyword stack_auth_url: Openstack auth URL without the version suffix (
                             ex: http://10.10.10.10:5000/)
    :type stack_auth_url: str

    """

    if _is_supported_centos6() or _is_supported_centos7():
        # we should only preinstall if the rpm is not present.
        print(green("\nDetermining if goldstone-server RPM is already "
                    "installed."))
        if not _is_rpm_installed('goldstone-server'):
            _centos_preinstall(pg_passwd)

    elif _is_development_mac():
        _development_mac_preinstall()

    else:
        print()
        abort('This appears to be an unsupported platform. Exiting.')

    if (_is_supported_centos6() or _is_supported_centos7()) and \
            _install_rpm(rpm_file):
        goldstone_init(
            django_admin_user=django_admin_user,
            django_admin_password=django_admin_password,
            django_admin_email=django_admin_email,
            gs_tenant=gs_tenant, gs_tenant_owner=gs_tenant_owner,
            gs_tenant_admin=gs_tenant_admin,
            gs_tenant_admin_password=gs_tenant_admin_password,
            stack_tenant=stack_tenant, stack_user=stack_user,
            stack_password=stack_password,
            stack_auth_url=stack_auth_url)
    else:
        abort(red("Goldstone RPM installation failed.  Check the path to "
                  "the RPM file, and rerun."))

@task
def uninstall(dropdb=True, dropuser=True):
    """Removes the goldstone-server RPM, database, and user."""

    if _is_supported_centos7():
        with nested(hide('warnings', 'stderr', 'stdout'),
                    fab_settings(warn_only=True)):
            local('systemctl stop elasticsearch.service')
            local('systemctl disable elasticsearch.service')
            local('systemctl stop redis.service')
            local('systemctl disable redis.service')
            local('systemctl stop httpd.service')
            local('systemctl disable httpd.service')
            local('service logstash stop')
            local('systemctl stop celery.service')
            local('systemctl disable celery.service')
            local('systemctl stop celerybeat.service')
            local('systemctl disable celerybeat.service')

    with nested(hide('warnings', 'stderr', 'stdout'),
                fab_settings(warn_only=True)):
        local('yum remove -y goldstone-server')

    if dropdb:
        with nested(hide('warnings', 'stderr', 'stdout'),
                    fab_settings(warn_only=True)):
            local('su - postgres -c \'dropdb goldstone\'')
            if dropuser:
                # only makes sense if you've also dropped the database
                local('su - postgres -c \'dropuser goldstone\'')

            local('systemctl stop postgresql.service')
            local('systemctl disable postgresql.service')


