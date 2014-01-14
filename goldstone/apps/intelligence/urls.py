# vim: tabstop=4 shiftwidth=4 softtabstop=4

#
# Copyright 2014 Solinea, Inc.
#

from django.conf.urls import patterns, include, url

from .views import *

urlpatterns = patterns(
    '',
    # view calls
    url(r'^search[/]?$', IntelSearchView.as_view(), name='intel-search'),
    url(r'^errors[/]?$', IntelErrorsView.as_view(), name='intel-errors'),
    url(r'^log/cockpit[/]?$', IntelLogCockpitStackedView.as_view(),
        name='intel-log-cockpit'),
    # data calls
    url(r'^log/cockpit/data/(?P<interval>[a-z]{3,5})[/]?$',
        log_cockpit_summary, name='intel-log-cockpit-data'),
    url(r'^log/search/data/(?P<start_time>\d+)/(?P<end_time>\d+)[/]?$',
        log_search_data, name='intel-log-search-data')
)
