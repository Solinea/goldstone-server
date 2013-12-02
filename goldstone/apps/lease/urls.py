from django.conf.urls import patterns, include, url

from .views import ListLeaseView, CreateLeaseView
from .views import UpdateLeaseView, DeleteLeaseView

urlpatterns = patterns(
    '',
    url(r'^$',  ListLeaseView.as_view(), name='lease-list'),
    url(r'^new$', CreateLeaseView.as_view(),
        name='lease-new',),
    url(r'^edit/(?P<pk>\d+)/$', UpdateLeaseView.as_view(),
        name='lease-edit',),
    url(r'^delete/(?P<pk>\d+)/$', DeleteLeaseView.as_view(),
        name='lease-delete',),
)
