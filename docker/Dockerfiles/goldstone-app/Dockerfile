# vim:set ft=dockerfile:

FROM solinea/gunicorn

MAINTAINER Luke Heidecke <luke@solinea.com>

ADD goldstone-server ${APPDIR}

WORKDIR ${APPDIR}

USER root

# ENV DJANGO_SETTINGS_MODULE goldstone.settings.docker
# ENV GOLDSTONE_INSTALL_DIR /app
# ENV DJANGO_ADMIN_USER admin
# ENV DJANGO_ADMIN_PASSWORD goldstone
# ENV DJANGO_ADMIN_EMAIL root@localhost
# ENV GOLDSTONE_TENANT_ADMIN_PASSWORD goldstone
# ENV OS_TENANT_NAME admin
# ENV OS_USERNAME admin
# ENV OS_PASSWORD solinea
# ENV OS_AUTH_URL http://172.24.4.100:5000/v2.0/

RUN buildReqs=' \
    python2.7-dev \
    gcc \
    g++ \
  ' \
  && preReqs=' \
    libffi-dev \
    libssl-dev \
    libpq-dev \
  ' \
  && apt-get update -y -q -q \
  && apt-get install -y -q $buildReqs \
  && apt-get install -y -q $preReqs \
  && pip install -r requirements.txt \
  && apt-get remove -y $buildReqs \
  && apt-get autoremove -y \
## Have to re-install due to python2.7-dev uninstalling libqp-dev
  && apt-get install libpq-dev \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

USER ${APPUSER}

EXPOSE 8000

COPY ./docker_entrypoint.sh /
ENTRYPOINT ["/docker_entrypoint.sh"]
