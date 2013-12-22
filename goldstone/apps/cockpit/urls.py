from django.conf.urls import patterns, include, url

# from .views import ListCockpitView
from .views import view_cockpit

urlpatterns = patterns(
    '',
    # url(r'^$',  ListCockpitView.as_view(), name='cockpit'),
    url(r'^$',  view_cockpit, name='cockpit'),
)
