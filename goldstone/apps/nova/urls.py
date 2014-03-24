# vim: tabstop=4 shiftwidth=4 softtabstop=4

#
# Copyright 2014 Solinea, Inc.
#

from django.conf.urls import patterns, url

from .views import *


urlpatterns = patterns(
    '',
    url(r'^hypervisor/spawns[/]?$', SpawnsView.as_view(),
        name='nova-spawn-view'),
    #url(r'^hypervisor/(?P<name>\w+)/spawns[/]?', NovaInstanceSpawnsView.as_view()),
)