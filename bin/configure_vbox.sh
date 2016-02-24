#!/bin/bash
# Copyright 2015 Solinea, Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

#
# Does the following:
#     * creates a new host only network
#     * configures the network address space to work with the provided
#       developer OpenStack image
#     * ensures that the OpenStack VM has a NAT interface for external
#       access
#     * ensures that the OpenStack VM has a host only network interface
#     * adds NAT rules for Goldstone traffic
#

STACK=true
DOCKER=true
DOCKER_VM="default"
OPENSTACK_VM="RDO-kilo"

for arg in "$@" ; do
    case $arg in
        --no-stack)
            STACK=false
        ;;
        --no-docker)
            DOCKER=false
        ;;
        --docker-vm=*)
            DOCKER_VM="${arg#*=}"
            shift
        ;;
        --stack-vm=*)
            OPENSTACK_VM="${arg#*=}"
            shift
        ;;
        --help)
            echo "Usage: $0 [--docker-vm=name] [--stack-vm=name] [--no-stack] [--no-docker]"
            exit 0
        ;;
        *)
            # unknown option
            echo "Usage: $0 [--docker-vm=name] [--stack-vm=name] [--no-stack] [--no-docker]"
            exit 1
        ;;
    esac
done

HOST_ONLY_ADDR=172.24.4.1
HOST_ONLY_NETMASK=255.255.255.0
NAT_NAME=GoldstoneDevNAT
NAT_NETWORK=10.0.41.0/24
OPENSTACK_HOST_INT=2
OPENSTACK_NAT_INT=1
COMMON_RULE_LIST='es_9200_local,tcp,,9200,,9200 
                  es_9300_local,tcp,,9300,,9300 
                  logstash_syslog_local,tcp,,5514,,5514 
                  logstash_metrics_local,udp,,5516,,5516 
                  logstash_agent_local,tcp,,5516,,5516 
                  logstash_internal_local,tcp,,5517,,5517
                  postgres_local,tcp,,5432,,5432 
                  redis_local,tcp,,6379,,6379
                  kibana_local,tcp,,5601,,5601
                  gs_8000_local,tcp,,8000,,8000
                  gs_8888_local,tcp,,8888,,8888 
                  flower_local,tcp,,5555,,5555' 

if [[ $STACK == "true" ]] ; then
    HOST_NET_EXISTS=$(VBoxManage list --long hostonlyifs | grep -qs $HOST_ONLY_ADDR ; echo $?)
    NAT_NET_EXISTS=$(VBoxManage list --long natnetworks | grep -qs $NAT_NAME ; echo $?)

    # Track errors with VM network settings
    err_count="0"

    if [ $HOST_NET_EXISTS = 1 ] ; then
        # create the vboxnet
        echo "Creating host only network"
        host_net=$(VBoxManage hostonlyif create 2> /dev/null | \
           grep Interface | \
           sed -e "s/^.*'\(.*\)'.*$/\1/")

        if [[ $host_net == '' ]] ; then
            echo 'Could not create host only network'
            exit 1
        fi

        # configure vboxnet
        VBoxManage hostonlyif ipconfig $host_net --ip $HOST_ONLY_ADDR \
                                                 --netmask $HOST_ONLY_NETMASK 

        if [[ $? != 0 ]] ; then
            echo "Could not configure address of $host_net"
            exit 1
        else 
            echo "set $host_net to ${HOST_ONLY_ADDR}/${HOST_ONLY_NETMASK}"
        fi

        VBoxManage modifyvm $OPENSTACK_VM --nic${OPENSTACK_HOST_INT} hostonly || \
            err_count=$[$err_count+$?]
        VBoxManage modifyvm $OPENSTACK_VM --hostonlyadapter${OPENSTACK_HOST_INT} $host_net || \
            err_count=$[$err_counti+$?]

    else
        echo
        echo "***********************************************************************"
        echo "    A host network with address $HOST_ONLY_ADDR already exists." 
        echo "    You can find it using 'VBoxManage list --long hostonlyifs'."
        echo "    After you find the name, adjust your development OpenStack instance"
        echo "    network settings for interface $OPENSTACK_HOST_INT accordingly."
        echo "***********************************************************************"
        echo
    fi

    if [ $NAT_NET_EXISTS = 1 ] ; then

        # Add the NAT network
        VBoxManage natnetwork add --netname $NAT_NAME \
                                  --network $NAT_NETWORK \
                                  --enable \
                                  --dhcp off \
                                  --loopback-4 127.0.0.1=2 \
                                  --ipv6 off

        # configure NICs for VMs
        VBoxManage modifyvm $OPENSTACK_VM --nic${OPENSTACK_NAT_INT} natnetwork \
                                          --nat-network${OPENSTACK_NAT_INT} $NAT_NAME || \
            err_count=$[$err_counti+$?]
    else
        echo
        echo "***********************************************************************"
        echo "    A NAT network with name $NAT_NAME already exists." 
        echo "    You can inspect it using 'VBoxManage list --long natnetworks'."
        echo "    Adjust your development OpenStack instance network settings"
        echo "    for interface $OPENSTACK_NAT_INT accordingly."
        echo "***********************************************************************"

    fi

    if [ $err_count -gt 0 ] ; then
        echo "Encountered errors setting up VM network interfaces"
        exit 1
    else
        echo "Finished configuring VM network interfaces"
    fi
else
    echo "Skipping OpenStack network configuration"
fi


if [[ $DOCKER == "true" ]] ; then
    # Ensure the docker image is stopped
    docker-machine stop ${DOCKER_VM}
    # Restore the original ssh NAT rule if it has been deleted.  Ignore errors.
    VBoxManage modifyvm ${DOCKER_VM} --natpf1 "ssh,tcp,,2022,,22" 2> /dev/null

    # Track errors with Docker image NAT settings
    err_count="0"
    for rule in $COMMON_RULE_LIST ; do
        echo "processing rule: $rule"
        VBoxManage modifyvm ${DOCKER_VM} --natpf1 "$rule" || \
            err_count=$[$err_count+$?]
    done

    if [ $err_count -gt 0 ] ; then
        echo "Encountered errors setting up NAT rules for $DOCKER_VM"
        exit 1
    else
        echo "Finished configuring VM network interfaces"
    fi
else
    echo "Skipping docker VM network configuration"
fi
