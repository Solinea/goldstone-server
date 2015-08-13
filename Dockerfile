# vim:set ft=dockerfile:

FROM solinea/gunicorn

MAINTAINER Luke Heidecke <luke@solinea.com>

ENV DJANGO_SETTINGS_MODULE=goldstone.settings.production

ADD . ${APPDIR}

WORKDIR ${APPDIR}

USER root
RUN . ${ENVDIR}/bin/activate \
  && buildReqs=' \
    python2.7-dev \
    libpq-dev \
    libffi-dev \
    libssl-dev \
    gcc \
    g++ \
  ' \
  && apt-get update -y -q -q && apt-get install -y -q $buildReqs \
  && pip install -r requirements.txt \
  && apt-get remove -y $buildReqs \
  && apt-get autoremove -y \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

USER ${APPUSER}

RUN . ${ENVDIR}/bin/activate

EXPOSE 8000

CMD ["gunicorn", "--config=gunicorn-settings.py", "goldstone:application"]
