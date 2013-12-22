# vim: tabstop=4 shiftwidth=4 softtabstop=4

#
# Copyright 2013 Solinea, Inc.
#

"""
Views for managing leases
"""
from django.conf import settings  # noqa
from django.forms import ModelForm
from django.forms import ValidationError  # noqa
from django.forms.widgets import DateTimeInput, Select, TextInput  # noqa
from django.forms.widgets import HiddenInput  # noqa
from django.core.urlresolvers import reverse

# from crispy_forms.bootstrap import AppendedText, PrependedText, FormActions
# from django.forms.formsets import formset_factory
# from crispy_forms.helper import FormHelper
# from crispy_forms.layout import Layout, Div, Submit, HTML, Button, Row
# from crispy_forms.layout import Field, Fieldset, ButtonHolder
# from crispy_forms.bootstrap import AppendedText, PrependedText, FormActions
# from crispy_forms.bootstrap import FieldWithButtons, StrictButton

from .models import Lease
# from .models import Notification
# from .models import Action


class CreateLeaseForm(ModelForm):
    """regular form for creating leases"""

    class Meta:
        model = Lease
        fields = ['name', 'scope', 'resource_type', 'resource_id',
                  'tenant_id', 'expiration_time']
        widgets = {
            'expiration_time': DateTimeInput(attrs={'readonly': 'readonly'}),
            'name': TextInput(attrs={'placeholder': 'Lease Name'}),
        }


class UpdateLeaseForm(ModelForm):
    """regular form for editing leases"""

    class Meta:
        model = Lease
        fields = ['name', 'scope', 'resource_type', 'resource_id',
                  'tenant_id', 'expiration_time']
        widgets = {
            'expiration_time': DateTimeInput(attrs={'readonly': 'readonly'}),
            'name': TextInput(attrs={'placeholder': 'Lease Name'}),
        }
