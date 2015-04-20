/**
 * Copyright 2015 Solinea, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
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

var InfoButtonText = GoldstoneBaseModel.extend({
    defaults: {
        infoText: {

            // populate info-button-text here.
            // accepts html markup such as <br>

            discoverCloudTopology: 'This is the OpenStack topology map.  You ' +
                'can use leaf nodes to navigate to specific types of resources.',

            discoverZoomTopology: 'This is the OpenStack topology map.  Clicking ' +
                'branches will zoom in, clicking on leaf nodes will bring up information about resources. Click on the far left section to zoom out.',

            eventTimeline: 'The event timeline displays key events that have occurred ' +
                'in your cloud.  You can adjust the displayed data with the filter and ' +
                'time settings in the menu bar.  Hovering on an event brings up the ' +
                'event detail.',

            nodeAvailability: 'The node presence chart keeps track of the last time each ' +
                'node in the cloud was seen.  Nodes on the right have been seen more recently ' +
                'than nodes on the left.  The center lane shows nodes that have been detected ' +
                'in the log stream.  The top lane shows nodes that are not logging, but can be ' +
                'pinged.',

            serviceStatus: 'The service status panel shows the last known state of all OS services ' +
                'on the node.',

            utilization: 'The utilization charts show the OS level utilization of the node.',

            hypervisor: 'The hypervisor charts show the last known allocation and usage of resources ' +
                'across all of the VMs on the node.',

            novaTopologyDiscover: 'This is the OpenStack Nova topology map.  You ' +
                'can use leaf nodes to populate the resource list on the right.  In some cases, ' +
                'such as hypervisors, clicking a resource in the table will navigate you ' +
                'to a resource specific view.',

            cinderTopologyDiscover: 'This is the OpenStack Cinder topology map.  You ' +
                'can use leaf nodes to populate the resource list on the right.  In some cases, ' +
                'clicking a resource in the table will navigate you ' +
                'to a resource specific view.',

            glanceTopologyDiscover: 'This is the OpenStack Glance topology map.  You ' +
                'can use leaf nodes to populate the resource list on the right.  In some cases, ' +
                'clicking a resource in the table will navigate you ' +
                'to a resource specific view.',

            keystoneTopologyDiscover: 'This is the OpenStack Keystone topology map.  You ' +
                'can use leaf nodes to populate the resource list on the right.  In some cases, ' +
                'clicking a resource in the table will navigate you ' +
                'to a resource specific view.',

            novaSpawns: 'This chart displays VM spawn success and failure counts ' +
                'across your cloud.  You can adjust the displayed data with the ' +
                'time settings in the menu bar.  This data is derived from the ' +
                'log stream, so if no logging occurs for a period of time, gaps may ' +
                'appear in the data.',

            novaCpuResources: 'This chart displays aggregate CPU core allocation ' +
                'across your cloud.  You can adjust the displayed data with the ' +
                'time settings in the menu bar.  This data is derived from the ' +
                'log stream, so if no logging occurs for a period of time, gaps may ' +
                'appear in the data.',

            novaMemResources: 'This chart displays aggregate memory allocation ' +
                'across your cloud.  You can adjust the displayed data with the ' +
                'time settings in the menu bar.  This data is derived from the ' +
                'log stream, so if no logging occurs for a period of time, gaps may ' +
                'appear in the data.',

            novaDiskResources: 'This chart displays aggregate disk allocation ' +
                'across your cloud.  You can adjust the displayed data with the ' +
                'time settings in the menu bar.  This data is derived from the ' +
                'log stream, so if no logging occurs for a period of time, gaps may ' +
                'appear in the data.',

            searchLogAnalysis: 'This chart displays log stream data ' +
                'across your cloud.  You can adjust the displayed data with the ' +
                'time settings in the menu bar, and with the filter settings that double ' +
                'as a legend.  The table below contains the individual log entries for ' +
                'the time range and filter settings.',

            cloudTopologyResourceList: 'Click row for additional resource info.<br><br>' +
            'Clicking on hypervisor or hosts reports will navigate to additional report pages.'
        }
    }
});
