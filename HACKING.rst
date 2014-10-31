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

GOLDSTONE HACKING GUIDE
========================


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
    export DJANGO_SETTINGS_MODULE=goldstone.settings.local_dev

    mysql.server start
    redis-server > /dev/null 2>&1 &
    elasticsearch > /dev/null 2>&1 &
    celery worker --app=goldstone --loglevel=info --beat > /dev/null 2>&1 &


This changes to my goldstone development git directory and sets my default django setting module so that I don't have to include it on the command line every time.  It also starts all of the required software (which we will install in a minute).

Activating and deactivating the environment can be done with the following commands::

    $ workon goldstone
    $ deactivate

Install mysql and create development and test databases. Create a user goldstone with the role goldstone (or edit your development.py settings file)::

    $ brew install elasticsearch
    $ brew install redis
    $ brew install phantomjs
    $ brew install mysql  # for the mac, assuming you have brew installed
    $ mysqladmin  -u root -p create goldstone_dev
    $ mysqladmin  -u root -p create goldstone_test
    $ mysqladmin  -u root -p create goldstone
    $ mysql -u root
        > connect goldstone_test
        > CREATE USER 'goldstone'@'localhost' IDENTIFIED BY 'goldstone';
        > GRANT ALL PRIVILEGES ON * . * TO 'goldstone'@'localhost';
        > FLUSH PRIVILEGES;

If you want to have remote access to mysql, you can do something like this:

    $ mysql -uroot -pgoldstone -e "GRANT ALL PRIVILEGES ON goldstone.* \
      TO goldstone@'%' IDENTIFIED BY 'goldstone'"
    $ mysql -uroot -pgoldstone -e "FLUSH PRIVILEGES"
    $ service mysqld restart
    # don't forget to allow access to port 3306 via iptables.

Clone Goldstone from the bitbucket repo::

    $ cd $PROJECT_HOME
    $ git clone git@bitbucket.org:solinea/goldstone.git

Now, install pip prerequesites into your shiny new virtualenv. This will let your run the application on your laptop::

    $ cd goldstone
    $ pip install -r requirements.txt
    $ pip install -r test_requirements.txt

Get the local settings and put them in place::

    $ git submodule init
    $ git submodule update
    $ cp solinea_settings/* goldstone/settings

Make sure your default settings are exported::

    $ export DJANGO_SETTINGS_MODULE=goldstone.settings.local_dev

Sync and migrate the databases::

    $ python ./manage.py syncdb  # Answer 'no' to create superuser
    $ python ./manage.py migrate

Set up the elasticsearch templates::

    $ python manage.py shell <<EOF
    from goldstone.apps.core.tasks import _put_all_templates, _create_daily_index, _create_agent_index
   _put_all_templates()
   _create_daily_index()
   _create_agent_index()
   EOF

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
    cover runtests: commands[0] | coverage run --source=./goldstone manage.py test goldstone --settings=goldstone.settings.local_test
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




Front-end testing
*****************

This information assumes you already have node/npm installed.
It also assumes you already have phantomjs installed via previous steps in the HACKING.rst file. If not, install it via homebrew. At the time of this documentation, the testing environment was compatible with phantomjs 1.9.7

$ npm install -g grunt-cli
$ npm install
$ grunt
This will kick off the preliminary lint/test/watch routine.

In order for the e2e tests to run, you MUST have the server running and access to live data.

At the time of this documentation, the Gruntfile.js is configured with the following combo tasks:
grunt (default task): lint / test / watch.
grunt lint: lint only (no watch).
grunt test: test only (no watch).
grunt lintAndTest: lint and test only (no watch).



Documentation
=============

To create the product documentation:

* cd to doc directory - $ cd doc
* install sphinx - $ sudo pip install sphinx
* make the documentation - $ make html

The documentation will be in the doc/build/html directory

Creating Release
****************

To create a release, follow these steps:

# Bump the version number in the setup.cfg file (if not done already)
# Tag and sign the commit ($ git tag -s 1.0 -m 'first customer ship') -- PBR requires SIGNED tags to correctly build the version number into the RPM.
# Push the tags to bitbucket ($ git push origin 1.0)
# Create the RPM (on CentOS/Red Hat machine with # python setup.py bdist_rpm)
# SCP the RPM to the repo (# scp dist/goldstone-1.0-1.noarch.rpm repo.solinea.com:/var/www/html/repo/)
# Update the repo (on repo.solinea.com, run # createrepo /var/www/html/repo/)
# Have a drink at Eureka and wait for the bitching


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
