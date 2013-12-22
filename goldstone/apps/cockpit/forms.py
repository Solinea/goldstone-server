# vim: tabstop=4 shiftwidth=4 softtabstop=4

#
# Copyright 2013 Solinea, Inc.
#

"""
Views for managing cockpits
"""
from django.conf import settings  # noqa
from django.forms import ModelForm
from django.forms import ValidationError  # noqa
from django.forms.widgets import DateTimeInput, Select, TextInput  # noqa
from django.forms.widgets import HiddenInput  # noqa
from django.core.urlresolvers import reverse

from .models import Cockpit


class CreateCockpitForm(ModelForm):
    """regular form for creating cockpits"""

    class Meta:
        model = Cockpit
        # fields = ['name', 'scope', 'resource_type', 'resource_id',
        #           'tenant_id', 'expiration_time']
        # widgets = {
        #     'expiration_time': DateTimeInput(attrs={'readonly': 'readonly'}),
        #     'name': TextInput(attrs={'placeholder': 'Lease Name'}),
        # }


class UpdateCockpitForm(ModelForm):
    """regular form for editing cockpits"""

    class Meta:
        model = Cockpit
        # fields = ['name', 'scope', 'resource_type', 'resource_id',
        #           'tenant_id', 'expiration_time']
        # widgets = {
        #     'expiration_time': DateTimeInput(attrs={'readonly': 'readonly'}),
        #     'name': TextInput(attrs={'placeholder': 'Lease Name'}),
        # }
