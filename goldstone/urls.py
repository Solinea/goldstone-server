"""Goldstone URLconf."""
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
from django.conf.urls import patterns, include, url
from django.contrib import admin
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
# from django.views.generic import RedirectView

from goldstone.tenants.urls import urlpatterns as tenants_urlpatterns
from goldstone.views import RouterView, LoginView

admin.autodiscover()

# API documentation.
urlpatterns = patterns(
    '',
    url(r'^docs/', include("rest_framework_swagger.urls")))

# API.
urlpatterns += patterns(
    '',
    url(r'^accounts/', include("goldstone.accounts.urls")),
    url(r'^admin/', include(admin.site.urls)),
    url(r'^api-auth/', include('rest_framework.urls',
                               namespace='rest_framework')),
    url(r'^addons/', include('goldstone.addons.urls')),
    url(r'^cinder/', include('goldstone.cinder.urls')),
    url(r'^core/', include('goldstone.core.urls')),
    url(r'^glance/', include('goldstone.glance.urls')),
    url(r'^keystone/', include('goldstone.keystone.urls')),
    url(r'^logging/', include('goldstone.glogging.urls')),
    url(r'^nova/', include('goldstone.nova.urls')),
    url(r'^user/', include("goldstone.user.urls")),
    url(r'^login/', LoginView.as_view()),
    url(r'^$', RouterView.as_view()),
)

# Add the tenants' URL patterns directly, so that we don't have to over-root
# it.
urlpatterns += tenants_urlpatterns

urlpatterns += staticfiles_urlpatterns()
