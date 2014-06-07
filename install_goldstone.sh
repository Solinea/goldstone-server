#!/usr/bin/env bash

# ken@solinea.com
# (c) Solinea, Inc  2014

red_text=${txtbld}$(tput setaf 1) #  red
green_text=${txtbld}$(tput setaf 2) #  green
txtrst=$(tput sgr0) # reset

. ./install_functions.sh


function report_status() {
    d=`date`
    if [ "$result" == "1" ]; then
        echo -e "${d}	${stage}         ${green_text}[ PASS ]${txtrst}"
    else
        echo -e "${d} 	${stage}         ${red_text}[ FAIL ]${txtrst}"
    fi
}

function datestamp() {
    d=`date`
    echo -e "${d} 	STARTING ${stage} ...."
}

logrunname="install.log"

stage="EPEL"; datestamp; result=$(setup_epel 2>&1 $logrunname); report_status
stage="IPTABLES"; datestamp; result=$(config_iptables 2>&1 $logrunname); report_status
stage="ELASTICSEARCH"; datestamp; result=$(install_elasticsearch 2>&1 $logrunname); report_status
stage="LOGSTASH"; datestamp; result=$(install_logstash 2>&1 $logrunname); report_status
stage="LOGGING"; datestamp; result=$(set_logging 2>&1 $logrunname); report_status
stage="POSTGRESQL"; datestamp; result=$(install_pg 2>&1 $logrunname); report_status
stage="GOLDSTONE"; datestamp; result=$(configure_goldstone 2>&1 $logrunname); report_status
stage="CELERY"; datestamp; result=$(start_celery 2>&1 $logrunname); report_status


# setup_epel
# config_iptables
# install_elasticsearch
# install_logstash
# * set_logging
# install_pg
# configure_goldstone
# start_celery
