from django.conf.urls import patterns, include, url

from .views import *

urlpatterns = patterns(
    '',
    url(r'^search[/]?$', IntelSearchView.as_view(), name='intel-search'),
    url(r'^errors[/]?$', IntelErrorsView.as_view(), name='intel-errors'),
    url(r'^cockpit-content[/]?$', CockpitContentView.as_view(), name='cockpit_content')
    #url(r'^cockpit-content[/]?$', cockpit_content, name='cockpit_content')
)
