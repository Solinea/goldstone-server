#!/bin/bash -x
# Copyright 2015 Solinea, Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

#
# This script starts the boot2docker and OpenStack VirtualBox VMs, then
# brings up the docker containers that support Goldstone.  It is known
# to work with VirtualBox 4.3.30 or greater, and boot2docker v1.6.2.
#
# It assumes that you are running in a virtualenv, and that you have cloned
# the goldstone-docker and goldstone-server Github repos into the
# PROJECT_HOME associated with the virtual environment.
#
# Caution should be taken to ensure that the OpenStack VM is not in the
# process of shutting down when this script is executed, otherwise you
# may end up with a successful run, but the VM will be down.  If you use
# the sibling stop_dev_env.sh script to shut down, the condition will be
# rare since the script waits until the VM is powered off before exiting.
#

pass="'$GOLDSTONE_PASSWORD'"
echo "goldstone user password = $GOLDSTONE_PASSWORD" >> /initdb.log

gosu postgres psql <<- EOF
    CREATE USER goldstone PASSWORD $pass;
    CREATE DATABASE goldstone;
    GRANT ALL PRIVILEGES ON DATABASE goldstone TO goldstone;
    ALTER USER goldstone CREATEDB;
EOF

# Adjust PostgreSQL configuration so that remote connections to the
# database are possible. 

PG_HBA='/var/lib/postgresql/data/pg_hba.conf'
PG_CONFIG='/var/lib/postgresql/data/postgresql.conf'

if [[ -f $PG_HBA ]] ; then
    echo "updating pg_hba.conf" 
    echo "host all  all    0.0.0.0/0  md5" >> /var/lib/postgresql/data/pg_hba.conf 
else
    echo "no pg_hba.conf found!"
fi

if [[ -f $PG_CONFIG ]] ; then
    echo "updating postgresql.conf"
    echo "listen_addresses='*'" >> /var/lib/postgresql/data/postgresql.conf
else
    echo "no postgresql.conf found!"
fi

su - postgres -c 'export PGDATA=/var/lib/postgresql/data;/usr/lib/postgresql/9.4/bin/pg_ctl reload'

