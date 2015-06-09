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

## Install and configure Goldstone (as root)

You have two ways to install Goldstone.

### 1. Complete (requires terminal interaction)

The installation script will check the Goldstone prerequisites. If all checks pass, it will then prompt you for additional configuration information. Execute these commands:

```bash
root# cd /opt/goldstone
root# . bin/activate
root# fab full_install
```

### 2. Partial (requires no terminal interaction)

**This section is a work in progress.**

This installation requires no terminal interaction. But, you will have to perform additional installation steps (described below) after it completes.

The installation script will check the Goldstone prerequisites. If all checks pass, it will then do a partial installation of Goldstone. Execute these commands, replacing "PASSWORD" with the password you want the Django administrative account to have:

```bash
root# cd /opt/goldstone
root# . bin/activate
root# fab install:django_admin_password=PASSWORD
```

#### Completing the installation

Point your browser at the Goldstone server IP address or name, and log in with the account name "admin" and the Django administrative password.  Then perform these steps to complete the installation:

1. Click TBD
2. You will see a form for a new Goldstone tenant administrator account. Fill in the form, and click TBD
1. Click TBD
2. You will now see a form for a new Goldstone tenant. Fill in the form, and click TBD
3. Click TBD
3. You will see a form for a new OpenStack cloud, to be created under your Goldstone tenant. Fill in the form, and click TBD
4. You may now stay logged in as the site administrator and explore Goldstone. Or, you may logout and log back in using the Goldstone tenant administrator account you just created.


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

    root# fab -H openstack_host_addr[, openstack_addr] configure_stack


## Finished!

Now that everything has been configured, point your browser at the Goldstone server IP address or name and begin using Goldstone.

## Uninstallation

To uninstall Goldstone:
```bash
root# fab -f installer_fabfile.py uninstall
```

This will remove the Goldstone server software.  It will also stop and disable, but not remove supporting software including elasticsearch, logstash, redis, postgresql, and httpd.  It also does not revert configuration changes made by the `fab configure_stack` command.
