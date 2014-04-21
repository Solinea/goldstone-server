from __future__ import absolute_import
from goldstone.celery import app as celery_app
import logging
from .models import ApiPerfData
from goldstone.utils import _get_keystone_client, _stored_api_call


logger = logging.getLogger(__name__)


@celery_app.task(bind=True)
def time_cinder_service_list(self):
    """
    Call the service list command for the test tenant.  Retrieves the
    endpoint from keystone, then constructs the URL and inserts a record
    in the DB.
    """
    logger.debug(_get_keystone_client.cache_info())
    result = _stored_api_call("volume", "/os-services")
    api_db = ApiPerfData()
    rec_id = api_db.post(result['db_record'])
    logger.debug("[time_cinder_volume_list] id = %s", rec_id)





