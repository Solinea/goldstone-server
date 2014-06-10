Copyright 2014 Solinea, Inc.

Licensed under the Solinea Software License Agreement (goldstone),
Version 1.0 (the "License"); you may not use this file except in compliance
with the License. You may obtain a copy of the License at:

    http://www.solinea.com/goldstone/LICENSE.pdf

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

Author: Ken Pepple

=============================
Goldstone
=============================


Initial Setup
*************

Create your virtual environment for goldstone. Virtualenvwrapper makes this easy
(see http://virtualenvwrapper.readthedocs.org/en/latest/install.html)::

    $ pip install virtualenvwrapper
    $ pip install tox

Add the following or similar to your .bash_profile::

    export ARCHFLAGS=-Wno-error=unused-command-line-argument-hard-error-in-future # for Mavericks
    export JAVA_HOME="$(/usr/libexec/java_home)"
    export VIRTUALENVWRAPPER_PYTHON=/usr/local/bin/python
    export WORKON_HOME=$HOME/.virtualenvs
    export PROJECT_HOME=$HOME/devel
    source /usr/local/bin/virtualenvwrapper.sh

Create the virtual environment (this will also install virtualenv)::

    $ mkvirtualenv goldstone

**OPTIONAL**: Customize your virtualenv postactive script to make it yours. I use the following commands in my virtualenv::

    #!/bin/bash    
    cd ~/devel/goldstone

    export GOLDSTONE_SECRET="%ic+ao@5xani9s*%o355gv1%!)v1qh-43g24wt9l)gr@mx9#!7"
    export DJANGO_SETTINGS_MODULE=goldstone.settings.development    

    postgres -D /usr/local/var/postgres &
    redis-server > /dev/null 2>&1 &
    elasticsearch > /dev/null 2>&1 &
    celery worker --app=goldstone --loglevel=info --beat > /dev/null 2>&1 &


This changes to my goldstone development git directory and sets my default django setting module so that I don't have to include it on the command line every time.  It also starts all of the required software (which we will install in a minute).

Activating and deactivating the environment can be done with the following commands::

    $ workon goldstone
    $ deactivate

Install postgresql and create development and test databases. Create a user goldstone with the role goldstone (or edit your development.py setttings file)::

    $ brew install postgres  # for the mac, assuming you have brew installed
    $ pg_ctl -D /usr/local/var/postgres -l /usr/local/var/postgres/server.log start
    $ createdb goldstone_dev
    $ createdb goldstone
    $ createuser goldstone -d
    $ brew install elasticsearch 
    $ brew install redis 

Clone Goldstone from the bitbucket repo::

    $ cd $PROJECT_HOME
    $ git clone git@bitbucket.org:solinea/goldstone.git

Now, install pip prerequesites into your shiny new virtualenv. This will let your run the application on your laptop::

    $ cd goldstone
    $ pip install -r requirements.txt
    $ pip install -r test_requirements.txt

Make sure your default settings are exported::

    $ export DJANGO_SETTINGS_MODULE=goldstone.settings.development

Sync and migrate the databases::

    $ python ./manage.py syncdb  # Answer 'no' to create superuser
    $ python ./manage.py migrate

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
