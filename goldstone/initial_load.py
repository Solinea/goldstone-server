#!/usr/bin/env python
"""System initialization functions."""
# Copyright 2015 Solinea, Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
import os.path
from django.conf import settings


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
    from .models import es_conn
    try:
        conn = es_conn(server)
        conn.indices.put_template(template_name,
                                  json.load(template_file),
                                  create=False)
    except RequestError:
        print "?ERROR: Template creation failed. Please report this!"
        raise


def _put_metrics_template(server=settings.ES_SERVER):
    """Load the ES template for the agent index."""

    try:
        f = open(os.path.join(os.path.dirname(__file__),
                              "goldstone_metrics_template.json"), 'rb')
        _put_es_template(f, "goldstone_metrics", server=server)
    except Exception:         # pylint: disable=W0703
        print "?ERROR: Failed to create/update the goldstone_metrics " \
              "template.  Please report this!"
        raise


def _put_reports_template(server=settings.ES_SERVER):
    """Load the ES template for the agent index."""

    try:
        f = open(os.path.join(os.path.dirname(__file__),
                              "goldstone_reports_template.json"), 'rb')
        _put_es_template(f, "goldstone_reports", server=server)
    except Exception:         # pylint: disable=W0703
        print "?ERROR: Failed to create/update the goldstone_reports " \
              "template.  Please report this!"
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
    _put_reports_template(server=server)
    _put_metrics_template(server=server)


def initialize_elasticsearch():
    """Set up the Elasticsearch templates."""

    _put_all_templates()
