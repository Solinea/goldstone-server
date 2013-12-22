from django.conf.urls import patterns, include, url

from .views import SearchView, ErrorsView

urlpatterns = patterns(
    '',
    url(r'^search$', SearchView.as_view(), name='intel-search',),
    url(r'^errors$', ErrorsView.as_view(), name='intel-errors',)
)
