from django.conf.urls import patterns, include, url
from django.contrib import admin
from django.contrib.staticfiles.urls import staticfiles_urlpatterns

import apps.lease.views

admin.autodiscover()

urlpatterns = patterns(
    '',
    url(r'^$', apps.lease.views.ListLeaseView.as_view(), name='lease-list'),
    url(r'^new$', apps.lease.views.CreateLeaseView.as_view(),
        name='lease-new',),
    url(r'^edit/(?P<pk>\d+)/$', apps.lease.views.UpdateLeaseView.as_view(),
        name='lease-edit',),
    url(r'^delete/(?P<pk>\d+)/$', apps.lease.views.DeleteLeaseView.as_view(),
        name='lease-delete',),
    url(r'^admin/', include(admin.site.urls)),
)

urlpatterns += staticfiles_urlpatterns()
