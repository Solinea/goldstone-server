This folder contains `Vagrant`_ environments for developers to 
test goldstone builds. 

Vagrant can be installed by downloading the installer from 
http://www.vagrantup.com/downloads.html. Vagrant requires `VirtualBox`_ also.

.. _Vagrant: http://vagrantup.com/
.. _VirtualBox: https://www.virtualbox.org/

Usage
=====

To use these environments, change to the appropriate environment directory (see descriptions below) and then start the VM: ::

    # vagrant up

This will start the VM and follow the vagrantfile script to provision it. Once the provisioning is done, you can login into the box via the `vagrant ssh` command: ::

    # vagrant ssh
    Last login: Thu Jun 26 18:02:56 2014 from 10.0.2.2
    [vagrant@vagrant-centos65 ~]$

By default, the VMs are using NAT networking. To view the goldstone application, use the http://localhost:8080 port which is forwarded to port 80 on the VM.

When you are done with the VM, you can delete it with the `vagrant destroy` command: ::

    $ vagrant destroy
        default: Are you sure you want to destroy the 'default' VM? [y/N] **y**
    ==> default: Forcing shutdown of VM...
    ==> default: Destroying VM and associated drives...
    ==> default: Running cleanup tasks for 'shell' provisioner...

Environments
============

The following environments have been created.

Vagrant-CentOS-Prod
*******************

This environment brings up a CentOS 6.5 virtualbox (3GB RAM, 8GB HD, 1vCPU) and then installs the latest released version of goldstone from repo.solinea.com. This VM already has EPEL enabled on it.

Vagrant-CentOS-Dev
******************

This environment brings up:

* **GOLDSTONE**: CentOS 6.5 virtualbox (2GB RAM, 8GB HD, 1vCPU) for goldstone and then installs the goldstone prerequesites and then mounts Solinea's local Dropbox folder with the development RPMs in it under /goldstone. This VM already has EPEL enabled on it also.
* **RDO**: CentOS 6.5 virtualbox (2GB RAM, 8GB HD, 1vCPU) with RDO (current Icehouse) preinstalled on it. The credential are stored in the home directory (`keystonerc_admin` and `keystonerc_demo`) and most services are running. The OpenStack Dashboard browse to http://localhost:8081/dashboard. To use Nagios, browse to http://localhost:8081/nagios (username: nagiosadmin, password: 627d12e0096c45b1). The generated puppet manifests are at `/var/tmp/packstack/20140628-003620-OhN37L/manifests`. System logs are redirected for OpenStack daemons through rsyslog (in `/etc/rsyslog.d/10-goldstone.conf`).

To access either machine, use the `vagrant ssh` command with the VM name: ::

    $ vagrant ssh rdo
    Last login: Sat Jun 28 22:30:26 2014 from 10.0.2.2
    [vagrant@vagrant-centos65 ~]$ exit
    logout
    Connection to 127.0.0.1 closed.
    $ vagrant ssh goldstone
    Last login: Sat Jun 28 22:26:45 2014 from 10.0.2.2
    [vagrant@vagrant-centos65 ~]$ exit
    logout
    Connection to 127.0.0.1 closed.
    $ 

Inside the goldstone VM, you can install any unreleased goldstone version with: ::

    # yum localinstall -y /goldstone/goldstone-1.1.dev19.ga96ad94-1.noarch.rpm



