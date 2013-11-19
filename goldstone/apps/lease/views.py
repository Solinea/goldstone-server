from django.core.urlresolvers import reverse
from django.shortcuts import redirect, render
from django.views.generic import ListView
from django.views.generic import CreateView
from django.views.generic import UpdateView

from crispy_forms.helper import FormHelper

from .models import Lease
from .models import Notification
from .models import Action


class ListLeaseView(ListView):
    model = Lease
    template_name = 'lease_list.html'


class CreateLeaseView(CreateView):
    model = Lease
    template_name = 'edit_lease.html'

    def get_success_url(self):
        return reverse('lease-list')

    def get_context_data(self, **kwargs):
        context = super(CreateLeaseView, self).get_context_data(**kwargs)
        context['action'] = reverse('lease-new')
        return context


class UpdateLeaseView(UpdateView):
    model = Lease
    template_name = 'edit_lease.html'

    def get_success_url(self):
        return reverse('lease-list')

    def get_context_data(self, **kwargs):
        context = super(UpdateLeaseView, self).get_context_data(**kwargs)
        context['action'] = reverse('lease-edit',
                                    kwargs={'pk': self.get_object().id})
        return context
