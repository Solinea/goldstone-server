from __future__ import absolute_import
from django.conf import settings
from goldstone.celery import app as celery_app
from keystoneclient.v2_0 import client
import requests
from urllib2 import urlparse
import logging
from datetime import datetime
import json
from .models import ApiPerfData


logger = logging.getLogger(__name__)

# wrap a function with args for timeit
def _func_wrapper(func, *args, **kwargs):
    def wrapped():
        return func(*args, **kwargs)
    return wrapped


@celery_app.task(bind=True)
def time_keystone_auth(self):
    """
    Call the token url via http rather than the python client so we can get
    a full set of data for the record in the DB.  This will make things
    easier to model.  Call is equivalent to:

    curl -H "Content-type: application/json" -d '{
        "auth":{"passwordCredentials":
            {"username": "user", "password": "passwd"}}}'
        http://10.10.11.20:35357/v2.0/tokens
    """

    user = settings.OS_USERNAME
    passwd = settings.OS_PASSWORD
    url = settings.OS_AUTH_URL + "/tokens"
    payload = {"auth":{"passwordCredentials":{"username": user,
                                              "password": passwd}}}
    headers = {'content-type': 'application/json'}
    self.reply = requests.post(url, data=json.dumps(payload),
                               headers=headers)
    t = datetime.utcnow()

    # TODO should add the host and IP entries here, but it would have to be
    # pulled out of the URL
    response = {'response_time': self.reply.elapsed.total_seconds(),
                'response_status': self.reply.status_code,
                'response_length': int(self.reply.headers['content-length']),
                'component': 'keystone',
                'uri': urlparse.urlparse(self.reply.url).path,
                '@timestamp': t.strftime("%Y-%m-%dT%H:%M:%S." +
                                         str(int(round(t.microsecond/1000))) +
                                         "Z"),
                'task_id': self.request.id
                }
    logger.info("[time_keystone_auth] response = %s", json.dumps(response))
    apidb = ApiPerfData()
    id = apidb.post(response)
    logger.info("[time_keystone_auth] id = %s", id)

