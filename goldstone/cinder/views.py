"""Cinder views."""
# Copyright 2014 - 2015 Solinea, Inc.
#
# Licensed under the Solinea Software License Agreement (goldstone),
# Version 1.0 (the "License"); you may not use this file except in compliance
# with the License. You may obtain a copy of the License at:
#
#     http://www.solinea.com/goldstone/LICENSE.pdf
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
from goldstone.core.utils import JsonReadOnlyView
from .models import ServicesData, VolumesData, \
    BackupsData, SnapshotsData, VolTypesData, TransfersData


# Our API documentation extracts this docstring, hence the use of markup.
class VolumesDataView(JsonReadOnlyView):
    """Return Volume data.

    \n\nQuery string parameters:\n

    <b>zone</b>: The desired zone.\n
    <b>region</b>: The desired region.\n\n

    """

    model = VolumesData
    key = 'volumes'
    zone_key = 'availability_zone'


# Our API documentation extracts this docstring, hence the use of markup.
class BackupsDataView(JsonReadOnlyView):
    """Return Backups data.

    \n\nQuery string parameters:\n

    <b>zone</b>: The desired zone.\n
    <b>region</b>: The desired region.\n\n

    """

    model = BackupsData
    key = 'backups'
    zone_key = 'availability_zone'


# Our API documentation extracts this docstring, hence the use of markup.
class SnapshotsDataView(JsonReadOnlyView):
    """Return Snapshots data.

    \n\nQuery string parameters:\n

    <b>zone</b>: The desired zone.\n
    <b>region</b>: The desired region.\n\n

    """
    model = SnapshotsData
    key = 'snapshots'


# Our API documentation extracts this docstring, hence the use of markup.
class ServicesDataView(JsonReadOnlyView):
    """Return Services data.

    \n\nQuery string parameters:\n

    <b>zone</b>: The desired zone.\n
    <b>region</b>: The desired region.\n\n

    """
    model = ServicesData
    key = 'services'
    zone_key = 'zone'


# Our API documentation extracts this docstring, hence the use of markup.
class VolumeTypesDataView(JsonReadOnlyView):
    """Return VolumeTypes data.

    \n\nQuery string parameters:\n

    <b>zone</b>: The desired zone.\n
    <b>region</b>: The desired region.\n\n

    """
    model = VolTypesData
    key = 'volume_types'


# Our API documentation extracts this docstring, hence the use of markup.
class TransfersDataView(JsonReadOnlyView):
    """Return Transfers data.

    \n\nQuery string parameters:\n

    <b>zone</b>: The desired zone.\n
    <b>region</b>: The desired region.\n\n

    """
    model = TransfersData
    key = 'transfers'
