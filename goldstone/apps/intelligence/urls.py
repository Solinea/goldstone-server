# vim: tabstop=4 shiftwidth=4 softtabstop=4

#
# Copyright 2014 Solinea, Inc.
#

from django.conf.urls import patterns, include, url

from .views import *

urlpatterns = patterns(
    '',
    url(r'^search[/]?$', IntelSearchView.as_view(), name='intel-search'),
    url(r'^errors[/]?$', IntelErrorsView.as_view(), name='intel-errors'),
    #url(r'^cockpit-content[/]?$', CockpitContentView.as_view(),
    #    name='cockpit_content')
    url(r'^log-cockpit[/]?$', IntelLogCockpitView.as_view(),
        name='intel-log-cockpit'),
    url(r'^log-cockpit-data[/]?$', log_cockpit_data,
        name='intel-log-cockpit-data')
)
