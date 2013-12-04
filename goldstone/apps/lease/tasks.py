from datetime import datetime, timedelta
import os

from celery import task, shared_task
from celery.utils.log import get_task_logger
from django.utils import timezone
from django.conf import settings

from .models import Lease, Action, Notification


logger = get_task_logger(__name__)


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


def _resource_exists(resource_type, instance_id):
    logger.info('%s compute instance exists' % instance_id)
    return True


def _terminate_tenant_instances(tenant_id):
    logger.info('terminating tenant %s instances' % tenant_id)
    return True


def _terminate_specific_instance(instance_id):
    logger.info('terminating instance %s' % instance_id)
    return True


@shared_task
def expire(lease_id):
    """
    Expire leases
    """
    logger.info('expire starting for lease %s' % lease_id)
    creds = _get_admin_creds()
    try:
        expired_lease = Lease.get(lease_id)
    except:
        logger.warn("lease id %s does not exist in the database" % lease_id)
        return False
    if expired_lease.scope == "TENANT":
        expire_result = _terminate_tenant_instances(expired_lease.tenant_id)
    elif expired_lease.scope == "RESOURCE":
        expire_result = _terminate_specific_instance(expired_lease.resource_id)
    else:
        logger.warn("lease %s has incorrect scope: %s" %
                 (lease_id, expired_lease.scope))
    if expire_result:
        expired_lease.result = "COMPLETED"
    else:
        logger.warn('lease %s did not terminate' % lease_id)
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
    logger.info("finding expirations")
    expired_leases = Action.objects.filter(result__iexact="pending")
    expired_leases = expired_leases.filter(time__lte=timezone.now())
    for lease in expired_leases:
        expire.delay(lease.pk)
    return True


def _send_notification(tenant, message):
    return True


@shared_task
def notify(notification_id):
    """
    Send notifications
    """
    logger.info('notify starting')
    try:
        notification = Notification.get(notification_id)
        days_left = timezone.now() - notification.lease.expiration_time
        message = ("Your lease will expire in %s days." % days_left)
        result = _send_notification(tenant, message)
    except:
        result = False
        logger.warn("Failed to send notification %s" % notification_id)
    return result


@shared_task
def find_notifications():
    """
    Query database for expired leases
    """
    logger.info('finding notifications')
    expiring_notifications = Notification.objects.filter(
        result__iexact="pending")
    expiring_notifications = expiring_notifications.filter(
        time__lte=timezone.now())
    for notification in expiring_notifications:
        notify.delay(notification.id)
    return True
