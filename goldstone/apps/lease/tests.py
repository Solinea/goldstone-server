# vim: tabstop=4 shiftwidth=4 softtabstop=4

#
# Copyright 2012 Solinea, Inc.
#

from django.core.urlresolvers import resolve
from django.test import TestCase
from django.utils import timezone

from datetime import datetime, timedelta

from .models import Lease
from .models import Notification
from .models import Action


class LeaseTest(TestCase):

    def setUp(self):
        pass

    def tearDown(self):
        pass

    def _create_lease_object(self):
        lease = Lease()
        lease.name = 'Lease 1'
        lease.deleted = False
        lease.start_time = timezone.now()
        lease.expiration_time = timezone.make_aware(
            datetime.now()+timedelta(days=30),
            timezone.get_current_timezone())
        return lease

    def test_root_url_resolves_to_home_page_view(self):
        found = resolve('/leases/')
        self.assertEqual(found.view_name, 'lease-list')

    def test_create_leases(self):
        first_item = self._create_lease_object()
        first_item.save()
        saved_items = Lease.objects.all()
        self.assertEqual(saved_items.count(), 1)
        first_saved_item = saved_items[0]
        self.assertEqual(first_saved_item.name, 'Lease 1')

    def test_delete_lease(self):
        sample = self._create_lease_object()
        sample.save()
        saved_items = Lease.objects.all()
        self.assertEqual(saved_items.count(), 1)
        to_be_deleted = Lease.objects.first()
        to_be_deleted.delete()
        after_delete_items = Lease.objects.all()
        self.assertEqual(after_delete_items.count(), 0)

    def test_update_lease(self):
        sample = self._create_lease_object()
        sample.save()
        to_be_updated = Lease.objects.first()
        to_be_updated.deleted = True
        to_be_updated.save()
        update_lease = Lease.objects.first()
        self.assertEqual(True, update_lease.deleted)

    def test_lease_with_notification(self):
        sample = self._create_lease_object()
        sample.save()
        sample.notification_set.create(
            name="samples notification",
            driver="email",
            time=timezone.now(),
            result="success",
            )
        sample.notification_set.create(
            name="samples notification 2",
            driver="sms",
            time=timezone.now(),
            result="pending",
            )
        note_count = Notification.objects.all()
        self.assertEqual(note_count.count(), 2)

    def test_lease_with_action(self):
        sample = self._create_lease_object()
        sample.save()
        sample.action_set.create(
            name="sample action",
            driver="terminate",
            time=timezone.now(),
            result="pending",
            )
        action_count = Action.objects.all()
        self.assertEqual(action_count.count(), 1)

    def test_cascading_deletes_set_correctly(self):
        sample = self._create_lease_object()
        sample.save()
        sample.notification_set.create(
            name="samples notification",
            driver="email",
            time=timezone.now(),
            result="success",
            )
        sample.action_set.create(
            name="sample action",
            driver="terminate",
            time=timezone.now(),
            result="pending",
            )
        saved_items = Lease.objects.all()
        self.assertEqual(saved_items.count(), 1)
        action_count = Action.objects.all()
        self.assertEqual(action_count.count(), 1)
        note_count = Notification.objects.all()
        self.assertEqual(note_count.count(), 1)
        saved_items[0].delete()
        saved_items = Lease.objects.all()
        self.assertEqual(saved_items.count(), 0)
        action_count = Action.objects.all()
        self.assertEqual(action_count.count(), 0)
        note_count = Notification.objects.all()
        self.assertEqual(note_count.count(), 0)
