/*global sinon, todo, chai, describe, it, calledOnce*/
//integration tests

describe('apiPerfView.js spec', function() {
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
            $('body').append('<input type="checkbox" id="endTimeNow">' +
                '<input type="text" id="settingsEndTime" value=1417046538364>' +
                '<input type="text" id="settingsStartTime" value=1416046538364>');

            var e = $("input#settingsEndTime").val();
            var s = $("input#settingsStartTime").val();
            var test1 = goldstone.time.getDateRange();
            e = new Date(+e);
            s = new Date(+s);
            expect(test1).to.deep.equal([s, e]);

            // now check with #endTimeNow checked
            $('#endTimeNow').click();
            var test2 = goldstone.time.getDateRange();
            var endCheck = +new Date();
            expect(Date.parse(test2[1])).to.be.closeTo(endCheck, 2000);
            expect(test2[0]).to.deep.equal(s);

            // now check with #settingsEndTime equal to ''
            $('#endTimeNow').click();
            $('input#settingsEndTime').val('');
            var test3 = goldstone.time.getDateRange();
            endCheck = +new Date();
            expect(Date.parse(test3[1])).to.be.closeTo(endCheck, 2000);
            expect(test3[0]).to.deep.equal(s);

            // now check with #settingsEndTime equal to
            // an invalid date
            $('input#settingsEndTime').val('rufus');
            var test4 = goldstone.time.getDateRange();
            endCheck = +new Date();
            expect(Date.parse(test4[1])).to.be.closeTo(endCheck, 2000);
            expect(test4[0]).to.deep.equal(s);

            // now check with a valid end time and an
            // empty start time
            $('input#settingsEndTime').val(1417046538364);
            $('input#settingsStartTime').val('');
            var test5 = goldstone.time.getDateRange();
            startCheck = e.addWeeks(-1);
            expect(Date.parse(test5[0])).to.be.closeTo(+startCheck, 2000);
            expect(test5[1]).to.deep.equal(e);

            // now check with a valid end time and an
            // invalid start time
            $('input#settingsEndTime').val(1417046538364);
            $('input#settingsStartTime').val('bonzo');
            var test6 = goldstone.time.getDateRange();
            startCheck = e;
            expect(Date.parse(test6[0])).to.be.closeTo(+startCheck, 2000);
            expect(test6[1]).to.deep.equal(e);
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
});
