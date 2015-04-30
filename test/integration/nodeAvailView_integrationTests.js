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

/*global sinon, todo, chai, describe, it, calledOnce*/
//integration tests - nodeAvailView.js

describe('nodeAvailView.js spec', function() {
    beforeEach(function() {
        $('body').html('<div class="testContainer"></div>' +
            '<div style="width:10%;" class="col-xl-1 pull-right">&nbsp;' +
            '</div>' +
            '<div class="col-xl-2 pull-right">' +
            '<form class="global-refresh-selector" role="form">' +
            '<div class="form-group">' +
            '<div class="col-xl-1">' +
            '<div class="input-group">' +
            '<select class="form-control" id="global-refresh-range">' +
            '<option value="15">refresh 15s</option>' +
            '<option value="30" selected>refresh 30s</option>' +
            '<option value="60">refresh 1m</option>' +
            '<option value="300">refresh 5m</option>' +
            '<option value="-1">refresh off</option>' +
            '</select>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</form>' +
            '</div>' +
            '<div class="col-xl-1 pull-right">' +
            '<form class="global-lookback-selector" role="form">' +
            '<div class="form-group">' +
            '<div class="col-xl-1">' +
            '<div class="input-group">' +
            '<select class="form-control" id="global-lookback-range">' +
            '<option value="15">lookback 15m</option>' +
            '<option value="60" selected>lookback 1h</option>' +
            '<option value="360">lookback 6h</option>' +
            '<option value="1440">lookback 1d</option>' +
            '</select>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</form>' +
            '</div>');

        // to answer GET requests
        this.server = sinon.fakeServer.create();
        this.server.respondWith("GET", "/*", [200, {
            "Content-Type": "application/json"
        }, '{absolutely: "nothing"}']);

        // confirm that dom is clear of view elements before each test:
        expect($('svg').length).to.equal(0);
        expect($('#spinner').length).to.equal(0);

        this.testCollection = new NodeAvailCollection({
            url: '/something/fancy',
        });
        this.testCollection.reset();

        blueSpinnerGif = "goldstone/static/images/ajax-loader-solinea-blue.gif";

        this.testView = new NodeAvailView({
            collection: this.testCollection,
            h: {
                "main": 450,
                "swim": 50
            },
            el: '.testContainer',
            chartTitle: "Test Chart Title",
            width: 500
        });

        this.dummy0 = {
            "timestamps": [1427684400000, 1427688000000, 1427691600000, 1427695200000, 1427698800000, 1427702400000, 1427706000000, 1427709600000, 1427713200000, 1427716800000, 1427720400000, 1427724000000, 1427727600000, 1427731200000, 1427734800000],
            "levels": ["info", "warning", "error", "alert", "critical", "notice"],
            "hosts": ["ctrl-01", "rsrc-01", "rsrc-02", "0.0.0.0", "10.10.2.6:61076"],
            "data": [{
                "1427655600000": [{
                    "ctrl-01": [{
                        "info": 10822
                    }, {
                        "warning": 72
                    }, {
                        "error": 0
                    }, {
                        "notice": 0
                    }]
                }, {
                    "rsrc-02": [{
                        "info": 2014
                    }, {
                        "warning": 366
                    }, {
                        "error": 0
                    }, {
                        "notice": 0
                    }]
                }, {
                    "rsrc-01": [{
                        "info": 1773
                    }, {
                        "warning": 246
                    }, {
                        "error": 0
                    }, {
                        "notice": 0
                    }]
                }]
            }, {
                "1427659200000": [{
                    "ctrl-01": [{
                        "info": 10836
                    }, {
                        "warning": 72
                    }, {
                        "error": 0
                    }, {
                        "notice": 0
                    }]
                }, {
                    "rsrc-02": [{
                        "info": 2010
                    }, {
                        "warning": 366
                    }, {
                        "error": 0
                    }, {
                        "notice": 0
                    }]
                }, {
                    "rsrc-01": [{
                        "info": 1770
                    }, {
                        "warning": 246
                    }, {
                        "error": 0
                    }, {
                        "notice": 0
                    }]
                }]
            }, {
                "1427662800000": [{
                    "ctrl-01": [{
                        "info": 10804
                    }, {
                        "warning": 72
                    }, {
                        "error": 0
                    }, {
                        "notice": 0
                    }]
                }, {
                    "rsrc-02": [{
                        "info": 2013
                    }, {
                        "warning": 366
                    }, {
                        "error": 0
                    }, {
                        "notice": 0
                    }]
                }, {
                    "rsrc-01": [{
                        "info": 1774
                    }, {
                        "warning": 246
                    }, {
                        "error": 0
                    }, {
                        "notice": 0
                    }]
                }]
            }, {
                "1427666400000": [{
                    "ctrl-01": [{
                        "info": 10802
                    }, {
                        "warning": 72
                    }, {
                        "error": 0
                    }, {
                        "notice": 0
                    }]
                }, {
                    "rsrc-02": [{
                        "info": 2009
                    }, {
                        "warning": 366
                    }, {
                        "error": 0
                    }, {
                        "notice": 0
                    }]
                }, {
                    "rsrc-01": [{
                        "info": 1769
                    }, {
                        "warning": 246
                    }, {
                        "error": 0
                    }, {
                        "notice": 0
                    }]
                }]
            }, {
                "1427670000000": [{
                    "ctrl-01": [{
                        "info": 10782
                    }, {
                        "warning": 72
                    }, {
                        "error": 0
                    }, {
                        "notice": 0
                    }]
                }, {
                    "rsrc-02": [{
                        "info": 2015
                    }, {
                        "warning": 366
                    }, {
                        "error": 0
                    }, {
                        "notice": 0
                    }]
                }, {
                    "rsrc-01": [{
                        "info": 1773
                    }, {
                        "warning": 246
                    }, {
                        "error": 0
                    }, {
                        "notice": 0
                    }]
                }]
            }, {
                "1427673600000": [{
                    "ctrl-01": [{
                        "info": 10788
                    }, {
                        "warning": 72
                    }, {
                        "notice": 0
                    }]
                }, {
                    "rsrc-02": [{
                        "info": 2011
                    }, {
                        "warning": 366
                    }, {
                        "notice": 0
                    }]
                }, {
                    "rsrc-01": [{
                        "info": 1771
                    }, {
                        "warning": 246
                    }, {
                        "notice": 0
                    }]
                }]
            }, {
                "1427677200000": [{
                    "ctrl-01": [{
                        "info": 10816
                    }, {
                        "warning": 72
                    }, {
                        "notice": 0
                    }]
                }, {
                    "rsrc-02": [{
                        "info": 2011
                    }, {
                        "warning": 366
                    }, {
                        "notice": 0
                    }]
                }, {
                    "rsrc-01": [{
                        "info": 1773
                    }, {
                        "warning": 246
                    }, {
                        "notice": 0
                    }]
                }]
            }, {
                "1427680800000": [{
                    "ctrl-01": [{
                        "info": 10806
                    }, {
                        "warning": 72
                    }, {
                        "notice": 0
                    }]
                }, {
                    "rsrc-02": [{
                        "info": 2011
                    }, {
                        "warning": 366
                    }, {
                        "notice": 0
                    }]
                }, {
                    "rsrc-01": [{
                        "info": 1771
                    }, {
                        "warning": 246
                    }, {
                        "notice": 0
                    }]
                }]
            }, {
                "1427684400000": [{
                    "ctrl-01": [{
                        "info": 10820
                    }, {
                        "warning": 72
                    }, {
                        "notice": 0
                    }]
                }, {
                    "rsrc-02": [{
                        "info": 2015
                    }, {
                        "warning": 366
                    }, {
                        "notice": 0
                    }]
                }, {
                    "rsrc-01": [{
                        "info": 1776
                    }, {
                        "warning": 246
                    }, {
                        "notice": 0
                    }]
                }]
            }, {
                "1427688000000": [{
                    "ctrl-01": [{
                        "info": 10712
                    }, {
                        "warning": 72
                    }, {
                        "notice": 0
                    }]
                }, {
                    "rsrc-02": [{
                        "info": 2010
                    }, {
                        "warning": 366
                    }, {
                        "notice": 0
                    }]
                }, {
                    "rsrc-01": [{
                        "info": 1768
                    }, {
                        "warning": 246
                    }, {
                        "notice": 0
                    }]
                }]
            }, {
                "1427691600000": [{
                    "ctrl-01": [{
                        "info": 10772
                    }, {
                        "warning": 72
                    }, {
                        "notice": 0
                    }]
                }, {
                    "rsrc-02": [{
                        "info": 2012
                    }, {
                        "warning": 366
                    }, {
                        "notice": 0
                    }]
                }, {
                    "rsrc-01": [{
                        "info": 1769
                    }, {
                        "warning": 246
                    }, {
                        "notice": 0
                    }]
                }]
            }, {
                "1427695200000": [{
                    "ctrl-01": [{
                        "info": 10784
                    }, {
                        "warning": 72
                    }, {
                        "notice": 0
                    }]
                }, {
                    "rsrc-02": [{
                        "info": 2011
                    }, {
                        "warning": 366
                    }, {
                        "notice": 0
                    }]
                }, {
                    "rsrc-01": [{
                        "info": 1769
                    }, {
                        "warning": 246
                    }, {
                        "notice": 0
                    }]
                }]
            }, {
                "1427698800000": [{
                    "ctrl-01": [{
                        "info": 10806
                    }, {
                        "warning": 72
                    }, {
                        "notice": 0
                    }]
                }, {
                    "rsrc-02": [{
                        "info": 2014
                    }, {
                        "warning": 366
                    }, {
                        "notice": 0
                    }]
                }, {
                    "rsrc-01": [{
                        "info": 1775
                    }, {
                        "warning": 246
                    }, {
                        "notice": 0
                    }]
                }]
            }, {
                "1427702400000": [{
                    "ctrl-01": [{
                        "info": 10812
                    }, {
                        "warning": 72
                    }, {
                        "notice": 0
                    }]
                }, {
                    "rsrc-02": [{
                        "info": 2010
                    }, {
                        "warning": 366
                    }, {
                        "notice": 0
                    }]
                }, {
                    "rsrc-01": [{
                        "info": 1771
                    }, {
                        "warning": 246
                    }, {
                        "notice": 0
                    }]
                }]
            }, {
                "1427706000000": [{
                    "ctrl-01": [{
                        "info": 10822
                    }, {
                        "warning": 72
                    }, {
                        "notice": 0
                    }]
                }, {
                    "rsrc-02": [{
                        "info": 2014
                    }, {
                        "warning": 366
                    }, {
                        "notice": 0
                    }]
                }, {
                    "rsrc-01": [{
                        "info": 1762
                    }, {
                        "warning": 246
                    }, {
                        "notice": 0
                    }]
                }]
            }, {
                "1427709600000": [{
                    "ctrl-01": [{
                        "info": 10763
                    }, {
                        "warning": 72
                    }, {
                        "notice": 0
                    }]
                }, {
                    "rsrc-02": [{
                        "info": 2010
                    }, {
                        "warning": 366
                    }, {
                        "notice": 0
                    }]
                }, {
                    "rsrc-01": [{
                        "info": 1753
                    }, {
                        "warning": 242
                    }, {
                        "notice": 0
                    }]
                }]
            }, {
                "1427713200000": [{
                    "ctrl-01": [{
                        "info": 10792
                    }, {
                        "warning": 72
                    }, {
                        "notice": 0
                    }]
                }, {
                    "rsrc-02": [{
                        "info": 1983
                    }, {
                        "warning": 360
                    }, {
                        "notice": 0
                    }]
                }, {
                    "rsrc-01": [{
                        "info": 1775
                    }, {
                        "warning": 246
                    }, {
                        "notice": 0
                    }]
                }]
            }, {
                "1427716800000": [{
                    "ctrl-01": [{
                        "info": 10784
                    }, {
                        "warning": 72
                    }, {
                        "notice": 0
                    }]
                }, {
                    "rsrc-02": [{
                        "info": 2009
                    }, {
                        "warning": 366
                    }, {
                        "notice": 0
                    }]
                }, {
                    "rsrc-01": [{
                        "info": 1771
                    }, {
                        "warning": 246
                    }, {
                        "notice": 0
                    }]
                }]
            }, {
                "1427720400000": [{
                    "ctrl-01": [{
                        "info": 10790
                    }, {
                        "warning": 72
                    }, {
                        "notice": 0
                    }]
                }, {
                    "rsrc-02": [{
                        "info": 2015
                    }, {
                        "warning": 366
                    }, {
                        "notice": 0
                    }]
                }, {
                    "rsrc-01": [{
                        "info": 1774
                    }, {
                        "warning": 246
                    }, {
                        "notice": 0
                    }]
                }]
            }, {
                "1427724000000": [{
                    "ctrl-01": [{
                        "info": 10816
                    }, {
                        "warning": 72
                    }, {
                        "notice": 0
                    }]
                }, {
                    "rsrc-02": [{
                        "info": 2011
                    }, {
                        "warning": 366
                    }, {
                        "notice": 0
                    }]
                }, {
                    "rsrc-01": [{
                        "info": 1771
                    }, {
                        "warning": 246
                    }, {
                        "notice": 0
                    }]
                }]
            }, {
                "1427727600000": [{
                    "ctrl-01": [{
                        "info": 10808
                    }, {
                        "warning": 72
                    }, {
                        "notice": 0
                    }]
                }, {
                    "rsrc-02": [{
                        "info": 2014
                    }, {
                        "warning": 366
                    }, {
                        "notice": 0
                    }]
                }, {
                    "rsrc-01": [{
                        "info": 1774
                    }, {
                        "warning": 246
                    }, {
                        "notice": 0
                    }]
                }]
            }, {
                "1427731200000": [{
                    "ctrl-01": [{
                        "info": 10730
                    }, {
                        "warning": 72
                    }, {
                        "notice": 0
                    }]
                }, {
                    "rsrc-02": [{
                        "info": 2010
                    }, {
                        "warning": 366
                    }, {
                        "notice": 0
                    }]
                }, {
                    "rsrc-01": [{
                        "info": 1770
                    }, {
                        "warning": 246
                    }, {
                        "notice": 0
                    }]
                }]
            }, {
                "1427734800000": [{
                    "ctrl-01": [{
                        "info": 7914
                    }, {
                        "warning": 50
                    }, {
                        "notice": 0
                    }]
                }, {
                    "rsrc-02": [{
                        "info": 1475
                    }, {
                        "warning": 268
                    }, {
                        "notice": 0
                    }]
                }, {
                    "rsrc-01": [{
                        "info": 1300
                    }, {
                        "warning": 180
                    }, {
                        "notice": 0
                    }]
                }]
            }]
        };

        this.dummy1 = {
            "timestamps": [1426550400000, 1426636800000, 1426723200000, 1426809600000, 1426896000000, 1426982400000, 1427068800000, 1427155200000, 1427241600000, 1427328000000, 1427414400000, 1427500800000, 1427587200000, 1427673600000],
            "levels": ["info", "warning", "error", "alert", "critical", "notice"],
            "hosts": ["ctrl-01", "rsrc-01", "rsrc-02", "0.0.0.0", "10.10.2.6:61076"],
            "data": [{
                "1426550400000": [{
                    "rsrc-01": [{
                        "info": 2023
                    }, {
                        "warning": 144
                    }, {
                        "critical": 0
                    }, {
                        "error": 0
                    }, {
                        "notice": 0
                    }]
                }, {
                    "10.10.2.6:61076": []
                }]
            }, {
                "1426636800000": [{
                    "ctrl-01": [{
                        "info": 53331
                    }, {
                        "warning": 1518
                    }, {
                        "error": 36
                    }, {
                        "alert": 0
                    }, {
                        "critical": 0
                    }, {
                        "notice": 0
                    }]
                }, {
                    "rsrc-01": [{
                        "info": 5827
                    }, {
                        "warning": 680
                    }, {
                        "error": 11
                    }, {
                        "alert": 0
                    }, {
                        "critical": 0
                    }, {
                        "notice": 0
                    }]
                }, {
                    "rsrc-02": [{
                        "info": 1894
                    }, {
                        "warning": 129
                    }, {
                        "error": 42
                    }, {
                        "alert": 0
                    }, {
                        "critical": 0
                    }, {
                        "notice": 0
                    }]
                }, {
                    "0.0.0.0": []
                }]
            }, {
                "1426723200000": [{
                    "ctrl-01": [{
                        "info": 56623
                    }, {
                        "warning": 1657
                    }, {
                        "notice": 0
                    }]
                }, {
                    "rsrc-01": [{
                        "info": 6147
                    }, {
                        "warning": 720
                    }, {
                        "notice": 0
                    }]
                }, {
                    "rsrc-02": [{
                        "info": 2042
                    }, {
                        "warning": 144
                    }, {
                        "notice": 0
                    }]
                }]
            }, {
                "1426809600000": [{
                    "ctrl-01": [{
                        "info": 62673
                    }, {
                        "warning": 1657
                    }, {
                        "error": 1
                    }, {
                        "notice": 0
                    }]
                }, {
                    "rsrc-01": [{
                        "info": 6109
                    }, {
                        "warning": 718
                    }, {
                        "error": 0
                    }, {
                        "notice": 0
                    }]
                }, {
                    "rsrc-02": [{
                        "info": 2029
                    }, {
                        "warning": 144
                    }, {
                        "error": 0
                    }, {
                        "notice": 0
                    }]
                }]
            }, {
                "1426896000000": [{
                    "ctrl-01": [{
                        "info": 86931
                    }, {
                        "warning": 1650
                    }, {
                        "notice": 0
                    }]
                }, {
                    "rsrc-01": [{
                        "info": 6131
                    }, {
                        "warning": 721
                    }, {
                        "notice": 0
                    }]
                }, {
                    "rsrc-02": [{
                        "info": 2031
                    }, {
                        "warning": 144
                    }, {
                        "notice": 0
                    }]
                }]
            }, {
                "1426982400000": [{
                    "ctrl-01": [{
                        "info": 87544
                    }, {
                        "warning": 1656
                    }, {
                        "notice": 0
                    }]
                }, {
                    "rsrc-01": [{
                        "info": 6115
                    }, {
                        "warning": 720
                    }, {
                        "notice": 0
                    }]
                }, {
                    "rsrc-02": [{
                        "info": 2029
                    }, {
                        "warning": 143
                    }, {
                        "notice": 0
                    }]
                }]
            }, {
                "1427068800000": [{
                    "ctrl-01": [{
                        "info": 87741
                    }, {
                        "warning": 1661
                    }, {
                        "error": 4
                    }, {
                        "notice": 0
                    }]
                }, {
                    "rsrc-01": [{
                        "info": 6117
                    }, {
                        "warning": 720
                    }, {
                        "error": 0
                    }, {
                        "notice": 0
                    }]
                }, {
                    "rsrc-02": [{
                        "info": 2038
                    }, {
                        "warning": 144
                    }, {
                        "error": 0
                    }, {
                        "notice": 0
                    }]
                }]
            }, {
                "1427155200000": [{
                    "ctrl-01": [{
                        "info": 90158
                    }, {
                        "warning": 1650
                    }, {
                        "notice": 0
                    }]
                }, {
                    "rsrc-01": [{
                        "info": 6121
                    }, {
                        "warning": 720
                    }, {
                        "notice": 0
                    }]
                }, {
                    "rsrc-02": [{
                        "info": 2023
                    }, {
                        "warning": 144
                    }, {
                        "notice": 0
                    }]
                }]
            }, {
                "1427241600000": [{
                    "ctrl-01": [{
                        "info": 93059
                    }, {
                        "warning": 1656
                    }, {
                        "notice": 0
                    }]
                }, {
                    "rsrc-01": [{
                        "info": 6118
                    }, {
                        "warning": 719
                    }, {
                        "notice": 0
                    }]
                }, {
                    "rsrc-02": [{
                        "info": 2032
                    }, {
                        "warning": 144
                    }, {
                        "notice": 0
                    }]
                }]
            }, {
                "1427328000000": [{
                    "ctrl-01": [{
                        "info": 106924
                    }, {
                        "warning": 1660
                    }, {
                        "error": 0
                    }, {
                        "notice": 0
                    }]
                }, {
                    "rsrc-01": [{
                        "info": 6156
                    }, {
                        "warning": 723
                    }, {
                        "error": 0
                    }, {
                        "notice": 0
                    }]
                }, {
                    "rsrc-02": [{
                        "info": 2060
                    }, {
                        "warning": 145
                    }, {
                        "error": 0
                    }, {
                        "notice": 0
                    }]
                }]
            }, {
                "1427414400000": [{
                    "ctrl-01": [{
                        "info": 117597
                    }, {
                        "warning": 1641
                    }, {
                        "notice": 0
                    }]
                }, {
                    "rsrc-01": [{
                        "info": 36101
                    }, {
                        "warning": 2504
                    }, {
                        "notice": 0
                    }]
                }, {
                    "rsrc-02": [{
                        "info": 2033
                    }, {
                        "warning": 144
                    }, {
                        "notice": 0
                    }]
                }]
            }, {
                "1427500800000": [{
                    "ctrl-01": [{
                        "info": 54669
                    }, {
                        "warning": 993
                    }, {
                        "error": 9
                    }, {
                        "critical": 0
                    }, {
                        "notice": 0
                    }]
                }, {
                    "rsrc-01": [{
                        "info": 17034
                    }, {
                        "warning": 2343
                    }, {
                        "error": 12
                    }, {
                        "critical": 0
                    }, {
                        "notice": 0
                    }]
                }, {
                    "rsrc-02": [{
                        "info": 3065
                    }, {
                        "warning": 437
                    }, {
                        "error": 8
                    }, {
                        "critical": 0
                    }, {
                        "notice": 0
                    }]
                }]
            }, {
                "1427587200000": [{
                    "ctrl-01": [{
                        "info": 234656
                    }, {
                        "warning": 1730
                    }, {
                        "error": 2
                    }, {
                        "notice": 0
                    }]
                }, {
                    "rsrc-01": [{
                        "info": 42495
                    }, {
                        "warning": 5899
                    }, {
                        "error": 0
                    }, {
                        "notice": 0
                    }]
                }, {
                    "rsrc-02": [{
                        "info": 40763
                    }, {
                        "warning": 7382
                    }, {
                        "error": 2
                    }, {
                        "notice": 0
                    }]
                }]
            }, {
                "1427673600000": [{
                    "ctrl-01": [{
                        "info": 191335
                    }, {
                        "warning": 1274
                    }, {
                        "notice": 0
                    }]
                }, {
                    "rsrc-02": [{
                        "info": 35646
                    }, {
                        "warning": 6484
                    }, {
                        "notice": 0
                    }]
                }, {
                    "rsrc-01": [{
                        "info": 31393
                    }, {
                        "warning": 4358
                    }, {
                        "notice": 0
                    }]
                }]
            }]
        };

        this.testView.defaults.dataToCombine[0] = this.dummy0;

        this.testView.defaults.dataToCombine[1] = this.dummy1;

    });
    afterEach(function() {
        $('body').html('');
        this.server.restore();
    });
    describe('collection is constructed', function() {
        it('should exist', function() {
            assert.isDefined(this.testCollection, 'this.testCollection has been defined');
            expect(this.testCollection.parse).to.be.a('function');
            expect(this.testCollection.length).to.equal(0);
            this.testCollection.add({
                test1: 'test1'
            });
            expect(this.testCollection.length).to.equal(1);
            this.testCollection.pop();
            expect(this.testCollection.length).to.equal(0);
        });
        it('should parse appropriate', function() {
            var testData = {
                a: "blah",
                b: "wah",
                results: [1, 2, 3]
            };
            var test1 = this.testCollection.parse(testData);
            expect(test1).to.deep.equal({
                a: "blah",
                b: "wah",
                results: [1, 2, 3]
            });
            testData = {
                a: "blah",
                b: "wah",
                results: [1, 2, 3],
                next: null
            };
            var test2 = this.testCollection.parse(testData);
            expect(test2).to.deep.equal({
                a: "blah",
                b: "wah",
                results: [1, 2, 3],
                next: null
            });
            testData = {
                a: "blah",
                b: "wah",
                results: [1, 2, 3],
                next: 'fantastic/loggin/urls/forever'
            };
            var test3 = this.testCollection.parse(testData);
            expect(test3).to.deep.equal({
                a: "blah",
                b: "wah",
                results: [1, 2, 3],
                next: 'fantastic/loggin/urls/forever'
            });
        });
    });

    describe('view is constructed', function() {
        it('combines datasets properly even if out of order in the array', function() {
            var dataArray = [];
            dataArray[0] = [{
                alert_count: 0,
                created: 1427151600000,
                critical_count: 0,
                debug_count: 0,
                emergency_count: 0,
                error_count: 0,
                id: "ctrl-01",
                info_count: 2025,
                managed: true,
                name: "ctrl-01",
                notice_count: 0,
                update_method: "LOGS",
                updated: 1427151600000,
                warning_count: 36,
            }, {
                alert_count: 0,
                created: 1427151600000,
                critical_count: 0,
                debug_count: 0,
                emergency_count: 0,
                error_count: 0,
                id: "rsrc-01",
                info_count: 133,
                managed: true,
                name: "rsrc-01",
                notice_count: 0,
                update_method: "LOGS",
                updated: 1427151600000,
                warning_count: 15,
            }, {
                alert_count: 0,
                created: 1427151600000,
                critical_count: 0,
                debug_count: 0,
                emergency_count: 0,
                error_count: 0,
                id: "rsrc-02",
                info_count: 46,
                managed: true,
                name: "rsrc-02",
                notice_count: 0,
                update_method: "LOGS",
                updated: 1427151600000,
                warning_count: 3,
            }];

            dataArray[1] = [{
                alert_count: 0,
                created: 1427068800000,
                critical_count: 0,
                debug_count: 0,
                emergency_count: 0,
                error_count: 0,
                id: "rsrc-01",
                info_count: 5970,
                managed: true,
                name: "rsrc-01",
                notice_count: 0,
                update_method: "LOGS",
                updated: 1427068800000,
                warning_count: 701,

            }, {
                alert_count: 0,
                created: 1427068800000,
                critical_count: 0,
                debug_count: 0,
                emergency_count: 0,
                error_count: 0,
                id: "rsrc-02",
                info_count: 2002,
                managed: true,
                name: "rsrc-02",
                notice_count: 0,
                update_method: "LOGS",
                updated: 1427068800000,
                warning_count: 141,
            }, {
                alert_count: 0,
                created: 1427068800000,
                critical_count: 0,
                debug_count: 0,
                emergency_count: 0,
                error_count: 4,
                id: "ctrl-01",
                info_count: 86013,
                managed: true,
                name: "ctrl-01",
                notice_count: 0,
                update_method: "LOGS",
                updated: 1427068800000,
                warning_count: 1628,
            }];

            var test1 = this.testView.combineDatasets(dataArray);
            expect(test1[2]).to.deep.equal({
                alert_count: 0,
                created: 1427151600000,
                critical_count: 0,
                debug_count: 0,
                emergency_count: 0,
                error_count: 0,
                id: "rsrc-02",
                info_count: 2002,
                managed: true,
                name: "rsrc-02",
                notice_count: 0,
                update_method: "LOGS",
                updated: 1427151600000,
                warning_count: 141,
            });
            expect(test1[1]).to.deep.equal({
                alert_count: 0,
                created: 1427151600000,
                critical_count: 0,
                debug_count: 0,
                emergency_count: 0,
                error_count: 0,
                id: "rsrc-01",
                info_count: 5970,
                managed: true,
                name: "rsrc-01",
                notice_count: 0,
                update_method: "LOGS",
                updated: 1427151600000,
                warning_count: 701,
            });
            expect(test1[0]).to.deep.equal({
                alert_count: 0,
                created: 1427151600000,
                critical_count: 0,
                debug_count: 0,
                emergency_count: 0,
                error_count: 4,
                id: "ctrl-01",
                info_count: 86013,
                managed: true,
                name: "ctrl-01",
                notice_count: 0,
                update_method: "LOGS",
                updated: 1427151600000,
                warning_count: 1628,
            });

        });
        it('should exist', function() {
            assert.isDefined(this.testView, 'this.testView has been defined');
            expect(this.testView).to.be.an('object');
            expect(this.testView.el).to.equal('.testContainer');
        });
        it('populates tooltips properly', function() {
            assert.isDefined(this.testView.formatTooltip, 'this.testView.formatTooltip has been defined');
            var testData = {
                alert_count: 0,
                created: 1430366537873,
                critical_count: 0,
                debug_count: 0,
                emergency_count: 0,
                error_count: 20,
                id: "ctrl-01",
                info_count: 10891,
                level: "error",
                managed: true,
                name: "ctrl-01",
                notice_count: 17,
                swimlane: "logs",
                update_method: "LOGS",
                updated: 1430366537873,
                warning_count: 171
            };
            var test1 = this.testView.formatTooltip(testData);
            expect(test1).to.equal('' +
                '<div class="text-right">Host: ctrl-01<br>Time: Wed Apr 29 2015 21:02:17 GMT-0700 (PDT)<br>Error: 20<br>Warning: 171<br>Notice: 17<br>Info: 10891<br></div>'
            );
            testData = {
                alert_count: 0,
                created: 1430366537873,
                critical_count: 0,
                debug_count: 0,
                emergency_count: 0,
                error_count: 0,
                id: "ctrl-01",
                info_count: 0,
                level: "error",
                managed: true,
                name: "ctrl-01",
                notice_count: 0,
                swimlane: "logs",
                update_method: "LOGS",
                updated: 1430366537873,
                warning_count: 0
            };
            var test2 = this.testView.formatTooltip(testData);
            expect(test2).to.equal('' +
                '<div class="text-right">Host: ctrl-01<br>Time: Wed Apr 29 2015 21:02:17 GMT-0700 (PDT)<br></div>'
            );
            testData = {
                alert_count: 10,
                created: 1430366537873,
                critical_count: 20,
                debug_count: 30,
                emergency_count: 40,
                error_count: 50,
                id: "ctrl-01",
                info_count: 60,
                level: "error",
                managed: true,
                name: "ctrl-01",
                notice_count: 70,
                swimlane: "logs",
                update_method: "LOGS",
                updated: 1430366537873,
                warning_count: 80
            };
            var test3 = this.testView.formatTooltip(testData);
            expect(test3).to.equal('' +
                '<div class="text-right">Host: ctrl-01<br>Time: Wed Apr 29 2015 21:02:17 GMT-0700 (PDT)<br>Emergency: 40<br>Alert: 10<br>Critical: 20<br>Error: 50<br>Warning: 80<br>Notice: 70<br>Info: 60<br>Debug: 30<br></div>'
            );
            testData = {
                created: 1430366537873,
            };
            var test4 = this.testView.formatTooltip(testData);
            expect(test4).to.equal('' +
                '<div class="text-right">Host: undefined<br>Time: Wed Apr 29 2015 21:02:17 GMT-0700 (PDT)<br></div>'
            );
        });
        it('view update appends svg and border elements', function() {
            expect(this.testView.update).to.be.a('function');
            expect($('svg').length).to.equal(1);
            expect($('g').find('.axis').text()).to.equal('');
            expect($('.panel-title').text().trim()).to.equal('Test Chart Title');
            expect($('svg').text()).to.not.include('Response was empty');
        });
        it('can handle a null server payload and append appropriate response', function() {
            this.update_spy = sinon.spy(this.testView, "update");
            expect($('.popup-message').length).to.equal(1);
            expect($('.popup-message').text()).to.equal('');
            this.testCollection.reset();
            this.testView.update();
            expect($('.testContainer').find('.popup-message').length).to.equal(1);
            expect($('.popup-message').text()).to.equal('No Data Returned');
            // it doesn't RE-apply 'No Data Returned' if it's already there:
            this.testView.update();
            expect($('.testContainer').find('.popup-message').length).to.equal(1);
            expect($('.popup-message').text()).to.equal('No Data Returned');
            // it REMOVES 'No Data Returned' if data starts flowing again:
            this.testCollection.add({
                "id": "46b24373-eedc-43d5-9543-19dea317d88f",
                "name": "compute-01",
                "created": "2014-10-27T19:27:17Z",
                "updated": "2014-10-28T18:33:18Z",
                "update_method": "LOGS",
                "managed": false,
                "error_count": 10,
                "warning_count": 4,
                "info_count": 33,
                "audit_count": 551,
                "debug_count": 0,
                "polymorphic_ctype": 12
            });
            this.testView.update();
            expect($('.testContainer').find('.popup-message').length).to.equal(1);
            expect($('.popup-message').text()).to.equal('No Data Returned');
            expect(this.update_spy.callCount).to.equal(3);
            this.update_spy.restore();
        });
        it('populates the event filters', function() {

            this.testView.defaults.dataToCombine[0] = this.dummy0;
            this.testView.defaults.dataToCombine[1] = this.dummy1;

            //TODO: FIX THIS ONE
            this.testView.update();
            expect($('#populateEventFilters').children().length).to.equal(0);
        });
        it('sums appropriately based on filter and count', function() {
            var testData = {
                "info_count": 42
            };
            var test1 = this.testView.sums(testData);
            expect(test1).to.equal(42);

            this.testView.defaults.filter.info_count = false;
            testData = {
                "info_count": 0
            };
            var test2 = this.testView.sums(testData);
            expect(test2).to.equal(0);

            this.testView.defaults.filter.info = false;
            testData = {
                "info_count": 42
            };
            var test3 = this.testView.sums(testData);
            expect(test3).to.equal(0);
        });
        it('redraws successfully', function() {
            expect(this.testView.redraw).is.a('function');

            this.testView.defaults.dataset = this.testCollection.toJSON();

            this.testView.redraw();
        });
        it('appends circles upon update', function() {
            expect($('svg').find('circle').length).to.equal(0);
            this.testView.update();
            expect($('svg').find('circle').length).to.equal(0);
        });
        it('can utilize the dataErrorMessage machinery to append a variety of errors', function() {
            this.dataErrorMessage_spy = sinon.spy(this.testView, "dataErrorMessage");
            expect($('.popup-message').text()).to.equal('');
            this.testView.dataErrorMessage(null, {
                status: '999',
                responseText: 'naughty - coal for you!'
            });
            expect($('.popup-message').text()).to.equal('999 error: naughty - coal for you!.');
            this.testView.dataErrorMessage(null, {
                status: '123',
                responseText: 'nice - bourbon for you!'
            });
            expect($('.popup-message').text()).to.equal('123 error: nice - bourbon for you!.');
            this.testView.dataErrorMessage('butterfly - spread your wings again');
            expect($('.popup-message').text()).to.equal('butterfly - spread your wings again');
            this.testView.clearDataErrorMessage();
            expect($('#noDataReturned').text()).to.equal('');
            expect(this.dataErrorMessage_spy.callCount).to.equal(3);
            this.dataErrorMessage_spy.restore();
        });
    });
});
