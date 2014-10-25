/*global sinon, todo, chai, describe, it, calledOnce*/
//integration tests

describe('apiPerfView.js spec', function() {
    beforeEach(function() {

        // confirm that dom is clear of view elements before each test:
        expect($('svg').length).to.equal(0);
        expect($('#spinner').length).to.equal(0);

        this.testCollection = new ApiPerfCollection({
            url: '/nova/api_perf?start=1408554857&end=1411146857&interval=32400s&render=false'
        });
        blueSpinnerGif = "goldstone/static/images/ajax-loader-solinea-blue.gif";

        this.testView = new ApiPerfView({
            chartTitle: "Tester API Performance",
            collection: this.testCollection,
            height: 300,
            infoCustom: [{
                key: "API Call",
                value: "Hypervisor Show"
            }],
            el: 'body',
            startStopInterval: {
                start: 1413644531000,
                end: 1414249331000,
                interval: "3600s"
            },
            width: $('body').width(),
            yAxisLabel: 'yAxisTest'
        });
    });
    afterEach(function() {
        $('body').html('');
    });
    describe('view is constructed', function() {
        it('should exist', function() {
            assert.isDefined(this.testView, 'this.testView has been defined');
            expect(this.testView).to.be.an('object');
            expect(this.testView.el).to.equal('body');
        });
        it('info button popover responds to click event', function() {
            expect($('div.popover').length).to.equal(0);
            $(this.testView.el).find('#api-perf-info').click();
            expect($('div.popover').length).to.equal(1);
        });
        it('view update appends svg and border elements', function() {
            expect(this.testView.update).to.be.a('function');
            this.testView.update();
            expect($('svg').length).to.equal(1);
            expect($('g.legend-items').find('text').text()).to.equal('MinMaxAvg');
            expect($('.panel-title').text().trim()).to.equal('Tester API Performance');
            expect($('svg').text()).to.not.include('Response was empty');
        });
        it('can handle a null server payload and append appropriate response', function() {
            console.log($('svg').text());
            expect($('svg').text()).to.not.include('Response was empty');
            console.log(this.testCollection.toJSON());
            this.testCollection.reset();
            console.log(this.testCollection.toJSON());
            this.testView.update();
            expect($('svg').text()).to.include('Response was empty');
            console.log($('svg').text());
            $('body').html('');
            this.testCollection.add({url: '/nova/api_perf?start=1408554857&end=1411146857&interval=32400s&render=false'});
            console.log(this.testCollection.toJSON());
            this.testView.update();
            console.log($('svg').text());
            expect($('svg').text()).to.not.include('Response was empty');
        });
    });
});




describe("Backbone Object functionality", function() {
    beforeEach(function() {

        server = sinon.fakeServer.create();

        JSONresponse = 'chartData: [{"2xx":20.0,"3xx":0.0,"4xx":0.0,"5xx":0.0,"avg":317.4,"count":20.0,"key":1409140800000.0,"max":559.0,"min":270.0,"std_deviation":61.1027004313,"sum":6348.0,"sum_of_squares":2089526.0,"variance":3733.54},{"2xx":938.0,"3xx":0.0,"4xx":0.0,"5xx":0.0,"avg":337.2590618337,"count":938.0,"key":1409173200000.0,"max":2981.0,"min":248.0,"std_deviation":130.4775305509,"sum":316349.0,"sum_of_squares":122660441.0,"variance":17024.3859786508},{"2xx":192.0,"3xx":0.0,"4xx":0.0,"5xx":0.0,"avg":313.7135416667,"count":192.0,"key":1409205600000.0,"max":754.0,"min":261.0,"std_deviation":47.228238198,"sum":60233.0,"sum_of_squares":19324165.0,"variance":2230.5064832899}';

        server.respondWith('GET', '/*', [
            200, {
                'Content-Type': 'application/json'
            },
            JSON.stringify(JSONresponse)
        ]);

        this.nsReport_stub = {
            start: new Date(1408554857000),
            end: new Date(1411146857000),
            interval: "32400s"
        };


        this.testApiChart = new ApiPerfCollection({
            url: goldstone.nova.apiPerf.url(this.nsReport_stub.start, this.nsReport_stub.end, this.nsReport_stub.interval, false)
        });

        this.fetch_stub = sinon.stub(this.testApiChart, "fetch");

        this.initialize_stub = sinon.stub(this.testApiChart, "initialize");

        // this.render_stub = sinon.stub(this.testApiChart, "render");

    });

    afterEach(function() {
        // this.render_stub.restore();
        this.fetch_stub.restore();
        this.initialize_stub.restore();
        server.restore();

    });

    describe("Something about Model", function() {
        it("something should happen", function() {

            expect(this.nsReport_stub.start).to.be.a('date');
            expect(this.nsReport_stub.end).to.be.a('date');
            expect(this.nsReport_stub.interval).to.be.a('string');

            this.testApiChart.fetch();
            // server.respond();

            // expect(this.fetch_stub).should.have.been.calledOnce();
            sinon.assert.calledOnce(this.fetch_stub);
        });
    });

});
