#! /bin/bash
RC=0
get_sum () {
    SUM=`md5sum $1 | awk '{print $1}'`
}

check_sum () {
# if the sum has changed, tell our caller that with the return code
    SUM2=`md5sum $1 | awk '{print $1}'`
    if [ a$SUM2 != a$SUM ] ; then
	RC=1
    fi
}


USE_LOG_FAC=1
LIBERTY_OR_NEWER=0
VERS=`rpm -q openstack-nova-common | cut -d- -f 4 | cut -d. -f1`
if [ "$VERS" -gt 11 -a "$VERS" -lt 2000 ] ; then
    USE_LOG_FAC=0
    LIBERTY_OR_NEWER=1
fi

if [ -s /etc/nova/nova.conf ] ; then
get_sum  /etc/nova/nova.conf
openstack-config --set --list /etc/nova/nova.conf DEFAULT notification_driver messagingv2

[ $USE_LOG_FAC -eq 1 ] && openstack-config --set	/etc/nova/nova.conf	DEFAULT	syslog_log_facility	LOG_LOCAL0
openstack-config --set	/etc/nova/nova.conf	DEFAULT	use_syslog	TRUE
openstack-config --set	/etc/nova/nova.conf	DEFAULT	verbose	TRUE
openstack-config --set	/etc/nova/nova.conf	DEFAULT	instance_usage_audit	TRUE
openstack-config --set	/etc/nova/nova.conf	DEFAULT	instance_usage_audit_period	hour
openstack-config --set	/etc/nova/nova.conf	DEFAULT	notify_on_state_change	vm_and_task_state

check_sum /etc/nova/nova.conf
fi
if [ -s /etc/nova/api-paste.ini ] ; then
get_sum /etc/nova/api-paste.ini

openstack-config --set	/etc/nova/api-paste.ini	composite:openstack_compute_api_v2	keystone	"compute_req_id faultwrap sizelimit authtoken keystonecontext ratelimit audit osapi_compute_app_v2"
openstack-config --set	/etc/nova/api-paste.ini	composite:openstack_compute_api_v2	keystone_nolimit	"compute_req_id faultwrap sizelimit authtoken keystonecontext audit osapi_compute_app_v2"
openstack-config --set	/etc/nova/api-paste.ini	composite:openstack_compute_api_v21	keystone	"compute_req_id faultwrap sizelimit authtoken keystonecontext audit osapi_compute_app_v21"
openstack-config --set	/etc/nova/api-paste.ini	composite:openstack_compute_api_v3	keystone	"request_id faultwrap sizelimit authtoken keystonecontext audit osapi_compute_app_v3"
openstack-config --set	/etc/nova/api-paste.ini	filter:audit	paste.filter_factory	keystonemiddleware.audit:filter_factory
openstack-config --set	/etc/nova/api-paste.ini	filter:audit	audit_map_file	/etc/nova/nova_api_audit_map.conf

check_sum /etc/nova/api-paste.ini
fi

if [ -s /etc/cinder/cinder.conf ] ; then
get_sum /etc/cinder/cinder.conf


openstack-config --set --list /etc/cinder/cinder.conf DEFAULT notification_driver messaging

[ $USE_LOG_FAC -eq 1 ] && openstack-config --set	/etc/cinder/cinder.conf	DEFAULT	syslog_log_facility	LOG_LOCAL5
openstack-config --set	/etc/cinder/cinder.conf	DEFAULT	use_syslog	TRUE
openstack-config --set	/etc/cinder/cinder.conf	DEFAULT	verbose	TRUE
openstack-config --set	/etc/cinder/cinder.conf	DEFAULT	control_exchange	cinder

check_sum /etc/cinder/cinder.conf
fi
if [ -s /etc/cinder/api-paste.ini ] ; then
get_sum /etc/cinder/api-paste.ini

openstack-config --set	/etc/cinder/api-paste.ini	composite:openstack_volume_api_v1	keystone	"request_id faultwrap sizelimit osprofiler authtoken keystonecontext audit apiv1"
openstack-config --set	/etc/cinder/api-paste.ini	composite:openstack_volume_api_v1	keystone_nolimit	"request_id faultwrap sizelimit osprofiler authtoken keystonecontext audit apiv1"
openstack-config --set	/etc/cinder/api-paste.ini	composite:openstack_volume_api_v2	keystone	"request_id faultwrap sizelimit osprofiler authtoken keystonecontext audit apiv2"
openstack-config --set	/etc/cinder/api-paste.ini	composite:openstack_volume_api_v2	keystone_nolimit	"request_id faultwrap sizelimit osprofiler authtoken keystonecontext audit apiv2"
openstack-config --set	/etc/cinder/api-paste.ini	filter:audit	paste.filter_factory	keystonemiddleware.audit:filter_factory
openstack-config --set	/etc/cinder/api-paste.ini	filter:audit	audit_map_file	/etc/cinder/cinder_api_audit_map.conf

check_sum /etc/cinder/api-paste.ini
fi

if [ -s /etc/keystone/keystone.conf ]  ; then

get_sum /etc/keystone/keystone.conf

openstack-config --set --list /etc/keystone/keystone.conf DEFAULT notification_driver messaging

[ $USE_LOG_FAC -eq 1 ] && openstack-config --set	/etc/keystone/keystone.conf	DEFAULT	syslog_log_facility	LOG_LOCAL6
openstack-config --set	/etc/keystone/keystone.conf	DEFAULT	use_syslog	TRUE
openstack-config --set	/etc/keystone/keystone.conf	DEFAULT	verbose	TRUE
openstack-config --set	/etc/keystone/keystone.conf	DEFAULT	notification_format	cadf

check_sum /etc/keystone/keystone.conf

fi

if [ -s /etc/neutron/neutron.conf ] ; then
get_sum /etc/neutron/neutron.conf
openstack-config --set --list /etc/neutron/neutron.conf notification_driver neutron.openstack.common.notifier.rpc_notifier

[ $USE_LOG_FAC -eq 1 ] && openstack-config --set	/etc/neutron/neutron.conf	DEFAULT	syslog_log_facility	LOG_LOCAL2
openstack-config --set	/etc/neutron/neutron.conf	DEFAULT	use_syslog	TRUE
openstack-config --set	/etc/neutron/neutron.conf	DEFAULT	verbose	TRUE

check_sum /etc/neutron/neutron.conf
fi
if [ -s /etc/neutron/api-paste.ini ]  ; then
get_sum /etc/neutron/api-paste.ini

openstack-config --set	/etc/neutron/api-paste.ini	composite:neutronapi_v2_0	use	"call:neutron.auth:pipeline_factory"
openstack-config --set	/etc/neutron/api-paste.ini	composite:neutronapi_v2_0	noauth	"request_idcatch_errorsextensions neutronapiapp_v2_0"
openstack-config --set	/etc/neutron/api-paste.ini	composite:neutronapi_v2_0	keystone	"request_id catch_errors authtoken keystonecontext audit extensions neutronapiapp_v2_0"
openstack-config --set	/etc/neutron/api-paste.ini	filter:audit	paste.filter_factory	keystonemiddleware.audit:filter_factory
openstack-config --set	/etc/neutron/api-paste.ini	filter:audit	audit_map_file	/etc/neutron/neutron_api_audit_map.conf
check_sum /etc/neutron/api-paste.ini
fi

if [ -s /etc/ceilometer/ceilometer.conf ] ; then
get_sum /etc/ceilometer/ceilometer.conf

[ $USE_LOG_FAC -eq 1 ] && openstack-config --set	/etc/ceilometer/ceilometer.conf	DEFAULT	syslog_log_facility	LOG_LOCAL3
openstack-config --set	/etc/ceilometer/ceilometer.conf	DEFAULT	use_syslog	TRUE
openstack-config --set	/etc/ceilometer/ceilometer.conf	DEFAULT	verbose	TRUE
openstack-config --set	/etc/ceilometer/ceilometer.conf	event	definitions_cfg_file	event_definitions.yaml
openstack-config --set	/etc/ceilometer/ceilometer.conf	event	drop_unmatched_notifications	FALSE
openstack-config --set	/etc/ceilometer/ceilometer.conf	notification	store_events	TRUE
openstack-config --set	/etc/ceilometer/ceilometer.conf	notification	disable_non_metric_meters	TRUE
openstack-config --set	/etc/ceilometer/ceilometer.conf	database	event_connection	es://$1:9200
openstack-config --set	/etc/ceilometer/ceilometer.conf	database	time_to_live	604800#oneweek

check_sum /etc/ceilometer/ceilometer.conf
fi

if [ -s /etc/ceilometer/api_paste.ini ] ; then
get_sum /etc/ceilometer/api_paste.ini
openstack-config --set	/etc/ceilometer/api_paste.ini	pipeline:main	pipeline	request_idauthtokenauditapi-server
openstack-config --set	/etc/ceilometer/api_paste.ini	filter:audit	paste.filter_factory	keystonemiddleware.audit:filter_factory
openstack-config --set	/etc/ceilometer/api_paste.ini	filter:audit	audit_map_file	/etc/ceilometer/ceilometer_api_audit_map.conf
check_sum /etc/ceilometer/api_paste.ini
fi

if [ -s /etc/glance/glance-cache.conf ] ; then
get_sum /etc/glance/glance-cache.conf

[ $USE_LOG_FAC -eq 1 ] && openstack-config --set	/etc/glance/glance-cache.conf	DEFAULT	syslog_log_facility	LOG_LOCAL1
openstack-config --set	/etc/glance/glance-cache.conf	DEFAULT	use_syslog	TRUE
openstack-config --set	/etc/glance/glance-cache.conf	DEFAULT	verbose	TRUE
check_sum /etc/glance/glance-cache.conf
fi

if [ -s /etc/glance/glance-api.conf ] ; then
get_sum /etc/glance/glance-api.conf

openstack-config --set --list /etc/glance/glance-api.conf DEFAULT notification_driver messagingv2
[ $USE_LOG_FAC -eq 1 ] && openstack-config --set	/etc/glance/glance-api.conf	DEFAULT	syslog_log_facility	LOG_LOCAL1
openstack-config --set	/etc/glance/glance-api.conf	DEFAULT	use_syslog	TRUE
openstack-config --set	/etc/glance/glance-api.conf	DEFAULT	verbose	TRUE
openstack-config --set	/etc/glance/glance-api.conf	paste_deploy	config_file	/etc/glance/glance-api-paste.ini
check_sum /etc/glance/glance-api.conf
fi
if [ -s /etc/glance/glance-api-paste.ini ] ; then
get_sum /etc/glance/glance-api-paste.ini
openstack-config --set /etc/glance/glance-api-paste.ini filter:audit paste.filter_factory keystonemiddleware.audit:filter_factory
openstack-config --set /etc/glance/glance-api-paste.ini filter:audit audit_map_file /etc/glance/glance_api_audit_map.conf
HC=""
if [ $LIBERTY_OR_NEWER -eq 1 ] ; then
    HC="healthcheck "
fi
openstack-config --set /etc/glance/glance-api-paste.ini pipeline:glance-api-keystone pipeline "${HC}versionnegotiation osprofiler authtoken audit context  rootapp"
openstack-config --set /etc/glance/glance-api-paste.ini pipeline:glance-api-keystone+caching pipeline "${HC}versionnegotiation osprofiler authtoken audit context cache rootapp"
openstack-config --set /etc/glance/glance-api-paste.ini pipeline:glance-api-keystone+cachemanagement pipeline "${HC}versionnegotiation osprofiler authtoken audit context  cache cachemanage rootapp"

check_sum /etc/glance/glance-api-paste.ini
fi

if [ -s /etc/glance/glance-registry.conf ] ; then
get_sum /etc/glance/glance-registry.conf

openstack-config --set --list /etc/glance/glance-registry.conf DEFAULT notification_driver messagingv2

[ $USE_LOG_FAC -eq 1 ] && openstack-config --set	/etc/glance/glance-registry.conf	DEFAULT	syslog_log_facility	LOG_LOCAL1
openstack-config --set	/etc/glance/glance-registry.conf	DEFAULT	use_syslog	TRUE
openstack-config --set	/etc/glance/glance-registry.conf	DEFAULT	verbose	TRUE
check_sum /etc/glance/glance-registry.conf
fi

if [ -s /etc/glance/glance-scrubber.conf ] ; then
get_sum /etc/glance/glance-scrubber.conf

[ $USE_LOG_FAC -eq 1 ] && openstack-config --set	/etc/glance/glance-scrubber.conf	DEFAULT	syslog_log_facility	LOG_LOCAL1
openstack-config --set	/etc/glance/glance-scrubber.conf	DEFAULT	use_syslog	TRUE
openstack-config --set	/etc/glance/glance-scrubber.conf	DEFAULT	verbose	TRUE

check_sum /etc/glance/glance-scrubber.conf
fi

echo RC: $RC
exit $RC
