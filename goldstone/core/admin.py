"""Core admin."""
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

from django.contrib import admin
from goldstone.core.models import SavedSearch, AlertDefinition, \
    EmailProducer, Alert, MonitoredService, Producer


class SavedSearchAdmin(admin.ModelAdmin):
    list_display = ('uuid', 'name', 'owner', 'protected', 'hidden',
                    'index_prefix', 'doc_type', 'timestamp_field')


class AlertAdmin(admin.ModelAdmin):
    list_display = ('uuid', 'short_message', 'alert_def')


class AlertDefinitionAdmin(admin.ModelAdmin):
    list_display = ('uuid', 'name', 'enabled', 'search')


class ProducerAdmin(admin.ModelAdmin):
    list_display = ('uuid', 'alert_def')


class EmailProducerAdmin(admin.ModelAdmin):
    list_display = ('uuid', 'alert_def', 'sender', 'receiver')


class MonitoredServiceAdmin(admin.ModelAdmin):
    list_display = ('uuid', 'name', 'host', 'state', 'updated')

admin.site.register(SavedSearch, SavedSearchAdmin)
admin.site.register(AlertDefinition, AlertDefinitionAdmin)
admin.site.register(Alert, AlertAdmin)
admin.site.register(Producer, ProducerAdmin)
admin.site.register(EmailProducer, EmailProducerAdmin)
admin.site.register(MonitoredService, MonitoredServiceAdmin)
