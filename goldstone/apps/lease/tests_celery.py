from datetime import datetime, timedelta
from mock import patch, MagicMock

from django.test import TestCase
from django.test.utils import override_settings
from django.utils import timezone
# from novaclient.v1_1 import client

from .models import Lease, Notification, Action
from .tasks import task, expire

class CeleryLeaseTest(TestCase):


    def mock_client(self, u, p, t, a, **kwargs):
        return "client"


    def mock_delete(self, s):
        return "200"

    def setUp(self):
        # create three leases, each with a notification and action
        self.lease = Lease(
            name='Lease 1',
            deleted=False,
            start_time=timezone.now(),
            expiration_time=timezone.now(),
            status="pending",
            resource_id=101,
            scope="RESOURCE"
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
    @patch('novaclient.v1_1.client.Client')
    @patch('novaclient.v1_1.client.servers')
    def test_find_expire(self, mock_client, mock_delete):
        """Expiring a lease should set the status/results fields to COMPLETE
        """
        # client.Client = self.mock_client(1,1,1,1,service_type="compute")
        # client.servers.delete = self.mock_delete(12)
        mock_client.return_value = True
        mock_delete.deleteself.return_value = True
        # (l, n, a) = self.dummy_data()
        # mock_server.delete.return_value = True
        result = expire.delay(self.action.pk)
        # self.assertTrue(result.successful())
        # self.assertEqual(101, self.lease.resource_id)
        # self.assertEqual(True, result.result)
        # self.assertEqual("SUCCESS", result.status)
        self.assertTrue(mock_client.called)
        self.assertEqual("COMPLETED", Lease.objects.first().status)
