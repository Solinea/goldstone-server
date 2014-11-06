/**
 * Copyright 2014 Solinea, Inc.
 *
 * Licensed under the Solinea Software License Agreement (goldstone),
 * Version 1.0 (the "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License at:
 *
 *     http://www.solinea.com/goldstone/LICENSE.pdf
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Author: Alex Jacobs
 */

/*
to invoke:
1. include infoButonText.js in the template script tags
2. instantiate the model as a variable: var infoButtonText = new InfoButtonText().get('infoText');
3. invoke via infoButtonText, and an index corresponding to the particular text desired.

2 styles:
---------
1. infoButtonText.discoverCloudTopology (Front Page Cloud Topology)
2. infoButtonText['eventTimeline'] (Front Page Event Timeline)
etc...

*/

var InfoButtonText = Backbone.Model.extend({
    defaults: {
        infoText: {

            // populate info-button-text here.
            // accepts html markup such as <br>

            discoverCloudTopology: 'discoverCloudTopology test',

            eventTimeline: 'eventTimeline test',

            nodeAvailability: 'nodeAvailability test',

            serviceStatus: 'serviceStatus test',

            utilization: 'utilization test',

            hypervisor: 'hypervisor test',

            novaTopologyDiscover: 'novaTopologyDiscover test',

            cinderTopologyDiscover: 'cinderTopologyDiscover test',

            glanceTopologyDiscover: 'glanceTopologyDiscover test',

            keystoneTopologyDiscover: 'keystoneTopologyDiscover test',

            novaSpawns: 'novaSpawns test',

            novaCpuResources: 'novaCpuResources test',

            novaMemResources: 'novaMemResources test',

            novaDiskResources: 'novaDiskResources test',

            searchLogAnalysis: 'searchLogAnalysis test'
        }
    }
});
