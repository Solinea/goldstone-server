# vim: tabstop=4 shiftwidth=4 softtabstop=4

#
# Copyright 2013 Solinea, Inc.
#

from django.core.urlresolvers import reverse
from django.shortcuts import redirect, render
from django.views.generic import DetailView, ListView

from .models import Cockpit
from goldstone.apps.lease.models import Lease


class DetailCockpitView(DetailView):
    model = Cockpit
    template_name = 'cockpit_detail.html'


# class ListCockpitView(ListView):
#     model = Cockpit
#     Lease = Lease.objects.all()
#     template_name = 'cockpit.html'

def view_cockpit(request):
    leases = Lease.objects.all()
    lease_count = len(leases)
    return render(request, 'cockpit.html',
                  {'leases': leases, 'lease_count': lease_count})
