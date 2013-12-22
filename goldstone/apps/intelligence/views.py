# vim: tabstop=4 shiftwidth=4 softtabstop=4

#
# Copyright 2013 Solinea, Inc.
#

from django.shortcuts import redirect, render

from django.views.generic import TemplateView

class KibanaView(TemplateView):
    template_name = 'logs.html'
