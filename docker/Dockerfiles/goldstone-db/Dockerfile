# vim:set ft=dockerfile:
#TODO(heidecke): Base on the new solinea/postgres image

FROM postgres:9.4

MAINTAINER Luke Heidecke <luke@solinea.com>

# ENV POSTGRES_PASSWORD goldstone
# ENV GOLDSTONE_PASSWORD goldstone

ADD init-goldstone-db.sh /docker-entrypoint-initdb.d/
