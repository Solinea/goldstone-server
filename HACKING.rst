GOLDSTONE HACKING GUIDE
========================



Major Design Decisions
**********************

* Goldstone is current based on the 1.6 version of `Django`_.
* For database and model migrations, Goldstone uses `South`_.
* Goldstone has chosen Postgresql as its main database, however MySQL will also be tested against.
* The PBR library (created by the OpenStack project) is used for sane and simple setup.py, versioning and setup.cfg values. 
* `Celery`_ and django-celery is used for asyncronous tasks.
* Goldstone has additional developer tasks augemented by the django_extensions library.
* The `Twitter Bootstrap 3`_ framework is used for UX. This also means that `jQuery`_ and `jQuery-UI`_ are used in the UX. `Font Awesome`_ has been used for icons instead of the standard icons.


.. _Django: http://www.django.com
.. _South: http:www.FIXME.com
.. _Celery: http://www.FIXME.com
.. _`Twitter Bootstrap 3`: http://www.FIXME.com
.. _jQuery: http://www.FIXME.com
.. _jQuery-UI: http://www.FIXME.com
.. _`Font Awesome`: http://www.FIXME.com



GoldStone Style Commandments
****************************

In general, we follow the `OpenStack style conventions`_ where they are possible and applicable. 

.. _OpenStack style conventions: http://docs.openstack.org/developer/hacking/
