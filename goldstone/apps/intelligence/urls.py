from django.conf.urls import patterns, include, url

from .views import KibanaView

urlpatterns = patterns(
    '',
    url(r'^logs$', KibanaView.as_view(), name='kibana-logs',)
)
