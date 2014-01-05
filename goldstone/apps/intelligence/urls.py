# vim: tabstop=4 shiftwidth=4 softtabstop=4

#
# Copyright 2014 Solinea, Inc.
#

from django.conf.urls import patterns, include, url

from .views import IntelSearchView, IntelErrorsView

urlpatterns = patterns(
    '',
    url(r'^search$', IntelSearchView.as_view(), name='intel-search',),
    url(r'^errors$', IntelErrorsView.as_view(), name='intel-errors',)
)
