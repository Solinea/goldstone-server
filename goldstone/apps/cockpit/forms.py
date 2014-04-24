# Copyright 2014 Solinea, Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

__author__ = 'Ken Pepple'

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
