Design Decisions
================

* Django
* Tasks
* User Experience


Django
******

Goldstone has chosen to use the newest stable versions of Django and related libraries at the time of creations (December 2013).

* Goldstone is based on the 1.6 version of `Django`_.
* For database and model migrations, Goldstone uses `South`_.
* Goldstone has chosen Postgresql as its main database, however MySQL will also be tested against.
* The PBR library (created by the OpenStack project) is used for sane and simple setup.py, versioning and setup.cfg values. 
* Goldstone has additional developer tasks augemented by the django_extensions library.


Tasks
*****

Goldstone has a large number of asynchronous tasks that need to be executed.

* `Celery`_ and django-celery is used for asyncronous tasks.
* All OpenStack actions except informational queries are async tasks
* Goldstone uses Redis and the Django database for 

User Experience
***************

* The `Twitter Bootstrap 3`_ framework is used for UX. 
* This also means that `jQuery`_ and `jQuery-UI`_ are used.
* `Font Awesome`_ has been used for icons instead of the standard icons.

.. _Django: http://www.django.com
.. _South: http:www.FIXME.com
.. _Celery: http://www.FIXME.com
.. _`Twitter Bootstrap 3`: http://www.FIXME.com
.. _jQuery: http://www.FIXME.com
.. _jQuery-UI: http://www.FIXME.com
.. _`Font Awesome`: http://www.FIXME.com
