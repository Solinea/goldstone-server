# Goldstone Server Hacking Guide


This explains how to install and run Goldstone Server locally (mostly in docker containers), so you can do code development on the project.  The instructions assume a Mac OS X Yosemite development environment with [homebrew](http://brew.sh/) and [Virtualbox](https://www.virtualbox.org/wiki/Downloads) installed.

[TOC]

## Prerequisites

Install various prerequisite packages:

    $ brew update
    $ brew doctor # (Resolve any any errors or warnings)
    $ brew install python
    $ brew install git
    $ brew install boot2docker
    $ brew install docker-compose
    $ brew install postgres
    $ brew install pyenv-virtualenvwrapper
    $ boot2docker init

You must have Python 2, at least at the version 2.7.10.

**_Note: the postgres server does not need to be started.  It is installed in order to support some of the Goldstone dependencies._**


## Fork and Clone Goldstone Repos

Depending on your contributor status (core or community), you will either create forks of the [goldstone-server](https://github.com/Solinea/goldstone-server) and [goldstone-docker](https://github.com/Solinea/goldstone-docker) Github repositories, or you will be working on on branches from the main repos.

The commands given below are for use by core contributors. If you are a community contributor, your first step will be to [fork the repositories](https://help.github.com/articles/fork-a-repo/). You will also substitute your own github user id for "Solinea" in the following clone commands.

    $ mkdir ~/devel
    $ cd ~/devel
    $ git clone https://github.com/Solinea/goldstone-server.git



## Configure a Goldstone virtualenv

Execute the following script to complete the virtualenv wrapper package setup (note that the version in the path may be different):


     $ /usr/local/Cellar/pyenv-virtualenvwrapper/20140609/bin/pyenv-sh-virtualenvwrapper


Add the following lines to your shell startup script (`.bashrc`, `.zshrc`, etc.):

    $ export VIRTUALENVWRAPPER_PYTHON=/usr/local/bin/python
    $ export VIRTUALENVWRAPPER_VIRTUALENV=/usr/local/bin/virtualenv
    $ export WORKON_HOME=$HOME/.virtualenvs
    $ export PROJECT_HOME=$HOME/devel
    $ source /usr/local/bin/virtualenvwrapper.sh

   Open a new terminal window and confirm that these environment variables have been set.  Once satisfied, move on to creating the virtualenv:

    $ mkvirtualenv -a $PROJECT_HOME/goldstone-server goldstone-server

   Copy this [postactivate](https://gist.github.com/jxstanford/6ee6cc61143113776d0d) script into your `$WORKON_HOME/goldstone-server/bin` folder, overwriting the original.


## Install the Development OpenStack VM

For convenience, you can [download an OpenStack VM image](https://horizon.hpcloud.com/project/containers/RDO-Images/RDO-kilo.ova/download) with a Kilo version of [RDO](https://www.rdoproject.org/Main_Page).  Once downloaded, import the VM into VirtualBox.


## Configure VirtualBox Networking

The recommended developement environment uses a prebuilt OpenStack image.  This section assumes that the image has been downloaded and imported into VirtualBox. The `configure_vbox.sh` script in `$PROJECT_HOME/goldstone-server/bin` sets up the following aspects of networking:

* Creates a new host-only network
* Ensures that the OpenStack VM has the correct network interfaces
* Creates a DHCP server on the host-only network
* Configures NAT rules for boot2docker VM

If your environment is different than the typical dev environment, you may be able to use the script as a reference or adapt it to your needs.  To execute the changes, run:

    $ $PROJECT_HOME/goldstone-server/bin/configure_vbox.sh

**_Note: configure_vbox.sh accepts --nonetwork, --nostack, and --nodocker flags to skip configuration of those
particular components.  This helps address reconfiguration of specific components (for example, if you have recreated
your boot2docker VM, you could run configure_vbox.sh --nonetwork --nostack.  This would only configure the docker
related NAT rules. _**

## Activate the Virtualenv

Once all of the initial setup has been completed, you can activate the virtualenv by running the workon command.

    $ workon goldstone-server

This command will set your environment to use an isolated python version.  Running `deactivate` will revert to using the system python.  

The first time you enter the virtualenv, you should also install the project requirements, and some additional utilities.

    $ pip install --upgrade pip
    $ pip install -r requirements.txt
    $ pip install -r test-requirements.txt
    $ pip install flower

If the requirements files change, you should rerun the `pip install` commands.

**_Note that the goldstone-server virtualenv is only meant to be run in a single terminal window._**


## Building the Goldstone Containers

All supporting services are available as docker containers.  To build the containers locally, run the following commands:

    $ cd $PROJECT_HOME/goldstone-server/docker
    $ boot2docker up
    $ eval "$(boot2docker shellinit)"
    $ bin/build_containers.sh
    $ boot2docker down

## Initialize Goldstone Server

This step configures the Goldstone Server database, and is the final step before running the application.  It only needs to be done the first time you start Goldstone, and when you change ES or PostgreSQL schema.  You can rerun this step if you want to wipe the database clean; however, it will not remove existing data in PostgreSQL and Elasticsearch.

To initialize Goldstone Server, use the goldstone_init fabric task:

    $ cd $PROJECT_HOME/goldstone-server
    $ ./bin/start_dev_env.sh
    $ fab goldstone_init
    $ fab -f installer-fabfile.py -H 172.24.4.100 configure_stack



### Re-initializing Goldstone Server

If there have been significant data model changes in Goldstone, you may need to drop and recreate the database, then rerun the goldstone_init task.  To do that, execute the following commands while the postgres docker ontainer is running (the password will be the one you provided when running goldstone_init the last time):

    $ cd $PROJECT_HOME/goldstone-server
    $ dropdb -U postgres -h 127.0.0.1 goldstone   # password goldstone
    $ createdb -U postgres -h 127.0.0.1 goldstone   # password goldstone
    $ fab goldstone_init
    $ fab -H 172.24.4.100 configure_stack

If you prefer to configure your own OpenStack, you will need to follow the instructions for configuring OpenStack hosts in the [INSTALL](http://goldstone-server.readthedocs.org/en/latest/INSTALL/) guide.  You should also update your `postactivate` script to use proper values for the `OS_*` settings.

## Starting/Stopping Goldstone Server

There are some convenience scripts in `$PROJECT_HOME/goldstone-server/bin` for starting and stopping the virtual machines and docker containers that support the goldstone test environment.  For developer flexibilty, starting/stopping the django application has been omitted from the scripts.  To start the development environment, execute:

    $ cd $PROJECT_HOME/goldstone-server
    $ ./bin/start_dev_env.sh
    $ fab runserver   # select local_docker settings

To stop the development environment, exit the running server (Ctrl-C), then:

    $ cd $PROJECT_HOME/goldstone-server
    $ ./bin/stop_dev_env.sh


## Verify the Development Environment

To ensure that the installation is working properly, you can run the test suite.  If all goes will complete with a congratulatory message (though you may see some exceptions in the output from individual tests):

    $ cd $PROJECT_HOME/goldstone-server
    $ tox -e py27
    <-- snip -->
    -------------------------------------
    Ran 215 tests in 42.295s
    OK (skipped=11)
    Destroying test database for alias 'default'...
    _____________ summary _______________
    py27: commands succeeded
    congratulations :)

Assuming the testing went well, you're ready to start the application:

    $ cd $PROJECT_HOME/goldstone-server
    $ fab runserver
    [localhost] local: ls goldstone/settings | egrep "production|local_|dev_|test_" | egrep -v "pyc|~"

	choose a settings file to use:
	[0] local_docker.py
	[1] production.py
	Choice (0-1): 1
	[localhost] local: ./manage.py runserver --settings=goldstone.settings.local_docker
	Validating models...

	0 errors found
	June 05, 2015 - 19:01:29
	Django version 1.6.11, using settings 'goldstone.settings.local_docker'
	Starting development server at http://127.0.0.1:8000/
	Quit the server with CONTROL-C.

When startup is complete, you should be able to see the Goldstone application at http://127.0.0.1:8000.  Log in with the credentials you created during initialization.

![enter image description here](https://lh3.googleusercontent.com/p75_NPl7u54OxhqHYhDujVVqzRy7y0k-ZZtsjCYQV3o=w1057-h633-no)


## Testing

### Backend Testing

Goldstone uses the standard Django testing tools:

* [Tox](http://tox.readthedocs.org/en/latest/) for test automation. Goldstone's tox setup tests against Python 2.7 and PEP8 (syntax) by default. Additional jobs for coverage and pyflakes are available.
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

In order for the e2e tests to run, you *must* have the
server running and access to live data.

**In addition, the e2e testing suite is required to log in in order to received
an auth token that is required for successful api calls.**
You will need to enable a login, with tenant admin rights, for
the username/password combo of "gsadmin / solinea".

At the time of this documentation, the Gruntfile.js is configured with the following combo tasks:

    grunt (default task): lint / unit testing (no e2e tests) / watch.
    grunt watch: watch for changes that will trigger unit/integration/e2e tests
    grunt lint: lint only (no watch).
    grunt test: unit/integration/e2e test only (no watch).
    grunt lintAndTest: lint and test only (no watch).

As the JavaScript files are concatenated and read from a common file `bundle.js`,
you will need to make sure the `grunt watch` task is live and running in order
to see changes to JavaScript files reflected in the client.

## Coding Guidelines

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

## Configuring Postfix

If you're not working on or testing the password-reset sequence, you can skip
to the next section.

To test Goldstone's password-reset sequence, you'll need an
[SMTP](https://en.wikipedia.org/wiki/Simple_Mail_Transfer_Protocol) server
running on your development machine.

Since [Postfix](http://www.postfix.org) is nigh-universal, here's how to
configure it to relay outgoing mail to a Gmail account, on OS X.

First, if you're in a virtual ("workon") environment, deactivate it. Then:

```bash
    $ sudo bash
    root# cd /etc/postfix
```

Edit `main.cf`. If any of these variables are already in the file, change them to what's listed here.  Otherwise, add these lines to the end of the file:
```
myhostname = localhost
relayhost = [smtp.gmail.com]:587
smtp_sasl_auth_enable = yes
smtp_sasl_mechanism_filter = plain
smtp_sasl_password_maps = hash:/etc/postfix/sasl_passwd
smtp_sasl_security_options = noanonymous
smtp_tls_CAfile = /etc/postfix/systemdefault.pem
smtp_use_tls = yes
```

Create the file, `/etc/postfix/sasl_passwd`.  Add this line to it, plugging in your e-mail username
and password:
```
[smtp.gmail.com]:587 EMAIL_USERNAME:PASSWORD
```

(For example, your line might read, `[smtp.gmail.com]:587
dirk_diggler@mycompany.com:12344321`.

Then:

```bash
    root# postmap /etc/postfix/sasl_passwd
```

Now put a valid certificate into
`/etc/postfix/systemdefault.pem`. Here's one way to do it:

1. Launch the KeyChain Access application
2. In the sidebar, select "System" and "Certificates"
3. In the main window, select `com.apple.systemdefault`
4. `File | Export Items...`
5. Select "Privacy Enhanced Mail (.pem)" and save it to your Desktop.

Move the file you just saved to `/etc/postfix/systemdefault.pem`.

Then, chown the file so that root owns it:
```bash
    root# chown root /etc/postfix/systemdefault.pem
```

Now start postfix and test it:

```bash
    root# postfix start
    root# echo "Test mail from postfix" | mail -s "Test Postfix" YOU@DOMAIN.TLD
```

If you receive the test email, Postfix is running correctly!

If not, look in `/var/log/mail.log` to start diagnosing what's wrong.

### Starting on a boot

If you want Postfix to always start when you boot your machine, edit
`/System/Library/LaunchDaemons/org.postfix.master.plist`. Insert this text after the `<dict>`:

```
<key>KeepAlive</key>
<dict>
   <key>SuccessfulExit</key>
   <false/>
</dict>
```

Insert this text before the `</dict>`:

```
<key>RunAtLoad</key>
<true/>
```


## Building a Generic Goldstone VM

* work in progress *

Follow instructions in the [INSTALL](http://goldstone-server.readthedocs.org/en/latest/INSTALL/) guide for installing via an RPM inside your VM; however, instead of executing `fab install`, execute:

    root# cd /opt/goldstone
    root# . bin/activate
    root# fab partial_install:django_admin_password=YOUR_PASSWORD

This will deploy Goldstone Server, but will leave the connection to the OpenStack cloud unconfigured.  It can be configured later via the client or the API.

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
