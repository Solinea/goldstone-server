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

    ---

    GET:
        parameters:
           - name: region
             description: The desired region.
             paramType: query
           - name: zone
             description: The desired zone.
             paramType: query

    """

    model = VolumesData
    key = 'volumes'
    zone_key = 'availability_zone'


# Our API documentation extracts this docstring, hence the use of markup.
class BackupsDataView(JsonReadOnlyView):
    """Return Backups data.

    ---

    GET:
        parameters:
           - name: region
             description: The desired region.
             paramType: query
           - name: zone
             description: The desired zone.
             paramType: query

    """

    model = BackupsData
    key = 'backups'
    zone_key = 'availability_zone'


# Our API documentation extracts this docstring, hence the use of markup.
class SnapshotsDataView(JsonReadOnlyView):
    """Return Snapshots data.

    ---

    GET:
        parameters:
           - name: region
             description: The desired region.
             paramType: query
           - name: zone
             description: The desired zone.
             paramType: query

    """
    model = SnapshotsData
    key = 'snapshots'


# Our API documentation extracts this docstring, hence the use of markup.
class ServicesDataView(JsonReadOnlyView):
    """Return Services data.

    ---

    GET:
        parameters:
           - name: region
             description: The desired region.
             paramType: query
           - name: zone
             description: The desired zone.
             paramType: query

    """
    model = ServicesData
    key = 'services'
    zone_key = 'zone'


# Our API documentation extracts this docstring, hence the use of markup.
class VolumeTypesDataView(JsonReadOnlyView):
    """Return VolumeTypes data.

    ---

    GET:
        parameters:
           - name: region
             description: The desired region.
             paramType: query
           - name: zone
             description: The desired zone.
             paramType: query

    """
    model = VolTypesData
    key = 'volume_types'


# Our API documentation extracts this docstring, hence the use of markup.
class TransfersDataView(JsonReadOnlyView):
    """Return Transfers data.

    ---

    GET:
        parameters:
           - name: region
             description: The desired region.
             paramType: query
           - name: zone
             description: The desired zone.
             paramType: query

    """
    model = TransfersData
    key = 'transfers'
