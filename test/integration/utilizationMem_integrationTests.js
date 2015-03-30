/*global sinon, todo, chai, describe, it, calledOnce*/
//integration tests

describe('UtilizationMem.js spec', function() {
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

        this.protoFetchSpy = sinon.spy(UtilizationMemCollection.prototype, "fetch");

        this.testCollection = new UtilizationMemCollection({
            url: '/something/fancy'
        });

        blueSpinnerGif = "goldstone/static/images/ajax-loader-solinea-blue.gif";

        this.testView = new UtilizationMemView({
            collection: this.testCollection,
            el: '.testContainer',
            width: $('.testContainer').width(),
            featureSet: 'memUsage'
        });

        this.testCollection.reset();
        this.testCollection.add([

            {
                "metric_type": "gauge",
                "name": "os.mem.total",
                "node": "compute-02",
                "@timestamp": 1415149850560,
                "unit": "bytes",
                "value": 33658171392
            }, {
                "metric_type": "gauge",
                "name": "os.mem.free",
                "node": "compute-02",
                "@timestamp": 1415072630561,
                "unit": "bytes",
                "value": 31947091968
            }, {
                "metric_type": "gauge",
                "name": "os.mem.free",
                "node": "compute-02",
                "@timestamp": 1415072690561,
                "unit": "bytes",
                "value": 31945719808
            }, {
                "metric_type": "gauge",
                "name": "os.mem.free",
                "node": "compute-02",
                "@timestamp": 1415072750561,
                "unit": "bytes",
                "value": 31947214848
            }
        ]);

    });
    afterEach(function() {
        $('body').html('');
        this.server.restore();
        this.protoFetchSpy.restore();
    });
    describe('collection is constructed', function() {
        it('should exist', function() {
            var dataTest = JSON.stringify('hello');
            assert.isDefined(this.testCollection, 'this.testCollection has been defined');
            expect(this.testCollection.parse).to.be.a('function');
            expect(this.testCollection.length).to.equal(4);
            this.testCollection.add({
                metric_type: "gauge",
                name: "os.mem.free",
                node: "compute-02",
                timestamp: 1415072450561,
                unit: "bytes",
                value: 31947214848
            });
            expect(this.testCollection.length).to.equal(5);
            this.testCollection.parse(dataTest);
            if (this.testCollection.dummyGen) {
                this.testCollection.dummyGen();
            }
        });
        it('should parse appropriately', function() {
            this.testCollection.defaults.urlCollectionCount = 10;
            expect(this.testCollection.defaults.urlCollectionCount).to.equal(10);
            var test = 'monkeys';
            this.testCollection.parse(test);
            expect(this.testCollection.defaults.urlCollectionCount).to.equal(9);
            test = {
                monkeys: 'apples',
                next: null
            };
            this.testCollection.parse(test);
            expect(this.testCollection.defaults.urlCollectionCount).to.equal(8);
            test = {
                monkeys: 'bananas',
                next: 'rotten/core/apples/llamas.html',
                results: [1, 2, 3]
            };
            var test1 = this.testCollection.parse(test);
            expect(this.testCollection.defaults.urlCollectionCount).to.equal(8);
            expect(test1).to.deep.equal([1, 2, 3]);
            test = {
                monkeys: 'bananas',
                next: null,
                results: [1, 2, 3]
            };
            var test2 = this.testCollection.parse(test);
            expect(this.testCollection.defaults.urlCollectionCount).to.equal(7);
            expect(test2).to.deep.equal([1, 2, 3]);
        });
    });
    describe('collectionPrep test', function() {
        it('should exist', function() {
            assert.isDefined(this.testView.collectionPrep, 'this.testCollection.collectionPrep has been defined');
            var test1 = this.testView.collectionPrep();
            expect(test1).to.deep.equal([{
                used: 1.59356689453125,
                free: 29.753047943115234,
                total: 0.1,
                date: '1415072630561'
            }, {
                used: 1.5948448181152344,
                free: 29.75177001953125,
                total: 0.1,
                date: '1415072690561'
            }, {
                used: 1.5934524536132812,
                free: 29.753162384033203,
                total: 0.1,
                date: '1415072750561'
            }]);
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
            this.testCollection.add([{
                "metric_type": "gauge",
                "name": "os.mem.total",
                "node": "compute-02",
                "@timestamp": 1415149850560,
                "unit": "bytes",
                "value": 33658171392
            }, {
                "metric_type": "gauge",
                "name": "os.mem.free",
                "node": "compute-02",
                "@timestamp": 1415072630561,
                "unit": "bytes",
                "value": 31947091968
            }]);
            this.testCollection.defaults.urlCollectionCount = 0;
            this.testView.update();
            this.testCollection.trigger('sync');
            expect($('.popup-message').text()).to.equal('No Data Returned');
            expect(this.update_spy.callCount).to.equal(4);
            expect($('g').find('text').text()).to.equal('usedTotal: 31.35GB.561051015202530');
            this.update_spy.restore();
        });
    });
});
