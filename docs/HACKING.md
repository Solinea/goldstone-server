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
    $ brew install pyenv-virtualenvwrapper
    $ boot2docker init

## Fork and Clone Goldstone Repos

Depending on your contributor status (core or community), you will either create forks of the [goldstone-server](https://github.com/Solinea/goldstone-server) and [goldstone-docker](https://github.com/Solinea/goldstone-docker) Github repositories, or you will be working on on branches from the main repos.

The commands given below are for use by core contributors. If you are a community contributor, your first step will be to [fork the repositories](https://help.github.com/articles/fork-a-repo/). You will also substitute your own github user id for "Solinea" in the following clone commands.   

    $ mkdir ~/devel
    $ cd ~/devel
    $ git clone git@github.com:Solinea/goldstone-docker.git
    $ git clone git@github.com:Solinea/goldstone-server.git



## Configure a Goldstone virtualenv

Add the following lines to your shell startup script (`.bashrc`, `.zshrc`, etc.):

    export VIRTUALENVWRAPPER_PYTHON=/usr/local/bin/python
    export VIRTUALENVWRAPPER_VIRTUALENV=/usr/local/bin/virtualenv
    export WORKON_HOME=$HOME/.virtualenvs
    export PROJECT_HOME=$HOME/devel
    source /usr/local/bin/virtualenvwrapper.sh

   Open a new terminal window and confirm that these environment variables have been set.  Once satisfied, move on to creating the virtualenv:

    $ mkvirtualenv -a $PROJECT_HOME/goldstone-server goldstone-server
    
   Copy these [postactivate](https://gist.githubusercontent.com/jxstanford/6ee6cc61143113776d0d/raw/3a8a3a8d4068057246c36bdd00bbd2977cb1c0ec/postactivate) and [postdeactivate](https://gist.githubusercontent.com/jxstanford/b73a3cc004c26af496f8/raw/62c5c5c5e16a8402682e70bb327f627775cb819b/postdeactivate) scripts into your  `$WORKON_HOME/goldstone-server/bin`. 

## Configure VirtualBox Networking

This section assumes you will be using the pre-built RDO image with an IP address of 172.24.4.100.  If you are using a different image, you may need to adjust the network configuration to match your VM definition.

In order to operate with the downloaded RDO image, you may need to make a change to the definition of the vboxnet0 host-only network.  Open the VirtualBox app and navigate to the  "Host-only Networks" panel of the "Network" section of the "Preferences" menu item.

![enter image description here](https://lh3.googleusercontent.com/gV6Kh5tnOw1LKFReNVfyxkDp7uwvuG3RgFWn9fqLey8=w934-h634-no)

Edit the vboxnet0 entry and set the IP address to 172.24.4.1 and the netmask to 255.255.255.0.

![enter image description here](https://lh3.googleusercontent.com/fDkZKCZbOS4XIfB2UHktErbpVRjPRf55Li-UmLj5WP4=w973-h634-no)

## Set Up an OpenStack VM

For convenience, you can download a VM image **[TODO add link when available]** with a Kilo version of [RDO](https://www.rdoproject.org/Main_Page), preconfigured for use with Goldstone Server.  Once downloaded, import the VM into VirtualBox.

If you prefer to configure your own OpenStack, you will need to follow the instructions for configuring OpenStack hosts in the [INSTALL](http://goldstone-server.readthedocs.org/en/latest/INSTALL/) guide.  You should also update your `postactivate` script to use proper values for the `OS_*` settings.

## Configure boot2docker VM Port Forwarding

This section assumes you are using the pre-build RDO image with an IP address of 172.24.4.100.  If you are using a different image, you may need to adjust the source IP address to match your VM.

Execute these commands in your terminal window. Change "boot2docker-vm" to the name of your boot2docker virtual machine, if it's something different:

```
VBoxManage modifyvm "boot2docker-vm" --natpf1 "es_9200_RDO,tcp,172.24.4.1,9200,,9200"
VBoxManage modifyvm "boot2docker-vm" --natpf1 "es_9200_local,tcp,,9200,,9200"
VBoxManage modifyvm "boot2docker-vm" --natpf1 "es_9300_RDO,tcp,172.24.4.1,9300,,9300"
VBoxManage modifyvm "boot2docker-vm" --natpf1 "es_9300_local,tcp,,9300,,9300"
VBoxManage modifyvm "boot2docker-vm" --natpf1 "logstash_syslog_RDO,tcp,172.24.4.1,5514,,5514"
VBoxManage modifyvm "boot2docker-vm" --natpf1 "logstash_syslog_local,tcp,,5514,,5514"
VBoxManage modifyvm "boot2docker-vm" --natpf1 "logstash_metrics_RDO,tcp,172.24.4.1,5516,,5516"
VBoxManage modifyvm "boot2docker-vm" --natpf1 "logstash_metrics_local,tcp,,5516,,5516"
VBoxManage modifyvm "boot2docker-vm" --natpf1 "postgres_RDO,tcp,172.24.4.1,5432,,5432"
VBoxManage modifyvm "boot2docker-vm" --natpf1 "postgres_local,tcp,,5432,,5432"
VBoxManage modifyvm "boot2docker-vm" --natpf1 "redis_local,tcp,,6379,,6379"
```

To verify that port forwarding has been correctly configured, go to boot2docker-vm's Network settings, expand the "Advanced" section, and click on the "Port Forwarding" button.  It should
look like this:

![enter image description here](https://lh3.googleusercontent.com/Hy1sDfWbYbLvhJjZa7kNSXXImGtri7zIlwPEazNwk3s=w797-h634-no)

## Activate the Virtualenv 

Once all of the initial setup has been completed, you can activate the virtualenv by running the workon command. 

    $ workon goldstone-server

This command will start the required VMs, docker containers, and celery processes.  Running `deactivate` will stop everything.  

The first time you enter the virtualenv, you should also install the project requirements, and some additional utilities.

    $ pip install --upgrade pip
    $ pip install -r requirements.txt
    $ pip install -r test-requirements.txt
    $ pip install flower

If the requirements files change, you should rerun the `pip install` commands.

**_Note that the goldstone-server virtualenv is only meant to be run in a single terminal window._**

## Initialize Goldstone Server

This step configures the Goldstone Server database, and is the final step before running the application.  You can rerun this step if you want to wipe the database clean; however, it will not remove existing data in Elasticsearch. 

To initialize Goldstone Server, use the goldstone_init fabric task:

    $ cd $PROJECT_HOME/goldstone-server
    $ fab goldstone_init

You will be prompted for the settings to use (select local_docker), passwords for the Django admin and goldstone user, and your OpenStack cloud settings. 

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

In order for the e2e tests to run, you *must* have the
server running and access to live data.

**In addition, the e2e testing suite is required to log in in order to received
an auth token that is required for successful api calls.**
You will need to enable a login, with tenant admin rights, for
the username/password combo of "gsadmin / solinea".

At the time of this documentation, the Gruntfile.js is configured with the following combo tasks:

    grunt (default task): lint / test / watch.
    grunt watch: watch for changes that will trigger unit/integration/e2e tests
    grunt lint: lint only (no watch).
    grunt test: unit/integration/e2e test only (no watch).
    grunt lintAndTest: lint and test only (no watch).
    grunt testDev: lint, followed by unit/integration test (no e2e) and watch that only triggers further unit/integration tests, no e2e tests.

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
