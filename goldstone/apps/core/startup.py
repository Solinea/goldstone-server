from elasticsearch import TransportError
import logging
from goldstone.models import GSConnection

logger = logging.getLogger(__name__)


class StartupGoldstone(object):

    def _setup_index(self, conn, index_name):
        try:
            logger.info("Ensuring that index [%s] exists", index_name)
            if not conn.indices.exists(index_name):
                conn.indices.create(index_name)
                logger.info("Created index [%s]", index_name)

        except TransportError:
            logger.exception("could not contact elasticsearch on startup.")

    def __init__(self):
        logger.debug("attempting to create goldstone_model ES index")
        # Create the goldstone_model and goldstone_agent ES indices if
        # they don't exist.  If we can't complete this initialization, then
        # goldstone will fail to start.
        conn = GSConnection().conn
        self._setup_index(conn, "goldstone_model")
        self._setup_index(conn, "goldstone_agent")
