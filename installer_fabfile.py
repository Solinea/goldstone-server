"""Fabric file for Goldstone installation."""
# Copyright 2015 Solinea, Inc.
#
# Licensed under the Solinea Software License Agreement (Goldstone),
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
from __future__ import print_function

import os
import platform
import subprocess

from fabric.api import task, local
from fabric.colors import green, cyan, red
from fabric.utils import abort
from fabric.operations import prompt


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


def _is_supported_centos6():
    """Is this a CentOS 6.5 or 6.6 server"""

    try:
        dist = platform.linux_distribution()
        return dist[0] == 'CentOS' and dist[1] in ['6.5', '6.6']
    except Exception:  # pylint: disable=W0703
        return False


def _is_development_mac():
    """Is this a mac?"""
    try:
        dist = platform.mac_ver()
        return dist[2] == 'x86_64'
    except Exception:  # pylint: disable=W0703
        return False


def _is_rpm_installed(name):
    """Check to see of an RPM is installed."""
    cmd = 'yum list installed ' + name
    return not subprocess.call(cmd.split())


def _verify_required_rpms(rpms):
    """Verify that a list of RPMs is installed on the system.

    Returns the list of missing dependencies (empty list if all satisfied)."""

    print()
    print(green("Checking for prerequisite RPMs."))
    missing = [name for name in rpms if not _is_rpm_installed(name)]
    print()
    print(green("Checking for prerequisite RPMs completed."))
    return missing


def _install_additional_repos():
    """Sets up yum repos used by goldstone installer."""

    print()
    print(green("Installing epel, logstash, and elasticsearch repos..."))

    if not _is_rpm_installed('epel-release'):
        local('yum install -y  '
              'http://dl.fedoraproject.org/pub/epel/6/'
              'x86_64/epel-release-6-8.noarch.rpm')

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


def _centos6_setup_postgres():
    """Configure postgresql on a CentOS system."""
    from os import rename
    from time import sleep

    print()
    print(green("Configuring PostgreSQL..."))

    if not os.path.exists(CENTOS_PG_HBA):
        subprocess.call('service postgresql initdb'.split())

    subprocess.call('chkconfig postgresql on'.split())
    subprocess.call('service postgresql start'.split())
    sleep(10)
    subprocess.call('su - postgres -c "createdb goldstone"', shell=True)

    print(cyan("creating the PostgreSQL goldstone user.  Please enter a password..."))
    # TODO this prompts for password, then complains if the user exists
    subprocess.call('su - postgres -c "createuser goldstone -s -d -P"',
                    shell=True)

    # edit the pg_hba.conf
    rename(CENTOS_PG_HBA, CENTOS_PG_HBA_BACKUP)
    pg_hba_fd = open(CENTOS_PG_HBA, 'w')
    print("local\tall\tgoldstone\tpassword", file=pg_hba_fd)
    print("host\tall\tgoldstone\t127.0.0.1/32\tpassword", file=pg_hba_fd)
    print("host\tall\tgoldstone\t::1/128\tpassword", file=pg_hba_fd)

    # now tack on the original file
    with open(CENTOS_PG_HBA_BACKUP) as infile:
        pg_hba_fd.write(infile.read())

    # reload the config
    subprocess.call('service postgresql restart'.split())


def _is_root_user():
    """Is this running as root?"""

    import getpass

    return getpass.getuser() == "root"


def _fix_setuptools():
   """Workaround for https://bugs.launchpad.net/pbr/+bug/1369179"""
   print()
   print(green("Updating the 'distribute' pip module."))

   subprocess.call('pip install --upgrade distribute'.split())
   subprocess.call('pip install --upgrade setuptools'.split())


def _centos6_preinstall():
    """Perform the pre-installation steps on CentOS."""

    REQUIRED_RPMS = ['gcc', 'gcc-c++', 'java-1.7.0-openjdk',
                     'postgresql-server', 'postgresql-devel', 'git']

    if not _is_root_user():
        print()
        abort('This task must be run as root. Exiting...')

    missing = _verify_required_rpms(REQUIRED_RPMS)
    if missing:
        abort("Please rerun this task after the following RPMs are "
              "installed: %s" % str(missing))

    _install_additional_repos()
    _centos6_setup_postgres()
    _fix_setuptools()


def _development_mac_preinstall():
    """Verify/set up Goldstone dev environment on MacOS."""
    pass


def _license_accepted():
    """Present license information and ask user to confirm acceptance."""

    print(cyan("Goldstone is licensed under the terms of the Solinea Software "
               "License Agreement, which can be downloaded here:\n\n"
               "\thttp://www.solinea.com/goldstone/LICENSE.pdf\n\n"
               "To continue, please confirm that you have read and accept the "
               "license.\n"))
    result = prompt('Accept license [y/n]?', validate="""[yn]""")
    return result == 'y'


def _validate_path(path):
    """Check for existence of a filesystem path."""
    if not os.path.exists(path):
        raise ValueError("File does not exist.")

    return path


def _centos6_install():
    """Install the downloaded RPM."""

    print()
    print(green("Installing the Goldstone server RPM.  This could take "
                "a while."))
    user_input = prompt('Location Goldstone RPM?',
                        default='./goldstone-server.rpm',
                        validate=_validate_path)
    cmd = 'yum localinstall -y ' + user_input
    return not subprocess.call(cmd.split())


@task
def install():
    """Handle Goldstone prerequisite steps prior to installation."""

    if not _license_accepted():
        abort("Installation can't continue without accepting the license.")

    if _is_supported_centos6():

        # we should only preinstall if the rpm is not present.
        if not _is_rpm_installed('goldstone-server'):
            _centos6_preinstall()

        if _centos6_install():
            print()
            print(green("Goldstone server RPM install complete."))
            print(cyan("To complete the setup, run the following steps:\n\n"
                       "\tcd /opt/goldstone\n"
                       "\tfab goldstone_init\n"))
        else:
            print()
            print(red("Goldstone server RPM installation failed.  Please copy "
                      "the output of this script and open a ticket with "
                      "support@solinea.com"))
            abort("Goldstone RPM installation failed.")

    elif _is_development_mac():
        _development_mac_preinstall()

    else:
        print()
        abort('This appears to be an unsupported platform. Exiting...')
