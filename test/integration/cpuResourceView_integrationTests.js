/*global sinon, todo, chai, describe, it, calledOnce*/
//integration tests

describe('cpuResourceView.js spec', function() {
    beforeEach(function() {

        $('body').html('<div class="testContainer"></div>');

        // to answer GET requests
        this.server = sinon.fakeServer.create();
        this.server.respondWith("GET", "/*", [200, {
            "Content-Type": "application/json"
        }, '[]']);

        // confirm that dom is clear of view elements before each test:
        expect($('svg').length).to.equal(0);
        expect($('#spinner').length).to.equal(0);

        this.protoFetchSpy = sinon.spy(ServiceStatusCollection.prototype, "fetch");

        this.testCollection = new CpuResourceCollection({
            urlPrefix: '/something/fancy'
        });

        blueSpinnerGif = "goldstone/static/images/ajax-loader-solinea-blue.gif";

        this.testView = new CpuResourceView({
            chartTitle: "Test Cpu Resources",
            collection: this.testCollection,
            featureSet: 'cpu',
            height: 300,
            infoCustom: 'novaCpuResources',
            el: '.testContainer',
            width: $('.testContainer').width(),
            yAxisLabel: 'Test Y Axis Label'
        });

        this.testCollection.reset();
        this.testCollection.add({
            "1422518400000": [15936.0, 512.0, 23904.0, 512.0],
            "1422519840000": [15936.0, 512.0, 23904.0, 512.0],
            "1422535680000": [15936.0, 512.0, 23904.0, 512.0],
            "1422558720000": [15936.0, 512.0, 23904.0, 512.0],
            "1422525600000": [15936.0, 512.0, 23904.0, 512.0],
            "1422557280000": [15936.0, 512.0, 23904.0, 512.0],
            "1422550080000": [15936.0, 512.0, 23904.0, 512.0],
            "1422538560000": [15936.0, 512.0, 23904.0, 512.0],
            "1422528480000": [15936.0, 512.0, 23904.0, 512.0],
            "1422541440000": [15936.0, 512.0, 23904.0, 512.0],
            "1422563040000": [15936.0, 512.0, 23904.0, 512.0],
            "1422531360000": [15936.0, 512.0, 23904.0, 512.0],
            "1422548640000": [15936.0, 512.0, 23904.0, 512.0],
            "1422521280000": [15936.0, 512.0, 23904.0, 512.0],
            "1422534240000": [15936.0, 512.0, 23904.0, 512.0],
            "1422555840000": [15936.0, 512.0, 23904.0, 512.0],
            "1422547200000": [15936.0, 512.0, 23904.0, 512.0],
            "1422561600000": [15936.0, 512.0, 23904.0, 512.0],
            "1422554400000": [15936.0, 512.0, 23904.0, 512.0],
            "1422568800000": [31872.0, 3072.0, 47808.0, 3072.0],
            "1422564480000": [15936.0, 512.0, 23904.0, 512.0],
            "1422537120000": [15936.0, 512.0, 23904.0, 512.0],
            "1422527040000": [15936.0, 512.0, 23904.0, 512.0],
            "1422540000000": [15936.0, 512.0, 23904.0, 512.0],
            "1422567360000": [15936.0, 1024.0, 23904.0, 1024.0],
            "1422560160000": [15936.0, 512.0, 23904.0, 512.0],
            "1422552960000": [15936.0, 512.0, 23904.0, 512.0],
            "1422522720000": [15936.0, 512.0, 23904.0, 512.0],
            "1422524160000": [15936.0, 512.0, 23904.0, 512.0],
            "1422529920000": [15936.0, 512.0, 23904.0, 512.0],
            "1422542880000": [15936.0, 512.0, 23904.0, 512.0],
            "1422532800000": [15936.0, 512.0, 23904.0, 512.0],
            "1422565920000": [15936.0, 512.0, 23904.0, 512.0],
            "1422551520000": [15936.0, 512.0, 23904.0, 512.0],
            "1422544320000": [15936.0, 512.0, 23904.0, 512.0],
            "1422545760000": [15936.0, 512.0, 23904.0, 512.0]
        });
    });
    afterEach(function() {
        $('body').html('');
        this.server.restore();
        this.protoFetchSpy.restore();
    });
    describe('view dataPrep', function() {
        it('prepares JSON payload for rendering', function() {
            var test1 = this.testView.dataPrep({
                0: {
                    "1422564480000": [15936, 512, 23904, 512],
                    "1422537120000": [15936.0, 512.0, 23904.0, 512.0],
                    "1422527040000": [15936.0, 512.0, 23904.0, 512.0],
                    "1422540000000": [15936.0, 512.0, 23904.0, 512.0]
                }
            });
            expect(test1).to.deep.equal(
                [{
                    "eventTime": '1422564480000',
                    "Success": 23904,
                    "Failure": 15936
                }, {
                    "eventTime": '1422537120000',
                    "Success": 23904,
                    "Failure": 15936
                }, {
                    "eventTime": '1422527040000',
                    "Success": 23904,
                    "Failure": 15936
                }, {
                    "eventTime": '1422540000000',
                    "Success": 23904,
                    "Failure": 15936
                }]);
        });
    });
    describe('view specialInit', function() {
        it('set Axis', function() {
            this.testView.specialInit();
        });
    });
    describe('view is constructed', function() {
        it('should exist', function() {
            assert.isDefined(this.testView, 'this.testView has been defined');
            expect(this.testView).to.be.an('object');
            expect(this.testView.el).to.equal('.testContainer');
        });
        it('view update appends svg and border elements', function() {
            expect(this.testView.update).to.be.a('function');
            this.testView.update();
            expect($('svg').length).to.equal(1);
            expect($('g.x axis').find('text').text()).to.equal('');
            expect($('.y axis').text().trim()).to.equal('');
            expect($('svg').text()).to.not.include('Response was empty');
        });
        it('can handle a null server payload and append appropriate response', function() {
            this.update_spy = sinon.spy(this.testView, "update");
            expect($('.popup-message').text()).to.equal('');
            this.testCollection.reset();
            this.testView.update();
            this.testView.update();
            expect($('.popup-message').text()).to.equal('No Data Returned');
            this.testCollection.add({
                "timestamp": 1415148790577,
                "name": "os.cpu.sys",
                "metric_type": "gauge",
                "value": 0.12160618725179,
                "unit": "percent",
                "node": "compute-02"
            });
            this.testView.update();
            expect($('.popup-message').text()).to.equal('No Data Returned');
            expect(this.update_spy.callCount).to.equal(3);
            expect($('g').find('text').text()).to.equal('FailSuccess');
            this.update_spy.restore();
        });
        it('can utilize the dataErrorMessage machinery to append a variety of errors', function() {
            this.testView.update();

            this.dataErrorMessage_spy = sinon.spy(this.testView, "dataErrorMessage");
            expect($('.popup-message').text()).to.equal('');
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
});
