from django.conf.urls import patterns, include, url
from django.contrib import admin
from django.contrib.staticfiles.urls import staticfiles_urlpatterns

import waffle

admin.autodiscover()

urlpatterns = patterns(
    '',
    url(r'^intelligence/', include('goldstone.apps.intelligence.urls')),
    url(r'^admin/', include(admin.site.urls)),
    url(r'^$', include('goldstone.apps.cockpit.urls')),
)

if waffle.switch_is_active('gse'):
    urlpatterns += patterns(url(r'^leases/',
                                include('goldstone.apps.lease.urls')),)

urlpatterns += staticfiles_urlpatterns()
