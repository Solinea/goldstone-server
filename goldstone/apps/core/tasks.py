"""Core tasks."""
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
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# we only use es_conn, but for some reason, making the import more specific
# causes an import failure.
import goldstone

from goldstone.celery import app as celery_app
from django.conf import settings
from elasticsearch.exceptions import RequestError
import logging
from subprocess import check_call

logger = logging.getLogger(__name__)


@celery_app.task()
def delete_indices(prefix,
                   cutoff=None,
                   es_host=settings.ES_HOST,
                   es_port=settings.ES_PORT):
    """Cull old indices from Elasticsearch.

    Takes an index name prefix (ex: goldstone-) and a cutoff time in days
    Returns 0 or None if no cutoff was provided.
    """

    if cutoff is not None:
        cmd = "curator --host %s --port %s delete --prefix %s " \
              "--older-than %d" % (es_host, es_port, prefix, cutoff)
        return check_call(cmd.split())
    else:
        return "Cutoff was none, no action taken"


def _create_or_replace_alias(index_name, server=settings.ES_SERVER,
                             alias='goldstone'):
    """Manage an alias for an index.

    Takes an index name and an alias name.  If the alias does not exist,
    it is created and associated with the provided index name.  If the
    alias already exists, it is repointed at the provided index.
    """
    try:
        conn = goldstone.models.es_conn(server)
        if conn.indices.exists_alias(alias):
            conn.indices.update_aliases({
                "actions": [
                    {"remove": {"index": "_all", "alias": alias}},
                    {"add": {"index": index_name, "alias": alias}}
                ]
            })
        else:
            conn.indices.put_alias(alias, index_name)
    except Exception:         # pylint: disable=W0703
        logger.warn('Alias creation failed. Please report this.')
        raise


def create_index(name, body=None, server=settings.ES_SERVER):
    """Create an ES index with the provided name and body."""

    try:
        conn = goldstone.models.es_conn(server)
        conn.indices.create(name, body=body)
    except RequestError as exc:
        # Reraise anything that isn't index already exists
        if not exc.error.startswith('IndexAlreadyExistsException'):
            logger.warn('Index creation failed. Please report this error.')
            raise
        else:
            logger.debug('Attempt to create index %s failed. Already exists.',
                         name)


@celery_app.task()
def create_daily_index(basename='goldstone'):
    """Create a new index in ElasticSearch and set up the goldstone alias."""
    from datetime import date

    now = date.today()
    index_name = basename + "-" + now.strftime("%Y.%m.%d")

    try:
        create_index(index_name)
        return _create_or_replace_alias(index_name)
    except Exception:         # pylint: disable=W0703
        logger.error("Failed to create the daily goldstone index and/or"
                     "alias.  Please report this.")
        raise
