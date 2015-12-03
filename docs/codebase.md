# This file explains the tree structure and organization of the Goldstone code repository

client

client -> examples -> Four D3 examples that do not run on real data

client -> js -> collections -> a set that holds all the data-models with pre-built sorting, searching for rendering to views

client -> js-> models -> limited data-structure objects that you can attach stuff to

client -> js -> preload-> Javascript classes that get extended from our parent classes

client -> js -> views -> main workhorse for rendering collected data

client -> scss -> stuff that turns into css in the browser, css preprocessor (domain specific for shortcuts, compatible with CSS

client -> sitelib -> everything concatenated by a grunt task into lib.js/bundle.js

client -> sitelib ->jquery.datatables.js -> awesome plugin to render all our tables and charts (predefined with sorting, pagination etc )

client -> sitelib -> siteLibLoader.js -> super critical file that preempts grunt's default and delivered to grunt only for dev environment contains  the exact order of 3rd party libraries to be loaded for dev only environments and bunlded in lib.js

config

designdocs

dist

docker

docs

docs -> HACKING.md -> explains how to install and run Goldstone Server locally for dev (MAC OS only)

external

goldstone

goldstone -> core -> django project to help integrate with all external interfaces like docker, views and search queries

goldstone -> drefs -> django project to contain all rest-framework API's related to elasticsearch

goldstone -> glance -> interface to open-stack data

goldstone -> glogging -> django project to contain all API's related to syslog and logstash

goldstone -> nova -> interface to open-stack data, external facing views and queries

goldstone -> keystone -> interface to open-stack data

goldstone -> static -> contains all client related files

goldstone -> static -> addons -> addons that came from client-related assets

goldstone -> static -> bundle -> lib.js : concatenated version of all external libraries

goldstone -> static -> bundle -> bundle.js : concatenated version of all client-facing java scripts

goldstone -> static -> css -> contains mainly css files used for grunt conversion or assets used by bootstrap

goldstones -> templates -> contains all HTML templates used by the browser


gruntfile.js -> Applicable only to dev, defines all the tasks and registers tasks that can be run by grunt


package.json -> Applicable only to dev, contains all dependencies


static -> exact copy of all the folders (one level up) for docker containerization, except goldstone


test -> contains all client related tests


test_data


utils -> Files for rpmbuild, nova and elasticsearch utilities





