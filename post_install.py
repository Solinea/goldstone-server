"""Post install steps file for Goldstone Server."""
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
from contextlib import contextmanager

import os
import platform

from django.core.exceptions import ObjectDoesNotExist

from fabric.colors import green, cyan, red
from fabric.utils import fastprint
from fabric.operations import prompt


# The Goldstone install dir
INSTALL_DIR = os.environ.get('GOLDSTONE_INSTALL_DIR', '/home/app')
SETTINGS = \
    os.environ.get('DJANGO_SETTTINGS_MODULE', 'goldstone.settings.docker')


def cloud_init(gs_tenant,
               stack_tenant,
               stack_user,
               stack_password,
               stack_auth_url,
               settings=SETTINGS,
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
    from goldstone.tenants.models import Cloud

    # The OpenStack identity authorization URL has a version number segment. We
    # use this version. It should not start with a slash.
    AUTH_URL_VERSION = "v3/"

    # This is used to detect a version segment at an authorization URL's end.
    AUTH_URL_VERSION_LIKELY = r'\/[vV]\d'

    # Ask for user for two of the necessary attributes if they're not
    # defined.
    if stack_tenant is None:
        stack_tenant = prompt(cyan("Enter Openstack tenant name: "),
                              default='admin')
    if stack_user is None:
        stack_user = prompt(cyan("Enter Openstack user name: "),
                            default='admin')
    try:
        # Note: There's a db unique constraint on (tenant, tenant_name, and
        # username).
        Cloud.objects.get(tenant=gs_tenant,
                          tenant_name=stack_tenant,
                          username=stack_user)
    except ObjectDoesNotExist:
        # The row doesn't exist, so we have to create it. To do that, we
        # need two more pieces of information.
        if stack_password is None:
            stack_password = prompt(
                cyan("Enter Openstack user password: "))

        if stack_auth_url is None:
            stack_auth_url = \
                prompt(cyan("Enter OpenStack auth URL "
                            "(eg: http://10.10.10.10:5000/v2.0/): "))

            if re.search(AUTH_URL_VERSION_LIKELY, stack_auth_url[-9:]):
                # The user shouldn't have included the version segment, but
                # did anyway. Remove it.
                version_index = re.search(AUTH_URL_VERSION_LIKELY,
                                          stack_auth_url)
                stack_auth_url = stack_auth_url[:version_index.start()]

            # Append our version number to the base URL.
            stack_auth_url = os.path.join(stack_auth_url, AUTH_URL_VERSION)

        # Create the row!
        Cloud.objects.create(tenant=gs_tenant,
                             tenant_name=stack_tenant,
                             username=stack_user,
                             password=stack_password,
                             auth_url=stack_auth_url)
    else:
        fastprint("\nCloud entry already exists.")


def django_admin_init(username='admin',
                      password=None,
                      email='root@localhost',
                      settings=SETTINGS,
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
    from django.contrib.auth import get_user_model

    try:
        get_user_model().objects.get(username=username)
    except ObjectDoesNotExist:
        fastprint(green("Creating Django admin account.\n"))
        if password is None:
            password = prompt(cyan("Enter Django admin password: "))

        get_user_model().objects.create_superuser(username, email, password)
        fastprint("done.\n")
    else:
        # The tenant_admin already exists. Print a message.
        fastprint("Account %s already exists. We will use it.\n" % username)


def tenant_init(gs_tenant='default',
                gs_tenant_owner='None',
                gs_tenant_admin='gsadmin',
                gs_tenant_admin_password=None,
                settings=SETTINGS,
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
    from django.contrib.auth import get_user_model
    from goldstone.tenants.models import Tenant

    print(green(
        "\nInitializing the Goldstone tenant and OpenStack connection."))

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
    except ObjectDoesNotExist:
        fastprint("Creating Goldstone tenant admin account.")
        if gs_tenant_admin_password is None:
            gs_tenant_admin_password = prompt(
                cyan("\nEnter Goldstone admin password: "))

        user = get_user_model().objects.create_user(
            username=gs_tenant_admin, password=gs_tenant_admin_password)

    # Link the tenant_admin account to this tenant.
    user.tenant = tenant
    user.tenant_admin = True
    user.default_tenant_admin = True
    user.save()

    return tenant


def docker_install():
    """Create Goldstone default tenant and initialize cloud, deriving values
    from environment variables provided in the Dockerfile.

    If env vars are not provided by the container, then the install will be
    made in a way that is configured for the goldstone developer environment.

    Supported env vars are:

    DJANGO_SETTINGS_MODULE (default: goldstone.settings.docker)
    GOLDSTONE_INSTALL_DIR (default: /home/app)
    DJANGO_ADMIN_USER (default: admin)
    DJANGO_ADMIN_PASSWORD (default: goldstone)
    DJANGO_ADMIN_EMAIL (default: root@localhost)
    GOLDSTONE_TENANT_ADMIN_PASSWORD (default: goldstone)
    OS_TENANT_NAME (default: admin)
    OS_USERNAME (default: admin)
    OS_PASSWORD (default: solinea)
    OS_AUTH_URL (default: http://172.24.4.100:5000/v2.0/)

    """
    # test to see that this really is a docker container.
    if not os.path.isfile('/.dockerinit'):
        print(red('This Does not appear to be a docker container. Exiting.'))
        exit(1)

    # pull params out of the environment
    django_admin_user = os.environ.get('DJANGO_ADMIN_USER', 'admin')
    django_admin_password = os.environ.get(
        'DJANGO_ADMIN_PASSWORD', 'goldstone')
    django_admin_email = os.environ.get('DJANGO_ADMIN_EMAIL', 'root@localhost')
    gs_tenant = 'default'
    gs_tenant_owner = 'None'
    gs_tenant_admin = 'gsadmin'
    gs_tenant_admin_password = os.environ.get(
        'GOLDSTONE_TENANT_ADMIN_PASSWORD', 'goldstone')
    stack_tenant = os.environ.get('OS_TENANT_NAME', 'admin')
    stack_user = os.environ.get('OS_USERNAME', 'admin')
    stack_password = os.environ.get('OS_PASSWORD', 'solinea')
    stack_auth_url = os.environ.get(
        'OS_AUTH_URL', 'http://172.24.4.100:5000/v2.0/')

    print(green("Setting up Django admin account."))
    django_admin_init(
        username=django_admin_user,
        password=django_admin_password,
        email=django_admin_email
    )
    print(green("Setting up default Goldstone tenant admin account."))
    tenant = tenant_init(
        gs_tenant,
        gs_tenant_owner,
        gs_tenant_admin,
        gs_tenant_admin_password
    )

    print(green("Initializing connection to OpenStack cloud."))
    cloud_init(
        tenant,
        stack_tenant,
        stack_user,
        stack_password,
        stack_auth_url
    )


if __name__ == "__main__":
    import django
    django.setup()
    print(green("starting postinstall steps for docker environment"))
    docker_install()
    print(green("finished postinstall steps for docker environment"))
