# Goldstone Server Hacking Guide


This explains how to install and run Goldstone Server locally, so you can do code development on the project.  These instructions are written for a Mac OS X Yosemite development.

## Prerequisites

Install [Docker Toolbox](https://github.com/docker/toolbox/releases). 

**_Note: there is an issue with release 1.8.2a of Docker Toolbox, but earlier versions work_**

Using brew, install various prerequisite packages:

    $ brew update
    $ brew doctor # (Resolve any any errors or warnings)
    $ brew install python # (python 2.7.9 is the version used in the app container)
    $ brew install git
    $ brew install pyenv-virtualenvwrapper


**_Note: if you have manually installed Docker Machine and Docker Compose, make sure your Docker Machine VM name is 'default' in order to be compatible with the supporting scripts._**


## Fork and Clone Goldstone Repo

Depending on your contributor status (core or community), you will either create a fork of the [goldstone-server](https://github.com/Solinea/goldstone-server) Github repositories, or you will be working on branches from the main repo.

The commands given below are for use by core contributors. If you are a community contributor, your first step will be to [fork the repository](https://help.github.com/articles/fork-a-repo/). You will also substitute your own github user id for "Solinea" in the following clone command.

    $ mkdir ~/devel
    $ cd ~/devel
    $ git clone git@github.com:Solinea/goldstone-server.git

If you install in a location other than `~/devel/goldstone-server`, you will need to set the `GS_PROJ_TOP_DIR` environment variable to the directory containing the source.

## Configure a Goldstone virtualenv

Execute the following script to complete the virtualenv wrapper package setup (note that the version in the path may be different):


     $ /usr/local/Cellar/pyenv-virtualenvwrapper/20140609/bin/pyenv-sh-virtualenvwrapper


Add the following lines to your shell startup script (`.bashrc`, `.zshrc`, etc.):

    export VIRTUALENVWRAPPER_PYTHON=/usr/local/bin/python
    export VIRTUALENVWRAPPER_VIRTUALENV=/usr/local/bin/virtualenv
    export WORKON_HOME=$HOME/.virtualenvs
    export PROJECT_HOME=$HOME/devel
    source /usr/local/bin/virtualenvwrapper.sh

Open a new terminal window and confirm that these environment variables have been set.  Once satisfied, move on to creating the virtualenv:

    $ mkvirtualenv -a $PROJECT_HOME/goldstone-server goldstone-server

Copy this [postactivate](https://gist.github.com/jxstanford/6ee6cc61143113776d0d#file-postactivate) script into your `$WORKON_HOME/goldstone-server/bin` folder, overwriting the original. Then:

    $ workon goldstone-server
    $ pip install -r requirements.txt
    $ pip install -r test-requirements.txt


## Install the Development OpenStack VM

Though Goldstone is intended to work with any supported cloud, it is suggested that you use [this VM with RDO Kilo installed](https://a248.e.akamai.net/cdn.hpcloudsvc.com/he27fba417855517f7da9656d4eedbfdc/prodaw2//RDO-kilo-20150902.ova) Once the download has completed, import the VM into VirtualBox by double-clicking on the downloaded file.

## Configure VirtualBox Networking

The recommended development environment uses a prebuilt OpenStack image.  This section assumes that the image has been downloaded and imported into VirtualBox. The `configure_vbox.sh` script in `$PROJECT_HOME/goldstone-server/bin` sets up the following aspects of networking:

* Creates a new host-only network for OpenStack
* Ensures that the OpenStack VM has the correct network interfaces
* Creates a DHCP server on the host-only network
* Configures NAT rules for docker VM

If your environment is different than the typical dev environment, you may be able to use the script as a reference or adapt it to your needs.  To execute the changes, run:

    $ cd ~/devel/goldstone-server
    $ bin/stop_dev_env.sh
    $ bin/configure_vbox.sh

**_Note: configure_vbox.sh accepts --no-stack, and --no-docker flags to skip configuration of those particular components.  This helps address reconfiguration of specific components (for example, if you have recreated your docker VM, you could run `configure_vbox.sh --no-stack`.  This would only configure the docker
related NAT rules._**


## Starting Goldstone Server

To start the development environment, execute:

    $ cd ~/devel/goldstone-server
    $ ./bin/start_dev_env.sh

The first time you start Goldstone Server, it will probably take several minutes to download docker containers and perform configuration tasks.  You may see errors and missing data in the user interface. You may also see failures if you execute the test suite.  The data should be sufficiently populated in 10 minutes.  If you continue to see errors in the UI or in tests, [please submit an issue!](https://github.com/Solinea/goldstone-server/issues)

All output (database, search, task, app server, etc.) will be logged to the terminal window that you called start_dev_env.sh.  If you would like to send the output to a file, you could either:

    $ ./bin/start_dev_env.sh | tee /tmp/goldstone.log  # sends output to console and file

or:
   
    $ ./bin/start_dev_env.sh > /tmp/goldstone.log 2>&1  # sends output only to file


## Stopping Goldstone Server

To stop the development environment, either:

* `<Ctrl-C>` from the window running `start_dev_env.sh`; or
* run `stop_dev_env.sh` from another window. 
 
This will stop both the docker VM and the OpenStack VM.


## Configuring OpenStack Instance

Execute the following commands to configure the development OpenStack instance to ship logs and events back to Goldstone.  This only needs to be performed once:

    $ cd ~/devel/goldstone-server
    $ ./bin/start_dev_env.sh

Then in another window:

    $ eval $(docker-machine env default)
    $ ./bin/configure_stack.sh


It may be helpful to create a couple of instances via the API in order to generate some log, event, and metric activity.  You can execute the following commands to create a small instance:

    $ eval $(docker-machine env default)
    $ docker exec -i -t goldstoneserver_gsappdev_1 bash -i -c 'nova boot --image cirros --flavor m1.tiny ceilo0'

Here are some [screenshots](https://photos.google.com/album/AF1QipPsFIXlFUzuJflAowyshNoDtF3ph9hMAIdK4WGa) of a working dev environment. Your environment should look similar.


## Logging In

After the containers have started and OpenStack has been configured to interact with Goldstone, you can access the user interface with the following information:

* url: **http://127.0.0.1:8000**
* django admin username: **admin**
* django admin password: **goldstone**
* Goldstone admin username: **gsadmin**
* Goldstone admin password: **goldstone**


## Testing

### Backend Testing

Goldstone uses standard Django testing tools:

* [Tox](http://tox.readthedocs.org/en/latest/) for test automation. Goldstone's tox setup tests against Python 2.7, PEP8, and pylint by default.  There is also an additional `coverage` target available to evaluate code coverage.
* [Django TestCase](https://docs.djangoproject.com/en/1.8/topics/testing/tools/#testcase) for unit testing.

With the development environment started, execute the following commands in another window:

    $ workon goldstone-server
    $ cd ~/devel/goldstone-server
    $ tox
    <-- snip -->
    -------------------------------------
    Ran 215 tests in 42.295s
    OK (skipped=11)
    Destroying test database for alias 'default'...
    _____________ summary _______________
    py27: commands succeeded
    congratulations :)

To generate a coverage report:

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


### Front-end testing

This information assumes you already have node/npm installed.  With the development environment started in another window, execute:

    $ npm install -g grunt-cli
    $ npm install
    $ grunt

**_Note: The end to end testing requires an auth token, and currently assumes that you have a a `gsadmin` user with the password `goldstone`._**

The Gruntfile.js is configured with the following combo tasks:

* grunt (default task): lint / unit testing (no e2e tests) / watch.
* grunt watch: watch for changes that will trigger unit/integration/e2e tests
* grunt lint: lint only (no watch).
* grunt test: unit/integration/e2e test only (no watch).
* grunt lintAndTest: lint and test only (no watch).

As the JavaScript files are concatenated and read from a common file `bundle.js`, you will need to make sure the `grunt watch` task is live and running in order to see changes to JavaScript files reflected in the client.


## Managing Goldstone Server Addons

In the development environment, addons are managed via the `manage_addon.sh` script.  Using the `opentrail` addon as an example, here is the procedure to install the addon:

    $ cd ~/devel/goldstone-server
    $ bin/start_dev_env.sh

In another window:

    $ cd ~/devel/django-opentrail
    $ python ./manage.py sdist
    $ cp dist/django-opentrail-0.0.tar.gz ~/devel/goldstone-server
    $ cd ~/devel/goldstone-server
    $ eval $(docker-machine env default)
    $ bin/manage_addon.sh --install --addon-name=opentrail --addon-file=django-opentrail-0.0.tar.gz

Then restart the dev env by entering `<Ctrl-C>` in the first window and rerunning `bin/start_dev_env.sh`

To uninstall the plugin:

    $ cd ~/devel/goldstone-server
    $ eval $(docker-machine env default)
    $ bin/manage_addon.sh --uninstall --addon-name=opentrail --package-name='django-opentrail'

## Troubleshooting, Rebuilding, and Interacting with Containers

Here are some useful commands that you can help with managing the development process, data, and containers.  

Removing a container will force it to be recreated next time you start the dev environment.  As an example, to remove the app server container:

    $ cd ~/devel/goldstone-server
    $ ./bin/stop_dev_env.sh
    $ docker-machine start default
    $ eval $(docker-machine env default)
    $ docker rm goldstoneserver_gsappdev_1
    $ ./bin/start_dev_env.sh

Removing all containers and images will result in pulling the base images from upstream, and recreating all of the containers:

    $ cd ~/devel/goldstone-server
    $ ./bin/wipe_docker 
    $ ./bin/start_dev_env.sh


## Coding Guidelines

### Python code

We rely on pep8 and pylint to help ensure the consistency and integrity of the codebase.

Please follow the generally accepted practices, based on these style guidelines:

* [PEP 8](https://www.python.org/dev/peps/pep-0008/) - Style Guide
* [PEP 257](https://www.python.org/dev/peps/pep-0257/) - Docstring conventions
* [Openstack Style Guidelines](http://docs.openstack.org/developer/hacking/) - Where they are possible and applicable.

To test that your code conforms to this project's standards:

    $ tox -e checkin
    $ fab test

## Configuring Postfix

If you're not working on or testing the password-reset sequence, you can skip
to the next section.

To test Goldstone's password-reset sequence, you'll need an
[SMTP](https://en.wikipedia.org/wiki/Simple_Mail_Transfer_Protocol) server
running on your development machine.

Since [Postfix](http://www.postfix.org) is nigh-universal, here's how to
configure it to relay outgoing mail to a Gmail account, on OS X.

First, if you're in a virtual ("workon") environment, deactivate it. Then:

    $ sudo bash
    root# cd /etc/postfix

Edit `main.cf`. If any of these variables are already in the file, change them to what's listed here.  Otherwise, add these lines to the end of the file:

    myhostname = localhost
    relayhost = [smtp.gmail.com]:587
    smtp_sasl_auth_enable = yes
    smtp_sasl_mechanism_filter = plain
    smtp_sasl_password_maps = hash:/etc/postfix/sasl_passwd
    smtp_sasl_security_options = noanonymous
    smtp_tls_CAfile = /etc/postfix/systemdefault.pem
    smtp_use_tls = yes

Create the file, `/etc/postfix/sasl_passwd`.  Add this line to it, plugging in your e-mail username
and password:

    [smtp.gmail.com]:587 EMAIL_USERNAME:PASSWORD
    

(For example, your line might read, `[smtp.gmail.com]:587
dirk_diggler@mycompany.com:12344321`.

Then:

    root# postmap /etc/postfix/sasl_passwd

Now put a valid certificate into
`/etc/postfix/systemdefault.pem`. Here's one way to do it:

1. Launch the KeyChain Access application
2. In the sidebar, select "System" and "Certificates"
3. In the main window, select `com.apple.systemdefault`
4. `File | Export Items...`
5. Select "Privacy Enhanced Mail (.pem)" and save it to your Desktop.

Move the file you just saved to `/etc/postfix/systemdefault.pem`.

Then, chown the file so that root owns it:

    root# chown root /etc/postfix/systemdefault.pem


Now start postfix and test it:

    root# postfix start
    root# echo "Test mail from postfix" | mail -s "Test Postfix" YOU@DOMAIN.TLD

If you receive the test email, Postfix is running correctly!

If not, look in `/var/log/mail.log` to start diagnosing what's wrong.

### Starting on a boot

If you want Postfix to always start when you boot your machine, edit
`/System/Library/LaunchDaemons/org.postfix.master.plist`. Insert this text after the `<dict>`:

    <key>KeepAlive</key>
    <dict>
        <key>SuccessfulExit</key>
        <false/>
    </dict>

Insert this text before the `</dict>`:

    <key>RunAtLoad</key>
    <true/>

## Major Design Decisions

* The client code supplied with Goldstone may be used in production, or it may be used as a reference design for your own custom client. Goldstone has been designed to be used through its API without using Django's authentication or view+template subsystems.
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
