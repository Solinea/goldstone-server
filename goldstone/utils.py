from django.conf import settings
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

    kt = client.Client(username=user,
                       password=passwd,
                       tenant_name=tenant,
                       auth_url=auth_url)

    if kt.auth_token is None:
        raise GoldstoneAuthError("Keystone client call succeeded, but auth "
                                 "token was not returned.  Check credential "
                                 "settings.")
    else:
        # not sure if the API would accept an md5 hash of a UUID.
        # TODO should try to detect whether key is a UUID or a PKI first
        # doesn't seem to be an obvious pull from the keystone client.  defer.
        md5 = hashlib.md5()
        md5.update(kt.auth_token)
        return {'client': kt, 'hex_token': md5.hexdigest()}


def _stored_api_call(endpt, path, headers={}, data=None,
                     user=settings.OS_USERNAME,
                     passwd=settings.OS_PASSWORD,
                     tenant=settings.OS_TENANT_NAME,
                     auth_url=settings.OS_AUTH_URL):

    kt = _get_keystone_client(user, passwd, tenant, auth_url)
    url = None
    try:
        url = kt['client'].service_catalog.\
            get_endpoints()[endpt][0]['publicURL'] + path
    except:
        raise LookupError("Could not find a public URL endpoint for %s", endpt)

    headers = dict(
        {'x-auth-token': kt['hex_token'],
         'content-type': 'application/json'}.items() +
        headers.items())
    t = datetime.utcnow()
    reply = requests.get(url, headers=headers, data=data)
    # TODO should add the host and IP entries here, but it would have to be
    # pulled out of the URL
    rec = {'response_time': reply.elapsed.total_seconds(),
           'response_status': reply.status_code,
           'response_length': int(reply.headers['content-length']),
           'component': 'cinder',
           'uri': urlparse.urlparse(reply.url).path,
           '@timestamp': t.strftime("%Y-%m-%dT%H:%M:%S." +
                                    str(int(round(t.microsecond/1000))) +
                                    "Z")
    }

    logger.debug("response = %s",
                 json.dumps(rec))

    # someone could change the upstream password to
    # match the configuration credentials after the result was cached.
    if reply.status_code == requests.codes.unauthorized:
        logger.debug("clearing keystone client cache due to 401 response")
        _get_keystone_client.cache_clear()

    return {
        'reply': reply,
        'db_record': rec
    }
