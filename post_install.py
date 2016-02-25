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

import os
import django
from django.core.exceptions import ObjectDoesNotExist

from fabric.colors import green, cyan, red
from fabric.contrib.files import upload_template, exists
from fabric.decorators import task
from fabric.utils import fastprint
from fabric.operations import prompt, run, settings as fab_settings
import operator

INSTALL_DIR = os.environ.get('APPDIR')                # set in the Dockerfile
SETTINGS = os.environ.get('DJANGO_SETTTINGS_MODULE')  # set in compose env
PROD_CONFIG = INSTALL_DIR + "/config"


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

    # production deployments will generally have the user configure settings
    # upon first login.
    if stack_tenant is None or stack_user is None or stack_auth_url is None \
            or stack_password is None:
        fastprint("\nSkipping cloud setup.")
        return None

    # developers may want to put the connection settings in the docker env
    # since they will redeploy often.
    try:
        # Note: There's a db unique constraint on (tenant, tenant_name, and
        # username).
        Cloud.objects.get(tenant=gs_tenant,
                          tenant_name=stack_tenant,
                          username=stack_user)
    except ObjectDoesNotExist:
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
    stack_tenant = os.environ.get('OS_TENANT_NAME')
    stack_user = os.environ.get('OS_USERNAME')
    stack_password = os.environ.get('OS_PASSWORD')
    stack_auth_url = os.environ.get(
        'OS_AUTH_URL')

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


#################################################
# openstack node configuration support below here
#################################################


def _set_single_value_configs(file_name, edits_list):
    """
    Edits StrOpt entries in a config file.

    :param file_name: the config file name
    :param edits_list: the list of edits to make
    :return: None
    """

    if exists(file_name, use_sudo=True, verbose=True):
        print(green("\tEditing %s" % file_name))

        for config_entry in edits_list:
            cmd = "crudini --existing=file --set %s %s %s '%s'" % \
                  (file_name, config_entry['section'],
                   config_entry['parameter'], config_entry['value'])
            run(cmd)

            print(green("\tSet %s:%s to %s" %
                        (config_entry['section'], config_entry['parameter'],
                         config_entry['value'])))
    else:
        raise IOError("File not found: %s" % file_name)


def _set_multi_value_configs(file_name, edits_list):
    """
    Edits MultiStrOpt entries in a config file.  Currently only supports adding
    a new parameter.

    :param file_name: the config file name
    :param edits_list: the list of edits to make
    :return: None
    """
    import re
    from fabric.contrib.files import sed, contains

    if exists(file_name, use_sudo=True, verbose=True):
        print(green("\tEditing %s" % file_name))

        for config_entry in edits_list:
            # hopefully match all forms of key = [other_val] val [other_val]
            # while avoiding key = [other_val] xvalx [other_val]
            # pylint: disable=W1401

            empty_setting_regex = '^\<%s\>[:space:]*=[:space]*$' % \
                                  (config_entry['parameter'])
            setting_regex = '^\<%s\>[ \t]*=.*\<%s\>.*$' % \
                            (config_entry['parameter'], config_entry['value'])

            empty_setting_exists = contains(
                file_name, empty_setting_regex, escape=False)
            setting_exists = contains(
                file_name, setting_regex, escape=False)

            if not setting_exists and empty_setting_exists:
                print(green("\tReplacing empty %s entry" %
                            (config_entry['parameter'])))
                sed(file_name,
                    '^%s[\s]*=[\s]*$' % (config_entry['parameter']),
                    '%s = %s' % (config_entry['parameter'],
                                 config_entry['value']),
                    backup='.gsbak')
                # we have our own backup, so delete the one that sed made
                run("rm %s.gsbak" % file_name)
            elif not setting_exists:
                # add a new line to the appropriate section
                print(green("\tAdding new %s entry" %
                            (config_entry['parameter'])))
                sed(file_name,
                    '^\[%s\][\s]*$' % (config_entry['section']),
                    '\[%s\]\\n%s = %s' % (config_entry['section'],
                                          config_entry['parameter'],
                                          config_entry['value']),
                    backup='.gsbak')
                # we have our own backup, so delete the one that sed made
                run("rm %s.gsbak" % file_name)
            else:
                print(green("\tNo changes required for %s" %
                            (config_entry['parameter'])))

    else:
        raise IOError("File not found: %s" % file_name)


def _backup_config_file(file_name, backup_postfix, previously_backed_up):
    """Back up a configuration file if it hasn't been backed up already.

    :param file_name: name of file
    :param backup_postfix: postfix to append
    :param previously_backed_up: list of already backed up files
    :return: updated previously backed up files
    """
    if file_name not in previously_backed_up and \
            exists(file_name, use_sudo=True, verbose=True):

        backup_file = file_name + "." + str(backup_postfix)
        run("cp " + file_name + " " + backup_file)
        previously_backed_up.append(file_name)

    return previously_backed_up


def _configure_service(service_name, backup_postfix, single_value_edits,
                       multi_value_edits, template_dir, template_files):
    """
    Configure a service as defined in the supplied params.
    :param service_name: eg: Nova
    :param single_value_edits: dict of configuration instructions
    :param multi_value_edits: dict of configuration instructions
    :param template_dir: directory on calling host where templates are found
    :param template_files: dict of configuration instructions
    :return:
    """

    backed_up_files = []

    with fab_settings(warn_only=True, user="root"):

        print(green("\nConfiguring %s" % service_name))

        # process config changes for single value entries
        for entry in single_value_edits.items():
            file_name = entry[0]
            backed_up_files = _backup_config_file(
                file_name, backup_postfix, backed_up_files)

            # set StrOpt values
            try:
                _set_single_value_configs(file_name, entry[1])
            except IOError:
                pass

        # process config changes for multi value entries
        for entry in multi_value_edits.items():
            file_name = entry[0]
            backed_up_files = _backup_config_file(
                file_name, backup_postfix, backed_up_files)

        # set MultiStrOpt values
            try:
                _set_multi_value_configs(file_name, entry[1])
            except IOError:
                pass

        # upload template files
        for entry in template_files:
            file_name = entry['file']
            template_name = entry['template']
            template_context = entry['context'] if 'context' in entry else {}
            backed_up_files = _backup_config_file(
                file_name, backup_postfix, backed_up_files)

            upload_template(
                template_name,
                file_name,
                context=template_context,
                template_dir=template_dir,
                backup=False)


@task
def _configure_nova(backup_postfix, restart='yes', config_loc=PROD_CONFIG):
    """Configures nova on OpenStack hosts.

    :param backup_postfix: A string to append to any config files that are
                           backed up (a timestamp would be nice).
    :type backup_postfix: str
    :param restart: restart the service? (yes/no)
    :type restart: str
    """

    single_value_edits = {
        "/etc/nova/nova.conf": [
            {
                "section": "DEFAULT",
                "parameter": "syslog_log_facility",
                "value": "LOG_LOCAL0"},
            {
                "section": "DEFAULT",
                "parameter": "use_syslog",
                "value": str(True)
            },
            {
                "section": "DEFAULT",
                "parameter": "verbose",
                "value": str(True)
            },
            {
                "section": "DEFAULT",
                "parameter": "instance_usage_audit",
                "value": str(True)
            },
            {
                "section": "DEFAULT",
                "parameter": "instance_usage_audit_period",
                "value": "hour"
            },
            {
                "section": "DEFAULT",
                "parameter": "notify_on_state_change",
                "value": "vm_and_task_state"
            },
        ],
        "/etc/nova/api-paste.ini": [
            {
                "section": "composite:openstack_compute_api_v2",
                "parameter": "keystone",
                "value": "compute_req_id faultwrap sizelimit authtoken "
                         "keystonecontext ratelimit audit osapi_compute_app_v2"
            },
            {
                "section": "composite:openstack_compute_api_v2",
                "parameter": "keystone_nolimit",
                "value": "compute_req_id faultwrap sizelimit authtoken "
                         "keystonecontext audit osapi_compute_app_v2"
            },
            {
                "section": "composite:openstack_compute_api_v21",
                "parameter": "keystone",
                "value": "compute_req_id faultwrap sizelimit authtoken "
                         "keystonecontext audit osapi_compute_app_v21"
            },
            {
                "section": "composite:openstack_compute_api_v3",
                "parameter": "keystone",
                "value": "request_id faultwrap sizelimit authtoken "
                         "keystonecontext audit osapi_compute_app_v3"
            },
            {
                "section": "filter:audit",
                "parameter": "paste.filter_factory",
                "value": "keystonemiddleware.audit:filter_factory"
            },
            {
                "section": "filter:audit",
                "parameter": "audit_map_file",
                "value": "/etc/nova/nova_api_audit_map.conf"
            }
        ]
    }

    # config lines that accept multiple values per line
    multi_value_edits = {
        "/etc/nova/nova.conf": [
            {
                "section": "DEFAULT",
                "parameter": "notification_driver",
                "value": "messagingv2"
            }
        ]
    }

    template_dir = os.path.join(config_loc, "nova")
    template_files = [
        {
            "file": "/etc/nova/nova_api_audit_map.conf",
            "template": "nova_api_audit_map.conf.template"
        }
    ]

    _configure_service('Nova', backup_postfix, single_value_edits,
                       multi_value_edits, template_dir, template_files)

    if restart == 'yes':
        print(green("\nRestarting Nova service."))
        run("openstack-service restart nova")
    else:
        print(green("\nRestart Nova to apply changes."))


@task
def _configure_cinder(backup_postfix, restart='yes', config_loc=PROD_CONFIG):
    """Configures cinder on OpenStack hosts.

    :param backup_postfix: A string to append to any config files that are
                           backed up (a timestamp would be nice).
    :type backup_postfix: str
    :param restart: restart the service? (yes/no)
    :type restart: str
    """

    single_value_edits = {
        "/etc/cinder/cinder.conf": [
            {
                "section": "DEFAULT",
                "parameter": "syslog_log_facility",
                "value": "LOG_LOCAL5"},
            {
                "section": "DEFAULT",
                "parameter": "use_syslog",
                "value": str(True)
            },
            {
                "section": "DEFAULT",
                "parameter": "verbose",
                "value": str(True)
            },
            {
                "section": "DEFAULT",
                "parameter": "control_exchange",
                "value": "cinder"
            }
        ],
        "/etc/cinder/api-paste.ini": [
            {
                "section": "composite:openstack_volume_api_v1",
                "parameter": "keystone",
                "value": "request_id faultwrap sizelimit osprofiler authtoken "
                         "keystonecontext audit apiv1"
            },
            {
                "section": "composite:openstack_volume_api_v1",
                "parameter": "keystone_nolimit",
                "value": "request_id faultwrap sizelimit osprofiler authtoken "
                         "keystonecontext audit apiv1"
            },
            {
                "section": "composite:openstack_volume_api_v2",
                "parameter": "keystone",
                "value": "request_id faultwrap sizelimit osprofiler authtoken "
                         "keystonecontext audit apiv2"
            },
            {
                "section": "composite:openstack_volume_api_v2",
                "parameter": "keystone_nolimit",
                "value": "request_id faultwrap sizelimit osprofiler authtoken "
                         "keystonecontext audit apiv2"
            },
            {
                "section": "filter:audit",
                "parameter": "paste.filter_factory",
                "value": "keystonemiddleware.audit:filter_factory"
            },
            {
                "section": "filter:audit",
                "parameter": "audit_map_file",
                "value": "/etc/cinder/cinder_api_audit_map.conf"
            }
        ]
    }

    # config lines that accept multiple values per line
    multi_value_edits = {
        "/etc/cinder/cinder.conf": [
            {
                "section": "DEFAULT",
                "parameter": "notification_driver",
                "value": "messagingv2"
            }
        ]
    }

    template_dir = os.path.join(config_loc, "cinder")
    template_files = [
        {
            "file": "/etc/cinder/cinder_api_audit_map.conf",
            "template": "cinder_api_audit_map.conf.template"
        }
    ]

    _configure_service('Cinder', backup_postfix, single_value_edits,
                       multi_value_edits, template_dir, template_files)

    if restart == 'yes':
        print(green("\nRestarting Cinder service."))
        run("openstack-service restart cinder")
    else:
        print(green("\nRestart Cinder to apply changes."))


@task
def _configure_keystone(backup_postfix, restart='yes', config_loc=PROD_CONFIG):
    """Configures keystone on OpenStack hosts.

    :param backup_postfix: A string to append to any config files that are
                           backed up (a timestamp would be nice).
    :type backup_postfix: str
    :param restart: restart the service? (yes/no)
    :type restart: str
    """

    single_value_edits = {
        "/etc/keystone/keystone.conf": [
            {
                "section": "DEFAULT",
                "parameter": "syslog_log_facility",
                "value": "LOG_LOCAL6"},
            {
                "section": "DEFAULT",
                "parameter": "use_syslog",
                "value": str(True)
            },
            {
                "section": "DEFAULT",
                "parameter": "verbose",
                "value": str(True)
            },
            {
                "section": "DEFAULT",
                "parameter": "notification_format",
                "value": "cadf"
            },

        ]
    }

    # config lines that accept multiple values per line
    multi_value_edits = {
        "/etc/keystone/keystone.conf": [
            {
                "section": "DEFAULT",
                "parameter": "notification_driver",
                "value": "messaging"
            }
        ]
    }

    template_dir = os.path.join(config_loc, "keystone")
    template_files = []

    _configure_service('Keystone', backup_postfix, single_value_edits,
                       multi_value_edits, template_dir, template_files)

    if restart == 'yes':
        print(green("\nRestarting Keystone service."))
        run("systemctl restart httpd")
    else:
        print(green("\nRestart Keystone to apply changes."))


@task
def _configure_neutron(backup_postfix, restart='yes', config_loc=PROD_CONFIG):
    """Configures neutron on OpenStack hosts.

    :param backup_postfix: A string to append to any config files that are
                           backed up (a timestamp would be nice).
    :type backup_postfix: str
    :param restart: restart the service? (yes/no)
    :type restart: str
    """

    single_value_edits = {
        "/etc/neutron/neutron.conf": [
            {
                "section": "DEFAULT",
                "parameter": "syslog_log_facility",
                "value": "LOG_LOCAL2"},
            {
                "section": "DEFAULT",
                "parameter": "use_syslog",
                "value": str(True)
            },
            {
                "section": "DEFAULT",
                "parameter": "verbose",
                "value": str(True)
            }
        ],
        "/etc/neutron/api-paste.ini": [
            {
                "section": "composite:neutronapi_v2_0",
                "parameter": "use",
                "value": "call:neutron.auth:pipeline_factory"
            },
            {
                "section": "composite:neutronapi_v2_0",
                "parameter": "noauth",
                "value": "request_id catch_errors extensions "
                         "neutronapiapp_v2_0"
            },
            {
                "section": "composite:neutronapi_v2_0",
                "parameter": "keystone",
                "value": "request_id catch_errors authtoken keystonecontext "
                         "audit extensions neutronapiapp_v2_0"
            },
            {
                "section": "filter:audit",
                "parameter": "paste.filter_factory",
                "value": "keystonemiddleware.audit:filter_factory"
            },
            {
                "section": "filter:audit",
                "parameter": "audit_map_file",
                "value": "/etc/neutron/neutron_api_audit_map.conf"
            },
        ]
    }

    # config lines that accept multiple values per line
    multi_value_edits = {
        "/etc/neutron/neutron.conf": [
            {
                "section": "DEFAULT",
                "parameter": "notification_driver",
                "value": "neutron.openstack.common.notifier.rpc_notifier"
            }
        ]
    }

    template_dir = os.path.join(config_loc, "neutron")
    template_files = [
        {
            "file": "/etc/neutron/neutron_api_audit_map.conf",
            "template": "neutron_api_audit_map.conf.template"
        }
    ]

    _configure_service('Neutron', backup_postfix, single_value_edits,
                       multi_value_edits, template_dir, template_files)

    if restart == 'yes':
        print(green("\nRestarting Neutron service."))
        run("openstack-service restart neutron")
    else:
        print(green("\nRestart Neutron to apply changes."))


@task
def _configure_glance(backup_postfix, restart='yes', config_loc=PROD_CONFIG):
    """Configures glance on OpenStack hosts.

    :param backup_postfix: A string to append to any config files that are
                           backed up (a timestamp would be nice).
    :type backup_postfix: str
    :param restart: restart the service? (yes/no)
    :type restart: str
    """

    single_value_edits = {
        "/etc/glance/glance-cache.conf": [
            {
                "section": "DEFAULT",
                "parameter": "syslog_log_facility",
                "value": "LOG_LOCAL1"},
            {
                "section": "DEFAULT",
                "parameter": "use_syslog",
                "value": str(True)
            },
            {
                "section": "DEFAULT",
                "parameter": "verbose",
                "value": str(True)
            }
        ],
        "/etc/glance/glance-api.conf": [
            {
                "section": "DEFAULT",
                "parameter": "syslog_log_facility",
                "value": "LOG_LOCAL1"},
            {
                "section": "DEFAULT",
                "parameter": "use_syslog",
                "value": str(True)
            },
            {
                "section": "DEFAULT",
                "parameter": "verbose",
                "value": str(True)
            },
            {
                "section": "paste_deploy",
                "parameter": "config_file",
                "value": "/etc/glance/glance-api-paste.ini"
            }
        ],
        "/etc/glance/glance-registry.conf": [
            {
                "section": "DEFAULT",
                "parameter": "syslog_log_facility",
                "value": "LOG_LOCAL1"},
            {
                "section": "DEFAULT",
                "parameter": "use_syslog",
                "value": str(True)
            },
            {
                "section": "DEFAULT",
                "parameter": "verbose",
                "value": str(True)
            }
        ],
        "/etc/glance/glance-scrubber.conf": [
            {
                "section": "DEFAULT",
                "parameter": "syslog_log_facility",
                "value": "LOG_LOCAL1"},
            {
                "section": "DEFAULT",
                "parameter": "use_syslog",
                "value": str(True)
            },
            {
                "section": "DEFAULT",
                "parameter": "verbose",
                "value": str(True)
            }
        ],
    }

    # config lines that accept multiple values per line
    multi_value_edits = {
        "/etc/glance/glance-api.conf": [
            {
                "section": "DEFAULT",
                "parameter": "notification_driver",
                "value": "messagingv2"
            }
        ],
        "/etc/glance/glance-registry.conf": [
            {
                "section": "DEFAULT",
                "parameter": "notification_driver",
                "value": "messagingv2"
            }
        ]
    }

    template_dir = os.path.join(config_loc, "glance")
    template_files = [
        {
            "file": "/etc/glance/glance-api-paste.ini",
            "template": "glance-api-paste.ini.template"
        },
        {
            "file": "/etc/glance/glance_api_audit_map.conf",
            "template": "glance_api_audit_map.conf.template"
        }
    ]

    _configure_service('Glance', backup_postfix, single_value_edits,
                       multi_value_edits, template_dir, template_files)

    if restart == 'yes':
        print(green("\nRestarting Glance service."))
        run("openstack-service restart glance")
    else:
        print(green("\nRestart Glance to apply changes."))


@task
def _configure_ceilometer(backup_postfix, goldstone_addr, restart='yes',
                          config_loc=PROD_CONFIG):
    """Configures ceilometer on OpenStack hosts.

    :param backup_postfix: A string to append to any config files that are
                           backed up (a timestamp would be nice).
    :type backup_postfix: str
    :param goldstone_addr: IP address of the goldstone server
    :type goldstone_addr: str
    :param restart: restart the service? (yes/no)
    :type restart: str
    """

    single_value_edits = {
        "/etc/ceilometer/ceilometer.conf": [
            {
                "section": "DEFAULT",
                "parameter": "syslog_log_facility",
                "value": "LOG_LOCAL3"},
            {
                "section": "DEFAULT",
                "parameter": "use_syslog",
                "value": str(True)
            },
            {
                "section": "DEFAULT",
                "parameter": "verbose",
                "value": str(True)
            },
            {
                "section": "event",
                "parameter": "definitions_cfg_file",
                "value": "event_definitions.yaml"
            },
            {
                "section": "event",
                "parameter": "drop_unmatched_notifications",
                "value": str(False)
            },
            {
                "section": "notification",
                "parameter": "store_events",
                "value": str(True)
            },
            {
                "section": "notification",
                "parameter": "disable_non_metric_meters",
                "value": str(True)
            },
            {
                "section": "database",
                "parameter": "event_connection",
                "value": "es://%s:9200" % goldstone_addr
            },
            {
                "section": "database",
                "parameter": "time_to_live",
                "value": "604800"                # one week
            },
        ],
        "/etc/ceilometer/api_paste.ini": [
            {
                "section": "pipeline:main",
                "parameter": "pipeline",
                "value": "request_id authtoken audit api-server"
            },
            {
                "section": "filter:audit",
                "parameter": "paste.filter_factory",
                "value": "keystonemiddleware.audit:filter_factory"
            },
            {
                "section": "filter:audit",
                "parameter": "audit_map_file",
                "value": "/etc/ceilometer/ceilometer_api_audit_map.conf"
            },
        ]
    }

    # config lines that accept multiple values per line
    multi_value_edits = {}

    template_dir = os.path.join(config_loc, "ceilometer")
    template_files = [
        {
            "file": "/etc/ceilometer/pipeline.yaml",
            "template": "pipeline.yaml.template",
            "context": {"goldstone_addr": goldstone_addr}
        },
        {
            "file": "/etc/ceilometer/event_pipeline.yaml",
            "template": "event_pipeline.yaml.template"
        },
        {
            "file": "/etc/ceilometer/event_definitions.yaml",
            "template": "event_definitions.yaml.template"
        },
    ]

    _configure_service('Ceilometer', backup_postfix, single_value_edits,
                       multi_value_edits, template_dir, template_files)

    if restart == 'yes':
        print(green("\nRestarting Ceilometer service."))
        run("openstack-service restart ceilometer")
    else:
        print(green("\nRestart Ceilometer to apply changes."))


@task
def _configure_rsyslog(backup_postfix, goldstone_addr, restart='yes',
                       config_loc=PROD_CONFIG):
    """Configures neutron on OpenStack hosts.

    :param backup_postfix: A string to append to any config files that are
                           backed up (a timestamp would be nice).
    :type backup_postfix: str
    :param restart: restart the service? (yes/no)
    :type restart: str
    """

    # config lines that accept single values per line

    template_dir = os.path.join(config_loc, "rsyslog")

    template_files = [
        {
            "file": "/etc/rsyslog.conf",
            "template": "rsyslog.conf.template"
        },
        {
            "file": "/etc/rsyslog.d/10-goldstone.conf",
            "template": "10-goldstone.conf.template",
            "context": {"goldstone_addr": goldstone_addr}
        }
    ]

    _configure_service('Rsyslog', backup_postfix, {},
                       {}, template_dir, template_files)

    if restart == 'yes':
        print(green("\nRestarting Rsyslog service."))
        run("service rsyslog restart")
    else:
        print(green("\nRestart Rsyslog to apply changes."))


@task
def configure_stack(goldstone_addr=None, restart_services=None, accept=False,
                    config_loc=PROD_CONFIG):
    """Configures syslog and ceilometer parameters on OpenStack hosts.

    :param goldstone_addr: Goldstone server's hostname or IP accessible to
                           OpenStack hosts
    :type goldstone_addr: str
    :param restart_services: After completion, do you want to restart
                             openstack?
    :type restart_services: boolean
    :param accept: Do you understand that this will change your openstack and
                   syslog configs?
    :type accept: boolean

    """
    import arrow

    if not accept:
        accepted = prompt(cyan(
            "This utility will modify configuration files on the hosts\n"
            "supplied via the -H parameter, and optionally restart\n"
            "OpenStack and syslog services.\n\n"
            "Do you want to continue (yes/no)?"),
            default='yes', validate='yes|no')
    else:
        accepted = 'yes'

    if accepted != 'yes':
        return 0

    if restart_services is None:
        restart_services = prompt(cyan("Restart OpenStack and syslog services "
                                       "after configuration changes(yes/no)?"),
                                  default='yes', validate='yes|no')

    if goldstone_addr is None:
        goldstone_addr = prompt(cyan("Goldstone server's hostname or IP "
                                     "accessible to OpenStack hosts?"))

    backup_timestamp = arrow.utcnow().timestamp

    with fab_settings(warn_only=True, user="root"):

        _configure_rsyslog(
            backup_timestamp,
            goldstone_addr,
            restart=restart_services,
            config_loc=config_loc)

        _configure_ceilometer(
            backup_timestamp,
            goldstone_addr,
            restart=restart_services,
            config_loc=config_loc)

        _configure_nova(
            backup_timestamp,
            restart=restart_services,
            config_loc=config_loc)

        _configure_neutron(
            backup_timestamp,
            restart=restart_services,
            config_loc=config_loc)

        _configure_cinder(
            backup_timestamp,
            restart=restart_services,
            config_loc=config_loc)

        _configure_glance(
            backup_timestamp,
            restart=restart_services,
            config_loc=config_loc)

        _configure_keystone(
            backup_timestamp,
            restart=restart_services,
            config_loc=config_loc)

        print(green("\nFinished"))


if __name__ == "__main__":
    django.setup()
    print(green("starting postinstall steps for docker environment"))
    docker_install()
    print(green("finished postinstall steps for docker environment"))
