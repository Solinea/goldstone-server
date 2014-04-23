Copyright 2014 Solinea, Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

Author: Ken Pepple

=================
Deploying Goldstone
=================

How to run the tests
====================

Install libraries::

    $ sudo pip install -r requirements.txt

Set SECRET KEY environment variable::

    $ set SECRET_KEY="fsaafkjsdfiojsoivjfvoj"

You can generate strong SECRET_KEYS at http://www.miniwebtool.com/django-secret-key-generator/

Start the server::

    $ python manage.py runserver --settings=goldstone.settings.production

This will be better serverd through a true webserver like Apache.
