# vim: tabstop=4 shiftwidth=4 softtabstop=4

#
# Copyright 2013 Solinea, Inc.
#

from django.db import models


class Cockpit(models.Model):
    """
    Cockpits are custom dashboards for operators
    """

    name = models.CharField(max_length=100)
    owner = models.CharField(max_length=100)
    public = models.BooleanField(default=False)
    modules = models.CharField(max_length=200)

    def __unicode__(self):
        return self.name
