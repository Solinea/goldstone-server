#!/usr/bin/env bash

# ken@solinea.com
# (c) Solinea, Inc  2014

. ./install_functions.sh


function report_status() {
    if [[ $result = 1 ]]; then
        echo "${stage}         [ DONE ]"
    else
        echo "${stage}         [ FAIL ]"
    fi
}

logrunname="install.log"

stage="EPEL"; result=$(setup_epel 2>&1 $logrunname); report_status
stage="IPTABLES"; result=$(config_iptables 2>&1 $logrunname); report_status
stage="ELASTICSEARCH"; result=$(install_elasticsearch 2>&1 $logrunname); report_status
stage="LOGSTASH"; result=$(install_logstash 2>&1 $logrunname); report_status
stage="POSTGRESQL"; result=$(install_pg 2>&1 $logrunname); report_status
stage="GOLDSTONE"; result=$(configure_goldstone 2>&1 $logrunname); report_status
stage="CELERY"; result=$(start_celery 2>&1 $logrunname); report_status