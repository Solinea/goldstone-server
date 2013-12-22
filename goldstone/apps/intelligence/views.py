# vim: tabstop=4 shiftwidth=4 softtabstop=4

#
# Copyright 2013 Solinea, Inc.
#

from django.shortcuts import redirect, render

from django.views.generic import TemplateView


class SearchView(TemplateView):
    template_name = 'search.html'


class ErrorsView(TemplateView):
    template_name = 'errors.html'
