=============================
Goldstone
=============================


Initial Setup
*************

Create your virtual environment for goldstone. Virtualenvwrapper makes this easy::

$ pip install virtualenvwrapper
$ mkvirtualenv goldstone

This will also install virtualenv.

**OPTIONAL**: Customize your virtualenv postactive script to make it yours. I use the following commands in my virtualenv::

    #!/bin/bash    
    cd /Users/kpepple/Documents/dev/Solinea/goldstone-ui
    export DJANGO_SETTINGS_MODULE=goldstone.settings.development

This changes to my goldstone development git directory and sets my default django setting module so that I don't have to include it on the command line every time.

Install postgresql and create development and test databases. Create a user goldstone with the role goldstone (or edit your development.py setttings file)::

$ brew install postgres  # for the mac, assuming you have brew installed
$ pg_ctl -D /usr/local/var/postgres -l /usr/local/var/postgres/server.log start
$ createdb goldstone-dev
$ createuser goldstone

Now, install pip prerequesites into your shiny new virtualenv. This will let your run the application on your laptop::

$ pip install -r requirements.txt
$ pip install -r test_requirements.txt

Clone Goldstone from the 'Stash repo::

$ git clone ssh://git@dev.solinea.com:7999/gold/goldstone-ui.git

Make sure your default settings are exported::

$ export DJANGO_SETTINGS_MODULE=goldstone.settings.development

Sync and migrate the databases::

$ python ./manage.py syncdb
$ python ./manage.py migrate

RabbitMQ should be configured to support celery tasks.  For the brew install, ensure that /usr/local/sbin is in your PATH:

$ brew install rabbitmq
$ rabbitmq-server

Elasticsearch must also be configured.  You can set up a local version (see below), or refer to the one in the lab.  Instructions for local setup are below::

$ brew install elasticsearch # for the mac, assuming you have brew installed
$ elasticsearch
$ (cd ./test_data; python ./bulk_import_es.py)

If running locally, you should also update ./goldstone/settings/development.py and set:

ES_SERVER = "127.0.0.1:9200"

Now test out the server::

$ python ./manage.py runserver

You should now see the application running at http://localhost:8000/


Goldstone Testing
*****************

Goldstone use the standard Django testing tools:

* Tox for test automation. Goldstone's tox setup tests against Python 2.6, Python 2.7 and PEP8 (syntax) by default. Additional jobs for coverage and pyflakes are available.
* Django TestCase and selenium are used for unit and functional testing respectively.

Goldstone strives for 100% code coverage. Code coverage reports can be created through the `tox -e cover` command::

    $ tox -e cover
    GLOB sdist-make: /Users/kpepple/Documents/dev/Solinea/goldstone-ui/setup.py
    cover inst-nodeps: /Users/kpepple/Documents/dev/Solinea/goldstone-ui/.tox/dist/goldstone-ui-2014.1.dev56.g0558e73.zip
    cover runtests: commands[0] | coverage run --source=./goldstone manage.py test goldstone --settings=goldstone.settings.test
    Creating test database for alias 'default'...
    .........
    ----------------------------------------------------------------------
    Ran 9 tests in 0.074s

    OK
    Destroying test database for alias 'default'...
    cover runtests: commands[1] | coverage xml
    cover runtests: commands[2] | coverage report
    Name                                           Stmts   Miss  Cover
    ------------------------------------------------------------------
    goldstone/__init__                                 0      0   100%
    goldstone/apps/__init__                            0      0   100%
    goldstone/apps/lease/__init__                      0      0   100%
    goldstone/apps/lease/admin                         1      0   100%
    goldstone/apps/lease/celery                        3      3     0%
    goldstone/apps/lease/migrations/0001_initial      18      3    83%
    goldstone/apps/lease/migrations/__init__           0      0   100%
    goldstone/apps/lease/models                       34      3    91%
    goldstone/apps/lease/tasks                        21     21     0%
    goldstone/apps/lease/tests                        77      0   100%
    goldstone/apps/lease/tests_celery                 10      0   100%
    goldstone/apps/lease/views                         7      4    43%
    goldstone/libs/__init__                            0      0   100%
    goldstone/settings                                 0      0   100%
    goldstone/settings/__init__                        0      0   100%
    goldstone/settings/base                           24      3    88%
    goldstone/settings/development                     7      7     0%
    goldstone/settings/production                      1      1     0%
    goldstone/settings/stage                           1      1     0%
    goldstone/settings/test                            2      0   100%
    goldstone/urls                                     4      0   100%
    goldstone/wsgi                                     4      4     0%
    ------------------------------------------------------------------
    TOTAL                                            214     50    77%
    _______________________________________ summary ___________________
    cover: commands succeeded
    congratulations :)



Documentation
=============

To create the product documentation:

* cd to doc directory - $ cd doc
* install sphinx - $ sudo pip install sphinx
* make the documentation - $ make html

The documentation will be in the doc/build/html directory

Libraries
=========

This project uses the following libraries:

* jQuery-Timepicker-Addon (https://github.com/trentrichardson/jQuery-Timepicker-Addon) by Trent Richardson (MIT license)
* jQuery and jQuery-UI
* Django
