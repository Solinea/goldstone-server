from datetime import datetime, timedelta
import os

from django.conf import settings

from .models import Lease, Action, Notification
from goldstone.celery import Celery


def _get_admin_creds():
    """
    Get admin keys to execute privileged OpenStack actions
    """
    # TODO: fake this until keystone integration is done
    return {"OS_PASSWORD": settings.OS_PASSWORD,
            "OS_AUTH_URL": settings.OS_AUTH_URL,
            "OS_USERNAME": settings.OS_USERNAME,
            "OS_TENANT_NAME": settings.OS_TENANT_NAME,
            }


@app.task
def expire():
    """
    Expire leases
    """
    creds = _get_admin_creds()
    expiring_leases = Action.objects.filter(status__iexact="pending")
    expiring_leases = expiring_leases.objects.filter(time__lte=timezone.now())
    for x in expiring_leases:
        # determine action, scope and type of lease
        # x.lease.scope and x.lease.lease_type
        # update database status to "in action" or some shit
        # expire lease w/ openstack cli
        # wait for response
        # updated database status to "completed" or some shit
        pass
    pass


@app.task
def notify():
    """
    Send notifications
    """
    expiring_notifcations = Notification.objects.filter(
        status__iexact="pending")
    expiring_notifcations = expiring_notifcations.objects.filter(
        time__lte=timezone.now())
    for x in expiring:
        # perform notification
        # wait for response
        # updated database status
        pass
    pass
