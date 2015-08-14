# vim:set ft=dockerfile:

FROM solinea/gunicorn

MAINTAINER Luke Heidecke <luke@solinea.com>

ADD . ${APPDIR}

WORKDIR ${APPDIR}

USER root
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

ENV DJANGO_SETTINGS_MODULE=goldstone.settings.docker

EXPOSE 8000

CMD ["gunicorn", "--config=gunicorn-settings.py", "goldstone.wsgi"]
