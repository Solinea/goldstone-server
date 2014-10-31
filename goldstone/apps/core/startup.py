from django.core.exceptions import MiddlewareNotUsed
from django.conf import settings
from django.core.management import call_command
from elasticsearch import Elasticsearch, TransportError
import logging

logger = logging.getLogger(__name__)


class StartupGoldstone(object):

    def _setup_index(self, conn, index_name):
        try:
            if not conn.indices.exists(index_name):
                conn.indices.create(index_name)
            raise MiddlewareNotUsed('Startup complete')
        except TransportError:
            logger.exception("could not contact elasticsearch on startup.")

    def __init__(self):
        logger.debug("attempting to create goldstone_model ES index")

        # create the goldstone_model and goldstone_agent ES indices if
        # they don't exist
        conn = Elasticsearch(settings.ES_SERVER)
        self._setup_index(conn, "goldstone_model")
        self._setup_index(conn, "goldstone_agent")

        raise MiddlewareNotUsed('Startup complete')
