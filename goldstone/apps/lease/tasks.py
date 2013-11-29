from __future__ import absolute_import
from proj.celery import app

import os
from datetime import timedelta

ACTION_OFFSET = 120
NOTIFICATION_OFFSET = 120
QUERY_OFFSET = 60 * 10

CELERY_TIMEZONE = 'UTC'

CELERYBEAT_SCHEDULE = {'expiring_leases': {
    'task': 'tasks.pull_expiring_leases',
    'schedule': timedelta(seconds=QUERY_OFFSET),
    'args': '',
    }, 'upcoming_notifications': {
    'task': 'tasks.pull_upcoming_notifications',
    'schedule': timedelta(seconds=QUERY_OFFSET),
    'args': '',
    },
}


def _get_admin_keys():
    """
    Get admin keys to execute privileged OpenStack actions
    """
    pass


@app.task
def get_expiring_leases(offset=NOTIFICATION_OFFSET):
    """
    Query the database for leases expirations
    """
    pass


@app.task
def get_upcoming_notifications(offset=ACTION_OFFSET):
    """
    Query the database for upcoming notifications
    """
    pass


@app.task
def notify_expiring(lease, notification):
    """
    Send notifications
    """
    pass


@app.task
def enforce_expiration(lease, action):
    """
    Enforce lease expirations
    """
    pass
