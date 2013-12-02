from datetime import datetime, timedelta
import os

from celery import task, shared_task

from .models import Lease, Action, Notification


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


def _compute_exists(instance_id):
    return True


def _volume_exists(volume_id):
    return True


@shared_task
def expire(lease_id):
    """
    Expire leases
    """
    creds = _get_admin_creds()
    try:
        lease_to_be_expired = Lease.get(lease_id)
    except:
        pass
    # check state to determine that it has been already expired
    # determine action, scope and type of lease
    # x.lease.scope and x.lease.lease_type
    # update database status to "in action" or some shit
    # expire lease w/ openstack cli
    # wait for response
    # updated database status to "completed" or some shit
    return True


@shared_task
def find_expirations():
    """
    Query database for expired leases
    """
    expired_leases = Action.objects.filter(status__iexact="pending")
    expired_leases = expiring_leases.objects.filter(time__lte=timezone.now())
    for lease in expired_leases:
        expire.delay(lease.id)


@shared_task
def notify():
    """
    Send notifications
    """
    # perform notification
    # wait for response
    # updated database status
    return True


@shared_task
def find_notifications():
    """
    Query database for expired leases
    """
    expiring_notifications = Notification.objects.filter(
        status__iexact="pending")
    expiring_notifications = expiring_notifcations.objects.filter(
        time__lte=timezone.now())
    for notification in expiring_notifications:
        notify.delay(notification.id)
