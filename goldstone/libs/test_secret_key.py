# Copyright 2012 Nebula, Inc.
#
#    Licensed under the Apache License, Version 2.0 (the "License"); you may
#    not use this file except in compliance with the License. You may obtain
#    a copy of the License at
#
#         http://www.apache.org/licenses/LICENSE-2.0
#
#    Unless required by applicable law or agreed to in writing, software
#    distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
#    WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
#    License for the specific language governing permissions and limitations
#    under the License.

from django.test import SimpleTestCase

from goldstone.libs import secret_key

import os


class SecretKeyTests(SimpleTestCase):
    def test_generate_secret_key(self):
        key = secret_key.generate_key(32)
        self.assertEqual(len(key), 32)
        self.assertNotEqual(key, secret_key.generate_key(32))

    def test_generate_or_read_key_from_file(self):
        key_file = ".test_secret_key_store"
        key = secret_key.generate_or_read_from_file(key_file)

        # Consecutive reads should come from the already existing file:
        self.assertEqual(key, secret_key.generate_or_read_from_file(key_file))

        # Key file only be read/writable by user:
        self.assertEqual(oct(os.stat(key_file).st_mode & 0o777), "0600")
        os.chmod(key_file, 0o777)
        self.assertRaises(secret_key.FilePermissionError,
                          secret_key.generate_or_read_from_file, key_file)
        os.remove(key_file)
