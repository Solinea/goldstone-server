# Goldstone Installation

Before installing Goldstone, your server must meet the following prerequisites:

* 4GB RAM
* x64 CPU (or 4 core VM on x64 host)
* 100 GB free disk space
* CentOS / RHEL 7.x

* The Goldstone installer installs, and modifies packages and libraries.  It is highly recommended that it only be installed on dedicated systems. *  A [CentOS 7.1 x86 cloud image](http://cloud.centos.org/centos/7/images/) is an ideal starting point for a virtual machine based Goldstone installation.

To view and use Goldstone, you'll need a recent version of [Firefox](https://www.mozilla.org/en-US/firefox/products/), [Safari](https://www.apple.com/safari/), or [Chrome](https://www.google.com/intl/en-US/chrome/browser).

## Install RPM and run the configuration script (as root)

```bash
root# yum update ; reboot
root# yum localinstall -y goldstone-server-{version}.rpm
root# cd /opt/goldstone
root# . bin/activate
root# fab install
```

It will check for supported operating systems and prerequisties. If all checks pass, it will then prompt you for additional configuration information.

Additionally, Goldstone's password-reset sequence uses e-mail. Ensure you have a working [SMTP](https://en.wikipedia.org/wiki/Simple_Mail_Transfer_Protocol) server (e.g., [Postfix](http://www.postfix.org)) installed.

## Review production.py

If this is a first-time install of Goldstone, skip this section.

If this is a re-install of Goldstone, a new `production.py` file from Solinea will be in
`/opt/goldstone/goldstone/settings/production.py.rpmnew`.

Compare `/opt/goldstone/goldstone/settings/production.py` to
`/opt/goldstone/goldstone/settings/production.py.rpmnew`, and migrate any changes from the `.rpmnew` file into the `.py` file. If you did not previously edit `production.py`, you can simply do this:

```bash
root# mv /opt/goldstone/goldstone/settings/production.py.rpmnew /opt/goldstone/goldstone/settings.production.py.
```

After you've migrated your custom edits into `production.py`, reboot the server or restart the services.

```bash
root# systemctl restart httpd
root# systemctl restart celery
root# systemctl restart celerybeat
```

## Test password reset

Goldstone's login page includes a password-reset link. Please test it.

If the links in the password-reset e-mail do not work, you'll need to adjust the settings in `/opt/goldstone/goldstone/settings/production.py`. Look for the `DJOSER` dictionary.


## Direct logs to the Goldstone server

With Goldstone installed, the only task left is to point the OpenStack server logs to it so that it can begin processing them. There are two tasks in this step:

    1. Configure OpenStack services to use syslog
    2. Configure syslog to forward to your Goldstone server


### OpenStack service logging

Each OpenStack service uses one of the local syslog facilities to help with categorization of logs.  There are generally three fields to set in the configuration file for a service (i.e. `/etc/nova/nova.conf`).  They are:

    verbose = True
    use_syslog = True
    syslog_log_facility = LOG_LOCAL{X}

Swift has a different configuration mechanism, so inserting the following entries in swift.conf will configure the logging properly:

    [object-server]
    set log_facility = LOG_LOCAL4
    set log_level = INFO

    [object-replicator]
    set log_facility = LOG_LOCAL4
    set log_level = INFO

    [object-updater]
    set log_facility = LOG_LOCAL4
    set log_level = INFO

    [object-auditor]
    set log_facility = LOG_LOCAL4
    set log_level = INFO

This service mapping is used for syslog_log_facility:

* nova => LOG_LOCAL0
* glance => LOG_LOCAL1
* neutron => LOG_LOCAL2
* ceilometer => LOG_LOCAL3
* swift => LOG_LOCAL4
* cinder => LOG_LOCAL5
* keystone => LOG_LOCAL6


### OpenStack Ceilometer integration

TBS

### Rsyslog forwarding

In the `/opt/goldstone/external` folder, there are example configuration files for rsyslog:

* `/opt/goldstone/external/rsyslog/rsyslog.conf` is an example main rsyslog configuration file. It references the Goldstone specific file below.
* `/opt/goldstone/external/rsyslog/rsyslog.d/10-goldstone.conf` provides specific mapping. **This file must be modified** to replace the '@@goldstone_ip:5514' in the local0.* to local7.* lines with your Goldstone server IP address or name.

    For example, if your Goldstone server's IP address is 10.10.10.1, your file should be edited to read:

        *.*    @@10.10.10.1:5514    

If you run with selinux enabled, you will also need to configure it to allow rsyslog to use this port:

```bash
root# semanage port -a -t syslogd_port_t -p tcp 5514
```

Restart the OpenStack services and syslog or reboot the node. Repeat this on all the OpenStack servers (or better include this in your puppet scripts).


## Finished!

Now that everything has been configured, point your browser at the Goldstone server IP address or name and begin using Goldstone.

## Uninstallation

To uninstall Goldstone:
```bash
root# fab -f installer_fabfile.py uninstall
```

This will remove the Goldstone server software.  It will also stop and disable, but not remove supporting software including elasticsearch, logstash, redis, postgresql, and httpd.

## License

This work is licensed under a [Creative Commons Attribution-ShareAlike 4.0 International License](http://creativecommons.org/licenses/by-sa/4.0/).

* [Read the license's summary](http://creativecommons.org/licenses/by-sa/4.0/)
* [Read the license's full legal text](http://creativecommons.org/licenses/by-sa/4.0/legalcode)
