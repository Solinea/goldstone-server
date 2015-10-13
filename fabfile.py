"""Fabric file for Goldstone development."""
# Copyright 2015 Solinea, Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
from __future__ import print_function

import os
import os.path
import sys

from fabric.api import task

# Add the current directory to the module search path.
sys.path.append('')


@task
def clean(verbose=False):
    """Delete unnecessary and intermediate files.

    These subdirectories are skipped: .git, .tox.

    The deleted files are: *.orig, *.pyc, *.*~.

    """
    import re

    # Subdirectories to ignore. These are typically wholly controled by a tool,
    # and we don't need or want to muck with them.
    IGNORE = [".git", ".tox"]

    # Files to be deleted. Each entry is a regex.  Combinations of string
    # operations would be faster, but more cumbersome and harder to maintain.

    DELETE = [re.compile(r'^.*\.orig'),
              re.compile(r'^.*\.pyc'),
              re.compile(r'^.*\..*~'),
              ]

    def process_files(_, dirname, names):
        """Fine the unnecessary files in this directory, and delete them."""

        # If we're in a subdirectory that should be skipped, return now.
        if any(x in dirname for x in IGNORE):
            return

        # Make a list of the files to delete.
        targets = [x for x in names if any(y.search(x) for y in DELETE)]

        # Delete every target in this directory.
        for target in targets:
            filepath = os.path.join(dirname, target)

            if verbose:
                print("deleting %s ..." % filepath)

            os.remove(filepath)

    os.path.walk('.', process_files, None)


@task
def changelog(token):
    """Genereate a new CHANGELOG.md file.

    This overwrites the existing CHANGELOG.md.

    :param token: A Github personal access token, generated using
                  https://github.com/settings/tokens
    :type token: str

    """
    from subprocess import call

    call(["github_changelog_generator", "-t", "%s" % token])
