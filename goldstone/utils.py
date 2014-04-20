from goldstone.lru_cache import lru_cache
from keystoneclient.v2_0 import client
import logging

logger = logging.getLogger(__name__)


@lru_cache(maxsize=16)
def _get_keystone_client(user, passwd, tenant, auth_url):
    """
    Authenticate and cache a token.  If token doesn't work, caller should
    clear the cache and retry.
    """
    kt = None
    try:
        kt = client.Client(username=user,
                           password=passwd,
                           tenant_name=tenant,
                           auth_url=auth_url)
    except Exception as e:
        logger.error(e.message)
    finally:
        return kt
