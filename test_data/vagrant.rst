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

This environment brings up a CentOS 6.5 virtualbox (3GB RAM, 8GB HD, 1vCPU) and then installs the goldstone prerequesites and then mounts Solinea's local Dropbox folder with the development RPMs in it under /goldstone. From here, you can install any unreleased goldstone version with: ::

    # yum localinstall /goldstone/goldstone-1.1.dev19.ga96ad94-1.noarch.rpm

This VM already has EPEL enabled on it also.
