from django.conf import settings
from keystoneclient.apiclient.exceptions import ClientException
from goldstone.lru_cache import lru_cache
from keystoneclient.v2_0 import client
import logging
import hashlib
import requests
from datetime import datetime
from urllib2 import urlparse
import json
from exceptions import LookupError


logger = logging.getLogger(__name__)


class GoldstoneAuthError(Exception):
    pass


@lru_cache(maxsize=16)
def _get_keystone_client(user=settings.OS_USERNAME,
                         passwd=settings.OS_PASSWORD,
                         tenant=settings.OS_TENANT_NAME,
                         auth_url=settings.OS_AUTH_URL):
    """
    Authenticate and cache a token.  If token doesn't work, caller should
    clear the cache and retry.
    """

    try:
        kt = client.Client(username=user,
                           password=passwd,
                           tenant_name=tenant,
                           auth_url=auth_url)
    except ClientException:
        raise
    else:
        if kt.auth_token is None:
            raise GoldstoneAuthError("Keystone client call succeeded, but "
                                     "auth token was not returned.  Check "
                                     "credentials.")
        else:
            md5 = hashlib.md5()
            md5.update(kt.auth_token)
            return {'client': kt, 'hex_token': md5.hexdigest()}


def _construct_api_rec(reply, component, ts):
    td = reply.elapsed
    total_secs = (td.microseconds + (td.seconds + td.days * 24 * 3600) *
                  10**6) / 10**6
    rec = {'response_time': total_secs,
           'response_status': reply.status_code,
           'response_length': int(reply.headers['content-length']),
           'component': component,
           'uri': urlparse.urlparse(reply.url).path,
           '@timestamp': ts.strftime("%Y-%m-%dT%H:%M:%S." +
                                     str(int(round(ts.microsecond/1000))) +
                                     "Z")}
    logger.debug("response = %s",
                 json.dumps(rec))
    return rec


def stored_api_call(component, endpt, path, headers={}, data=None,
                    user=settings.OS_USERNAME,
                    passwd=settings.OS_PASSWORD,
                    tenant=settings.OS_TENANT_NAME,
                    auth_url=settings.OS_AUTH_URL):

    kt = _get_keystone_client(user, passwd, tenant, auth_url)

    try:
        url = kt['client'].service_catalog.\
            get_endpoints()[endpt][0]['publicURL'] + path

    except:
        raise LookupError("Could not find a public URL endpoint for %s", endpt)
    else:
        headers = dict(
            {'x-auth-token': kt['hex_token'],
             'content-type': 'application/json'}.items() +
            headers.items())
        t = datetime.utcnow()
        reply = requests.get(url, headers=headers, data=data)

        # someone could change the upstream password to
        # match the configuration credentials after the result was cached.
        if reply.status_code == requests.codes.unauthorized:
            logger.debug("clearing keystone client cache due to 401 response")
            _get_keystone_client.cache_clear()

        return {
            'reply': reply,
            'db_record': _construct_api_rec(reply, component, t)
        }
