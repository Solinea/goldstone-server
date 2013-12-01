from django.test import TestCase
from django.utils import timezone

from .models import Lease, Notification, Action
from .tasks import notify, expire


class CeleryLeaseTest(TestCase):

    def setUp(self):
        # create three leases, each with a notification and action
        lease = Lease(
            name='Lease 1',
            deleted=False,
            start_time=timezone.now(),
        )
        lease.save()
        lease.notification_set.create(
            name="samples notification",
            driver="email",
            time=timezone.now(),
            result="success",
            )
        lease.action_set.create(
            name="sample action",
            driver="terminate",
            time=timezone.now(),
            result="pending",
            )
        pass

    def tearDown(self):
        pass

    def test_notifications(self):
        pass

    def test_expires(self):
        pass
