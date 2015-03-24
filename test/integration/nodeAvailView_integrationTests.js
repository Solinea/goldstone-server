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
        this.testCollection.add([{
            "id": "46b24373-eedc-43d5-9543-19dea317d88f",
            "name": "compute-01",
            "created": "2014-10-27T19:26:17Z",
            "updated": "2014-10-28T18:32:18Z",
            "update_method": "LOGS",
            "managed": true,
            "error_count": 10,
            "warning_count": 4,
            "info_count": 33,
            "audit_count": 551,
            "debug_count": 4,
            "polymorphic_ctype": 12
        }, {
            "id": "d0656d75-1c26-48c5-875b-9130dd8892f4",
            "name": "compute-02",
            "created": "2014-10-27T19:27:17Z",
            "updated": "2014-10-28T18:33:17Z",
            "update_method": "LOGS",
            "managed": true,
            "error_count": 1,
            "warning_count": 2,
            "info_count": 3,
            "audit_count": 448,
            "debug_count": 5,
            "polymorphic_ctype": 12
        }, {
            "id": "46b24373-eedc-43d5-9543-19dea317d88f",
            "name": "controller-01",
            "created": "2014-10-27T19:29:17Z",
            "updated": "2014-10-28T18:38:18Z",
            "update_method": "LOGS",
            "managed": true,
            "error_count": 10,
            "warning_count": 4,
            "info_count": 33,
            "audit_count": 551,
            "debug_count": 0,
            "polymorphic_ctype": 12
        }]);

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
    });
    afterEach(function() {
        $('body').html('');
        this.server.restore();
    });
    describe('collection is constructed', function() {
        it('should exist', function() {
            assert.isDefined(this.testCollection, 'this.testCollection has been defined');
            expect(this.testCollection.parse).to.be.a('function');
            expect(this.testCollection.length).to.equal(2);
            this.testCollection.add({
                test1: 'test1'
            });
            expect(this.testCollection.length).to.equal(3);
            this.testCollection.pop();
            expect(this.testCollection.length).to.equal(2);
            this.testCollection.setXhr();
        });
        it('should parse appropriate', function() {
            var testData = {
                a: "blah",
                b: "wah",
                results: [1, 2, 3]
            };
            var test1 = this.testCollection.parse(testData);
            expect(test1).to.deep.equal([1, 2, 3]);
            testData = {
                a: "blah",
                b: "wah",
                results: [1, 2, 3],
                next: null
            };
            var test2 = this.testCollection.parse(testData);
            expect(test2).to.deep.equal([1, 2, 3]);
            testData = {
                a: "blah",
                b: "wah",
                results: [1, 2, 3],
                next: 'fantastic/loggin/urls/forever'
            };
            var test3 = this.testCollection.parse(testData);
            expect(test3).to.deep.equal([1, 2, 3]);
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
        it('view update appends svg and border elements', function() {
            expect(this.testView.update).to.be.a('function');
            expect($('svg').length).to.equal(1);
            expect($('g').find('.axis').text()).to.equal('DisabledLogsPing Only');
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
            this.testView.update();
            expect($('#populateEventFilters').children().length).to.equal(5);
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
            expect($('svg').find('circle').length).to.equal(2);
        });
        it('registers changes on the global lookback/refresh selectors', function() {
            this.scheduleFetchSpy = sinon.spy(this.testView, "scheduleFetch");
            expect(this.scheduleFetchSpy.callCount).to.equal(0);
            var test1 = this.testView.defaults.scheduleTimeout;
            expect(this.testView.defaults.scheduleTimeout).to.equal(test1);
            this.testView.scheduleFetch();
            expect(this.scheduleFetchSpy.callCount).to.equal(1);
            expect(this.testView.defaults.scheduleTimeout).to.not.equal(test1);
            this.scheduleFetchSpy.restore();
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
