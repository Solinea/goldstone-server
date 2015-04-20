# Copyright 2014 - 2015 Solinea, Inc.
#
# Licensed under the Solinea Software License Agreement (goldstone),
# Version 1.0 (the "License"); you may not use this file except in compliance
# with the License. You may obtain a copy of the License at:
#
#     http://www.solinea.com/goldstone/LICENSE.pdf
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
from elasticsearch import *
import json
from datetime import *
import pytz
import gzip

conn = Elasticsearch("10.10.11.123:9200", bulk_size=500)


def _get_index_template(template_name, file_path):

    print "dumping " + template_name + " index template..."

    f = gzip.open(file_path, 'wb')
    template = conn.indices.get_template(template_name)

    json.dump(template[template_name], f)
    f.close()

    print "done."


_get_index_template('logstash', './logstash_template.json.gz')
_get_index_template('goldstone', './goldstone_template.json.gz')
_get_index_template('goldstone_model', './model_template.json.gz')
_get_index_template('goldstone_agent', './agent_template.json.gz')


def _get_dataset(doc_type, sort='', index='_all', count='100'):
    try:
        result = conn.search(index=index, doc_type=doc_type, sort=sort,
                             size=count)
        # clean out the unnecessary junk
        return {'hits': {'hits': result['hits']['hits']}}
    except Exception as e:
        print "[_get_dataset] exception for " + doc_type + ": " + e.message
        return {'hits': {'hits': []}}

logstash_docs = [
    _get_dataset('syslog'),
    _get_dataset('nova_claims_summary_phys', '@timestamp:desc'),
    _get_dataset('nova_claims_summary_virt', '@timestamp:desc'),
    _get_dataset('nova_spawn_start', '@timestamp:desc'),
    _get_dataset('nova_spawn_finish', '@timestamp:desc'),
    _get_dataset('nova_hypervisor_stats', '@timestamp:desc'),
    _get_dataset('openstack_api_stats', '@timestamp:desc'),
]

goldstone_docs = [
    _get_dataset('keystone_service_list', '@timestamp:desc'),
    _get_dataset('keystone_endpoint_list', '@timestamp:desc'),
    _get_dataset('keystone_tenant_list', '@timestamp:desc'),
    _get_dataset('keystone_user_list', '@timestamp:desc'),
    _get_dataset('keystone_role_list', '@timestamp:desc'),
    _get_dataset('glance_image_list', '@timestamp:desc'),
    _get_dataset('cinder_service_list', '@timestamp:desc'),
    _get_dataset('cinder_volume_list', '@timestamp:desc'),
    _get_dataset('cinder_voltype_list', '@timestamp:desc'),
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

agent_docs = [
    _get_dataset('core_report', 'timestamp:desc', 'goldstone_agent'),
    _get_dataset('core_metric', 'timestamp:desc', 'goldstone_agent'),
]

model_docs = [
    _get_dataset('core_event', 'created:desc', 'goldstone_model'),
    _get_dataset('core_node', 'created:desc', 'goldstone_model'),
]


def dump_data(data, file_path):

    print "exporting " + str(len(data)) + " doc sets to " + file_path + " ..."

    f = gzip.open(file_path, 'wb')
    json.dump(data, f)

    f.close()

    print "done."

dump_data(logstash_docs, 'logstash_data.json.gz')
dump_data(goldstone_docs, 'goldstone_data.json.gz')
dump_data(agent_docs, 'agent_data.json.gz')
dump_data(model_docs, 'model_data.json.gz')

print "all done!"
