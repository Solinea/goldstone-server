# vim: tabstop=4 shiftwidth=4 softtabstop=4

#
# Copyright 2012 Solinea, Inc.
#

from django.db import models
from django.utils import timezone

from datetime import datetime, timedelta


class Lease(models.Model):
    """
    leases define time-based quotas for cloud resources
    """

    # Scope is the kind of lease granted
    # Tenant lease - all resources owned by tenant/project
    # Resource lease - specific resource (i.e. instance, volume, etc.)
    SCOPE_CHOICES = (
        ('TENANT', 'Tenant/Project'),
        ('RESOURCE', 'Resource'),
    )

    # Resource is service being leases
    # Compute is an OpenStack Nova instance
    # Volume is an OpenStack Cinder volume
    # IP is an OpenStack Neutron floating IP address (Not implemented)
    RESOURCE_TYPE_CHOICES = (
        ('COMPUTE', 'Compute Instance'),
        ('VOLUME', 'Block Storage Volume'),
    )

    # Resource is service being leases
    # Compute is an OpenStack Nova instance
    # Volume is an OpenStack Cinder volume
    LEASE_TYPE_CHOICES = (
        ('OPERATOR', 'Operator Initiated'),
        ('TENANT', 'Tenant Requested'),
    )

    name = models.CharField(max_length=100)
    owner_id = models.CharField(max_length=100)
    deleted = models.BooleanField()
    scope = models.CharField(max_length=100,
                             choices=SCOPE_CHOICES,
                             default='TENANT')
    lease_type = models.CharField(max_length=100,
                                  choices=LEASE_TYPE_CHOICES,
                                  default='INSTANCE')
    resource_id = models.CharField(max_length=100, blank=True)
    resource_type = models.CharField(max_length=100,
                                     choices=RESOURCE_TYPE_CHOICES,
                                     default='COMPUTE')
    tenant_id = models.CharField(max_length=100, blank=True)
    start_time = models.DateTimeField()
    expiration_time = models.DateTimeField()
    length_in_seconds = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=100, blank=True)
    reason = models.TextField(blank=True)

    def __unicode__(self):
        return self.name


class Notification(models.Model):
    """
    Notifications are messages sent to tenants
    or operators about actions
    """

    name = models.CharField(max_length=100)
    driver = models.CharField(max_length=100)
    metadata = models.CharField(max_length=100)
    time = models.DateTimeField()
    result = models.CharField(max_length=100)
    lease = models.ForeignKey(Lease)

    def __unicode__(self):
        return self.name


class Action(models.Model):
    """
    Actions are acts that are performed on cloud resources
    """
    name = models.CharField(max_length=100)
    driver = models.CharField(max_length=100)
    metadata = models.CharField(max_length=100)
    time = models.DateTimeField()
    result = models.CharField(max_length=100)
    lease = models.ForeignKey(Lease)

    def __unicode__(self):
        return self.name
