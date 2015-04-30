# Goldstone Hacking Guide

This explains how to install and run Goldstone locally, so you can do code development on it.

The recommended steps are:

1. Fork this repository on GitHub.
2. Follow the "Installation" instructions to set up your development environment.
3. Verify that you can build a working Goldstone application before you make any edits!
4. Make your improvements in your fork. Remember to include unit tests, and use tox (with the supplied `tox.ini`) to verify that the codebase still passes pep8, pylint, and all unit tests.
5. Submit a pull request to us. Be sure to include a problem description and an overview of your solution.

Remember that an instance of Goldstone running locally can be used to monitor a
local *or remote* OpenStack installation. The server on which Goldstone runs is
independent from the OpenStack cloud's location.


## Installation

### Preliminaries

If you're doing this on OS X, you need to install these packages:

```bash
# First install Homebrew, per the instructions at http://brew.sh. Then...
$ brew upgrade
$ brew doctor            # Resolve any any errors or warnings before continuing!
$ brew install caskroom/cask/brew-cask
$ brew cask install java
$ brew install python    # This puts a Python interpreter where mkvirtualenv expects it.
```    

### Upgrade or install Pip

If your system already has Pip, upgrade it to a recent version.

If your system doesn't have pip installed, install it:

```bash
$ curl https://bootstrap.pypa.io/get-pip.py > get-pip.py
$ python get-pip.py
```

### Virtualenvwrapper, tox

Create your virtual environment for Goldstone.  [Virtualenvwrapper](http://virtualenvwrapper.readthedocs.org/en/latest/install.html) makes this easy:

```bash
$ pip install virtualenvwrapper
$ pip install tox
```

Add the following or similar to your .bash_profile:

```bash
export ARCHFLAGS=-Wno-error=unused-command-line-argument-hard-error-in-future # for Mavericks
export JAVA_HOME="$(/usr/libexec/java_home)"
export VIRTUALENVWRAPPER_PYTHON=/usr/local/bin/python
export WORKON_HOME=$HOME/.virtualenvs
export PROJECT_HOME=$HOME/devel
source /usr/local/bin/virtualenvwrapper.sh
```

Create the virtual environment (this will also install virtualenv):

```bash
$ mkvirtualenv goldstone
```

Customize your virtualenv postactivate script to make it yours. This is a suggested virtualenv/postactivate:

```bash
#!/bin/bash
cd ~/devel/goldstone
export GOLDSTONE_SECRET="%ic+ao@5xani9s*%o355gv1%!)v1qh-43g24wt9l)gr@mx9#!7"
    

# For example, export DJANGO_SETTINGS_MODULE=goldstone.settings.local_ny_cloud2
export DJANGO_SETTINGS_MODULE=goldstone.settings.local_<datacenter>_<cloud_instance>
    

redis-server > /dev/null 2>&1 &
elasticsearch > /dev/null 2>&1 &
postgres -D /usr/local/var/postgres &
```

This is a suggested virtualenv/deactivate:

```bash
#!/bin/bash


echo "shutting down redis"
pkill -f redis


echo "shutting down elasticsearch"
pkill -f elasticsearch


echo "shutting down postgres"
pkill -f postgres
```

Activating and deactivating the environment can be done with the following commands:

```bash
$ workon goldstone
$ deactivate
```

### Install some packages

Install these packages in your Goldstone virtualenv:

```bash
$ workon goldstone
$ brew install elasticsearch phantomjs redis postgresql
```

### Set up your databases
Create your development and test databases, and create a "goldstone" database user:
    
```bash
$ createdb goldstone_dev
$ createdb goldstone_test
$ createuser goldstone -d
```

Edit your `pg_hba.conf` file.  If you installed with brew, this should be in `/usr/local/var/postgres/`.  See the [INSTALL file](INSTALL.md) for the modifications.

After you've edited pg_hba.conf, reload postgres:

```bash
$ pg_ctl reload
```

If you want remote access to postgres, you will also need to add an entry to
`/etc/sysconfig/iptables` like:

    -A INPUT -p tcp -m state --state NEW -m tcp --dport 5432 -m comment --comment "postgres incoming" -j ACCEPT 

And edit `/usr/local/var/postgres/postgresql.conf` to configure it to listen on 
external addresses::

    listen_address='*'

Then restart iptables:

```bash
$ service iptables restart
```

### Get the code

1. On GitHub, fork the Goldstone repository.
2. Clone your fork to your local machine:
   
```bash
    $ cd $PROJECT_HOME
    $ git clone <your clone URL>
```

Then pip-install the Python prerequisites:

```bash
    $ workon goldstone
    $ cd goldstone              # If your postactivate script doesn't have a cd
    $ pip install -r requirements.txt
    $ pip install -r test-requirements.txt
```


### Initialize Goldstone and login!

Sync and initialize the database, and initialize Elasticsearch's templates. You'll have to answer some account questions.  After that, run Django's development server:

```bash
$ fab -f installer_fabfile.py goldstone_init
$ fab runserver
```

You should now see the application running at [http://localhost:8000](http://localhost:8000). Django's admin interface will be at [http://localhost:8000/admin](http://localhost:8000/admin). You can login with your "superuser" account.

***Congratulations!***



## Testing

Goldstone uses the standard Django testing tools:

* [Tox](http://tox.readthedocs.org/en/latest/) for test automation. Goldstone's tox setup tests against Python 2.6, Python 2.7 and PEP8 (syntax) by default. Additional jobs for coverage and pyflakes are available.
* [Django TestCase](https://docs.djangoproject.com/en/1.8/topics/testing/tools/#testcase) for unit testing.

Code coverage reports can be created through the `tox -e cover` command:

```bash
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
```


### Front-end testing

This information assumes you already have node/npm installed.
At the time of this documentation, the testing environment was compatible with phantomjs 1.9.7.:

```bash
$ npm install -g grunt-cli
$ npm install
$ grunt
```

In order for the e2e tests to run, you *must* have the server running and access to live data.

At the time of this documentation, the Gruntfile.js is configured with the following combo tasks:
  
    grunt (default task): lint / test / watch.
    grunt watch: watch for changes that will trigger unit/integration/e2e tests
    grunt lint: lint only (no watch).
    grunt test: unit/integration/e2e test only (no watch).
    grunt lintAndTest: lint and test only (no watch).
    grunt testDev: lint, followed by unit/integration test (no e2e) and watch that only triggers further unit/integration tests, no e2e tests.


## Coding guidelines

### Python code

We rely on pep8 and pylint to help ensure the consistency and integrity of the codebase.

Please follow the generally accepted practices, based on these style guidelines:

* [PEP 8](https://www.python.org/dev/peps/pep-0008/) - Style Guide
* [PEP 257](https://www.python.org/dev/peps/pep-0257/) - Docstring conventions
* [Openstack Style Guidelines](http://docs.openstack.org/developer/hacking/) - Where they are possible and applicable.

To test that your code conforms to this project's standards:

```bash
$ tox -e checkin
$ fab test
```

### JavaScript code

TBD

## Major Design Decisions

* The client code supplied with Goldstone may be used in production, or it may be used as a reference design for your own custom client. Goldstone has been designed to be used through its API without using Django's authentication or view+template subsystems.
* Goldstone is currently based on the 1.6 version of [Django](http://www.djangoproject.com).
* Goldstone uses [PostgreSQL](http://www.postgresql.org) for its main database.
* For database and model migrations, Goldstone uses South.
* [Celery](http://www.celeryproject.org) is used for asynchronous tasks.
* The PBR library (created by the OpenStack project) is used for sane and simple setup.py, versioning and setup.cfg values.
* Goldstone has additional developer tasks augmented by the django_extensions library.
* The supplied client uses:
    * [Twitter Bootstrap 3](http://getbootstrap.com)
    * [Backbone](http://backbonejs.org)
    * [jQuery](http://jquery.com)
    * [D3](http://d3js.org), to provide nearly unlimited freedom to visually express data
    * [Font Awesome](http://fontawesome.io)

## License

This work is licensed under a [Creative Commons Attribution-ShareAlike 4.0 International License](http://creativecommons.org/licenses/by-sa/4.0/).

* [Read the license's summary](http://creativecommons.org/licenses/by-sa/4.0/)
* [Read the license's full legal text](http://creativecommons.org/licenses/by-sa/4.0/legalcode)
