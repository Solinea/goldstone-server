# vim: tabstop=4 shiftwidth=4 softtabstop=4

#
# Copyright 2013 Solinea, Inc.
#

from django.core.urlresolvers import reverse
from django.shortcuts import redirect, render
from django.views.generic import DetailView, ListView
from django.utils import timezone
from waffle.decorators import waffle_switch

from .models import Cockpit
from goldstone.apps.lease.models import Lease


# TODO GOLD-238 this does not seem to be used, can we remove it and the html
# template?
class DetailCockpitView(DetailView):
    model = Cockpit
    template_name = 'cockpit_detail.html'


# class ListCockpitView(ListView):
#     model = Cockpit
#     Lease = Lease.objects.all()
#     template_name = 'cockpit.html'

# TODO GOLD-237 template rendering and lease feature are conflated.
# Should separate.
#@waffle_switch('gse')
def view_cockpit(request):
    leases_to_show = 5
    leases = Lease.objects.filter(expiration_time__gte=timezone.now(),
                                  deleted=False,
                                  ).order_by('expiration_time')
    lease_count = len(leases)
    return render(request, 'cockpit.html',
                  {'leases': leases[:leases_to_show],
                   'lease_count': lease_count})
