=================
Deploying GoldStone
=================

How to run the tests
====================

Install libraries::

    $ sudo pip install -r requirements.txt

Set SECRET KEY environment variable::

    $ set SECRET_KEY="fsaafkjsdfiojsoivjfvoj"

You can generate strong SECRET_KEYS at http://www.miniwebtool.com/django-secret-key-generator/

Start the server::

    $ python manage.py runserver --settings=goldstone.settings.production

This will be better serverd through a true webserver like Apache.
