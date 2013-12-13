from datetime import datetime, timedelta
import os

from celery import task, shared_task
from celery.utils.log import get_task_logger
from django.utils import timezone
from django.conf import settings
from novaclient.v1_1 import client

from .models import Lease, Action, Notification


logger = get_task_logger(__name__)


# class OpenStackError(Exception):
#     raise SystemExit


def _get_creds():
    """Gather OpenStack credentials for admin user
    """

    # TODO: hard code this until keystone integration is done
    d = {"password": settings.OS_PASSWORD,
         "auth_url": settings.OS_AUTH_URL,
         "username": settings.OS_USERNAME,
         "tenant_name": settings.OS_TENANT_NAME,
         "tenant_id": settings.OS_TENANT_ID,
         }
    return d


def _get_novaclient():
    """Get compute cloud credentials
    """

    d = _get_creds()
    try:
        novaclient = client.Client(d["username"], d["password"],
                                   d["tenant_name"], d["auth_url"],
                                   service_type="compute")
    except Exception, err:
        logger.info('Error logging into cloud: %s' % err)
        raise SystemExit
    return novaclient


def _get_cinderclient():
    """Get storage cloud credentials
    """

    d = _get_creds()
    try:
        # TODO: rewrite for cinder client
        novaclient = client.Client(d["username"], d["password"],
                                   d["tenant_name"], d["auth_url"],
                                   service_type="compute")
    except Exception, err:
        logger.info('Error logging into cloud: %s' % err)
        raise SystemExit
    return novaclient


def _delete_instance(server_id, client=None):
    """Delete a specific compute instance

    :param server_id: OpenStack server ID
    :param client: Nova client object (Optional)
    """

    logger.info('deleting instance %s' % server_id)
    if client is None:
        client = _get_novaclient()
    try:
        nova_result = client.servers.delete(server_id)
        # TODO: evaluate nova_result code
        logger.info('Nova responded to terminate with %s' % nova_result)
        success = True
    except Exception, err:
        success = False
        raise SystemExit
    return success


def _terminate_tenant_instances(tenant_id, client=None):
    """Terminate all compute instances from a specific tenant

    :param tenant_id: OpenStack tenant ID
    :param client: Nova client object (Optional)
    """

    logger.info('terminating tenant %s instances' % tenant_id)
    if client is None:
        client = _get_novaclient()
    try:
        tenant_instances = client.servers.list()
        logger.info('Tenant has %s instance(s)' % len(tenant_instances))
        for instance in tenant_instances:
            terminate_result = _delete_instance(instance.id, client)
            logger.info('terminated instance %s' % instance.id)
        logger.info('Tenant %s instances terminated' % tenant_id)
        success = True
    except Exception, err:
        success = False
        raise SystemExit
    return success


def _terminate_specific_instance(instance_id):
    """Terminate one specific compute instance

    :param instance_id: OpenStack server ID
    """

    logger.info('terminating instance %s' % instance_id)
    result = _delete_instance(instance_id)
    return True


@task
def expire(action_id):
    """Expire leases
    """

    logger.info('Action starting for %s' % action_id)
    try:
        expired_lease = Action.objects.get(pk=action_id)
    except Exception, err:
        logger.warn("Action id %s does not exist in the database" % action_id)
        logger.warn("Unexpected error: %s" % err)
        return False

    if expired_lease.lease.scope == "TENANT":
        logger.info("tenant scope lease starting")
        rst = _terminate_tenant_instances(expired_lease.lease.tenant_id)
    elif expired_lease.lease.scope == "RESOURCE":
        logger.info("resource scope lease starting")
        rst = _terminate_specific_instance(expired_lease.lease.resource_id)
    else:
        logger.warn("lease %s has incorrect scope: %s" %
                   (lease_id, expired_lease.lease.scope))


@task
def find_expirations():
    """Query database for expired leases
    """

    logger.info("finding expirations")
    expired_leases = Action.objects.filter(result__iexact="pending")
    expired_leases = expired_leases.filter(time__lte=timezone.now())
    for a in expired_leases:
        expire_result = expire.delay(a.pk)
        if expire_result.state is 'SUCCESS':
            a.lease.status = "COMPLETED"
            a.lease.save()
            logger.info("lease status updated")
            a.result = "COMPLETED"
            a.save()
            logger.info("action result updated")
        else:
            logger.warn('lease %s did not terminate' % a.id)

    return expired_leases


def _send_notification(tenant, message):
    # lookup client email address in keystone OR use notification address
    # send email to address with message
    return True


@task
def notify(notification_id):
    """Send notifications
    """

    logger.info('notify starting')
    try:
        notification = Notification.get(notification_id)
        days_left = timezone.now() - notification.lease.expiration_time
        message = ("Your lease will expire in %s days." % days_left)
        result = self._send_notification(tenant, message)
    except:
        result = False
        logger.warn("Failed to send notification %s" % notification_id)
    return result


@task
def find_notifications():
    """Query database for notifications
    """

    logger.info('finding notifications')
    expiring_notifications = Notification.objects.filter(
        result__iexact="pending")
    expiring_notifications = expiring_notifications.filter(
        time__lte=timezone.now())
    for notification in expiring_notifications:
        notify.delay(notification.id)
    return True
