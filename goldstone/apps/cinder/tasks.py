from __future__ import absolute_import
from django.conf import settings
from goldstone.celery import app as celery_app
import requests
from urllib2 import urlparse
import logging
from datetime import datetime
import json
import hashlib
from .models import ApiPerfData
from goldstone.utils import _get_keystone_client


logger = logging.getLogger(__name__)


@celery_app.task(bind=True)
def time_cinder_service_list(self):
    """
    Call the service list command for the test tenant.  Retrieves the
    endpoint from keystone, then constructs the URL and inserts a record
    in the DB.
    """

    user = None
    passwd = None
    tenant = None
    auth_url = None

    try:
        user = settings.OS_USERNAME
        passwd = settings.OS_PASSWORD
        tenant = settings.OS_TENANT_NAME
        auth_url = settings.OS_AUTH_URL
    except AttributeError as e:
        logger.error(e.message)

    kt = _get_keystone_client(user, passwd, tenant, auth_url)
    logger.info(_get_keystone_client.cache_info())

    try:
        md5 = hashlib.md5()
        md5.update(kt.auth_token)
        url = kt.service_catalog.\
            get_endpoints()['volume'][0]['publicURL'] + "/os-services"
        headers = {'x-auth-token': md5.hexdigest(),
                   'content-type': 'application/json'}
        self.reply = requests.get(url, headers=headers)
        t = datetime.utcnow()

        # TODO should add the host and IP entries here, but it would have to be
        # pulled out of the URL
        response = {'response_time': self.reply.elapsed.total_seconds(),
                    'response_status': self.reply.status_code,
                    'response_length': int(
                        self.reply.headers['content-length']),
                    'component': 'cinder',
                    'uri': urlparse.urlparse(self.reply.url).path,
                    '@timestamp': t.strftime(
                        "%Y-%m-%dT%H:%M:%S." +
                        str(int(round(t.microsecond/1000))) +
                        "Z"),
                    'task_id': self.request.id
                    }
        logger.info("[time_cinder_volume_list] response = %s",
                    json.dumps(response))

        # clear the cache if the call failed for any reason.
        if not self.reply.status_code == 200:
            _get_keystone_client.cache_clear()

        apidb = ApiPerfData()
        id = apidb.post(response)
        logger.info("[time_cinder_volume_list] id = %s", id)
    except Exception as e:
        # reauthenticate next time to be safe
        _get_keystone_client.cache_clear()
        logger.error("Task failed with message: " + e.message)
