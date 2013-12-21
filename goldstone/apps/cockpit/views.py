# vim: tabstop=4 shiftwidth=4 softtabstop=4

#
# Copyright 2013 Solinea, Inc.
#

from django.core.urlresolvers import reverse
from django.shortcuts import redirect, render
from django.views.generic import DetailView, ListView

from .models import Cockpit


class DetailCockpitView(DetailView):
    model = Cockpit
    template_name = 'cockpit_detail.html'


class ListCockpitView(ListView):
    model = Cockpit
    template_name = 'cockpit.html'
