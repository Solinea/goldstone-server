# vim: tabstop=4 shiftwidth=4 softtabstop=4

#
# Copyright 2012 Solinea, Inc.
#

"""
Views for managing leases
"""
from django.forms import extras
from django.conf import settings  # noqa
from django.forms import ModelForm
from django.forms import ValidationError  # noqa
from django.forms.widgets import HiddenInput  # noqa
from django.core.urlresolvers import reverse

# from crispy_forms.bootstrap import AppendedText, PrependedText, FormActions
from crispy_forms.helper import FormHelper
from crispy_forms.layout import Submit

from .models import Lease
# from .models import Notification
# from .models import Action


class CreateLeaseForm(ModelForm):
    """Crispy form for creating leases"""

    # expiration_time = forms.DateField(widget=SelectDateWidget())

    def __init__(self, *args, **kwargs):
        self.helper = FormHelper()
        self.helper.form_method = 'post'
        self.helper.form_action = reverse('lease-new')
        self.helper.add_input(Submit('submit', 'Save'))
        super(CreateLeaseForm, self).__init__(*args, **kwargs)

    class Meta:
        model = Lease
        fields = ['name', 'scope', 'resource_type', 'resource_id',
                  'tenant_id', 'expiration_time']
        widgets = {'expiration_time': extras.SelectDateWidget(), }


class UpdateLeaseForm(ModelForm):
    pass
