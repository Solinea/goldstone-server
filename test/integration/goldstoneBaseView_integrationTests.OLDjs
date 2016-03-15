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
//integration tests

describe('goldstoneBaseView.js spec', function() {
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
        this.server.autoRespond = true;
        this.server.respondWith("GET", "/something/fancy", [200, {
            "Content-Type": "application/json"
        }, '[]']);

        // confirm that dom is clear of view elements before each test:
        expect($('svg').length).to.equal(0);
        expect($('#spinner').length).to.equal(0);

        blueSpinnerGif = "../../../goldstone/static/images/ajax-loader-solinea-blue.gif";

        this.testCollection = new ApiPerfCollection({
            urlPrefix: 'cinder'
        });

        this.testView = new GoldstoneBaseView({
            chartTitle: "Tester Base View",
            collection: this.testCollection,
            el: '.testContainer',
            height: 300,
            infoText: 'test',
            width: $('.testContainer').width(),
            yAxisLabel: 'yAxisTest'
        });
    });
    afterEach(function() {
        $('body').html('');
        this.server.restore();
    });

    describe('view is constructed', function() {
        it('should exist', function() {
            assert.isDefined(this.testView, 'this.testView has been defined');
            expect(this.testView).to.be.an('object');
            expect(this.testView.el).to.equal('.testContainer');
        });
        it('can handle a null server payload and append appropriate response', function() {
            this.testCollection.reset();
            this.testView.checkReturnedDataSet(this.testCollection.toJSON());
            expect($('.popup-message').text()).to.equal('No Data Returned');
        });
        it('appends dataErrorMessages to container', function() {
            this.testView.dataErrorMessage('this is a test');
            expect($('.popup-message').text()).to.include('this is a test');
            this.testView.dataErrorMessage('number two test');
            expect($('.popup-message').text()).to.include('number two test');
            this.testView.dataErrorMessage('should not be here', {
                responseJSON: {
                    status_code: 999,
                    message: 'messageInReponseJSON'
                }
            });
            expect($('.popup-message').text()).to.include('messageInReponseJSON');
            expect($('.popup-message').text()).to.not.include('should not be here');
            expect($('.popup-message').text()).to.include('999');
            this.testView.dataErrorMessage('should not be here', {
                responseJSON: {
                    status_code: 123,
                    message: 'newResponseMessage'
                }
            });
            expect($('.popup-message').text()).to.not.include('messageInReponseJSON');
            expect($('.popup-message').text()).to.include('newResponseMessage');
            expect($('.popup-message').text()).to.not.include('should not be here');
            expect($('.popup-message').text()).to.include('123');
        });
        it('can handle extra arguments that might exist from the server error', function() {
            this.testView.dataErrorMessage('should not be here', {
                responseJSON: {
                    status_code: 234,
                    message: 'newResponseMessageCheck'
                }
            }, 'nothing', 'to', 'worry', 'about');
            expect($(this.testView.el).find('.popup-message').text()).to.not.include('messageInReponseJSON');
            expect($(this.testView.el).find('.popup-message').text()).to.include('newResponseMessageCheck');
            expect($(this.testView.el).find('.popup-message').text()).to.not.include('should not be here');
            expect($(this.testView.el).find('.popup-message').text()).to.include('234');
        });
        it('can utilize the dataErrorMessage machinery to append a variety of errors', function() {
            this.dataErrorMessage_spy = sinon.spy(this.testView, "dataErrorMessage");
            this.testView.dataErrorMessage(null, {
                responseJSON: {
                    status_code: 246,
                    message: 'responseJSON message all up in your tests.',
                    detail: 'and some extra details, just for fun'
                }
            });
            expect($('.popup-message').text()).to.equal('246 error: responseJSON message all up in your tests. and some extra details, just for fun');
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
            this.testView.dataErrorMessage("butterfly - spread your wings again");
            expect($('.popup-message').text()).to.equal('butterfly - spread your wings again');
            this.testView.clearDataErrorMessage();
            expect($('#noDataReturned').text()).to.equal('');
            expect(this.dataErrorMessage_spy.callCount).to.equal(4);
            this.dataErrorMessage_spy.restore();
        });
    });
    describe('unit testing flattenObj', function() {
        it('should return a basic object', function() {
            assert.isDefined(this.testView.flattenObj, 'this.testView.flattenObj has been defined');
            expect(this.testView.flattenObj).to.be.a('function');
            var fut = this.testView.flattenObj;
            var testObj = {};
            var test1 = fut(testObj);
            expect(test1).to.deep.equal({});
        });
        it('should handle non-nested objects', function() {
            var fut = this.testView.flattenObj;
            var testObj = {
                a: 'a',
                b: 'b',
                c: 'c'
            };
            var test1 = fut(testObj);
            expect(test1).to.deep.equal({
                a: 'a',
                b: 'b',
                c: 'c'
            });

        });
        it('should handle nested objects', function() {
            var fut = this.testView.flattenObj;
            var testObj = {
                a: 'a',
                b: 'b',
                c: {
                    d: 'd',
                    e: 'e',
                    f: 'f'
                }
            };
            var test1 = fut(testObj);
            expect(test1).to.deep.equal({
                a: 'a',
                b: 'b',
                d: 'd',
                e: 'e',
                f: 'f',
            });

        });
        it('should transfer null values', function() {
            var fut = this.testView.flattenObj;
            var testObj = {
                a: 'a',
                b: 'b',
                c: null,
                d: undefined
            };
            var test1 = fut(testObj);
            expect(test1).to.deep.equal({
                a: 'a',
                b: 'b',
                c: null,
                d: undefined
            });

        });
        it('should not unpack nested arrays', function() {
            var fut = this.testView.flattenObj;
            var testObj = {
                a: 'a',
                b: 'b',
                c: {
                    d: [1, 2, 3, 4],
                    e: [1, 2, 3, 4],
                    f: [{
                        1: 1,
                        2: 2
                    }, 'hi'],
                    g: 'g'
                }
            };
            var test1 = fut(testObj);
            expect(test1).to.deep.equal({
                a: 'a',
                b: 'b',
                d: [1, 2, 3, 4],
                e: [1, 2, 3, 4],
                f: [{
                    1: 1,
                    2: 2
                }, 'hi'],
                g: 'g',
            });

        });
        it('should not overwrite keys that are duplicated in the nested objects', function() {
            var fut = this.testView.flattenObj;
            var testObj = {
                a: 'a',
                b: 'b',
                c: {
                    b: 'new b',
                    c: 'new c',
                    d: 'd'
                }
            };
            var test1 = fut(testObj);
            expect(test1).to.deep.equal({
                a: 'a',
                b: 'b',
                b_: 'new b',
                c: 'new c',
                d: 'd'
            });

        });
        it('should not handle multiple duplicated keys in the nested objects', function() {
            var fut = this.testView.flattenObj;
            var testObj = {
                a: 'a',
                b: 'b',
                c: {
                    b: 'new b',
                    c: 'new c',
                    d: 'd'
                },
                d: {
                    b: 'new new b',
                    c: 'new new c',
                    d: 'new d'
                }
            };
            var test1 = fut(testObj);
            expect(test1).to.deep.equal({
                a: 'a',
                b: 'b',
                b_: 'new b',
                c: 'new c',
                d: 'd',
                b__: 'new new b',
                c_: 'new new c',
                d_: 'new d'
            });

        });
        it('should create button groups', function() {
            var testRouteArray = [
                ['/#reports/logbrowser', 'Log Browser', 'active'],
                ['/#reports/eventbrowser', 'Event Browser'],
                ['/#reports/apibrowser', 'Api Browser'],
            ];

            var test1 = this.testView.templateButtonConstructor(testRouteArray);
            expect(test1).to.equal('<div class="btn-group" role="group"><a href="/#reports/logbrowser" class="active btn btn-default">Log Browser</a><a href="/#reports/eventbrowser" class="btn btn-default">Event Browser</a><a href="/#reports/apibrowser" class="btn btn-default">Api Browser</a></div><br><br>');
            testRouteArray = [['','']];
            var test2 = this.testView.templateButtonConstructor(testRouteArray);
            expect(test2).to.equal('<div class="btn-group" role="group"><a href="" class="btn btn-default"></a></div><br><br>');
        });
    });
});
