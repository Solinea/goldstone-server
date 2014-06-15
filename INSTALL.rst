=============================
Goldstone Installation
=============================

GOLDSTONE LICENSE
*********************

Copyright 2014 Solinea, Inc.

Licensed under the Solinea Software License Agreement (goldstone),
Version 1.0 (the "License"); you may not use this file except in compliance
with the License. You may obtain a copy of the License at:

    http://www.solinea.com/goldstone/LICENSE.pdf

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

INSTALLING GOLDSTONE
*********************

Installing goldstone is a three step process:

1. Install prerequisites
2. Run goldstone installer script
3. Direct OpenStack server logs to goldstone server


INSTALL PREREQUISITES
*********************

Your goldstone server needs to meet the following prerequesites:

▪ 4GB RAM
▪ x64 CPU
▪ CentOS / RHEL 6.5

Once you are sure that your server or VM meets those requirements, install these required packages via the command line as root:
 
# yum install -y java-1.7.0-openjdk.x86_64 gcc gcc-c++ 
# yum install -y mysql-server mysql-devel


RUN GOLDSTONE INSTALLER
***********************

First, add the goldstone repository then install the goldstone application.

# cat << EOF > /etc/yum.repos.d/goldstone.repo
> [goldstone]
> name=goldstone
> baseurl=http://repo.solinea.com/repo
> enabled=1
> gpgcheck=0
> EOF
# yum install goldstone

Now run the goldstone installer script as root:

# cd /opt/goldstone
# ./install_goldstone.sh

The output of this script will look like this:

Sat Jun  7 14:10:56 PDT 2014 	STARTING EPEL ....
Sat Jun  7 14:13:28 PDT 2014	EPEL         [ DONE ]
Sat Jun  7 14:13:28 PDT 2014 	STARTING IPTABLES ....
Sat Jun  7 14:13:29 PDT 2014	IPTABLES         [ DONE ]
Sat Jun  7 14:13:29 PDT 2014 	STARTING ELASTICSEARCH ....
Sat Jun  7 14:17:52 PDT 2014	ELASTICSEARCH         [ DONE ]
Sat Jun  7 14:17:52 PDT 2014 	STARTING LOGSTASH ....
Sat Jun  7 14:20:11 PDT 2014	LOGSTASH         [ DONE ]
Sat Jun  7 14:20:11 PDT 2014 	STARTING LOGGING ....
Sat Jun  7 14:20:11 PDT 2014	LOGGING         [ DONE ]
Sat Jun  7 14:20:11 PDT 2014 	STARTING POSTGRESQL ....
Sat Jun  7 14:20:45 PDT 2014	POSTGRESQL         [ DONE ]
Sat Jun  7 14:20:45 PDT 2014 	STARTING GOLDSTONE ....
Sat Jun  7 14:51:41 PDT 2014	GOLDSTONE         [ DONE ]
Sat Jun  7 14:51:41 PDT 2014 	STARTING CELERY ....
Sat Jun  7 14:51:44 PDT 2014	CELERY         [ DONE ]
Sat Jun  7 14:52:44 PDT 2014	[ FINISHED ]

This script may take up to 2 hours to run, as it needs to compile a number of libraries. While it is running, you can monitor the install.log file for low-level reports on its activities.

Once the script has finished, edit the /opt/goldstone/goldstone/settings/production.py file to add your OpenStack admin credentials. These are located at the bottom of the file:

OS_USERNAME = 'admin'
OS_PASSWORD = 'fe6ac09d85041ae384c66a83e362f565'
OS_TENANT_NAME = 'admin'
OS_AUTH_URL = 'http://10.10.15.230:5000/v2.0'


DIRECT LOGS TO GOLDSTONE SERVER
*******************************

With goldstone installed, the only task left is to point the OpenStack server logs to it so that it can begin processing them.

Each OpenStack service uses one of the local syslog facilities to help with categorization of logs.  There are generally three fields to set in the configuration file for a service (i.e. /etc/nova/nova.conf).  They are:

    * verbose = True
    * use_syslog = True
    * syslog_log_facility = LOG_LOCAL{X}

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

The following service mapping is used for syslog_log_facility:
    * nova => LOG_LOCAL0
    * glance => LOG_LOCAL1
    * neutron => LOG_LOCAL2
    * ceilometer => LOG_LOCAL3
    * swift => LOG_LOCAL4
    * cinder => LOG_LOCAL5
    * keystone => LOG_LOCAL6

Restart the OpenStack services and syslog or reboot the node. Repeat this on all the OpenStack servers (or better include this in your puppet scripts).

Now that everything has been configured, point your browser to the goldstone server IP address and begin using goldstone.