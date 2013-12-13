from datetime import datetime, timedelta
import mock

from django.test import TestCase
from django.test.utils import override_settings
from django.utils import timezone
from novaclient.v1_1 import client

from .models import Lease, Notification, Action
from .tasks import task, expire


class CeleryLeaseTest(TestCase):

    def setUp(self):
        # create three leases, each with a notification and action
        self.lease = Lease(
            name='Lease 1',
            deleted=False,
            start_time=timezone.now(),
            expiration_time=timezone.now(),
            status="pending",
            resource_id="1",
        )
        self.lease.save()
        self.notification = self.lease.notification_set.create(
            name="samples notification",
            driver="email",
            time=timezone.now(),
            result="pending",
            )
        self.notification.save()
        self.action = self.lease.action_set.create(
            name="sample action",
            driver="terminate",
            time=timezone.now(),
            result="pending",
            )
        self.action.save()

    def tearDown(self):
        pass

    def test_setups_are_correct(self):
        """Dummy test to make sure fixtures are correct
        """
        self.assertEqual("Lease 1", self.lease.name)
        self.assertEqual("samples notification", self.notification.name)
        self.assertEqual("sample action", self.action.name)

    def test_notifications(self):
        pass

    def test_expires(self):
        pass

    @override_settings(CELERY_EAGER_PROPAGATES_EXCEPTIONS=True,
                       CELERY_ALWAYS_EAGER=True,
                       BROKER_BACKEND='memory',)
    def test_find_expire(self):
        """Expiring a lease should set the status/results fields to COMPLETE
        """
        task._delete_instance = mock.MagicMock(return_value=True)
        result = expire.delay(self.lease.pk)
        task._delete_instance.assert_called_with(self.lease.pk)
        # self.assertEqual(True, result)
        self.assertEqual("COMPLETED", Lease.objects.first().status)
        self.assertEqual("COMPLETED", Action.objects.first().result)
