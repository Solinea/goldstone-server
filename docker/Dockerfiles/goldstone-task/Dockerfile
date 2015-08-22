# vim:set ft=dockerfile:

FROM solinea/goldstone
MAINTAINER Luke Heidecke <luke@solinea.com>

# Configure environment
USER www-data
RUN . /app/bin/activate 
CMD ["celery", \
  "worker", \
  "-A", "celery.py", \
  "-Q", "default", \
  "-n", "default@%h", \
  "--loglevel=info"]
