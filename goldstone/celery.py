from __future__ import absolute_import

from celery import Celery
from django.conf import settings


app = Celery('goldstone')
app.config_from_object('django.conf:settings')
app.autodiscover_tasks(lambda: settings.INSTALLED_APPS)


@app.task(bind=True)
def debug_task(self):
    print('Request: {0!r}'.format(self.request))


@app.task(bind=True)
def debug_task_example(self):
    print(repr(self.request))
