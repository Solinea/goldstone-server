"""Start up Goldstone."""
# Copyright 2014 - 2015 Solinea, Inc.
#
# Licensed under the Solinea Software License Agreement (goldstone),
# Version 1.0 (the "License"); you may not use this file except in compliance
# with the License. You may obtain a copy of the License at:
#
#     http://www.solinea.com/goldstone/LICENSE.pdf
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import logging
from elasticsearch import TransportError
from goldstone.models import es_conn

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
        """Create the goldstone_model and goldstone_agent ES indices if they
        don't exist."""

        logger.debug("attempting to create goldstone_model ES index")
        conn = es_conn()
        self._setup_index(conn, "goldstone_model")
        self._setup_index(conn, "goldstone_agent")
