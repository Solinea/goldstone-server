# Goldstone Server Hacking Guide


The purpose of this document is to get Goldstone Server up and running in your local environment, and introduce you to the development processes that contributors to Golstone Server have established.  We are always looking for ways to streamline the spin-up and development processes, so if you have suggestions, please open a github issue.

It is assumed that you are using a system running a recent version of MacOSX, though the instructions that follow can probably be adapted to a Linux environment fairly easily. Windows might be a little more involved, but since most of the fun happens inside Docker containers, it should be possible.  If you have edits to the document to adress these alternate platforms, let us know, or make a pull request!

## MacOSX Prerequisites

* [Docker Toolbox](https://docs.docker.com/mac/step_one/)
* [Homebrew](http://brew.sh/)

# Quickstart

In a terminal window:

    $ mkdir ~/devel
    $ cd ~/devel
    $ git clone git@github.com:Solinea/goldstone-server.git  # or your fork if you went that route
    $ cd ~/devel/goldstone-server
    $ bin/setup_dev_env.sh
    $ source ~/.bash_profile
    $ workon goldstone-server
    $ bin/start_dev_env.sh --help   # and select the most appropriate runtime flags 

Open another terminal window and execute:

    $ eval $(docker-machine env default)
    $ docker exec -it goldstoneserver_gsappdev_1 bash
    (venv) $ fab -f post_install.py -H 172.24.4.100 configure_stack:172.24.4.1,True,True
    (venv) $ exit

Navigate to Goldstone Server in a browser:

    * url: **http://127.0.0.1:8000**
    * django admin username: **admin**
    * django admin password: **goldstone**
    * Goldstone admin username: **gsadmin**
    * Goldstone admin password: **goldstone**

**_Usage notes:_**

* By default, an OpenStack VM archive will be downloaded to /tmp and imported into Virtualbox. You may want to save that image somewhere more permanent in case you need to recreated it.  
* If you have manually installed Docker Machine and Docker Compose, make sure your Docker Machine VM name is 'default' in order to be compatible with the supporting scripts.
* If you install in a location other than `~/devel/goldstone-server`, you will need to edit the `setup_dev_env.sh` script accordingly.
* The `fab` command to run `configure_stack` need only be run one time, and sets up the relationship between the OpenStack instance and Goldstone Server.
* If you have customized your default umask, you may experience problems building images and mounting volumes in containers.
* `bin/configure_vbox.sh` accepts `--no-stack`, and `--no-docker` flags to skip configuration of those particular components.  This helps address reconfiguration of specific components.  For example, if you have recreated your docker VM, you could run `configure_vbox.sh --no-stack`.  This would only configure the docker related NAT rules.


# The Details

This section discusses the setup and development process in more detail.

## Starting and Stopping Goldstone Server

To start the development environment, execute:

    $ workon goldstone-server
    $ ./bin/start_dev_env.sh

The first time you start Goldstone Server, it will probably take several minutes to download docker containers and perform configuration tasks.  You may see errors and missing data in the user interface. You may also see failures if you execute the test suite.  The data should be sufficiently populated shortly after running the `configure_dev_stack.sh` command documented below.  If you continue to see errors in the UI or in tests, [please submit an issue!](https://github.com/Solinea/goldstone-server/issues)

All output (database, search, task, app server, etc.) will be logged to the terminal window that you called `start_dev_env.sh`.  If you would like to send the output to a file, you could either:

    $ ./bin/start_dev_env.sh | tee /tmp/goldstone.log  # sends output to console and file

or:

    $ ./bin/start_dev_env.sh > /tmp/goldstone.log 2>&1  # sends output only to file


## Configuring OpenStack Instance

Execute the following commands to configure the development OpenStack instance to ship logs and events back to Goldstone.  This only needs to be performed once:

    $ cd ~/devel/goldstone-server
    $ ./bin/start_dev_env.sh

Then in another window:

    $ eval $(docker-machine env default)
    $ docker exec -it goldstoneserver_appdev_1 bash
    (container) $ fab -f post_install.py -H 172.24.4.100 configure_stack:172.24.4.1,True,True


It may be helpful to create a couple of instances via the API in order to generate some log, event, and metric activity.  You can execute the following commands to create a small instance:

    $ eval $(docker-machine env default)
    $ ./bin/gsexec --shell nova boot --image cirros --flavor m1.tiny ceilo0

## Logging In

After the containers have started and OpenStack has been configured to interact with Goldstone, you can access the user interface with the following information:

* url: **http://127.0.0.1:8000**
* django admin username: **admin**
* django admin password: **goldstone**
* Goldstone admin username: **gsadmin**
* Goldstone admin password: **goldstone**

The convenience script `bin/devrc` will create and alias called gscurl that has a current auth token set so the API can be called easily.  Source it after the server is accepting connections.

    $ source ./bin/devrc
    Change GS_* environment vars and rerun if necessary
    GS_URL=http://localhost:8000
    GS_USER=gsadmin
    GS_PASS=goldstone
    gscurl: aliased to curl -H "Authorization: Token 7d8c28168c5be6b0af8b033fac999339f8a2dcb4"

Now you can make API authenticated API calls like:

    $ gscurl -XGET $GS_URL/core/alert_definition/ | python -m json.tool

## Stopping Goldstone Server

To stop the development environment, either:

* `<Ctrl-C>` from the window running `start_dev_env.sh`; or
* run `stop_dev_env.sh` from another window.

This will stop both the docker VM and the OpenStack VM.

## Kibana Configuration

A Kibana container will be automatically started as a part of docker-compose-dev.yml getting executed.

The default url to access your kibana service is :

    http://localhost:5601/

Upon first connection to the service, Kibana will prompt you to "Configure an index pattern."

- Keep *Index contains time-based events* checked.
- The *Index name or pattern* should be set to `logstash-*`.
- Select `@timestamp` from the *Time-field name* dropdown menu.
- Click **Create** to save the configuration.
- To verify index creation, check the "Indices" tab (top-left corner) on your Kibana console

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

* [Django TestCase](https://docs.djangoproject.com/en/1.8/topics/testing/tools/#testcase) for unit testing.

The `bin/test.sh` script wraps a test runner that executes inside the app container.  You can optionally provide a package or class name to narrow the scope of the tests.  It will also run pep8 and coverage tests.

    $ workon goldstone-server
    $ ./bin/start_dev_env.sh
    $ ./bin/test.sh [package[.class]]

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

Using Emacs as an example, here is a procedure for installing additional Debian packages in a container:

    $ eval $(docker-machine env default)
    $ docker exec -u root -i -t goldstoneserver_gsappdev_1 apt-get update
    $ docker exec -u root -i -t goldstoneserver_gsappdev_1 apt-get install emacs
    $ docker commit goldstoneserver_gsappdev_1  # persist your changes to the container

### Updating pip Requirements in the App Container

If you amend the `requirements.txt` file, and want to test out the impact without recreating the application container, you can execute the following commands:

    $ cd ~/devel/goldstone-server
    $ ./bin/gsexec --shell pip install -r requirements.txt

## Coding Guidelines

### Python code

We rely on `pep8` and `pylint` to help ensure the consistency and integrity of the codebase.

Please follow the generally accepted practices, based on these style guidelines:

* [PEP 8](https://www.python.org/dev/peps/pep-0008/) - Style Guide
* [PEP 257](https://www.python.org/dev/peps/pep-0257/) - Docstring conventions
* [Openstack Style Guidelines](http://docs.openstack.org/developer/hacking/) - Where they are possible and applicable.

## Configuring Postfix

If you're not working on or using the password-reset sequence, you can skip
this section.

To use Goldstone's password-reset sequence, you'll need an
[SMTP](https://en.wikipedia.org/wiki/Simple_Mail_Transfer_Protocol) server
running on your development machine.

Since [Postfix](http://www.postfix.org) is nigh-universal, here's how to
configure it on OS X to relay outgoing mail to a Gmail account.

**_Note: Documenting all the issues that can arise with relaying e-mail is beyond this document's scope.  Please research your specific setup!_**

### 1. Main.cf

If you're in a virtual ("workon") environment, deactivate it. Then:

    $ sudo bash
    root# cd /etc/postfix

Edit `main.cf`. If any of these variables are already in the file, change them to what's listed here.  Otherwise, add these lines to the end of the file:

    inet_interfaces = localhost, 172.24.4.1
    myhostname = localhost
    mynetworks = 127.0.0.0/8, [::1]/128, 172.24.4.0/24
    relayhost = [smtp.gmail.com]:587
    smtp_sasl_auth_enable = yes
    smtp_sasl_mechanism_filter = plain
    smtp_sasl_password_maps = hash:/etc/postfix/sasl_passwd
    smtp_sasl_security_options = noanonymous
    smtp_tls_CAfile = /etc/postfix/systemdefault.pem
    smtp_use_tls = yes

NOTE: the `relayhost` value is appropriate for gmail.com. *You will need to adjust it for your SMTP server.

### 2. Sasl_passwd

Edit `/etc/postfix/sasl_passwd`.  Add this line to it, plugging in your e-mail username and password:

    [smtp.gmail.com]:587 EMAIL_USERNAME:PASSWORD

For example, your line might read, `[smtp.gmail.com]:587
dirk_diggler@mycompany.com:12344321`.

Then:

    root# postmap /etc/postfix/sasl_passwd

### 3. Systemdefault.pem

Put a valid certificate into `/etc/postfix/systemdefault.pem`. Here's one way
to do it:

1. Launch the KeyChain Access application
2. In the sidebar, select "System" and "Certificates"
3. In the main window, select `com.apple.systemdefault`
4. `File | Export Items...`
5. Select "Privacy Enhanced Mail (.pem)" and save it to a file
6. Move the file to `/etc/postfix/systemdefault.pem`

Then, chown the file so that root owns it:

    root# chown root /etc/postfix/systemdefault.pem

### 4. Goldstone-dev.env

In `~/devel/goldstone-server/docker/config/goldstone-dev.env`, add this:

    EMAIL_HOST=172.24.4.1
    EXTERNAL_HOSTNAME=localhost:8000

And then restart your development environment:

    $ # Switch to your start_dev_env window, then:
    $ ^C
    $ bin/start_dev_env.sh

### 5. Goldstone-test

If you want to use the password-reset sequence in your test environment, edit `~/devel/goldstone-server/docker/config/goldstone-test.env` and add this:

    EMAIL_HOST=172.24.4.1
    EXTERNAL_HOSTNAME=localhost:8000

**_Note: Configuring SMTP in an integration test environment is beyond this document's scope._**

### 6. Start postfix

Start or reload postfix, exit sudo:

    root# postfix start
    root# exit

### 7. Ensure Gmail will receive the relay

1. Go to http://google.com
2. Go to "My Account"
3. Under, "Sign-in & security," click "Connected apps & sites"
4. Set "Allow less secure apps" to ON

### 8. Test postfix

The easiest way to test your configuration is to browse to the Goldstone login page, click on "reset password," and send yourself a password-reset e-mail.

Another way would be to install `mailutils` and `postfix` in your container, and send yourself an e-mail using the `mail` utility.

### 9. Starting on a boot

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

* The client code supplied with Goldstone may be used in production, or as a reference design for your own custom client. Goldstone has been designed to be used through its API without using Django's authentication or view+template subsystems.
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
