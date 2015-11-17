# Goldstone Server Hacking Guide


This explains how to install and run Goldstone Server locally, so you can do code development on the project.  These instructions are written for a Mac OS X Yosemite development.

## Prerequisites

Install [Docker Toolbox](https://github.com/docker/toolbox/releases).

**_Note: there is an issue with release 1.8.2a of Docker Toolbox, but earlier and later versions work_**

Using brew, install various prerequisite packages:

    $ brew update
    $ brew doctor # (Resolve any any errors or warnings)
    $ brew install python # (python 2.7.9 is the version used in the app container)
    $ brew install git
    $ brew install pyenv-virtualenvwrapper
    $ brew install postgres


**_Note: if you have manually installed Docker Machine and Docker Compose, make sure your Docker Machine VM name is 'default' in order to be compatible with the supporting scripts._**

**_Note: the postgres server does not need to be started.  It is installed in order to support some of the Goldstone dependencies._**


## Fork and Clone Goldstone Repo

Depending on your contributor status (core or community), you will either create a fork of the [goldstone-server](https://github.com/Solinea/goldstone-server) Github repositories, or you will be working on branches from the main repo.

The commands given below are for use by core contributors. If you are a community contributor, your first step will be to [fork the repository](https://help.github.com/articles/fork-a-repo/). You will also substitute your own github user id for "Solinea" in the following clone command.

    $ mkdir ~/devel
    $ cd ~/devel
    $ git clone git@github.com:Solinea/goldstone-server.git

If you install in a location other than `~/devel/goldstone-server`, you will need to set the `GS_PROJ_TOP_DIR` environment variable to the directory containing the source.

**_Note: if you have customized your default umask, you may experience problems building images and mounting volumes in containers._**


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

The first time you start Goldstone Server, it will probably take several minutes to download docker containers and perform configuration tasks.  You may see errors and missing data in the user interface. You may also see failures if you execute the test suite.  The data should be sufficiently populated shortly after running the `configure_stack.sh` command documented below.  If you continue to see errors in the UI or in tests, [please submit an issue!](https://github.com/Solinea/goldstone-server/issues)

All output (database, search, task, app server, etc.) will be logged to the terminal window that you called `start_dev_env.sh`.  If you would like to send the output to a file, you could either:

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
    $ ./bin/gsexec --shell nova boot --image cirros --flavor m1.tiny ceilo0

Here are some [screenshots](https://photos.google.com/album/AF1QipPsFIXlFUzuJflAowyshNoDtF3ph9hMAIdK4WGa) of a working dev environment. Your environment should look similar.


## Logging In

After the containers have started and OpenStack has been configured to interact with Goldstone, you can access the user interface with the following information:

* url: **http://127.0.0.1:8000**
* django admin username: **admin**
* django admin password: **goldstone**
* Goldstone admin username: **gsadmin**
* Goldstone admin password: **goldstone**


## Kibana Configuration

In the development environment, a Kibana container will be started.

url: **http://`docker-machine ip default`:5601/**

Upon first connection to the service, Kibana will prompt you to "Configure an index pattern."

- Keep *Index contains time-based events* checked.
- The *Index name or pattern* should be set to `logstash-*`.
- Select `@timestamp` from the *Time-field name* dropdown menu.
- Click **Create** to save the configuration.

[Here](https://www.elastic.co/guide/en/kibana/current/introduction.html) is a good introduction to using Kibana.


## Debugging

### Python/Django
Currently, the preferred way to debug the running application is to use the `--service-ports` option to `docker-compose run` combined with breakpoints in the application code.  The first step is to insert a breakpoint where you want to use the interactive debugger.  You can use a line similar to this:

    import pdb; pdb.set_trace()

Once you have a breakpoint set, you can use the following commands to get access to the `pdb` shell:

    cd ~/devel/goldstone-server
    bin/stop_dev_env.sh
    docker-machine start default
    eval $(docker-machine env default)
    docker-compose -f docker-compose-dev.yml run --service-ports gsappdev

This will only start linked containers, so you may not see all containers running.  You may also want to stop celery from executing scheduled tasks in order to have less output to sift through.  You can kill the celery processes by executing:

    bin/gsexec --container=goldstoneserver_gsappdev_run_1 --shell pkill celery

When you have completed the debugging session, we recommend that you go back to using `start_dev_env.sh` so all containers are running.   
    

## Testing

### Backend Testing

Goldstone uses standard Django testing tools:

* [Tox](http://tox.readthedocs.org/en/latest/) for test automation. Goldstone's tox setup tests against Python 2.7, PEP8, and pylint by default.  There is also an additional `coverage` target available to evaluate code coverage.
* [Django TestCase](https://docs.djangoproject.com/en/1.8/topics/testing/tools/#testcase) for unit testing.

Testing can be performed from within the container via the `tox` command.  First, you will need to install `tox` in the app container:

    $ cd ~/devel/goldstone-server
    $ ./bin/start_dev_env.sh
    $ ./bin/gsexec --shell pip install tox

With `tox` installed, you can call various test targets by using one of the following commands:

    $ ./bin/gsexec --shell tox -e py27  # executes the tests suite for Python 2.7
    $ ./bin/gsexec --shell tox -e py27 goldstone.nova  # only execute nova tests
    $ ./bin/gsexec --shell tox -e cover  # execute a coverage report
    $ ./bin/gsexec --shell tox -e pep8  # check coding standards

Check `tox.ini` for other possible targets.


### Front-end testing

This information assumes you already have node/npm installed.  With the development environment started in another window, execute:

    $ cd ~/devel/goldstone-server
    $ npm install -g grunt-cli
    $ npm install
    $ grunt

**_Note: The end to end testing assumes that you have a a `gsadmin` user with the password `goldstone` configured._**

The Gruntfile.js is configured with the following combo tasks:

* grunt (default task): lint / unit testing (no e2e tests) / watch.
* grunt watch: watch for changes that will trigger unit/integration/e2e tests
* grunt lint: lint only (no watch).
* grunt test: unit/integration/e2e test only (no watch).
* grunt lintAndTest: lint and test only (no watch).

As the JavaScript files are concatenated and read from a common file `bundle.js`, you will need to make sure the `grunt watch` task is live and running in order to see changes to JavaScript files reflected in the client.

#### Testing Addons

The `grunt lintAndTest` command will search for tests in addon modules as well. The requirement is that the addon tests are in `goldstone/static/addons/**/client-test/*.js` . And the JavaScript under test must be in `goldstone/static/addons/**/client-js/main.js` .

## Managing Goldstone Server Addons

In the development environment, addons are managed via the `manage_addon.sh` script.  Using the `opentrail` addon as an example, here is the procedure to install the addon:

    $ cd ~/devel/goldstone-server
    $ bin/start_dev_env.sh

In another window:

    $ cd ~/devel/django-opentrail
    $ python ./manage.py sdist
    $ cp dist/django-opentrail-0.0.tar.gz ~/devel/goldstone-server/addons
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

### Removing a Single Container

Removing a container will force it to be recreated next time you start the dev environment.  As an example, to remove the app server container:

    $ cd ~/devel/goldstone-server
    $ ./bin/stop_dev_env.sh
    $ docker-machine start default
    $ eval $(docker-machine env default)
    $ docker rm goldstoneserver_gsappdev_1
    $ ./bin/start_dev_env.sh

### Removing All Containers and Images

Removing all containers and images will result in pulling the base images from upstream, and recreating all of the containers:

    $ cd ~/devel/goldstone-server
    $ ./bin/wipe_docker.sh
    $ ./bin/start_dev_env.sh

### Executing Commands in a Container

Executing commands in a container can be done via docker exec.  There are some oddities when running python commands that require some special parameters.  The `gsexec` command has been provided to simplify interaction.  By default it is configured to connect to the application server, but you could also use the `--app-container` flag to target a different container.  Here are examples of running some simple python and non-python commands inside the application container:

    $ cd ~/devel/goldstone-server
    $ ./bin/gsexec ls   # list files in app user's home directory
    $ ./bin/gsexec --shell nova boot --image cirros --flavor m1.tiny ceilo0  # create a VM (--shell solves the interaction problem)

### Installing Packages in Dev Containers

Using emacs as an example, here is a procedure for installing additional Debian packages in a container:

    $ eval $(docker-machine env default)
    $ docker exec -u root -i -t goldstoneserver_gsappdev_1 apt-get update
    $ docker exec -u root -i -t goldstoneserver_gsappdev_1 apt-get install emacs
    $ docker commit goldstoneserver_gsappdev_1  # persist your changes to the container

### Updating pip Requirements in the App Container

If you amend the `requirements.txt` file, and want to test out the impact without recreating the application container, you can execute the following commands:

    $ cd ~/devel/goldstone-server
    $ ./bin/gsexec --shell pip install -r requirements.txt
    $ docker commit goldstoneserver_gsappdev_1  # persist your changes to the container

## Using Kibana in Development



## Coding Guidelines

### Python code

We rely on `pep8` and `pylint` to help ensure the consistency and integrity of the codebase.

Please follow the generally accepted practices, based on these style guidelines:

* [PEP 8](https://www.python.org/dev/peps/pep-0008/) - Style Guide
* [PEP 257](https://www.python.org/dev/peps/pep-0257/) - Docstring conventions
* [Openstack Style Guidelines](http://docs.openstack.org/developer/hacking/) - Where they are possible and applicable.

To test that your code conforms to this project's standards:

    $ cd ~/devel/goldstone-server
    $ ./bin/gsexec --shell tox -e checkin
    $ ./bin/gsexec --shell tox -e py27

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
