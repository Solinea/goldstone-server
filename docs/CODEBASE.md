# This file explains the tree structure and organization of the Goldstone code repository

###addons

A folder for the .tar.gz files during the addon installation proceess.

###bin

Docker-related helper scripts

###client

client -> examples -> D3 examples that have been converted into backbone views for demo purposes, but not yet integrated with actual cloud data.

client -> js -> collections -> Backbone Collections for fetching and manipulating data prior to handing them off to the associated Backbone Views

client -> js-> models -> Backbone Models related to color schemes, i18n, and info button popup text.

client -> js -> preload-> Backbone Views that are inherited by other views and need to be pre-loaded

client -> js -> views -> Backbone Views: holds the majority of code related to rendering data

client -> scss -> SASS files that are processed into css.

client -> sitelib -> 3rd party js files. Will be concatenated by a grunt task into goldstone/static/bundle/libs.js

client -> sitelib ->jquery.datatables.js -> 3rd party jQuery plugin to render tabular data (with built-in support for sorting, pagination etc)

client -> sitelib -> siteLibLoadOrder.js -> file that defines the exact order of 3rd party libraries to be concatenated into the libs.js bundle. *Any files not specified here will not be added to the bundle.*

###config

###designdocs

###dist

###docker

Dockerfiles -> build instructions for docker containers supporting Goldstone server

config -> configuration files that are mounted to Goldstone docker containers

data -> data files that are mounted to Goldstone docker containers

###docs

docs -> HACKING.md -> explains how to install and run Goldstone Server locally for dev (MAC OS only)

###goldstone

goldstone -> core -> django project to help integrate with all external interfaces like docker, views and search queries

goldstone -> drefs -> django project to contain all rest-framework API's related to elasticsearch

goldstone -> glance -> interface to open-stack data

goldstone -> glogging -> django project to contain all API's related to syslog and logstash

goldstone -> nova -> interface to open-stack data, external facing views and queries

goldstone -> keystone -> interface to open-stack data

goldstone -> static -> contains all client related files

goldstone -> static -> addons -> client assets for installed addon modules

goldstone -> static -> bundle -> lib.js : concatenated version of all 3rd party js libraries

goldstone -> static -> bundle -> bundle.js : concatenated version of all client js contained in client/js/* (except for the site-lib folder, which is in libs.js in this directory)

goldstone -> static -> css -> mainly css files and some assets used by bootstrap

goldstones -> templates -> contains all HTML templates served by Django.


###gruntfile.js
Applicable only to dev environment, defines and registers tasks that can be run by grunt via the command line, such as `grunt watch`.


###package.json
Applicable only to dev, contains all front-end dev dependencies that will be installed via `npm install`.


###static

copy of all static assets for docker containerization

###test

contains all client related unit/integration/e2e tests that are run via grunt.

###test_data


###utils

Files for rpmbuild, nova and elasticsearch utilities





