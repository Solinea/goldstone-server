/*global sinon, todo, chai, describe, it, calledOnce*/
//integration tests

describe('base.js spec', function() {
    beforeEach(function() {

        $('body').html('<div class="test-container"></div>');

        // to answer GET requests
        this.server = sinon.fakeServer.create();
        this.server.respondWith("GET", "/something/fancy", [200, {
            "Content-Type": "application/json"
        }, '[]']);

    });
    afterEach(function() {
        $('body').html('');
        this.server.restore();
    });
    describe('settings fields are populated', function() {
        it('adds values to matched selectors', function() {
            $('body').append('<input id="settingsStartTime" type="text" value="test">' +
                '<input type="text" id="settingsEndTime" value="test1">'
            );
            expect($('#settingsStartTime').val()).to.equal('test');
            expect($('#settingsEndTime').val()).to.equal('test1');
            goldstone.populateSettingsFields(1416046538364, 1417046538364);
            expect($('#settingsStartTime').val()).to.equal('Nov 15 2014 02:15:38 GMT-0800 (PST)');
            expect($('#settingsEndTime').val()).to.equal('Nov 26 2014 16:02:18 GMT-0800 (PST)');
        });
        it('returns checkbox and input values correctly', function() {
            $('body').append('<select id="autoRefreshInterval">' +
                '<option>123</option>' +
                '<option selected>456</option>' +
                '</select>'
            );
            var test1 = goldstone.getRefreshInterval();
            expect(test1).to.equal('456');
            $('body').append('<input id="autoRefresh" type="checkbox">');
            var test2 = goldstone.isRefreshing();
            expect(test2).to.equal(false);
            $('#autoRefresh').click();
            var test3 = goldstone.isRefreshing();
            expect(test3).to.equal(true);
            $('#autoRefresh').click();
            var test4 = goldstone.isRefreshing();
            expect(test4).to.equal(false);
        });
        it('tests goldstone.time.getDateRange', function() {

            // first test based on valid start/end
            // and #endTimeNow unchecked
            var endTime = new Date(1417046538364);
            var startTime = new Date(1416046538364);
            $('body').append('<input type="checkbox" id="endTimeNow">' +
                '<input type="text" id="settingsEndTime" value="' + endTime + '"">' +
                '<input type="text" id="settingsStartTime" value="' + startTime +'"">');
            var e = $("input#settingsEndTime").val();
            var s = $("input#settingsStartTime").val();
            expect(Date.parse(e)).to.equal(Date.parse(endTime));
            expect(Date.parse(s)).to.equal(Date.parse(startTime));

            var test1 = goldstone.time.getDateRange();
            console.log('test1', test1, startTime, endTime);
            expect([Date.parse(test1[0]), Date.parse(test1[1])]).to.deep.equal([Date.parse(startTime), Date.parse(endTime)]);

            /*
            // now check with #endTimeNow checked
            $('#endTimeNow').click();
            var test2 = goldstone.time.getDateRange();
            var endCheck = +new Date();
            expect(Date.parse(test2[1])).to.be.closeTo(endCheck, 2000);
            expect(test2[0]).to.deep.equal(s);
            */

            // now check with #settingsEndTime equal to ''
            $('#endTimeNow').click();
            $('input#settingsEndTime').val('');
            var test3 = goldstone.time.getDateRange();
            var endCheck = +new Date();
            expect(Date.parse(test3[1])).to.be.closeTo(endCheck, 2000);
            expect(Date.parse(test3[0])).to.equal(Date.parse(s));

            // now check with #settingsEndTime equal to
            // an invalid date
            $('input#settingsEndTime').val('rufus');
            var test4 = goldstone.time.getDateRange();
            endCheck = +new Date();
            expect(Date.parse(test4[1])).to.be.closeTo(endCheck, 2000);
            expect(Date.parse(test4[0])).to.equal(Date.parse(s));
        });
        it('triggers barChartBase', function() {
            goldstone.charts.barChartBase();
            goldstone.charts.barChartBase('test-container', {
                top: 10,
                bottom: 10,
                left: 10,
                right: 10
            }, 'bobo');
        });
        it('triggers lineChartBase', function() {
            goldstone.charts.lineChartBase();
            goldstone.charts.lineChartBase('test-container', {
                top: 10,
                bottom: 10,
                left: 10,
                right: 10
            }, 'bobo');
        });
    });
    describe('alerts are raised', function() {
        it('properly cascades alerts', function() {
            this.raiseError_spy = sinon.spy(goldstone, "raiseError");
            this.raiseDanger_spy = sinon.spy(goldstone, "raiseDanger");
            this.raiseWarning_spy = sinon.spy(goldstone, "raiseWarning");
            this.raiseSuccess_spy = sinon.spy(goldstone, "raiseSuccess");
            this.raiseInfo_spy = sinon.spy(goldstone, "raiseInfo");
            this.raiseAlert_spy = sinon.spy(goldstone, "raiseAlert");

            expect(this.raiseError_spy.callCount).to.equal(0);
            expect(this.raiseDanger_spy.callCount).to.equal(0);
            expect(this.raiseWarning_spy.callCount).to.equal(0);
            expect(this.raiseSuccess_spy.callCount).to.equal(0);
            expect(this.raiseInfo_spy.callCount).to.equal(0);
            expect(this.raiseAlert_spy.callCount).to.equal(0);

            goldstone.raiseError();

            expect(this.raiseError_spy.callCount).to.equal(1);
            expect(this.raiseDanger_spy.callCount).to.equal(1);
            expect(this.raiseWarning_spy.callCount).to.equal(0);
            expect(this.raiseSuccess_spy.callCount).to.equal(0);
            expect(this.raiseInfo_spy.callCount).to.equal(0);
            expect(this.raiseAlert_spy.callCount).to.equal(1);

            goldstone.raiseDanger();

            expect(this.raiseError_spy.callCount).to.equal(1);
            expect(this.raiseDanger_spy.callCount).to.equal(2);
            expect(this.raiseWarning_spy.callCount).to.equal(0);
            expect(this.raiseSuccess_spy.callCount).to.equal(0);
            expect(this.raiseInfo_spy.callCount).to.equal(0);
            expect(this.raiseAlert_spy.callCount).to.equal(2);

            goldstone.raiseWarning();

            expect(this.raiseError_spy.callCount).to.equal(1);
            expect(this.raiseDanger_spy.callCount).to.equal(2);
            expect(this.raiseWarning_spy.callCount).to.equal(1);
            expect(this.raiseSuccess_spy.callCount).to.equal(0);
            expect(this.raiseInfo_spy.callCount).to.equal(0);
            expect(this.raiseAlert_spy.callCount).to.equal(3);

            goldstone.raiseSuccess();

            expect(this.raiseError_spy.callCount).to.equal(1);
            expect(this.raiseDanger_spy.callCount).to.equal(2);
            expect(this.raiseWarning_spy.callCount).to.equal(1);
            expect(this.raiseSuccess_spy.callCount).to.equal(1);
            expect(this.raiseInfo_spy.callCount).to.equal(0);
            expect(this.raiseAlert_spy.callCount).to.equal(4);

            goldstone.raiseInfo();

            expect(this.raiseError_spy.callCount).to.equal(1);
            expect(this.raiseDanger_spy.callCount).to.equal(2);
            expect(this.raiseWarning_spy.callCount).to.equal(1);
            expect(this.raiseSuccess_spy.callCount).to.equal(1);
            expect(this.raiseInfo_spy.callCount).to.equal(1);
            expect(this.raiseAlert_spy.callCount).to.equal(5);

            this.raiseError_spy.restore();
            this.raiseDanger_spy.restore();
            this.raiseWarning_spy.restore();
            this.raiseSuccess_spy.restore();
            this.raiseInfo_spy.restore();
            this.raiseAlert_spy.restore();
        });
    });
    describe('bivariate with average', function() {
        it('creates object', function() {
            var test1 = goldstone.charts.bivariateWithAverage;
            expect(test1).to.be.an('object');
            var chartIsArray = Array.isArray(test1);
            expect(chartIsArray).to.equal(false);

            var nsReport = goldstone.glance.report;
            var nsApiPerf = goldstone.glance.apiPerf;
            nsApiPerf.infoCustom = {
                key: 'hoo',
                value: 'haw'
            };
            nsApiPerf.bivariate = goldstone.charts.bivariateWithAverage._getInstance(nsApiPerf);
            nsReport.start = (+new Date()) - 10000;
            nsReport.end = new Date();
            nsReport.interval = '' + Math.round(0.357 * 10000) + "s";
            nsApiPerf.bivariate.loadUrl(nsReport.start, nsReport.end, nsReport.interval,
                true, '.test-container');
            nsApiPerf.bivariate.loadUrl(nsReport.start, nsReport.end, nsReport.interval,
                false, '.test-container');
            nsApiPerf.data = [];
            nsApiPerf.bivariate.init();
            nsApiPerf.bivariate.update();
        });

    });
});
