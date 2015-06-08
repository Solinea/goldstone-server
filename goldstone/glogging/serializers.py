"""Logging serializers."""
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
from goldstone.drfes.serializers import ReadOnlyElasticSerializer


class LogDataSerializer(ReadOnlyElasticSerializer):
    """Serializer for ES log data. Excludes several uninteresting fields."""

    class Meta:        # pylint: disable=C1001,W0232
        """Meta"""
        exclude = ('@version', 'message', 'syslog_ts', 'received_at', 'sort',
                   'tags', 'syslog_facility_code', 'syslog_severity_code',
                   'syslog_pri', 'syslog5424_pri', 'syslog5424_host', 'type')


class LogAggSerializer(ReadOnlyElasticSerializer):
    """Custom serializer to manipulate the aggregation that comes back from
    ES."""

    def to_representation(self, instance):
        """Create serialized representation of aggregate log data.

        There will be a summary block that can be used for ranging, legends,
        etc., then the detailed aggregation data which will be a nested
        structure.  The number of layers will depend on whether the host
        aggregation was done.

        """

        timestamps = [i['key'] for i in instance.per_interval['buckets']]
        levels = [i['key'] for i in instance.per_level['buckets']]
        hosts = [i['key'] for i in instance.per_host['buckets']] \
            if hasattr(instance, 'per_host') else None

        # let's clean up the inner buckets
        data = []
        if hosts is None:
            for interval_bucket in instance.per_interval.buckets:
                key = interval_bucket.key
                values = [{item.key: item.doc_count}
                          for item in interval_bucket.per_level.buckets]
                data.append({key: values})

        else:
            for interval_bucket in instance.per_interval.buckets:
                interval_key = interval_bucket.key
                interval_values = []
                for host_bucket in interval_bucket.per_host.buckets:
                    key = host_bucket.key
                    values = [{item.key: item.doc_count}
                              for item in host_bucket.per_level.buckets]
                    interval_values.append({key: values})
                data.append({interval_key: interval_values})

        if hosts is None:
            return {
                'timestamps': timestamps,
                'levels': levels,
                'data': data
            }
        else:
            return {
                'timestamps': timestamps,
                'hosts': hosts,
                'levels': levels,
                'data': data
            }


class LogEventAggSerializer(ReadOnlyElasticSerializer):
    """Custom serializer to manipulate the aggregation that comes back from
    ES."""

    def to_representation(self, instance):
        """Create serialized representation of aggregate log data.

        There will be a summary block that can be used for ranging, legends,
        etc., then the detailed aggregation data which will be a nested
        structure.  The number of layers will depend on whether the host
        aggregation was done.

        """

        timestamps = [i['key'] for i in instance.per_interval['buckets']]
        event_types = [i['key'] for i in instance.per_type['buckets']]
        hosts = [i['key'] for i in instance.per_host['buckets']] \
            if hasattr(instance, 'per_host') else None

        # let's clean up the inner buckets
        data = []
        if hosts is None:
            for interval_bucket in instance.per_interval.buckets:
                key = interval_bucket.key
                values = [{item.key: item.doc_count}
                          for item in interval_bucket.per_type.buckets]
                data.append({key: values})

        else:
            for interval_bucket in instance.per_interval.buckets:
                interval_key = interval_bucket.key
                interval_values = []
                for host_bucket in interval_bucket.per_host.buckets:
                    key = host_bucket.key
                    values = [{item.key: item.doc_count}
                              for item in host_bucket.per_type.buckets]
                    interval_values.append({key: values})
                data.append({interval_key: interval_values})

        if hosts is None:
            return {
                'timestamps': timestamps,
                'types': event_types,
                'data': data
            }
        else:
            return {
                'timestamps': timestamps,
                'hosts': hosts,
                'types': event_types,
                'data': data
            }
