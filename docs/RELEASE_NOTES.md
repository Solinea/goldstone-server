Goldstone Server Release Notes

This page documents core features included in the Goldstone Server and Goldstone Server Enterprise release.

## 1.0.0

For detailed information on using any of Goldstone Server’s features, please refer to the User Guide.

### Requirements

The host OS for Goldstone Server 1.0.0 requires:

* CentOS 7.x

* Docker >= 1.9.1

Goldstone Server can manage the following OpenStack distros:

* RedHat RDO Kilo (2015.1.1-1.el7)

* Crudini >= 0.7 (from EPEL repo)

### Goldstone Server Open Source Additions

* Login page

* Settings page to configure administrator name/email, and connection to OpenStack cloud

* Dashboard page containing the service status panel, metric stream flow panel, and global resource panels for CPU, memory, RAM, and VM spawn activity

* API metrics page containing high level statistics about API response time by OpenStack project

* Report page to search, sort, and browse system and OpenStack logs, OpenStack events, and OpenStack API calls.  

* Predefined searches provided by Solinea, as well as a search editor to allow customer defined searches.

* Cloud topology navigator to browse cloud resource configuration across Keystone, Nova, Neutron, Cinder, and Glance

* Alerts panel to display key events

* I18N translations for English and Japanese

* RPM based packaging

* Docker containerization of underlying services

### Goldstone Server Enterprise Additions

* Initial set of predefined searches

* OpenStack advisory integrations

* OpenStack resource leases

* OpenTrail cloud event auditing

