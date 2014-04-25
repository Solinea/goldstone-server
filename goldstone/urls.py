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

from django.conf.urls import patterns, include, url
from django.contrib import admin
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.conf import settings
from django.views.generic import RedirectView
from djangojs.views import QUnitView
import logging
import waffle

logger = logging.getLogger(__name__)

admin.autodiscover()

urlpatterns = patterns(
    '',
    # TODO create the main discover page and remove redirect
    url(r'^discover[/]?$', RedirectView.as_view(url='/nova/discover'),
        name='discover'),
    url(r'^intelligence/', include('goldstone.apps.intelligence.urls')),
    url(r'^nova/', include('goldstone.apps.nova.urls')),
    url(r'^keystone/', include('goldstone.apps.keystone.urls')),
    url(r'^cinder/', include('goldstone.apps.cinder.urls')),
    url(r'^neutron/', include('goldstone.apps.neutron.urls')),
    url(r'^glance/', include('goldstone.apps.glance.urls')),
    url(r'^api_perf/', include('goldstone.apps.api_perf.urls')),
    url(r'^$', RedirectView.as_view(url='/discover'), name='home'),
    url(r'^admin/', include(admin.site.urls)),
)

if settings.QUNIT_ENABLED:
    urlpatterns += patterns(
        '',
        url(r'^djangojs/', include('djangojs.urls')),
        url(r'^qunit$', QUnitView.as_view(
            template_name='qunit.tests.html', js_files='js/tests/*.tests.js',
            jquery=True, django_js=True), name='my_qunit_view')
    )

if waffle.switch_is_active('gse'):
    urlpatterns += patterns('', url(r'^leases/',
                                    include('goldstone.apps.lease.urls')))


urlpatterns += staticfiles_urlpatterns()
