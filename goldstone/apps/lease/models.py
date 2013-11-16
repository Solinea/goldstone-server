from django.db import models


class Lease(models.Model):
    """
    leases define time-based quotas for cloud resources
    """

    name = models.CharField(max_length=100)
    owner_id = models.CharField(max_length=100)
    deleted = models.BooleanField()
    scope = models.CharField(max_length=100)
    lease_type = models.CharField(max_length=100)
    resource_id = models.CharField(max_length=100)
    resource_type = models.CharField(max_length=100)
    tenant_id = models.CharField(max_length=100)
    start_time = models.DateTimeField()
    length_in_seconds = models.CharField(max_length=100)
    status = models.CharField(max_length=100)
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
