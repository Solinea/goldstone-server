# vim: tabstop=4 shiftwidth=4 softtabstop=4

#
# Copyright 2012 Solinea, Inc.
#

from django.contrib import admin

# Register your models here.
from .models import Lease, Notification, Action

admin.site.register(Lease)
admin.site.register(Action)
admin.site.register(Notification)
