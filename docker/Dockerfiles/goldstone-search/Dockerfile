# vim:set ft=dockerfile:

FROM solinea/elasticsearch
MAINTAINER Luke Heidecke <luke@solinea.com>

# Install admin plugins
RUN plugin install mobz/elasticsearch-head \
  && plugin install lukas-vlcek/bigdesk

# Overlays any files/directories to the ES config dir
# ADD config /usr/share/elasticsearch/config

ENV ES_CLUSTERNAME goldstone

# Defaults to the container's hostname
ENV ES_NODENAME \${HOSTNAME}

# Defaults to reasonable dev environment memory
ENV ES_HEAP_SIZE 256M

ENV ES_JAVA_OPTS="\
  -Des.cluster.name=\${ES_CLUSTERNAME} \
  -Des.node.name=\${ES_NODENAME} \
  -Des.index.search.slowlog.threshold.query.warn=10s \
  -Des.index.search.slowlog.threshold.query.info=5s \
  -Des.index.search.slowlog.threshold.query.debug=2s \
  -Des.index.search.slowlog.threshold.query.trace=500ms \
  -Des.index.search.slowlog.threshold.fetch.warn=1s \
  -Des.index.search.slowlog.threshold.fetch.info=800ms \
  -Des.index.search.slowlog.threshold.fetch.debug=500ms \
  -Des.index.search.slowlog.threshold.fetch.trace=200ms \
  -Des.index.indexing.slowlog.threshold.index.warn=10s \
  -Des.index.indexing.slowlog.threshold.index.info=5s \
  -Des.index.indexing.slowlog.threshold.index.debug=2s \
  -Des.index.indexing.slowlog.threshold.index.trace=500ms \
  -Des.monitor.jvm.gc.young.warn=1000ms \
  -Des.monitor.jvm.gc.young.info=700ms \
  -Des.monitor.jvm.gc.young.debug=400ms \
  -Des.monitor.jvm.gc.old.warn=10s \
  -Des.monitor.jvm.gc.old.info=5s \
  -Des.monitor.jvm.gc.old.debug=2s \
  "
