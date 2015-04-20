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

=================
Testing Goldstone
=================

Overview
********

Goldstone use the standard Django testing tools:

* Tox for test automation 
* Django TestCase and Selenium are used for unit and functional testing respectively


Running Tests
*************

Goldstone uses tox for testing. To install tox::

    # pip install tox

To run the tests::

    $ tox
   
Goldstone's tox setup tests against Python 2.6, Python 2.7 and PEP8 (syntax) by default.

It's also possible to run a specific environment of unit tests with::

    $ tox -e py26

This runs the tests under the python 2.6 interpreter. It also accepts ``py27`` for python 2.7, ``py33`` for python 3.3, ``cover`` for test coverage, ``flake8`` for PyFlakes linting and ``pep8`` for code syntax checking.


Writing Tests
*************

Goldstone uses Django's unit test machinery (which extends Python's ``unittest2`` library) as the core of its test suite. As such, tests for the Python code classes should be written as unit tests. No doctests please.

In general new code without unit tests will not be accepted, and every bugfix *must* include a regression test.


Viewing Code Coverage
*********************

Goldstone strives for 100% code coverage. Code coverage reports can be created through the `tox -e cover` command:

$ tox -e cover
