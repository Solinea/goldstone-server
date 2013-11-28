# vim: tabstop=4 shiftwidth=4 softtabstop=4

#
# Copyright 2012 Solinea, Inc.
#

"""
Views for managing leases
"""
from django.conf import settings  # noqa
from django.forms import ModelForm
from django.forms import ValidationError  # noqa
from django.forms.widgets import DateInput  # noqa
from django.forms.widgets import HiddenInput  # noqa
from django.core.urlresolvers import reverse

# from crispy_forms.bootstrap import AppendedText, PrependedText, FormActions
# from django.forms.formsets import formset_factory
from crispy_forms.helper import FormHelper
from crispy_forms.layout import Layout, Div, Submit, HTML, Button, Row, Field, Fieldset, ButtonHolder
from crispy_forms.bootstrap import AppendedText, PrependedText, FormActions
from crispy_forms.bootstrap import FieldWithButtons, StrictButton

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
        self.helper.layout = Layout(
                    Fieldset(
                        'name',
                        'scope',
                        'resource_type',
                        'resource_id',
                        'tenant_id',
                        FieldWithButtons('expiration_time', 
                            StrictButton('<i class="fa fa-camera-retro"></i>')),
                    ),
                    
                    ButtonHolder(
                        Submit('submit', 'Save')
                    )
                )
        super(CreateLeaseForm, self).__init__(*args, **kwargs)

    class Meta:
        model = Lease
        fields = ['name', 'scope', 'resource_type', 'resource_id',
                  'tenant_id', 'expiration_time']
        widgets = {'expiration_time': DateInput()}


class UpdateLeaseForm(ModelForm):
    pass
