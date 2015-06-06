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

// define collection and link to model

var apiRedoCollection = GoldstoneBaseCollection.extend({
    instanceSpecificInit: function() {
        var self = this;
        setTimeout(function() {
            self.reset();
            // self.add(self.setRandomData());
            self.parse(self.testData);
        }, 1000);
    },

    preProcessData: function(data) {
        var self = this;
        _.each(self.testData.per_interval, function(item) {
            item.time = parseInt(_.keys(item)[0], 10);
            item = self.flattenObj(item);
            self.add(item);
        });
        self.trigger('sync');
    },

    // setRandomData: function() {
    //     var result = [];
    //     var baseTime = 1429488000000;
    //     for (var i = 0; i < (Math.floor(Math.random() * 20) + 10); i++) {
    //         result.push({
    //             time: baseTime,
    //             "count": Math.floor(Math.random() * 100)
    //         });
    //         baseTime += 10000;
    //     }
    //     return result;
    // },

    fetch: function() {
        this.reset();
        this.add(this.setRandomData());
        this.trigger('sync');
    },

    testData: {
        "per_interval": [{
            "1433976525000": {
                "count": 0,
                "response_status": [{
                    "500.0-599.0": 0
                }, {
                    "400.0-499.0": 0
                }, {
                    "300.0-399.0": 0
                }, {
                    "200.0-299.0": 0
                }],
                "stats": {
                    "count": 0,
                    "min": null,
                    "sum_of_squares": null,
                    "max": null,
                    "sum": null,
                    "std_deviation": null,
                    "std_deviation_bounds": {
                        "upper": null,
                        "lower": null
                    },
                    "variance": null,
                    "avg": null
                }
            }
        }, {
            "1433976540000": {
                "count": 2,
                "response_status": [{
                    "500.0-599.0": 0
                }, {
                    "400.0-499.0": 0
                }, {
                    "300.0-399.0": 0
                }, {
                    "200.0-299.0": 2
                }],
                "stats": {
                    "count": 2,
                    "min": 0.103232,
                    "sum_of_squares": 0.038355125008,
                    "max": 0.166428,
                    "sum": 0.26966,
                    "std_deviation": 0.03159799999999999,
                    "std_deviation_bounds": {
                        "upper": 0.19802599999999998,
                        "lower": 0.07163400000000003
                    },
                    "variance": 0.0009984336039999993,
                    "avg": 0.13483
                }
            }
        }, {
            "1433976555000": {
                "count": 0,
                "response_status": [{
                    "500.0-599.0": 0
                }, {
                    "400.0-499.0": 0
                }, {
                    "300.0-399.0": 0
                }, {
                    "200.0-299.0": 0
                }],
                "stats": {
                    "count": 0,
                    "min": null,
                    "sum_of_squares": null,
                    "max": null,
                    "sum": null,
                    "std_deviation": null,
                    "std_deviation_bounds": {
                        "upper": null,
                        "lower": null
                    },
                    "variance": null,
                    "avg": null
                }
            }
        }, {
            "1433976570000": {
                "count": 0,
                "response_status": [{
                    "500.0-599.0": 0
                }, {
                    "400.0-499.0": 0
                }, {
                    "300.0-399.0": 0
                }, {
                    "200.0-299.0": 0
                }],
                "stats": {
                    "count": 0,
                    "min": null,
                    "sum_of_squares": null,
                    "max": null,
                    "sum": null,
                    "std_deviation": null,
                    "std_deviation_bounds": {
                        "upper": null,
                        "lower": null
                    },
                    "variance": null,
                    "avg": null
                }
            }
        }, {
            "1433976585000": {
                "count": 0,
                "response_status": [{
                    "500.0-599.0": 0
                }, {
                    "400.0-499.0": 0
                }, {
                    "300.0-399.0": 0
                }, {
                    "200.0-299.0": 0
                }],
                "stats": {
                    "count": 0,
                    "min": null,
                    "sum_of_squares": null,
                    "max": null,
                    "sum": null,
                    "std_deviation": null,
                    "std_deviation_bounds": {
                        "upper": null,
                        "lower": null
                    },
                    "variance": null,
                    "avg": null
                }
            }
        }, {
            "1433976600000": {
                "count": 6,
                "response_status": [{
                    "500.0-599.0": 0
                }, {
                    "400.0-499.0": 0
                }, {
                    "300.0-399.0": 0
                }, {
                    "200.0-299.0": 6
                }],
                "stats": {
                    "count": 6,
                    "min": 0.033241,
                    "sum_of_squares": 0.037151859424,
                    "max": 0.142279,
                    "sum": 0.41316400000000003,
                    "std_deviation": 0.03808129668077083,
                    "std_deviation_bounds": {
                        "upper": 0.1450232600282083,
                        "lower": -0.007301926694874991
                    },
                    "variance": 0.0014501851568888876,
                    "avg": 0.06886066666666667
                }
            }
        }, {
            "1433976615000": {
                "count": 0,
                "response_status": [{
                    "500.0-599.0": 0
                }, {
                    "400.0-499.0": 0
                }, {
                    "300.0-399.0": 0
                }, {
                    "200.0-299.0": 0
                }],
                "stats": {
                    "count": 0,
                    "min": null,
                    "sum_of_squares": null,
                    "max": null,
                    "sum": null,
                    "std_deviation": null,
                    "std_deviation_bounds": {
                        "upper": null,
                        "lower": null
                    },
                    "variance": null,
                    "avg": null
                }
            }
        }, {
            "1433976630000": {
                "count": 0,
                "response_status": [{
                    "500.0-599.0": 0
                }, {
                    "400.0-499.0": 0
                }, {
                    "300.0-399.0": 0
                }, {
                    "200.0-299.0": 0
                }],
                "stats": {
                    "count": 0,
                    "min": null,
                    "sum_of_squares": null,
                    "max": null,
                    "sum": null,
                    "std_deviation": null,
                    "std_deviation_bounds": {
                        "upper": null,
                        "lower": null
                    },
                    "variance": null,
                    "avg": null
                }
            }
        }, {
            "1433976645000": {
                "count": 0,
                "response_status": [{
                    "500.0-599.0": 0
                }, {
                    "400.0-499.0": 0
                }, {
                    "300.0-399.0": 0
                }, {
                    "200.0-299.0": 0
                }],
                "stats": {
                    "count": 0,
                    "min": null,
                    "sum_of_squares": null,
                    "max": null,
                    "sum": null,
                    "std_deviation": null,
                    "std_deviation_bounds": {
                        "upper": null,
                        "lower": null
                    },
                    "variance": null,
                    "avg": null
                }
            }
        }, {
            "1433976660000": {
                "count": 2,
                "response_status": [{
                    "500.0-599.0": 0
                }, {
                    "400.0-499.0": 0
                }, {
                    "300.0-399.0": 0
                }, {
                    "200.0-299.0": 2
                }],
                "stats": {
                    "count": 2,
                    "min": 0.066502,
                    "sum_of_squares": 0.020860576524999997,
                    "max": 0.128211,
                    "sum": 0.194713,
                    "std_deviation": 0.030854499999999993,
                    "std_deviation_bounds": {
                        "upper": 0.15906549999999997,
                        "lower": 0.03564750000000001
                    },
                    "variance": 0.0009520001702499996,
                    "avg": 0.0973565
                }
            }
        }, {
            "1433976675000": {
                "count": 2,
                "response_status": [{
                    "500.0-599.0": 0
                }, {
                    "400.0-499.0": 0
                }, {
                    "300.0-399.0": 0
                }, {
                    "200.0-299.0": 2
                }],
                "stats": {
                    "count": 2,
                    "min": 0.072004,
                    "sum_of_squares": 0.021040926100000003,
                    "max": 0.125922,
                    "sum": 0.197926,
                    "std_deviation": 0.026959000000000045,
                    "std_deviation_bounds": {
                        "upper": 0.1528810000000001,
                        "lower": 0.045044999999999905
                    },
                    "variance": 0.0007267876810000025,
                    "avg": 0.098963
                }
            }
        }, {
            "1433976690000": {
                "count": 0,
                "response_status": [{
                    "500.0-599.0": 0
                }, {
                    "400.0-499.0": 0
                }, {
                    "300.0-399.0": 0
                }, {
                    "200.0-299.0": 0
                }],
                "stats": {
                    "count": 0,
                    "min": null,
                    "sum_of_squares": null,
                    "max": null,
                    "sum": null,
                    "std_deviation": null,
                    "std_deviation_bounds": {
                        "upper": null,
                        "lower": null
                    },
                    "variance": null,
                    "avg": null
                }
            }
        }, {
            "1433976705000": {
                "count": 0,
                "response_status": [{
                    "500.0-599.0": 0
                }, {
                    "400.0-499.0": 0
                }, {
                    "300.0-399.0": 0
                }, {
                    "200.0-299.0": 0
                }],
                "stats": {
                    "count": 0,
                    "min": null,
                    "sum_of_squares": null,
                    "max": null,
                    "sum": null,
                    "std_deviation": null,
                    "std_deviation_bounds": {
                        "upper": null,
                        "lower": null
                    },
                    "variance": null,
                    "avg": null
                }
            }
        }, {
            "1433976720000": {
                "count": 2,
                "response_status": [{
                    "500.0-599.0": 0
                }, {
                    "400.0-499.0": 0
                }, {
                    "300.0-399.0": 0
                }, {
                    "200.0-299.0": 2
                }],
                "stats": {
                    "count": 2,
                    "min": 0.068806,
                    "sum_of_squares": 0.023357234792,
                    "max": 0.136466,
                    "sum": 0.205272,
                    "std_deviation": 0.033829999999999985,
                    "std_deviation_bounds": {
                        "upper": 0.17029599999999998,
                        "lower": 0.034976000000000035
                    },
                    "variance": 0.001144468899999999,
                    "avg": 0.102636
                }
            }
        }, {
            "1433976735000": {
                "count": 0,
                "response_status": [{
                    "500.0-599.0": 0
                }, {
                    "400.0-499.0": 0
                }, {
                    "300.0-399.0": 0
                }, {
                    "200.0-299.0": 0
                }],
                "stats": {
                    "count": 0,
                    "min": null,
                    "sum_of_squares": null,
                    "max": null,
                    "sum": null,
                    "std_deviation": null,
                    "std_deviation_bounds": {
                        "upper": null,
                        "lower": null
                    },
                    "variance": null,
                    "avg": null
                }
            }
        }, {
            "1433976750000": {
                "count": 0,
                "response_status": [{
                    "500.0-599.0": 0
                }, {
                    "400.0-499.0": 0
                }, {
                    "300.0-399.0": 0
                }, {
                    "200.0-299.0": 0
                }],
                "stats": {
                    "count": 0,
                    "min": null,
                    "sum_of_squares": null,
                    "max": null,
                    "sum": null,
                    "std_deviation": null,
                    "std_deviation_bounds": {
                        "upper": null,
                        "lower": null
                    },
                    "variance": null,
                    "avg": null
                }
            }
        }, {
            "1433976765000": {
                "count": 0,
                "response_status": [{
                    "500.0-599.0": 0
                }, {
                    "400.0-499.0": 0
                }, {
                    "300.0-399.0": 0
                }, {
                    "200.0-299.0": 0
                }],
                "stats": {
                    "count": 0,
                    "min": null,
                    "sum_of_squares": null,
                    "max": null,
                    "sum": null,
                    "std_deviation": null,
                    "std_deviation_bounds": {
                        "upper": null,
                        "lower": null
                    },
                    "variance": null,
                    "avg": null
                }
            }
        }, {
            "1433976780000": {
                "count": 2,
                "response_status": [{
                    "500.0-599.0": 0
                }, {
                    "400.0-499.0": 0
                }, {
                    "300.0-399.0": 0
                }, {
                    "200.0-299.0": 2
                }],
                "stats": {
                    "count": 2,
                    "min": 0.07278,
                    "sum_of_squares": 0.022419174304,
                    "max": 0.130852,
                    "sum": 0.20363199999999998,
                    "std_deviation": 0.02903600000000004,
                    "std_deviation_bounds": {
                        "upper": 0.15988800000000009,
                        "lower": 0.04374399999999991
                    },
                    "variance": 0.0008430892960000023,
                    "avg": 0.10181599999999999
                }
            }
        }, {
            "1433976795000": {
                "count": 0,
                "response_status": [{
                    "500.0-599.0": 0
                }, {
                    "400.0-499.0": 0
                }, {
                    "300.0-399.0": 0
                }, {
                    "200.0-299.0": 0
                }],
                "stats": {
                    "count": 0,
                    "min": null,
                    "sum_of_squares": null,
                    "max": null,
                    "sum": null,
                    "std_deviation": null,
                    "std_deviation_bounds": {
                        "upper": null,
                        "lower": null
                    },
                    "variance": null,
                    "avg": null
                }
            }
        }, {
            "1433976810000": {
                "count": 0,
                "response_status": [{
                    "500.0-599.0": 0
                }, {
                    "400.0-499.0": 0
                }, {
                    "300.0-399.0": 0
                }, {
                    "200.0-299.0": 0
                }],
                "stats": {
                    "count": 0,
                    "min": null,
                    "sum_of_squares": null,
                    "max": null,
                    "sum": null,
                    "std_deviation": null,
                    "std_deviation_bounds": {
                        "upper": null,
                        "lower": null
                    },
                    "variance": null,
                    "avg": null
                }
            }
        }, {
            "1433976825000": {
                "count": 0,
                "response_status": [{
                    "500.0-599.0": 0
                }, {
                    "400.0-499.0": 0
                }, {
                    "300.0-399.0": 0
                }, {
                    "200.0-299.0": 0
                }],
                "stats": {
                    "count": 0,
                    "min": null,
                    "sum_of_squares": null,
                    "max": null,
                    "sum": null,
                    "std_deviation": null,
                    "std_deviation_bounds": {
                        "upper": null,
                        "lower": null
                    },
                    "variance": null,
                    "avg": null
                }
            }
        }, {
            "1433976840000": {
                "count": 2,
                "response_status": [{
                    "500.0-599.0": 0
                }, {
                    "400.0-499.0": 0
                }, {
                    "300.0-399.0": 0
                }, {
                    "200.0-299.0": 2
                }],
                "stats": {
                    "count": 2,
                    "min": 0.069012,
                    "sum_of_squares": 0.023047915873000004,
                    "max": 0.135223,
                    "sum": 0.204235,
                    "std_deviation": 0.03310550000000002,
                    "std_deviation_bounds": {
                        "upper": 0.16832850000000005,
                        "lower": 0.035906499999999966
                    },
                    "variance": 0.0010959741302500013,
                    "avg": 0.1021175
                }
            }
        }, {
            "1433976855000": {
                "count": 0,
                "response_status": [{
                    "500.0-599.0": 0
                }, {
                    "400.0-499.0": 0
                }, {
                    "300.0-399.0": 0
                }, {
                    "200.0-299.0": 0
                }],
                "stats": {
                    "count": 0,
                    "min": null,
                    "sum_of_squares": null,
                    "max": null,
                    "sum": null,
                    "std_deviation": null,
                    "std_deviation_bounds": {
                        "upper": null,
                        "lower": null
                    },
                    "variance": null,
                    "avg": null
                }
            }
        }, {
            "1433976870000": {
                "count": 0,
                "response_status": [{
                    "500.0-599.0": 0
                }, {
                    "400.0-499.0": 0
                }, {
                    "300.0-399.0": 0
                }, {
                    "200.0-299.0": 0
                }],
                "stats": {
                    "count": 0,
                    "min": null,
                    "sum_of_squares": null,
                    "max": null,
                    "sum": null,
                    "std_deviation": null,
                    "std_deviation_bounds": {
                        "upper": null,
                        "lower": null
                    },
                    "variance": null,
                    "avg": null
                }
            }
        }, {
            "1433976885000": {
                "count": 0,
                "response_status": [{
                    "500.0-599.0": 0
                }, {
                    "400.0-499.0": 0
                }, {
                    "300.0-399.0": 0
                }, {
                    "200.0-299.0": 0
                }],
                "stats": {
                    "count": 0,
                    "min": null,
                    "sum_of_squares": null,
                    "max": null,
                    "sum": null,
                    "std_deviation": null,
                    "std_deviation_bounds": {
                        "upper": null,
                        "lower": null
                    },
                    "variance": null,
                    "avg": null
                }
            }
        }, {
            "1433976900000": {
                "count": 6,
                "response_status": [{
                    "500.0-599.0": 0
                }, {
                    "400.0-499.0": 0
                }, {
                    "300.0-399.0": 0
                }, {
                    "200.0-299.0": 6
                }],
                "stats": {
                    "count": 6,
                    "min": 0.023924,
                    "sum_of_squares": 0.035347273545,
                    "max": 0.157422,
                    "sum": 0.37616900000000003,
                    "std_deviation": 0.04427832574528485,
                    "std_deviation_bounds": {
                        "upper": 0.15125148482390305,
                        "lower": -0.025861818157236358
                    },
                    "variance": 0.001960570130805555,
                    "avg": 0.06269483333333334
                }
            }
        }, {
            "1433976915000": {
                "count": 0,
                "response_status": [{
                    "500.0-599.0": 0
                }, {
                    "400.0-499.0": 0
                }, {
                    "300.0-399.0": 0
                }, {
                    "200.0-299.0": 0
                }],
                "stats": {
                    "count": 0,
                    "min": null,
                    "sum_of_squares": null,
                    "max": null,
                    "sum": null,
                    "std_deviation": null,
                    "std_deviation_bounds": {
                        "upper": null,
                        "lower": null
                    },
                    "variance": null,
                    "avg": null
                }
            }
        }, {
            "1433976930000": {
                "count": 0,
                "response_status": [{
                    "500.0-599.0": 0
                }, {
                    "400.0-499.0": 0
                }, {
                    "300.0-399.0": 0
                }, {
                    "200.0-299.0": 0
                }],
                "stats": {
                    "count": 0,
                    "min": null,
                    "sum_of_squares": null,
                    "max": null,
                    "sum": null,
                    "std_deviation": null,
                    "std_deviation_bounds": {
                        "upper": null,
                        "lower": null
                    },
                    "variance": null,
                    "avg": null
                }
            }
        }, {
            "1433976945000": {
                "count": 0,
                "response_status": [{
                    "500.0-599.0": 0
                }, {
                    "400.0-499.0": 0
                }, {
                    "300.0-399.0": 0
                }, {
                    "200.0-299.0": 0
                }],
                "stats": {
                    "count": 0,
                    "min": null,
                    "sum_of_squares": null,
                    "max": null,
                    "sum": null,
                    "std_deviation": null,
                    "std_deviation_bounds": {
                        "upper": null,
                        "lower": null
                    },
                    "variance": null,
                    "avg": null
                }
            }
        }, {
            "1433976960000": {
                "count": 2,
                "response_status": [{
                    "500.0-599.0": 0
                }, {
                    "400.0-499.0": 0
                }, {
                    "300.0-399.0": 0
                }, {
                    "200.0-299.0": 2
                }],
                "stats": {
                    "count": 2,
                    "min": 0.080136,
                    "sum_of_squares": 0.026618167491999998,
                    "max": 0.142114,
                    "sum": 0.22225,
                    "std_deviation": 0.03098899999999997,
                    "std_deviation_bounds": {
                        "upper": 0.17310299999999995,
                        "lower": 0.04914700000000006
                    },
                    "variance": 0.0009603181209999982,
                    "avg": 0.111125
                }
            }
        }, {
            "1433976975000": {
                "count": 2,
                "response_status": [{
                    "500.0-599.0": 0
                }, {
                    "400.0-499.0": 0
                }, {
                    "300.0-399.0": 0
                }, {
                    "200.0-299.0": 2
                }],
                "stats": {
                    "count": 2,
                    "min": 0.065863,
                    "sum_of_squares": 0.01949425309,
                    "max": 0.123111,
                    "sum": 0.188974,
                    "std_deviation": 0.028624000000000007,
                    "std_deviation_bounds": {
                        "upper": 0.151735,
                        "lower": 0.03723899999999999
                    },
                    "variance": 0.0008193333760000004,
                    "avg": 0.094487
                }
            }
        }, {
            "1433976990000": {
                "count": 0,
                "response_status": [{
                    "500.0-599.0": 0
                }, {
                    "400.0-499.0": 0
                }, {
                    "300.0-399.0": 0
                }, {
                    "200.0-299.0": 0
                }],
                "stats": {
                    "count": 0,
                    "min": null,
                    "sum_of_squares": null,
                    "max": null,
                    "sum": null,
                    "std_deviation": null,
                    "std_deviation_bounds": {
                        "upper": null,
                        "lower": null
                    },
                    "variance": null,
                    "avg": null
                }
            }
        }, {
            "1433977005000": {
                "count": 0,
                "response_status": [{
                    "500.0-599.0": 0
                }, {
                    "400.0-499.0": 0
                }, {
                    "300.0-399.0": 0
                }, {
                    "200.0-299.0": 0
                }],
                "stats": {
                    "count": 0,
                    "min": null,
                    "sum_of_squares": null,
                    "max": null,
                    "sum": null,
                    "std_deviation": null,
                    "std_deviation_bounds": {
                        "upper": null,
                        "lower": null
                    },
                    "variance": null,
                    "avg": null
                }
            }
        }, {
            "1433977020000": {
                "count": 2,
                "response_status": [{
                    "500.0-599.0": 0
                }, {
                    "400.0-499.0": 0
                }, {
                    "300.0-399.0": 0
                }, {
                    "200.0-299.0": 2
                }],
                "stats": {
                    "count": 2,
                    "min": 0.068267,
                    "sum_of_squares": 0.021916621058,
                    "max": 0.131363,
                    "sum": 0.19963,
                    "std_deviation": 0.03154800000000001,
                    "std_deviation_bounds": {
                        "upper": 0.16291100000000003,
                        "lower": 0.03671899999999999
                    },
                    "variance": 0.0009952763040000003,
                    "avg": 0.099815
                }
            }
        }, {
            "1433977035000": {
                "count": 0,
                "response_status": [{
                    "500.0-599.0": 0
                }, {
                    "400.0-499.0": 0
                }, {
                    "300.0-399.0": 0
                }, {
                    "200.0-299.0": 0
                }],
                "stats": {
                    "count": 0,
                    "min": null,
                    "sum_of_squares": null,
                    "max": null,
                    "sum": null,
                    "std_deviation": null,
                    "std_deviation_bounds": {
                        "upper": null,
                        "lower": null
                    },
                    "variance": null,
                    "avg": null
                }
            }
        }, {
            "1433977050000": {
                "count": 0,
                "response_status": [{
                    "500.0-599.0": 0
                }, {
                    "400.0-499.0": 0
                }, {
                    "300.0-399.0": 0
                }, {
                    "200.0-299.0": 0
                }],
                "stats": {
                    "count": 0,
                    "min": null,
                    "sum_of_squares": null,
                    "max": null,
                    "sum": null,
                    "std_deviation": null,
                    "std_deviation_bounds": {
                        "upper": null,
                        "lower": null
                    },
                    "variance": null,
                    "avg": null
                }
            }
        }, {
            "1433977065000": {
                "count": 0,
                "response_status": [{
                    "500.0-599.0": 0
                }, {
                    "400.0-499.0": 0
                }, {
                    "300.0-399.0": 0
                }, {
                    "200.0-299.0": 0
                }],
                "stats": {
                    "count": 0,
                    "min": null,
                    "sum_of_squares": null,
                    "max": null,
                    "sum": null,
                    "std_deviation": null,
                    "std_deviation_bounds": {
                        "upper": null,
                        "lower": null
                    },
                    "variance": null,
                    "avg": null
                }
            }
        }, {
            "1433977080000": {
                "count": 2,
                "response_status": [{
                    "500.0-599.0": 0
                }, {
                    "400.0-499.0": 0
                }, {
                    "300.0-399.0": 0
                }, {
                    "200.0-299.0": 2
                }],
                "stats": {
                    "count": 2,
                    "min": 0.069013,
                    "sum_of_squares": 0.02291469761,
                    "max": 0.134729,
                    "sum": 0.20374199999999998,
                    "std_deviation": 0.032858000000000026,
                    "std_deviation_bounds": {
                        "upper": 0.16758700000000004,
                        "lower": 0.03615499999999994
                    },
                    "variance": 0.0010796481640000018,
                    "avg": 0.10187099999999999
                }
            }
        }, {
            "1433977095000": {
                "count": 0,
                "response_status": [{
                    "500.0-599.0": 0
                }, {
                    "400.0-499.0": 0
                }, {
                    "300.0-399.0": 0
                }, {
                    "200.0-299.0": 0
                }],
                "stats": {
                    "count": 0,
                    "min": null,
                    "sum_of_squares": null,
                    "max": null,
                    "sum": null,
                    "std_deviation": null,
                    "std_deviation_bounds": {
                        "upper": null,
                        "lower": null
                    },
                    "variance": null,
                    "avg": null
                }
            }
        }, {
            "1433977110000": {
                "count": 0,
                "response_status": [{
                    "500.0-599.0": 0
                }, {
                    "400.0-499.0": 0
                }, {
                    "300.0-399.0": 0
                }, {
                    "200.0-299.0": 0
                }],
                "stats": {
                    "count": 0,
                    "min": null,
                    "sum_of_squares": null,
                    "max": null,
                    "sum": null,
                    "std_deviation": null,
                    "std_deviation_bounds": {
                        "upper": null,
                        "lower": null
                    },
                    "variance": null,
                    "avg": null
                }
            }
        }, {
            "1433977125000": {
                "count": 0,
                "response_status": [{
                    "500.0-599.0": 0
                }, {
                    "400.0-499.0": 0
                }, {
                    "300.0-399.0": 0
                }, {
                    "200.0-299.0": 0
                }],
                "stats": {
                    "count": 0,
                    "min": null,
                    "sum_of_squares": null,
                    "max": null,
                    "sum": null,
                    "std_deviation": null,
                    "std_deviation_bounds": {
                        "upper": null,
                        "lower": null
                    },
                    "variance": null,
                    "avg": null
                }
            }
        }, {
            "1433977140000": {
                "count": 2,
                "response_status": [{
                    "500.0-599.0": 0
                }, {
                    "400.0-499.0": 0
                }, {
                    "300.0-399.0": 0
                }, {
                    "200.0-299.0": 2
                }],
                "stats": {
                    "count": 2,
                    "min": 0.0669,
                    "sum_of_squares": 0.022147324225,
                    "max": 0.132935,
                    "sum": 0.19983499999999998,
                    "std_deviation": 0.033017500000000026,
                    "std_deviation_bounds": {
                        "upper": 0.16595250000000006,
                        "lower": 0.03388249999999994
                    },
                    "variance": 0.0010901553062500017,
                    "avg": 0.09991749999999999
                }
            }
        }, {
            "1433977155000": {
                "count": 0,
                "response_status": [{
                    "500.0-599.0": 0
                }, {
                    "400.0-499.0": 0
                }, {
                    "300.0-399.0": 0
                }, {
                    "200.0-299.0": 0
                }],
                "stats": {
                    "count": 0,
                    "min": null,
                    "sum_of_squares": null,
                    "max": null,
                    "sum": null,
                    "std_deviation": null,
                    "std_deviation_bounds": {
                        "upper": null,
                        "lower": null
                    },
                    "variance": null,
                    "avg": null
                }
            }
        }, {
            "1433977170000": {
                "count": 0,
                "response_status": [{
                    "500.0-599.0": 0
                }, {
                    "400.0-499.0": 0
                }, {
                    "300.0-399.0": 0
                }, {
                    "200.0-299.0": 0
                }],
                "stats": {
                    "count": 0,
                    "min": null,
                    "sum_of_squares": null,
                    "max": null,
                    "sum": null,
                    "std_deviation": null,
                    "std_deviation_bounds": {
                        "upper": null,
                        "lower": null
                    },
                    "variance": null,
                    "avg": null
                }
            }
        }, {
            "1433977185000": {
                "count": 0,
                "response_status": [{
                    "500.0-599.0": 0
                }, {
                    "400.0-499.0": 0
                }, {
                    "300.0-399.0": 0
                }, {
                    "200.0-299.0": 0
                }],
                "stats": {
                    "count": 0,
                    "min": null,
                    "sum_of_squares": null,
                    "max": null,
                    "sum": null,
                    "std_deviation": null,
                    "std_deviation_bounds": {
                        "upper": null,
                        "lower": null
                    },
                    "variance": null,
                    "avg": null
                }
            }
        }, {
            "1433977200000": {
                "count": 6,
                "response_status": [{
                    "500.0-599.0": 0
                }, {
                    "400.0-499.0": 0
                }, {
                    "300.0-399.0": 0
                }, {
                    "200.0-299.0": 6
                }],
                "stats": {
                    "count": 6,
                    "min": 0.015975,
                    "sum_of_squares": 0.024633215142,
                    "max": 0.130376,
                    "sum": 0.303682,
                    "std_deviation": 0.03929112626987874,
                    "std_deviation_bounds": {
                        "upper": 0.12919591920642415,
                        "lower": -0.027968585873090812
                    },
                    "variance": 0.0015437926035555551,
                    "avg": 0.05061366666666667
                }
            }
        }, {
            "1433977215000": {
                "count": 0,
                "response_status": [{
                    "500.0-599.0": 0
                }, {
                    "400.0-499.0": 0
                }, {
                    "300.0-399.0": 0
                }, {
                    "200.0-299.0": 0
                }],
                "stats": {
                    "count": 0,
                    "min": null,
                    "sum_of_squares": null,
                    "max": null,
                    "sum": null,
                    "std_deviation": null,
                    "std_deviation_bounds": {
                        "upper": null,
                        "lower": null
                    },
                    "variance": null,
                    "avg": null
                }
            }
        }, {
            "1433977230000": {
                "count": 0,
                "response_status": [{
                    "500.0-599.0": 0
                }, {
                    "400.0-499.0": 0
                }, {
                    "300.0-399.0": 0
                }, {
                    "200.0-299.0": 0
                }],
                "stats": {
                    "count": 0,
                    "min": null,
                    "sum_of_squares": null,
                    "max": null,
                    "sum": null,
                    "std_deviation": null,
                    "std_deviation_bounds": {
                        "upper": null,
                        "lower": null
                    },
                    "variance": null,
                    "avg": null
                }
            }
        }, {
            "1433977245000": {
                "count": 0,
                "response_status": [{
                    "500.0-599.0": 0
                }, {
                    "400.0-499.0": 0
                }, {
                    "300.0-399.0": 0
                }, {
                    "200.0-299.0": 0
                }],
                "stats": {
                    "count": 0,
                    "min": null,
                    "sum_of_squares": null,
                    "max": null,
                    "sum": null,
                    "std_deviation": null,
                    "std_deviation_bounds": {
                        "upper": null,
                        "lower": null
                    },
                    "variance": null,
                    "avg": null
                }
            }
        }, {
            "1433977260000": {
                "count": 2,
                "response_status": [{
                    "500.0-599.0": 0
                }, {
                    "400.0-499.0": 0
                }, {
                    "300.0-399.0": 0
                }, {
                    "200.0-299.0": 2
                }],
                "stats": {
                    "count": 2,
                    "min": 0.067994,
                    "sum_of_squares": 0.031765417037000004,
                    "max": 0.164749,
                    "sum": 0.232743,
                    "std_deviation": 0.048377500000000025,
                    "std_deviation_bounds": {
                        "upper": 0.21312650000000005,
                        "lower": 0.019616499999999953
                    },
                    "variance": 0.002340382506250002,
                    "avg": 0.1163715
                }
            }
        }, {
            "1433977275000": {
                "count": 2,
                "response_status": [{
                    "500.0-599.0": 0
                }, {
                    "400.0-499.0": 0
                }, {
                    "300.0-399.0": 0
                }, {
                    "200.0-299.0": 2
                }],
                "stats": {
                    "count": 2,
                    "min": 0.069073,
                    "sum_of_squares": 0.019970023985,
                    "max": 0.123284,
                    "sum": 0.192357,
                    "std_deviation": 0.02710550000000001,
                    "std_deviation_bounds": {
                        "upper": 0.1503895,
                        "lower": 0.04196749999999998
                    },
                    "variance": 0.0007347081302500006,
                    "avg": 0.0961785
                }
            }
        }, {
            "1433977290000": {
                "count": 0,
                "response_status": [{
                    "500.0-599.0": 0
                }, {
                    "400.0-499.0": 0
                }, {
                    "300.0-399.0": 0
                }, {
                    "200.0-299.0": 0
                }],
                "stats": {
                    "count": 0,
                    "min": null,
                    "sum_of_squares": null,
                    "max": null,
                    "sum": null,
                    "std_deviation": null,
                    "std_deviation_bounds": {
                        "upper": null,
                        "lower": null
                    },
                    "variance": null,
                    "avg": null
                }
            }
        }, {
            "1433977305000": {
                "count": 0,
                "response_status": [{
                    "500.0-599.0": 0
                }, {
                    "400.0-499.0": 0
                }, {
                    "300.0-399.0": 0
                }, {
                    "200.0-299.0": 0
                }],
                "stats": {
                    "count": 0,
                    "min": null,
                    "sum_of_squares": null,
                    "max": null,
                    "sum": null,
                    "std_deviation": null,
                    "std_deviation_bounds": {
                        "upper": null,
                        "lower": null
                    },
                    "variance": null,
                    "avg": null
                }
            }
        }, {
            "1433977320000": {
                "count": 2,
                "response_status": [{
                    "500.0-599.0": 0
                }, {
                    "400.0-499.0": 0
                }, {
                    "300.0-399.0": 0
                }, {
                    "200.0-299.0": 2
                }],
                "stats": {
                    "count": 2,
                    "min": 0.066277,
                    "sum_of_squares": 0.020530023818000002,
                    "max": 0.127033,
                    "sum": 0.19331,
                    "std_deviation": 0.030378000000000002,
                    "std_deviation_bounds": {
                        "upper": 0.15741100000000002,
                        "lower": 0.035899
                    },
                    "variance": 0.0009228228840000002,
                    "avg": 0.096655
                }
            }
        }, {
            "1433977335000": {
                "count": 0,
                "response_status": [{
                    "500.0-599.0": 0
                }, {
                    "400.0-499.0": 0
                }, {
                    "300.0-399.0": 0
                }, {
                    "200.0-299.0": 0
                }],
                "stats": {
                    "count": 0,
                    "min": null,
                    "sum_of_squares": null,
                    "max": null,
                    "sum": null,
                    "std_deviation": null,
                    "std_deviation_bounds": {
                        "upper": null,
                        "lower": null
                    },
                    "variance": null,
                    "avg": null
                }
            }
        }, {
            "1433977350000": {
                "count": 0,
                "response_status": [{
                    "500.0-599.0": 0
                }, {
                    "400.0-499.0": 0
                }, {
                    "300.0-399.0": 0
                }, {
                    "200.0-299.0": 0
                }],
                "stats": {
                    "count": 0,
                    "min": null,
                    "sum_of_squares": null,
                    "max": null,
                    "sum": null,
                    "std_deviation": null,
                    "std_deviation_bounds": {
                        "upper": null,
                        "lower": null
                    },
                    "variance": null,
                    "avg": null
                }
            }
        }, {
            "1433977365000": {
                "count": 0,
                "response_status": [{
                    "500.0-599.0": 0
                }, {
                    "400.0-499.0": 0
                }, {
                    "300.0-399.0": 0
                }, {
                    "200.0-299.0": 0
                }],
                "stats": {
                    "count": 0,
                    "min": null,
                    "sum_of_squares": null,
                    "max": null,
                    "sum": null,
                    "std_deviation": null,
                    "std_deviation_bounds": {
                        "upper": null,
                        "lower": null
                    },
                    "variance": null,
                    "avg": null
                }
            }
        }, {
            "1433977380000": {
                "count": 2,
                "response_status": [{
                    "500.0-599.0": 0
                }, {
                    "400.0-499.0": 0
                }, {
                    "300.0-399.0": 0
                }, {
                    "200.0-299.0": 2
                }],
                "stats": {
                    "count": 2,
                    "min": 0.069426,
                    "sum_of_squares": 0.02324748898,
                    "max": 0.135748,
                    "sum": 0.20517400000000002,
                    "std_deviation": 0.03316099999999998,
                    "std_deviation_bounds": {
                        "upper": 0.16890899999999998,
                        "lower": 0.03626500000000005
                    },
                    "variance": 0.0010996519209999986,
                    "avg": 0.10258700000000001
                }
            }
        }, {
            "1433977395000": {
                "count": 0,
                "response_status": [{
                    "500.0-599.0": 0
                }, {
                    "400.0-499.0": 0
                }, {
                    "300.0-399.0": 0
                }, {
                    "200.0-299.0": 0
                }],
                "stats": {
                    "count": 0,
                    "min": null,
                    "sum_of_squares": null,
                    "max": null,
                    "sum": null,
                    "std_deviation": null,
                    "std_deviation_bounds": {
                        "upper": null,
                        "lower": null
                    },
                    "variance": null,
                    "avg": null
                }
            }
        }, {
            "1433977410000": {
                "count": 0,
                "response_status": [{
                    "500.0-599.0": 0
                }, {
                    "400.0-499.0": 0
                }, {
                    "300.0-399.0": 0
                }, {
                    "200.0-299.0": 0
                }],
                "stats": {
                    "count": 0,
                    "min": null,
                    "sum_of_squares": null,
                    "max": null,
                    "sum": null,
                    "std_deviation": null,
                    "std_deviation_bounds": {
                        "upper": null,
                        "lower": null
                    },
                    "variance": null,
                    "avg": null
                }
            }
        }, {
            "1433977425000": {
                "count": 0,
                "response_status": [{
                    "500.0-599.0": 0
                }, {
                    "400.0-499.0": 0
                }, {
                    "300.0-399.0": 0
                }, {
                    "200.0-299.0": 0
                }],
                "stats": {
                    "count": 0,
                    "min": null,
                    "sum_of_squares": null,
                    "max": null,
                    "sum": null,
                    "std_deviation": null,
                    "std_deviation_bounds": {
                        "upper": null,
                        "lower": null
                    },
                    "variance": null,
                    "avg": null
                }
            }
        }]
    }
});
