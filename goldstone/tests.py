from djangojs.runners import JsTestCase, JsFileTestCase, JsTemplateTestCase
from djangojs.runners import JasmineSuite, QUnitSuite


class QUnitTests(QUnitSuite, JsTestCase):
    title = 'My QUnit suite'
    url_name = 'my_qunit_view'
    js_files = [
        'intelligence/static/intelligence/js/*',
    ]
