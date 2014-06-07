#!/usr/bin/env bash

# ken@solinea.com
# (c) Solinea, Inc  2014

red_text=${txtbld}$(tput setaf 1) #  red
green_text=${txtbld}$(tput setaf 2) #  green
txtrst=$(tput sgr0) # reset

. ./install_functions.sh


function report_status() {
    if [[ $result = 1 ]]; then
        echo -e "${stage}         ${green_text}[ PASS ]${txtrst}"
    else
        echo -e "${stage}         ${red_text}[ FAIL ]${txtrst}"
    fi
}

logrunname="install.log"

stage="EPEL"; result=$(setup_epel 2>&1 $logrunname); report_status
stage="IPTABLES"; result=$(config_iptables 2>&1 $logrunname); report_status
stage="ELASTICSEARCH"; result=$(install_elasticsearch 2>&1 $logrunname); report_status
stage="LOGSTASH"; result=$(install_logstash 2>&1 $logrunname); report_status
stage="LOGGING"; result=$(set_logging 2>&1 $logrunname); report_status
stage="POSTGRESQL"; result=$(install_pg 2>&1 $logrunname); report_status
stage="GOLDSTONE"; result=$(configure_goldstone 2>&1 $logrunname); report_status
stage="CELERY"; result=$(start_celery 2>&1 $logrunname); report_status


# setup_epel
# config_iptables
# install_elasticsearch
# install_logstash
# * set_logging
# install_pg
# configure_goldstone
# start_celery