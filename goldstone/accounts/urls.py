"""Accounts URLconf.

This configures endpoints that route to the djoser package, for basic account
authorization and administration. And, to views in this application, for
additional account functionality and tenant functionality.

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
from rest_framework.routers import DefaultRouter
from djoser import views as djoser_views
# from .views import foo

# First, hook up the djoser package. We can't include djoser's URLconf, since
# we need to match on an URL segment to do that. Including it the standard way
# would mean rooting it at /accounts/XXX, where XXX is some string. The
# alternative would be to root djoser at Goldstone's URLconf, but then the
# endpoints would have a different segment (e.g., /accounts vs. /auth). So,
# we'll override djoser's URLconf to hook up the djoser views directly. We hook
# up a subset of djoser's default API.
urlpatterns = patterns(
    '',
    url(r'^me[/]?$', djoser_views.UserView.as_view(), name='user'),
    url(r'^register[/]?$',
        djoser_views.RegistrationView.as_view(),
        name='register'),
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

# # Views handled by DjangoRestFramework ViewSets.
# router = DefaultRouter(trailing_slash=False)
# router.register(r'^endpoints[/]?$',
#                 EndpointsDataViewSet,
#                 base_name='keystone-endpoints')
# router.register(r'^roles[/]?$', RolesDataViewSet, base_name='keystone-roles')
# router.register(r'^services[/]?$',
#                 ServicesDataViewSet,
#                 base_name='keystone-services')
# router.register(r'^tenants[/]?$',
#                 TenantsDataViewSet,
#                 base_name='keystone-tenants')
# router.register(r'^users[/]?$', UsersDataViewSet, base_name='keystone-users')

# urlpatterns = router.urls

# # Other views.
# urlpatterns += patterns(
#     '',
#     url(r'^report[/]?$', ReportView.as_view(),
#         name='keystone-report-view'),
#     url(r'^api_perf[/]?$', ApiPerfView.as_view(),
#         name='keystone-api-perf'),
# )
