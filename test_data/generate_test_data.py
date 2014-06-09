# Copyright 2014 Solinea, Inc.
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

__author__ = 'John Stanford'

from elasticsearch import *
import json
from datetime import *
import pytz
import gzip

conn = Elasticsearch("10.10.11.122:9200", bulk_size=500)

start = datetime(2014, 3, 12, 0, 0, 0, tzinfo=pytz.utc)
end = datetime.now(tz=pytz.utc)

data_f = gzip.open('data.json.gz', 'wb')
data_f2 = gzip.open('goldstone_data.json.gz', 'wb')
template_f = gzip.open("./template.json.gz", 'wb')

template = conn.indices.get_template('logstash')
json.dump(template['logstash'], template_f)
template_f.close()

# get some general events
fq = {
    "query": {
        "range": {
            "@timestamp": {
                "gte": start.isoformat(),
                "lte": end.isoformat()
            }
        }
    }
}

print "query = " + json.dumps(fq)


def _get_dataset(doc_type, sort=''):
    try:
        return conn.search(index="_all", doc_type=doc_type, sort=sort)
    except:
        return {'hits': {'hits': []}}

result1 = [
    _get_dataset('syslog'),
    _get_dataset('nova_claims_summary_phys', '@timestamp:desc'),
    _get_dataset('nova_claims_summary_virt', '@timestamp:desc'),
    _get_dataset('nova_spawn_start', '@timestamp:desc'),
    _get_dataset('nova_spawn_finish', '@timestamp:desc'),
    _get_dataset('nova_hypervisor_stats', '@timestamp:desc'),
    _get_dataset('openstack_api_stats', '@timestamp:desc'),
]

result2 = [
    _get_dataset('keystone_service_list', '@timestamp:desc'),
    _get_dataset('keystone_endpoint_list', '@timestamp:desc'),
    _get_dataset('glance_image_list', '@timestamp:desc'),
    _get_dataset('cinder_service_list', '@timestamp:desc'),
    _get_dataset('cinder_volume_list', '@timestamp:desc'),
    _get_dataset('cinder_volume_type_list', '@timestamp:desc'),
    _get_dataset('cinder_transfer_list', '@timestamp:desc'),
    _get_dataset('cinder_backup_list', '@timestamp:desc'),
    _get_dataset('cinder_snapshot_list', '@timestamp:desc'),
    _get_dataset('nova_agents_list', '@timestamp:desc'),
    _get_dataset('nova_aggregates_list', '@timestamp:desc'),
    _get_dataset('nova_avail_zones_list', '@timestamp:desc'),
    _get_dataset('nova_cloudpipes_list', '@timestamp:desc'),
    _get_dataset('nova_flavors_list', '@timestamp:desc'),
    _get_dataset('nova_floating_ip_pools_list', '@timestamp:desc'),
    _get_dataset('nova_hosts_list', '@timestamp:desc'),
    _get_dataset('nova_hypervisors_list', '@timestamp:desc'),
    _get_dataset('nova_networks_list', '@timestamp:desc'),
    _get_dataset('nova_secgroups_list', '@timestamp:desc'),
    _get_dataset('nova_servers_list', '@timestamp:desc'),
    _get_dataset('nova_services_list', '@timestamp:desc'),
]

print "exporting " + str(len(result1)) + " logstash sets"
print "exporting " + str(len(result2)) + " goldstone sets"


json.dump(result1, data_f)
json.dump(result2, data_f2)

data_f.close()
data_f2.close()
