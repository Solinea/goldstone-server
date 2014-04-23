from __future__ import absolute_import
from goldstone.celery import app as celery_app
import logging
from .models import ApiPerfData
from goldstone.utils import _get_keystone_client, stored_api_call
from django.conf import settings
from datetime import datetime
import requests
import json


logger = logging.getLogger(__name__)

@celery_app.task(bind=True)
def time_cinder_api(self):
    """
    Call the service list command for the test tenant.  Retrieves the
    endpoint from keystone, then constructs the URL and inserts a record
    in the DB.
    """
    result = stored_api_call("cinder", "volume", "/os-services")
    logger.info("result = %s", json.dumps(result))
    logger.debug(_get_keystone_client.cache_info())
    api_db = ApiPerfData()
    rec_id = api_db.post(result['db_record'])
    logger.debug("[time_cinder_api] id = %s", rec_id)
    return {
        'id': rec_id,
        'record': result['db_record']
    }
