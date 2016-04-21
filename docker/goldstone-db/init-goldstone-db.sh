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


if [ ${HASHED_POSTGRES_PASSWORD} ] ; then
    pg_pass="'$HASHED_POSTGRES_PASSWORD'"
else
   pg_pass="'$POSTGRES_PASSWORD'"
fi

if [ ${HASHED_GOLDSTONE_PASSWORD} ] ; then
    gs_pass="'$HASHED_GOLDSTONE_PASSWORD'"
    enc='ENCRYPTED'
else
    gs_pass="'$GOLDSTONE_PASSWORD'"
    enc='UNENCRYPTED'
fi

gosu postgres psql <<- EOF
    CREATE USER goldstone PASSWORD $gs_pass;
    CREATE DATABASE goldstone;
    GRANT ALL PRIVILEGES ON DATABASE goldstone TO goldstone;
    ALTER USER goldstone CREATEDB;
    ALTER USER postgres $enc PASSWORD $pg_pass;
    ALTER USER goldstone $enc PASSWORD $gs_pass;
EOF

# Adjust PostgreSQL configuration so that remote connections to the
# database are possible. 

PG_HBA='/var/lib/postgresql/data/pg_hba.conf'
PG_CONFIG='/var/lib/postgresql/data/postgresql.conf'

echo "updating pg_hba.conf" 
echo "local all all     trust" > /var/lib/postgresql/data/pg_hba.conf 
echo "host  all all 0.0.0.0/0   md5" >> /var/lib/postgresql/data/pg_hba.conf 

su - postgres -c 'export PGDATA=/var/lib/postgresql/data;/usr/lib/postgresql/9.4/bin/pg_ctl reload'
