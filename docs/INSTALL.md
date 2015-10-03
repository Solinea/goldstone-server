# Goldstone Installation

Before installing Goldstone, your environment must meet the following prerequisites:

**Server requirements**

* 4GB RAM
* x64 CPU (or 4 core VM on x64 host)
* 100 GB free disk space
* CentOS / RHEL 7.x
* Docker >= 1.8.2 ([Install instructions](https://docs.docker.com/installation/centos/))
* Docker running (`systemctl start docker`)
* Docker configured to start at boot (`systemctl enable docker`)

**Cloud requirements**

* RDO Kilo
* OpenStack hosts must be permitted send data to Goldstone on ports:
 * TCP/5514
 * TCP/5515
 * TCP/5516
 * TCP/9200
* Goldstone server must be permitted to access OpenStack API

**Browser requirements**

The Goldstone web client is developed and tested with [Firefox](https://www.mozilla.org/en-US/firefox/products/), [Safari](https://www.apple.com/safari/), or [Chrome](https://www.google.com/intl/en-US/chrome/browser).  We do not currently have a definitive list of supported browser versions, but the [compatibility chart](http://caniuse.com/#feat=es5) reflects what we think should work.

## Install (as root)

This process downloads assets from the internet, and can take quite a while.  Due to RPM restrictions, you may not see any output until the postinstall steps have completed.  

* Download the [latest release](https://github.com/Solinea/goldstone-server/releases)
* `yum localinstall -y goldstone-server-{version}.rpm`
* Edit `/opt/goldstone/docker/config/goldstone-prod.env`, and set values appropriate for your environment. 
* `systemctl enable goldstone-server`
* `systemctl start goldstone-server`

## Direct Logs and Events to the Goldstone Server

This procedure will modify the configuration of your OpenStack server(s).  All changed configuration files will be backed up with a file of the form name.{timestamp}. 


With Goldstone installed, the only task left is to configure OpenStack servers to send logs and events to the Goldstone server. Execute the following command to perform the configuration, substituting appropriate values for names and addresses:
The final configuration 
```bash
root# docker exec -i -t docker_gsapp_1 bash
app@2f31cd23f422:~$ . /venv/bin/activate  # inside the docker container
(venv)app@2f31cd23f422:~$ fab -f installer_fabfile.py -H {OpenStack_controller_IP,OpenStack_compute_IP,...} configure_stack
[{your ip address}] Executing task 'configure_stack'
This utility will modify configuration files on the hosts
supplied via the -H parameter, and optionally restart
OpenStack and syslog services.

Do you want to continue (yes/no)? [yes]
Restart OpenStack and syslog services after configuration changes(yes/no)? [yes]
Goldstone server's hostname or IP accessible to OpenStack hosts? {your goldstone ip}  # this is the IP address of your Goldstone server
```

### List of modified files

The following files are modified by the `configure_stack` task.  For the complete list of modifications performed, refer to Appendix A.

* /etc/rsyslog.conf
* /etc/rsyslog.d/10-goldstone.conf
* /etc/ceilometer/ceilometer.conf
* /etc/ceilometer/pipeline.yaml
* /etc/ceilometer/event_pipeline.yaml
* /etc/ceilometer/event_definitions.yaml
* /etc/ceilometer/api_paste.ini
* /etc/nova/nova.conf
* /etc/nova/api-paste.ini
* /etc/nova/nova_api_audit_map.conf
* /etc/cinder/cinder.conf
* /etc/cinder/api-paste.ini
* /etc/cinder/cinder_api_audit_map.conf
* /etc/neutron/neutron.conf
* /etc/neutron/api-paste.ini
* /etc/neutron/neutron_api_audit_map.conf
* /etc/keystone/keystone.conf
* /etc/glance/glance-cache.conf
* /etc/glance/glance-api.conf
* /etc/glance/glance-registry.conf
* /etc/glance/glance-scrubber.conf
* /etc/glance/glance-api-paste.ini
* /etc/glance/glance_api_audit_map.conf

## Access the client

Point your browser at the Goldstone server IP address or name and begin using Goldstone. You can log in as the `gsadmin` user with the password you configured in the `goldstone-prod.env` file.  It may take a few minutes for data to be populated in the client, but within 5 minutes, you should see charts and tables start to fill in.

`http://{your ip address}:8888`

## Uninstallation (as root)

This process may take a long time while it removes the Goldstone containers and images. It does not revert configuration changes made to OpenStack via the configure_stack task.

* `yum remove goldstone-server`

## Appendix A - OpenStack Configuration Changes

This appendix documents the various configuration changes required to fully integrate Goldstone and your OpenStack cloud.  


### RDO Kilo

#### /etc/rsyslog.conf

In the MODULES section of the file, the following directives are added:

    # Increase max message size to 64k
    $MaxMessageSize 64k

    # Preserve full domain names
    $PreserveFQDN on

    # Use high resolution timestamp for forwarded
    $ActionForwardDefaultTemplate RSYSLOG_ForwardFormat

#### /etc/rsyslog.d/10-goldstone.conf

This file is installed from a template.  The template is located within the installation directory at `external/rsyslog/10-goldstone.conf.template`.  Substitute the IP address of your Goldstone Server host for the string **`%(goldstone_addr)s`** within the template.


#### /etc/ceilometer/ceilometer.conf

Within the `[DEFAULT]` section, the following values are changed or added:

    syslog_log_facility = LOG_LOCAL3
    use_syslog = True
    verbose = True

Within the `[event]` section, the following values are changed or added:

    definitions_cfg_file = event_definitions.yaml
    drop_unmatched_notifications = False

Within the `[notification]` section, the following values are changed or added:

    store_events = True
    disable_non_metric_meters = True

Within the `[database]` section, the following values are changed or added  (substitute the IP address of your Goldstone Server host for the **`goldstone_addr`**):

    event_connection = es://**goldstone_addr**:9200

#### /etc/ceilometer/pipeline.yaml

This file is installed from a template.  The template is located within the installation directory at `external/ceilometer/pipeline.yaml.template`.  Substitute the IP address of your Goldstone Server host for the string **`%(goldstone_addr)s`** within the template.  If you have customized your file, the Goldstone team will be happy to assess how best to merge the customizations.  Please contact us.


#### /etc/ceilometer/event_pipeline.yaml

This file is installed from a template.  The template is located within the installation directory at `external/ceilometer/event_pipeline.yaml.template`.  If you have customized your file, the Goldstone team will be happy to assess how best to merge the customizations.  Please contact us.


#### /etc/ceilometer/event_definitions.yaml

This file is installed from a template.  The template is located within the installation directory at `external/ceilometer/event_definitions.yaml.template`.  If you have customized your file, the Goldstone team will be happy to assess how best to merge the customizations.  Please contact us.


#### /etc/ceilometer/api_paste.ini

This file is installed from a template.  The template is located within the installation directory at `external/ceilometer/api-paste.ini.template`.  If you have customized your file, the Goldstone team will be happy to assess how best to merge the customizations.  Please contact us.


#### /etc/nova/nova.conf

Within the `[DEFAULT]` section, the following values are changed or added:

    syslog_log_facility = LOG_LOCAL0
    use_syslog = True
    verbose = True
    instance_usage_audit = True
    instance_usage_audit_period = hour
    notify_on_state_change = vm_and_task_state

The `notification_driver` parameter in the `[DEFAULT]` section accepts multiple values.  To specify an additional value, you can add the following line after all other entries:

    notification_driver = messagingv2


#### /etc/nova/api-paste.ini

This file is installed from a template.  The template is located within the installation directory at `external/nova/api-paste.ini.template`.  If you have customized your file, the Goldstone team will be happy to assess how best to merge the customizations.  Please contact us.


#### /etc/nova/nova_api_audit_map.conf

This file is installed from a template.  The template is located within the installation directory at `external/nova/nova_api_audit_map.conf.template`.  If you have customized your file, the Goldstone team will be happy to assess how best to merge the customizations.  Please contact us.


#### /etc/cinder/cinder.conf

Within the `[DEFAULT]` section, the following values are changed or added:

    syslog_log_facility = LOG_LOCAL5
    use_syslog = True
    verbose = True
    control_exchange = cinder

The `notification_driver` parameter in the `[DEFAULT]` section accepts multiple values.  To specify an additional value, you can add the following line after all other entries:

    notification_driver = messagingv2


#### /etc/cinder/api-paste.ini

This file is installed from a template.  The template is located within the installation directory at `external/cinder/api-paste.ini.template`.  If you have customized your file, the Goldstone team will be happy to assess how best to merge the customizations.  Please contact us.


#### /etc/cinder/cinder_api_audit_map.conf

This file is installed from a template.  The template is located within the installation directory at `external/cinder/cinder_api_audit_map.conf.template`.  If you have customized your file, the Goldstone team will be happy to assess how best to merge the customizations.  Please contact us.


#### /etc/neutron/neutron.conf

Within the `[DEFAULT]` section, the following values are changed or added:

    syslog_log_facility = LOG_LOCAL2
    use_syslog = True
    verbose = True


#### /etc/neutron/api-paste.ini

This file is installed from a template.  The template is located within the installation directory at `external/neutron/api-paste.ini.template`.  If you have customized your file, the Goldstone team will be happy to assess how best to merge the customizations.  Please contact us.


#### /etc/neutron/neutron_api_audit_map.conf

This file is installed from a template.  The template is located within the installation directory at `external/neutron/neutron_api_audit_map.conf.template`.  If you have customized your file, the Goldstone team will be happy to assess how best to merge the customizations.  Please contact us.


#### /etc/keystone/keystone.conf

Within the `[DEFAULT]` section, the following values are changed or added:

    syslog_log_facility = LOG_LOCAL2
    use_syslog = True
    verbose = True
    notification_format = cadf

The `notification_driver` parameter in the `[DEFAULT]` section accepts multiple values.  To specify an additional value, you can add the following line after all other entries:

    notification_driver = messaging


#### /etc/glance/glance-cache.conf

Within the `[DEFAULT]` section, the following values are changed or added:

    syslog_log_facility = LOG_LOCAL1
    use_syslog = True
    verbose = True


#### /etc/glance/glance-api.conf

Within the `[DEFAULT]` section, the following values are changed or added:

    syslog_log_facility = LOG_LOCAL1
    use_syslog = True
    verbose = True

The `notification_driver` parameter in the `[DEFAULT]` section accepts multiple values.  To specify an additional value, you can add the following line after all other entries:

    notification_driver = messagingv2


#### /etc/glance/glance-registry.conf

Within the `[DEFAULT]` section, the following values are changed or added:

    syslog_log_facility = LOG_LOCAL1
    use_syslog = True
    verbose = True

The `notification_driver` parameter in the `[DEFAULT]` section accepts multiple values.  To specify an additional value, you can add the following line after all other entries:

    notification_driver = messagingv2


#### /etc/glance/glance-scrubber.conf

Within the `[DEFAULT]` section, the following values are changed or added:

    syslog_log_facility = LOG_LOCAL1
    use_syslog = True
    verbose = True


#### /etc/glance/glance-api-paste.ini

This file is installed from a template.  The template is located within the installation directory at `external/glance/glance-api-paste.ini.template`.  If you have customized your file, the Goldstone team will be happy to assess how best to merge the customizations.  Please contact us.


#### /etc/glance/glance_api_audit_map.conf

This file is installed from a template.  The template is located within the installation directory at `external/glance/glance_api_audit_map.conf.template`.  If you have customized your file, the Goldstone team will be happy to assess how best to merge the customizations.  Please contact us.

