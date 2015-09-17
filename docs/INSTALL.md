# Goldstone Installation

Before installing Goldstone, your server must meet the following prerequisites:

* 4GB RAM
* x64 CPU (or 4 core VM on x64 host)
* 100 GB free disk space
* CentOS / RHEL 7.x
* Docker >= 1.8.2 ([Install instructions](https://docs.docker.com/installation/centos/))

Goldstone server is intended for use with OpenStack *Kilo* clouds, specifically, *RedHat's RDO*. 

To view and use Goldstone, you'll need a recent version of [Firefox](https://www.mozilla.org/en-US/firefox/products/), [Safari](https://www.apple.com/safari/), or [Chrome](https://www.google.com/intl/en-US/chrome/browser).

## Install RPMs (as root)

Download the [latest release](https://github.com/Solinea/goldstone-server/releases) and execute these commands:

```bash
root# yum update ; reboot
root# yum localinstall -y goldstone-server-{version}.rpm
```

## Edit configuration and enable service (as root)

Edit the `/opt/goldstone/docker/config/goldstone-prod.env` file, and set values appropriate for your environment. 

Execute the following commands to enable the service at boot and start immediately:

```bash
root# systemctl enable goldstone-server
root# systemctl start goldstone-server
```

## Direct Logs and Events to the Goldstone Server

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

**_ Note that this procedure will modify the configuration of your OpenStack server(s).  All changed configuration files will be backed up with a file of the form name.{timestamp}. _**


## Access the client

Point your browser at the Goldstone server IP address or name and begin using Goldstone. You can log in as the `gsadmin` user with the password you configured in the `goldstone-prod.env` file.  It may take a few minutes for data to be populated in the client, but within 5 minutes, you should see charts and tables start to fill in.

`http://{your ip address}:8888`

## Uninstallation

To uninstall Goldstone:
```bash
root# yum remove goldstone-server
```

This will remove the Goldstone server software and containers, but will not remove container images.  It also does not revert configuration changes made by the `fab configure_stack` command.
