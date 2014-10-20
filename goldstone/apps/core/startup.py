from django.core.exceptions import MiddlewareNotUsed
from django.conf import settings
from django.core.management import call_command
from elasticsearch import Elasticsearch, TransportError
import logging

logger = logging.getLogger(__name__)


class StartupGoldstone(object):
    def __init__(self):
        logger.debug("attempting to create goldstone_model ES index")

        # create the goldstone_model ES index if it doesn't exist
        index_name = "goldstone_model"
        conn = Elasticsearch(settings.ES_SERVER)
        try:
            if not conn.indices.exists(index_name):
                conn.indices.create(index_name)
            raise MiddlewareNotUsed('Startup complete')
        except TransportError:
            logger.exception("could not contact elasticsearch on startup.")

        raise MiddlewareNotUsed('Startup complete')
