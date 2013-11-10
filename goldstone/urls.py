from django.conf.urls import patterns, include, url

from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns('',
    # Examples:
    # url(r'^$', 'goldstone.views.home', name='home'),
    # url(r'^blog/', include('blog.urls')),

    url(r'^$', 'goldstone.apps.lease.views.home', name='home'),
    url(r'^admin/', include(admin.site.urls)),
)
