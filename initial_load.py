#!/usr/bin/env python
"""System initialization functions."""
# Copyright 2015 Solinea, Inc.
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
import os.path
from django.conf import settings
from goldstone.apps.core.tasks import create_daily_index

# we only use es_conn, but for some reason, making the import more specific
# causes an import failure.
import goldstone

def _put_es_template(template_file, template_name, server=settings.ES_SERVER):
    """Load an index template into ES from a file.

    :param template_file: filename of the json template
    :param template_name: name to install template as
    :param server: ES server
    :return: boolean indicator of acknowledgment

    This will overwrite an existing template of the same name.

    """
    import json
    from elasticsearch.exceptions import RequestError

    try:
        conn = goldstone.models.get_es_conn(server)
        conn.indices.put_template(template_name,
                                  json.load(template_file),
                                  create=False)
    except RequestError:
        print "?ERROR: Template creation failed. Please report this!"
        raise


def _put_agent_template(server=settings.ES_SERVER):
    """Load the ES template for the agent index."""

    try:
        f = open(os.path.join(os.path.dirname(__file__),
                              "goldstone_agent_template.json"), 'rb')
        _put_es_template(f, "goldstone_agent", server=server)
    except Exception:         # pylint: disable=W0703
        print "?ERROR: Failed to create/update the goldstone_agent template. " \
              "Please report this!"
        raise


def _put_model_template(server=settings.ES_SERVER):
    """Load the ES template for the model index."""

    try:
        f = open(os.path.join(os.path.dirname(__file__),
                              "goldstone_model_template.json"), 'rb')
        _put_es_template(f, "goldstone_model", server=server)
    except Exception:         # pylint: disable=W0703
        print "?ERROR: Failed to create/update the goldstone_agent template. " \
              "Please report this!"
        raise


def _put_goldstone_daily_template(server=settings.ES_SERVER):
    """Load the ES template for the goldstone index."""

    try:
        f = open(os.path.join(os.path.dirname(__file__),
                              "goldstone_es_template.json"), 'rb')
        _put_es_template(f, "goldstone_daily", server=server)
    except Exception:         # pylint: disable=W0703
        print "?ERROR: Failed to create/update the goldstone_es template. " \
              "Please report this!"
        raise


def _put_all_templates(server=settings.ES_SERVER):
    """Install or update all goldstone templates."""

    _put_goldstone_daily_template(server=server)
    _put_agent_template(server=server)
    _put_model_template(server=server)


def _create_agent_index():
    """Create a new index in ElasticSearch."""
    from goldstone.apps.core.tasks import create_index

    INDEX_NAME = "goldstone_agent"

    try:
        return create_index(INDEX_NAME)
    except Exception:         # pylint: disable=W0703
        print "?ERROR: Failed to create the goldstone agent index. " \
              "Please report this!"
        raise


def initialize_development():
    """Set up Elasticsearch templates for test running."""

    _put_all_templates()
    create_daily_index()
    _create_agent_index()
