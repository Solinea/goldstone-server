#!/usr/bin/env bash

# ken@solinea.com
# (c) Solinea, Inc  2014

. ./install_functons.sh

function report_status() {
    if [[ $result = 1 ]]; then
        print "${stage}         [ DONE ]"
    elif
        print "${stage}         [ FAIL ]"
    fi
}


stage="EPEL"; result=$(setup_epel); report_status()
stage="IPTABLES"; result=$(config_iptables); report_status()
stage="ELASTICSEARCH"; result=$(install_elasticsearch); report_status()
stage="LOGSTASH"; result=$(install_logstash); report_status()
stage="POSTGRESQL"; result=$(install_pg); report_status()
stage="GOLDSTONE"; result=$(configure_goldstone); report_status()
stage="CELERY"; result=$(start_celery); report_status()
