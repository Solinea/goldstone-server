# from __future__ import absolute_import
# 
# from celery import Celery
# from django.conf import settings
# 
# os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'conf.settings')
# 
# app = Celery('goldstone.apps.lease.celery', broker = 'redis://localhost:6379/0',)
# app.config_from_object('django.conf:settings')
# app.autodiscover_tasks(settings.INSTALLED_APPS, related_name='tasks')
# 
# 
# @app.task(bind=True)
# def debug_task(self):
#     print('Request: {0!r}'.format(self.request))
