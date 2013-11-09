from django.db import models

class Lease(models.Model):
    name = models.CharField(max_length=100)
    deleted = models.BooleanField()
    scope = models.CharField(max_length=100)
    lease_type = models.CharField(max_length=100)
    resource_id = models.CharField(max_length=100)
    resource_type = models.CharField(max_length=100)
    tenant_id = models.CharField(max_length=100)
    start_time = models.DateTimeField()
    length_in_seconds = models.CharField(max_length=100)
    status = models.CharField(max_length=100)
    action_time = models.DateTimeField()
    action = models.ForeignKey(Action)
    action_metadata = models.CharField(max_length=100)
    action_result = model.CharField(max_length=100)
    notification = models.ForeignKey(Notification)
    notification_metadata = models.CharField(max_length=100)
    notification_time = models.DateTimeField()
    notification_result = models.CharField(max_length=100)

class Notification(models.Model):
    name = models.CharField(max_length=100)
    driver = models.CharField(max_length=100)

class Action(models.Model):
    name = models.CharField(max_length=100)
    driver = models.CharField(max_length=100)
