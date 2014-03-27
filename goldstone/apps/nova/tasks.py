from __future__ import absolute_import
from django.conf import settings
from goldstone.celery import app as celery_app
from novaclient.v1_1 import client
import logging
import json
from datetime import datetime
from .models import AvailabilityZoneData

logger = logging.getLogger(__name__)

@celery_app.task(bind=True)
def nova_az_list(self):
    nt = client.Client(settings.OS_USERNAME, settings.OS_PASSWORD,
                       settings.OS_TENANT_NAME, settings.OS_AUTH_URL,
                       service_type="compute")
    response = {'zones': [z.to_dict() for z in nt.availability_zones.list()]}
    t = datetime.utcnow()
    response['@timestamp'] = t.strftime(
        "%Y-%m-%dT%H:%M:%S." + str(int(round(t.microsecond/1000))) + "Z")
    response['task_id'] = self.request.id
    #logger.info("[nova_az_list] response = %s", json.dumps(response))
    azdb = AvailabilityZoneData()
    id = azdb.post(response)
    logger.info("[nova_az_list] id = %s", id)
