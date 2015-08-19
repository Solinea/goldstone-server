#!/bin/bash -x

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

