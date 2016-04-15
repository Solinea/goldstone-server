 Ansible for Openstack Goldstone Setup
 =====================================

This playbook makes the needed changes for Goldstone on an
RDO Kilo or RDO Liberty install.

The playbook itself is under playbooks/config_openstack.yml

It runs the scripts/backup_rdo.config.sh on the host, then
scripts/config_openstack.sh and then copies some full configuration
files into place(from files/) and then restarts the OpenStack services.


Running the playbook
--------------------
Setup your ansible inventory with the hosts you're interested in under
a group called "openstack".

Then run:

Replacing the path and $GOLDSTONE_ADDRESS with the proper values
~~~
ansible-playbook <path_to_goldstone_ansible_directory>/playbooks/config_openstack.yml --extra-vars "goldstone_addr=$GOLDSTONE_ADDRESS"
~~~


Restrictions
------------
    At this time it is only compatible with RDO as it uses
the openstack-config tool due to missing features in the ansible
ini file module.

