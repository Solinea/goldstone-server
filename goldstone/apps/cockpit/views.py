# vim: tabstop=4 shiftwidth=4 softtabstop=4

#
# Copyright 2013 Solinea, Inc.
#

from django.views.generic import TemplateView


class CockpitView(TemplateView):
    template_name = 'cockpit.html'
