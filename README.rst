=============================
Goldstone
=============================

Goldstone is the first purpose-built monitoring, management and analytics platform for operating OpenStack clouds. The Goldstone server allows OpenStack cloud operators to:

* Discover and visualize the OpenStack cloud configuration and logs
* Report on key events and metrics at all layers of the cloud platform 
* Analyze and diagnose common issues
* Automate common cloud management and maintenance tasks

For more information on how to install Goldstone, view the INSTALL.rst file.Copyright 2014 Solinea, Inc.

--------------
Installation
--------------

The installation instructions are documented in INSTALL.rst.

--------------
Usage
--------------

The installation created a system administrator account with the credentials, "admin" / "changeme".

Your first task is to change this account's password and e-mail address. You can do this from the account settings page.

The installation also created an initial tenant, with a tenant administrator. The tenant administrator is also Goldstone's default tenant administrator. You may wish to change this tenant's name, owner name, or contact information; change the tenant admin's name or password, which is "gsadmin" / "changeme"; or create more tenant admins.


--------------
Documentation
--------------

TBS

-------------------------------------------------------------
Support, feature requests, bug fixes, development, etc.
-------------------------------------------------------------

Please send a pull request to the master branch. All pull requests should include unit tests where feasible, and additional or updated documentation if appropriate.

Code development
``````````````````````
HACKING.rst has instructions for setting up a Goldstone development environment.

The recommended steps are:

1. Fork this repository on GitHub.
2. Follow the instructions in HACKING.rst to set up your development environment.
3. Verify that you can build a working Goldstone image before you make any edits.
4. Make your improvements in your fork.
5. Submit a pull request to us. Be sure to a problem description, overview of your changes, and unit tests.

Please follow the generally accepted practices for Python and OpenStack code, based on these style guidelines:

* `PEP 8 <https://www.python.org/dev/peps/pep-0008/>`_ - Style Guide
* `PEP 257 <https://www.python.org/dev/peps/pep-0257/>`_ - Docstring conventions
* `Openstack Style Guidelines <http://docs.openstack.org/developer/hacking/>`_

To test that your code conforms to this project's standards:

::

   $ tox -e pep8
   $ tox -e pylint

For JavaScript code:

\TBD\


Getting help
`````````````````````````````

If you need help or have questions, you can submit them as issues in this repository. Or, you can ask your question in xxxxxxxxxxxxxxxxx.


--------------
API
--------------


--------------
License
--------------

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
