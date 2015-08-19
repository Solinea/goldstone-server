# vim:set ft=dockerfile:

FROM logstash:1.5
MAINTAINER Luke Heidecke <luke@solinea.com>

RUN /opt/logstash/bin/plugin install logstash-filter-translate
RUN /opt/logstash/bin/plugin install logstash-input-http
