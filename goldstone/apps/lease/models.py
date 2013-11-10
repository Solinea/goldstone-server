from django.db import models

class Lease(models.Model):
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

class Notification(models.Model):
    name = models.CharField(max_length=100)
    driver = models.CharField(max_length=100)
    metadata = models.CharField(max_length=100)
    time = models.DateTimeField()
    result = models.CharField(max_length=100)
    lease = models.ForeignKey(Lease)

class Action(models.Model):
    name = models.CharField(max_length=100)
    driver = models.CharField(max_length=100)
    metadata = models.CharField(max_length=100)
    time = models.DateTimeField()
    result = models.CharField(max_length=100)
    lease = models.ForeignKey(Lease)
