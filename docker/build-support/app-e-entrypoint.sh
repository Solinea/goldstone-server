#!/bin/bash
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

. ${ENVDIR}/bin/activate 

python manage.py runserver &

sleep 5

python manage.py syncdb --noinput --migrate  # Apply database migrations

declare -a addons=( opentrail leases )

for addon in "${addons[@]}" ; do
    fab -f addon_fabfile.py \
         install_addon:name=${addon},install_dir=${APPDIR},settings=${DJANGO_SETTINGS_MODULE},interactive=False 
done

python manage.py collectstatic --no-input
