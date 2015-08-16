# Goldstone Installation

Before installing Goldstone, your server must meet the following prerequisites:

* 4GB RAM
* x64 CPU (or 4 core VM on x64 host)
* 100 GB free disk space
* CentOS / RHEL 7.x

* The Goldstone installer installs, and modifies packages and libraries.  It is highly recommended that it only be installed on dedicated systems. *  A [CentOS 7.1 x86 cloud image](http://cloud.centos.org/centos/7/images/) is an ideal starting point for a virtual machine based Goldstone installation.

To view and use Goldstone, you'll need a recent version of [Firefox](https://www.mozilla.org/en-US/firefox/products/), [Safari](https://www.apple.com/safari/), or [Chrome](https://www.google.com/intl/en-US/chrome/browser).

## Install RPMs (as root)

Download the [latest release](https://github.com/Solinea/goldstone-server/releases) and execute these commands:

```bash
root# yum update ; reboot
root# yum localinstall -y goldstone-server-{version}.rpm
```

IMPORTANT: Please confirm that the goldstone-server RPM was installed successfully. We are constantly improving the installation process, but currently there are situations such as external download failures that could result in the RPM installation completing without error, while the Goldstone installation is incomplete.  This is what a success looks like:

```
Successfully installed Django South arrow celery django-admin-bootstrapped django-extensions django-filter django-picklefield django-polymorphic django-rest-params django-rest-swagger djangorestframework djoser drf-extensions elasticsearch-curator elasticsearch-dsl elasticsearch fabric functools32 lockfile networkx pbr psycopg2 python-cinderclient python-glanceclient python-keystoneclient python-neutronclient python-novaclient urllib3 python-dateutil pytz billiard kombu redis six PyYAML click paramiko decorator argparse PrettyTable requests simplejson Babel pyOpenSSL warlock oslo.utils oslo.i18n iso8601 netaddr oslo.config oslo.serialization stevedore cliff anyjson amqp pycrypto ecdsa cryptography jsonschema jsonpatch netifaces msgpack-python cmd2 pyparsing idna pyasn1 enum34 ipaddress cffi jsonpointer pycparser
Cleaning up...
*****************************************************************************

  To continue installation, do the following as root:

      root# cd /opt/goldstone
      root# . bin/activate
      root# fab install

  You will be prompted for:
      - the Django admin (admin) password
      - the Goldstone admin (gsadmin) password
      - the OpenStack admin tenant (from your adminrc)
      - the OpenStack admin user (from your adminrc)
      - the OpenStack admin password (from your adminrc)
      - the OpenStack auth URL (from your adminrc)

*****************************************************************************
  Verifying  : 1438284801:goldstone-server-0.7.1-0.7.1.el7.centos.x86_64                                                                     1/1

Installed:
  goldstone-server.x86_64 1438284801:0.7.1-0.7.1.el7.centos

Complete!
```

## Install and configure Goldstone (as root)

The installation script will check the Goldstone prerequisites. If all checks pass, it will then prompt you for additional configuration information. Execute these commands:

```bash
root# cd /opt/goldstone
root# . bin/activate
root# fab install
```

## Check your password-reset sequence

Goldstone's password-reset sequence uses e-mail. Ensure you have a working [SMTP](https://en.wikipedia.org/wiki/Simple_Mail_Transfer_Protocol) server (e.g., [Postfix](http://www.postfix.org)) installed.

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


## Direct Logs and Events to the Goldstone Server

With Goldstone installed, the only task left is to configure OpenStack servers to send logs and events to the Goldstone server. Execute the following command to perform the configuration, substituting IP addresses or hostnames for the openstack_host_addr value(s):

    root# fab -H openstack_host_addr[, openstack_host_addr] configure_stack


## Finished!

Now that everything has been configured, point your browser at the Goldstone server IP address or name and begin using Goldstone.

## Uninstallation

To uninstall Goldstone:
```bash
root# fab -f installer_fabfile.py uninstall
```

This will remove the Goldstone server software.  It will also stop and disable, but not remove supporting software including elasticsearch, logstash, redis, postgresql, and httpd.  It also does not revert configuration changes made by the `fab configure_stack` command.
