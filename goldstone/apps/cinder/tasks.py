from __future__ import absolute_import
from django.conf import settings
from goldstone.celery import app as celery_app
from keystoneclient.v2_0 import client
import requests
from urllib2 import urlparse
import logging
from datetime import datetime
import json
import hashlib
from .models import ApiPerfData


logger = logging.getLogger(__name__)


@celery_app.task(bind=True)
def time_cinder_volume_list(self):
    """
    Call the volume list command for the test tenant.  Retrieves the
    endpoint from keystone, then constructs the URL and inserts a record
    in the DB.
    """

    user = settings.OS_USERNAME
    passwd = settings.OS_PASSWORD
    kt = client.Client(username=user,
                       password=passwd,
                       tenant_name=settings.OS_TENANT_NAME,
                       auth_url=settings.OS_AUTH_URL)

    md5 = hashlib.md5()
    md5.update(kt.auth_token)
    url = kt.service_catalog.\
        get_endpoints()['volume'][0]['publicURL'] + "/volumes/detail"
    headers = {'x-auth-token': md5.hexdigest(),
               'content-type': 'application/json'}
    self.reply = requests.get(url, headers=headers)
    t = datetime.utcnow()

    # TODO should add the host and IP entries here, but it would have to be
    # pulled out of the URL
    response = {'response_time': self.reply.elapsed.total_seconds(),
                'response_status': self.reply.status_code,
                'response_length': int(self.reply.headers['content-length']),
                'component': 'cinder',
                'uri': urlparse.urlparse(self.reply.url).path,
                '@timestamp': t.strftime("%Y-%m-%dT%H:%M:%S." +
                                         str(int(round(t.microsecond/1000))) +
                                         "Z"),
                'task_id': self.request.id
                }
    logger.info("[time_cinder_volume_list] response = %s",
                json.dumps(response))
    apidb = ApiPerfData()
    id = apidb.post(response)
    logger.info("[time_cinder_volume_list] id = %s", id)
