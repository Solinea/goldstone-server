# vim: tabstop=4 shiftwidth=4 softtabstop=4

#from datetime import datetime, timedelta
from email.mime.text import MIMEText
import smtplib

from celery import task
from celery.utils.log import get_task_logger
from django.utils import timezone
from django.conf import settings
from novaclient.v1_1 import client

from .models import Lease, Action, Notification


logger = get_task_logger(__name__)


def _get_creds():
    """Gather OpenStack credentials for admin user
    """

    # TODO: hard code this until keystone integration is done
    try:
        creds = {"password": settings.OS_PASSWORD,
                 "auth_url": settings.OS_AUTH_URL,
                 "username": settings.OS_USERNAME,
                 "tenant_name": settings.OS_TENANT_NAME,
                 "tenant_id": settings.OS_TENANT_ID,
                 }
    except:
        # raise SystemExit
        creds = {"password": None,
                 "auth_url": None,
                 "username": None,
                 "tenant_name": None,
                 "tenant_id": None,
                 }
    return creds


def _get_novaclient():
    """Get compute cloud credentials
    """

    c = _get_creds()
    novaclient = None
    try:
        novaclient = client.Client(c["username"], c["password"],
                                   c["tenant_name"], c["auth_url"],
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
        logger.warn("Nova terminate failed: %s", err)
        success = False
        raise SystemExit
    return success


def _terminate_tenant_instances(tenant_id):
    """Terminate all compute instances from a specific tenant

    :param tenant_id: OpenStack tenant ID
    :param client: Nova client object (Optional)
    """

    logger.info('terminating tenant %s instances' % tenant_id)
    # Get client once to save on Keystone calls
    client = _get_novaclient()
    try:
        tenant_instances = client.servers.list()
        logger.info('Tenant has %s instance(s)' % len(tenant_instances))
        for instance in tenant_instances:
            terminate_result = _delete_instance(instance.id, client)
            logger.info('terminated instance %s' % instance.id)
        logger.info('All Tenant %s instances terminated' % tenant_id)
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
    client = _get_novaclient()
    result = _delete_instance(instance_id, client)
    return True


@task
def expire(action_id):
    """Expire leases

    :param action_id: Lease action id
    """

    logger.info('Action starting for %s' % action_id)
    try:
        this_action = Action.objects.get(pk=action_id)
    except Exception, err:
        logger.warn("Unexpected error: %s" % err)
        return False

    if this_action.lease.scope == "TENANT":
        rst = _terminate_tenant_instances(this_action.lease.tenant_id)
    elif this_action.lease.scope == "RESOURCE":
        rst = _terminate_specific_instance(this_action.lease.resource_id)
    else:
        logger.warn("lease %s has incorrect scope: %s" %
                   (this_action.lease.id, this_action.lease.scope))
    if rst:
        this_action.lease.status = "COMPLETED"
        this_action.lease.save()
        logger.info("lease status updated")
        this_action.result = "COMPLETED"
        this_action.save()
        logger.info("action result updated")
    else:
        logger.warn('lease %s did not terminate' % this_action.lease.id)
    return rst


@task
def find_expirations():
    """Query database for expired leases
    """

    logger.info("finding expirations")
    expired_leases = Action.objects.filter(result__iexact="pending")
    expired_leases = expired_leases.filter(time__lte=timezone.now())
    for a in expired_leases:
        expire_result = expire.delay(a.pk)

    return expired_leases


def _send_email_notification(tenant_address, message, subject):
    # TODO: lookup client email address in keystone

    sender = settings.NOTIFICATION_SENDER
    receiptent = tenant_address
    msg = MIMEText(message)

    msg['Subject'] = subject
    msg['From'] = sender
    msg['To'] = receiptent
    s = smtplib.SMTP(settings.MAILHOST)
    s.sendmail(sender, receiptent, msg.as_string())
    # s.set_debuglevel(1)
    s.quit()
    return True


@task
def notify(notification_id):
    """Send notification

    :param notification_id: Lease notification ID
    """

    tenant_email = settings.NOTIFICATION_SENDER

    try:
        logger.info('notify starting')
        this_notification = Notification.objects.get(pk=notification_id)
        days_left = timezone.now() - this_notification.lease.expiration_time
        message = ("%s: Your lease will expire in %s days." %
                  (tenant_email, days_left.days))
        subject = 'Lease Ending in %s' % days_left.days
        rst = _send_email_notification(tenant_email, message, subject)
        this_notification.result = "COMPLETED"
        this_notification.save()
    except Exception, err:
        result = False
        logger.warn("Failed to send notification %s due to %s" %
                    (notification_id, err))
    return rst


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
