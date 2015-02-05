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
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
from elasticutils import get_es

from goldstone.celery import app as celery_app
from django.conf import settings
from elasticsearch import *
from elasticsearch.exceptions import TransportError, RequestError
import os
import json
from datetime import date
import logging
from subprocess import check_call

logger = logging.getLogger(__name__)


def get_es_connection(server=settings.ES_SERVER):
    try:
        es = get_es(urls=[server], timeout=10,
                    max_retries=3)
        return es
    except TransportError:
        logger.error("Could not connect to ElasticSearch.")
        raise
    except Exception:           # pylint: disable=W0703
        logger.warn('Unknown exception getting ES connection.  Please report '
                    'this.')
        raise


def _delete_indices(prefix, cutoff,
                    es_host=settings.ES_HOST,
                    es_port=settings.ES_PORT
                    ):
    cmd = "curator --host %s --port %s delete --prefix %s --older-than %d" %\
          (es_host, es_port, prefix, cutoff)
    return check_call(cmd.split())


def _create_or_replace_alias(index_name, server=settings.ES_SERVER,
                             alias='goldstone'):
    try:
        conn = get_es_connection(server)
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


def _put_es_template(template_file, template_name, server=settings.ES_SERVER):
    """
    :param template_file: filename of the json template
    :param template_name: name to install template as
    :param server: ES server
    :return: boolean indicator of acknowledgment

    This will overwrite an existing template of the same name.
    """

    try:
        conn = get_es_connection(server)
        conn.indices.put_template(template_name,
                                  json.load(template_file),
                                  create=False)
    except RequestError:
        logger.warn('Template creation failed. Please report this error.')


def _create_index(name, body=None, server=settings.ES_SERVER):
    try:
        conn = get_es_connection(server)
        conn.indices.create(name, body=body)
    except RequestError as e:
        # Reraise anything that isn't index already exists
        if not e.error.startswith('IndexAlreadyExistsException'):
            logger.warn('Index creation failed. Please report this error.')
            raise
        else:
            logger.debug('Attempt to create index %s failed. Already exists.',
                         name)


def _put_agent_template(server=settings.ES_SERVER):
    try:
        f = open(os.path.join(os.path.dirname(__file__),
                              "goldstone_agent_template.json"), 'rb')
        _put_es_template(f, "goldstone_agent", server=server)
    except Exception:         # pylint: disable=W0703
        logger.error("Failed to create/update the goldstone_agent template.  "
                     "Please report this.")
        raise


def _put_model_template(server=settings.ES_SERVER):
    try:
        f = open(os.path.join(os.path.dirname(__file__),
                              "goldstone_model_template.json"), 'rb')
        _put_es_template(f, "goldstone_model", server=server)
    except Exception:         # pylint: disable=W0703
        logger.error("Failed to create/update the goldstone_agent template.  "
                     "Please report this.")
        raise


def _put_goldstone_daily_template(server=settings.ES_SERVER):
    try:
        f = open(os.path.join(os.path.dirname(__file__),
                              "goldstone_es_template.json"), 'rb')
        _put_es_template(f, "goldstone_daily", server=server)
    except Exception:         # pylint: disable=W0703
        logger.error("Failed to create/update the goldstone_es template.  "
                     "Please report this.")
        raise


def _put_all_templates(server=settings.ES_SERVER):
    """
    Install or update the goldstone templates.  This should only be used by
    the goldstone installer
    """

    _put_goldstone_daily_template(server=server)
    _put_agent_template(server=server)
    _put_model_template(server=server)


def _create_daily_index(server=settings.ES_SERVER,
                        basename='goldstone'):
    """
    Create a new index in ElasticSearch and set up
    an alias for goldstone to point to the latest index.
    """
    now = date.today()
    index_name = basename + "-" + now.strftime("%Y.%m.%d")

    try:
        _create_index(index_name)
        return _create_or_replace_alias(index_name)
    except Exception:         # pylint: disable=W0703
        logger.error("Failed to create the daily goldstone index and/or"
                     "alias.  Please report this.")
        raise


def _create_agent_index(server=settings.ES_SERVER):
    """
    Create a new index in ElasticSearch.
    """
    index_name = "goldstone_agent"

    try:
        return _create_index(index_name)
    except Exception:         # pylint: disable=W0703
        logger.error("Failed to create the goldstone agent index. Please "
                     "report this.")
        raise


@celery_app.task(bind=True)
def manage_es_indices(self,
                      es_host=settings.ES_HOST,
                      es_port=settings.ES_PORT):
    """
    Create a daily goldstone index, cull old goldstone and logstash indices
    :param es_host:
    :param es_port:
    :return: (Boolean, Boolean, Boolean)
    """

    result = []

    try:
        _create_daily_index(basename='goldstone')
        result.append(True)
    except Exception:         # pylint: disable=W0703
        logger.exception("exception creating daily goldstone index")
        result.append(False)

    try:
        if settings.ES_GOLDSTONE_RETENTION is not None:
            _delete_indices("goldstone-",
                            settings.ES_GOLDSTONE_RETENTION,
                            es_host, es_port)
            result.append(True)
    except Exception:         # pylint: disable=W0703
        logger.exception("exception deleting old goldstone indices")
        result.append(False)

    try:
        if settings.ES_LOGSTASH_RETENTION is not None:
            _delete_indices("logstash-",
                            settings.ES_LOGSTASH_RETENTION,
                            es_host, es_port)
            result.append(True)
    except Exception:         # pylint: disable=W0703
        logger.exception("exception deleting old logstash indices")
        result.append(False)

    return tuple(result)
