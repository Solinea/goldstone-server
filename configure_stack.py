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

import os

from fabric.api import task, local, run, settings as fab_settings
from fabric.colors import green, cyan
from fabric.operations import prompt
from fabric.contrib.files import upload_template, exists

PROD_CONFIG = os.environ.get("APPDIR", "/home/app") + "/config"


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
            cmd = "crudini --existing=file --set %s %s %s %s" % \
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

    from fabric.contrib.files import contains, sed

    if exists(file_name, use_sudo=True, verbose=True):
        print(green("\tEditing %s" % file_name))

        for config_entry in edits_list:
            # hopefully match all forms of key = [other_val] val [other_val]
            # while avoiding key = [other_val] xvalx [other_val]
            # pylint: disable=W1401
            empty_setting_regex = '^%s[\s]*=[\s]*$' % \
                                  (config_entry['parameter'])
            setting_regex = '^[\s]*%s[\s]*=.*(?<=\s|=)%s(?!\S).*$' % \
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
            "file": "/etc/nova/api-paste.ini",
            "template": "api-paste.ini.template"
        },
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
            "file": "/etc/cinder/api-paste.ini",
            "template": "api-paste.ini.template"
        },
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
        ]
    }

    # config lines that accept multiple values per line
    multi_value_edits = {}

    template_dir = os.path.join(config_loc, "neutron")
    template_files = [
        {
            "file": "/etc/neutron/api-paste.ini",
            "template": "api-paste.ini.template"
        },
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
        {
            "file": "/etc/ceilometer/api_paste.ini",
            "template": "api_paste.ini.template"
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
    single_value_edits = {}

    # config lines that accept multiple values per line
    multi_value_edits = {}

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

    _configure_service('Rsyslog', backup_postfix, single_value_edits,
                       multi_value_edits, template_dir, template_files)

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

        print(green("\nFinshed"))
