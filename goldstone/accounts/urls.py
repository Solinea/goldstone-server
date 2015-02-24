"""Accounts URLconf.

This configures endpoints that route to the djoser package, for account
authorization and administration.

"""
# Copyright 2015 Solinea, Inc.
#
# Licensed under the Solinea Software License Agreement (goldstone),
# Version 1.0 (the "License"); you may not use this file except in compliance
# with the License. You may obtain a copy of the License at:
#
#     http://www.solinea.com/goldstone/LICENSE.pdf
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
from django.conf.urls import patterns, url
from djoser import views as djoser_views
from .views import SettingsView, RegistrationView

# Hook up a subset of the djoser package. We don't include djoser's URLconf
# because that would mean rooting it at /accounts/XXX, making the URLs longer;
# and we need to override some of djoser's code in order to process user
# profiles.
urlpatterns = patterns(
    '',
    url(r'^settings[/]?$', SettingsView.as_view(), name='settings'),
    url(r'^register[/]?$', RegistrationView.as_view(), name='register'),
    url(r'^login[/]?$', djoser_views.LoginView.as_view(), name='login'),
    url(r'^logout[/]?$', djoser_views.LogoutView.as_view(), name='logout'),
    url(r'^password[/]?$',
        djoser_views.SetPasswordView.as_view(),
        name='set_password'),
    url(r'^password/reset[/]?$',
        djoser_views.PasswordResetView.as_view(),
        name='password_reset'),
    url(r'^password/reset/confirm[/]?$',
        djoser_views.PasswordResetConfirmView.as_view(),
        name='password_reset_confirm'),
)
