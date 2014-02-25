from django.conf.urls import patterns, include, url

# from .views import ListCockpitView
from .views import CockpitView

urlpatterns = patterns(
    '',
    url(r'^$',  CockpitView.as_view(), name='cockpit'),
)
