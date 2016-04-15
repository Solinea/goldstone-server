 Ansible for Openstack Goldstone Setup
 =====================================

This playbook makes the needed changes for Goldstone on an
RDO Kilo or RDO Liberty install.

The playbook itself is under playbooks/config_openstack.yml

It runs the scripts/backup_rdo.config.sh on the host, then
scripts/config_openstack.sh and then copies some full configuration
files into place(from files/) and then restarts the OpenStack services.

