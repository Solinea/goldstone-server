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

from django.core.exceptions import ObjectDoesNotExist
from fabric.api import task, local, settings as fab_settings
from fabric.colors import green, cyan, red
from fabric.utils import abort, fastprint
from fabric.operations import prompt
from fabric.context_managers import lcd


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
    'django_admin_user': "None",
    'django_admin_pass': "None",
    'goldstone_admin_user': "None",
    'goldstone_admin_pass': "None",
    'port': 80
}


def _is_supported_centos7():
    """Return True if this is a CentOS 7.0 or 7.1 server."""

    try:
        dist = platform.linux_distribution()
        return dist[0] == 'CentOS Linux' and dist[1].startswith('7.')
    except Exception:  # pylint: disable=W0703
        return False


def _is_root_user():
    """Return True if the user is running as root."""
    import getpass

    return getpass.getuser() == "root"


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

    with lcd(install_dir):
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


@task
def install_repos():
    """Sets up yum repos used by goldstone installer."""

    print(green("\nInstalling logstash and elasticsearch repos."))

    if not _is_root_user():
        abort(red('\nThis task must be run as root. Exiting...'))

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


@task
def setup_postgres(pg_passwd='goldstone'):
    """Configure postgresql on a CentOS 7.x system."""
    from os import rename

    print(green("\nConfiguring PostgreSQL."))

    if not _is_root_user():
        abort(red('\nThis task must be run as root. Exiting...'))

    if not os.path.exists(CENTOS_PG_HBA):
        subprocess.call('postgresql-setup initdb'.split())

    subprocess.call('systemctl enable postgresql'.split())
    subprocess.call('systemctl start postgresql'.split())

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


@task
def install_extra_rpms():
    """Install the downloaded RPM."""

    if not _is_root_user():
        abort(red('\nThis task must be run as root. Exiting...'))

    print()
    print(green("Installing redis, logstash, and ES."))
    local('yum -y install redis elasticsearch logstash logstash-contrib')


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
    import re

    # The OpenStack identity authorization URL has a version number segment. We
    # use this version. It should not start with a slash.
    AUTH_URL_VERSION = "v3/"

    # This is used to detect a version segment at an authorization URL's end.
    AUTH_URL_VERSION_LIKELY = r'\/[vV]\d'

    with _django_env(settings, install_dir):
        from goldstone.tenants.models import Cloud

        try:
            # unique constraint on (tenant, tenant_name, and username)
            Cloud.objects.get(tenant=gs_tenant,
                              tenant_name=stack_tenant,
                              username=stack_user)
        except ObjectDoesNotExist:
            # Since the row doesn't exist, we have to create it. Ask for user
            # for each of the necessary attributes if they're not defined.
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
                stack_auth_url = \
                    prompt(cyan("Enter OpenStack auth URL "
                                "(eg: http://10.10.10.10:5000/): "))

                if re.search(AUTH_URL_VERSION_LIKELY, stack_auth_url[-9:]):
                    # The user shouldn't have included the version segment, but
                    # did anyway. Remove it.
                    version_index = re.search(AUTH_URL_VERSION_LIKELY,
                                              stack_auth_url)
                    stack_auth_url = stack_auth_url[:version_index.start()]

                # Append our version number to the base URL.
                stack_auth_url = os.path.join(stack_auth_url, AUTH_URL_VERSION)

            Cloud.objects.create(tenant=gs_tenant,
                                 tenant_name=stack_tenant,
                                 username=stack_user,
                                 password=stack_password,
                                 auth_url=stack_auth_url)
        else:
            fastprint("\nCloud entry already exists.")


def _configure_centos7_firewalld():
    """Enable, start and configure ports for firewall."""

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

    with fab_settings(warn_only=True):

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
        local('chkconfig logstash on')
        local('service logstash restart')
        local('systemctl enable celery.service')
        local('systemctl restart celery.service')
        local('systemctl enable celerybeat.service')
        local('systemctl restart celerybeat.service')

    # need to wait for ES to start.
    sleep(15)


def _configure_services():
    """Configure required services to start on boot, and start them now."""

    if _is_supported_centos7():
        _configure_centos7_services()


def _final_report():
    """Output the key configuration data for the installation."""
    import socket

    print(green("\nConfiguration details:\n"
                "\tDjango admin: " + final_report['django_admin_user'] +
                "\n\tDjango admin password: " +
                final_report['django_admin_pass'] + "\n"
                "\n\tGoldstone admin: " +
                final_report['goldstone_admin_user'] +
                "\n\tGoldstone admin password: " +
                final_report['goldstone_admin_pass'] +
                "\n\tURL: http://" + socket.gethostname() + ":" +
                str(final_report['port'])))


@task
def django_admin_init(username='admin',
                      password=None,
                      email='root@localhost',
                      settings=PROD_SETTINGS,
                      install_dir=INSTALL_DIR):
    """Create the Django admin user.

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

        try:
            get_user_model().objects.get(username=username)
        except ObjectDoesNotExist:
            fastprint(green("Creating Django admin account.\n"))
            if password is None:
                password = prompt(cyan("Enter Django admin password: "))

            get_user_model().objects.create_superuser(username,
                                                      email,
                                                      password)
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
    """Create a tenant and default_tenant_admin, or use existing ones.

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
def load_es_templates(proj_settings=PROD_SETTINGS, install_dir=INSTALL_DIR):
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
def goldstone_init(gs_tenant='default',       # pylint: disable=R0913
                   gs_tenant_owner='None',
                   gs_tenant_admin='gsadmin',
                   gs_tenant_admin_password=None,
                   stack_tenant=None,
                   stack_user=None,
                   stack_password=None,
                   stack_auth_url=None,
                   settings=PROD_SETTINGS,
                   install_dir=INSTALL_DIR):
    """Configure the Goldstone tenant, cloud, miscellaneous services, and
    templates.

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
    _configure_services()
    load_es_templates(proj_settings=settings)

    _final_report()


@task
def full_install(pg_passwd='goldstone',       # pylint: disable=R0913
                 django_admin_user='admin',
                 django_admin_password=None,
                 django_admin_email='root@localhost',
                 gs_tenant='default',
                 gs_tenant_owner='None',
                 gs_tenant_admin='gsadmin',
                 gs_tenant_admin_password=None,
                 stack_tenant=None,
                 stack_user=None,
                 stack_password=None,
                 stack_auth_url=None):
    """Do a full installation of Goldstone, including prompting the user for
    various credentials.

    To do a non-interactive installation, supply these parameters on the
    command line: rpm_file, django_admin_password, gs_tenant_admin_password,
    stack_tenant, stack_user, stack_password, stack_auth_url. Other parameters
    can be supplied to override defaults.

    Example:

    root> fab -f installer_fabfile.py install:\
    stack_password=xyz,stack_auth_url=http://10.10.10.10:5000/,\
    stack_tenant=admin,stack_user=admin,django_admin_password=goldstone,\
    gs_tenant_admin_password=goldstone

    :keyword pg_passwd: postgres password for goldstone user.  Must match
                        goldstone settings file.
    :type django_admin_user: str
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

    if _is_supported_centos7():
        install_repos()
        setup_postgres(pg_passwd)
        install_extra_rpms()

        syncmigrate()

        django_admin_init(username=django_admin_user,
                          password=django_admin_password,
                          email=django_admin_email)

        goldstone_init(gs_tenant=gs_tenant,
                       gs_tenant_owner=gs_tenant_owner,
                       gs_tenant_admin=gs_tenant_admin,
                       gs_tenant_admin_password=gs_tenant_admin_password,
                       stack_tenant=stack_tenant,
                       stack_user=stack_user,
                       stack_password=stack_password,
                       stack_auth_url=stack_auth_url)

    else:
        print()
        abort('This appears to be an unsupported platform. Exiting.')


@task
def install(django_admin_password,
            pg_passwd='goldstone',
            django_admin_user='admin',
            django_admin_email='root@localhost'):
    """Do a partial installation of Goldstone.

    This requires no interaction with the user.

    This does what full_install() does, except for creating the Goldstone
    tenant and OpenStack cloud rows in the Tenant and Cloud tables. After this
    runs, the user must log in to Goldstone as a Django admin, create a
    Goldstone tenant, and create a cloud under that tenant.

    :param django_admin_password: Password for Django admin user
    :type django_admin_password: str
    :keyword pg_passwd: Postgres password for the Goldstone account.  This must
                        match what's in the Goldstone settings file.
    :type django_admin_user: str
    :keyword django_admin_user: Username for the Django admin user
    :type django_admin_user: str
    :keyword django_admin_email: Email for the Django admin user
    :type django_admin_email: str

    """

    if _is_supported_centos7():
        install_repos()
        setup_postgres(pg_passwd)
        install_extra_rpms()

        syncmigrate()

        django_admin_init(username=django_admin_user,
                          password=django_admin_password,
                          email=django_admin_email)

        _collect_static(PROD_SETTINGS, INSTALL_DIR)
        _configure_services()
        load_es_templates()

        _final_report()

    else:
        print()
        abort('This appears to be an unsupported platform. Exiting.')


@task
def uninstall(dropdb=True, dropuser=True):
    """Removes the goldstone-server RPM, database, and user."""

    if _is_supported_centos7():
        with fab_settings(warn_only=True):
            local('systemctl stop elasticsearch.service')
            local('systemctl disable elasticsearch.service')
            local('systemctl stop redis.service')
            local('systemctl disable redis.service')
            local('systemctl stop httpd.service')
            local('systemctl disable httpd.service')
            local('service logstash stop')
            local('chkconfig logstash off')
            local('systemctl stop celery.service')
            local('systemctl disable celery.service')
            local('systemctl stop celerybeat.service')
            local('systemctl disable celerybeat.service')

    if dropdb:
        with fab_settings(warn_only=True):
            local('su - postgres -c \'dropdb goldstone\'')
            if dropuser:
                # only makes sense if you've also dropped the database
                local('su - postgres -c \'dropuser goldstone\'')

            local('systemctl stop postgresql.service')
            local('systemctl disable postgresql.service')

    with fab_settings(warn_only=True):
        local('yum remove -y goldstone-server')
