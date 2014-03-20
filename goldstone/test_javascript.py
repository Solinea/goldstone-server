from djangojs.runners import JsTestCase
from djangojs.runners import QUnitSuite


class QUnitTests(QUnitSuite, JsTestCase):
    title = 'My QUnit suite'
    url_name = 'my_qunit_view'
    js_files = [
        'intelligence/static/intelligence/js/*',
    ]
