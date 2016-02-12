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

var TopologyPageView = GoldstoneBasePageView.extend({

    // overwritten as there is not trigger functionality to topology
    triggerChange: function(change) {
        return true;
    },

    renderCharts: function() {

        //---------------------------
        // instantiate Cloud Topology chart

        this.discoverTreeCollection = new GoldstoneBaseCollection({
            urlBase: "/core/topology/"
        });

        this.topologyTreeView = new TopologyTreeView({
            blueSpinnerGif: blueSpinnerGif,
            collection: this.discoverTreeCollection,
            chartTitle: goldstone.translate('Cloud Topology'),
            el: '#goldstone-discover-r1-c1',
            height: 700,
            infoText: 'discoverCloudTopology',
            multiRsrcViewEl: '#goldstone-discover-r1-c2',
            width: $('#goldstone-discover-r1-c2').width(),
        });

    },

    template: _.template('' +
        '<div id="goldstone-discover-r1" class="row">' +
        '<div id="goldstone-discover-r1-c1" class="col-md-6"></div>' +
        '<div id="goldstone-discover-r1-c2" class="col-md-6"></div>' +
        '</div>' 
    )

});
