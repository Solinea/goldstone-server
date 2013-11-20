=================
Testing GoldStone
=================

How to run the tests
====================

Goldstone uses tox for testing. To install tox::

    $ sudo pip install tox

To run the tests::

    $ tox
   
It's also possible to run a specific environment of unit tests with::

    $ tox -e py26

This runs the tests under the python 2.6 interpreter. It also accepts ``py27`` for python 2.7, ``py33`` for python 3.3, ``cover`` for test coverage and ``pep8`` for code syntax checking.

Writing tests
=============

Goldstone uses Django's unit test machinery (which extends Python's ``unittest2`` library) as the core of its test suite. As such, all tests for the Python code should be written as unit tests. No doctests please.

In general new code without unit tests will not be accepted, and every bugfix *must* include a regression test.
