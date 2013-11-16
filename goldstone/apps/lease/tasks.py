from __future__ import absolute_import
from proj.celery import app

import os
from datetime import timedelta

ACTION_OFFSET_DEFAULT = 120
NOTIFICATION_OFFSET_DEFAULT = 120
QUERY_DEFAULT_OFFSET = 60 * 10

CELERY_TIMEZONE = 'UTC'

CELERYBEAT_SCHEDULE = {
￼￼￼'expiring_leases': {
        'task': 'tasks.pull_expiring_leases',
        'schedule': timedelta(seconds=QUERY_DEFAULT_OFFSET),
        'args': '',
    },
￼￼￼'upcoming_notifications': {
        'task': 'tasks.pull_notifications',
        'schedule': timedelta(seconds=QUERY_DEFAULT_OFFSET),
        'args': '',
    },
}


def _get_admin_keys():
    """
    Get admin keys to execute privileged OpenStack actions
    """
    pass


@app.task
def pull_expiring_leases(offset=NOTIFICATION_OFFSET_DEFAULT):
    """
    Query the database for leases that will expire within x seconds
    """
    pass


@app.task
def pull_notifications(offset=ACTION_OFFSET_DEFAULT):
    """
    Query the database for notifications within x seconds
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
