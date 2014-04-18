# vim: tabstop=4 shiftwidth=4 softtabstop=4

#
# Copyright 2014 Solinea, Inc.
#

from django.conf.urls import patterns, url
from .views import *

urlpatterns = patterns(
    '',
    # url(r'^discover[/]?$', DiscoverView.as_view(),
    #     name='keystone-discover-view'),
    url(r'^report[/]?$', ReportView.as_view(),
        name='keystone-report-view'),
    url(r'^auth_api_perf[/]?$', AuthApiPerfView.as_view(),
        name='keystone-auth-api-perf'),
)
