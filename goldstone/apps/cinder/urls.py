# vim: tabstop=4 shiftwidth=4 softtabstop=4

#
# Copyright 2014 Solinea, Inc.
#

from django.conf.urls import patterns, url
from .views import *

urlpatterns = patterns(
    '',
    # url(r'^discover[/]?$', DiscoverView.as_view(),
    #     name='cinder-discover-view'),
    url(r'^report[/]?$', ReportView.as_view(),
        name='cinder-report-view'),
    url(r'^vol_list_api_perf[/]?$', VolumeListApiPerfView.as_view(),
        name='cinder-volume-list-api-perf'),
)
