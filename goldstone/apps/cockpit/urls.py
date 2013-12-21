from django.conf.urls import patterns, include, url

from .views import ListCockpitView

urlpatterns = patterns(
    '',
    url(r'^$',  ListCockpitView.as_view(), name='cockpit'),
)
