/*global sinon, todo, chai, describe, it, calledOnce*/
//integration tests - serviceStatusView.js

describe('serviceStatusView.js spec', function() {
    beforeEach(function() {
        $('body').html('<div class="testContainer"></div>');

        // to answer GET requests
        this.server = sinon.fakeServer.create();
        this.server.respondWith("GET", "/*", [200, {
            "Content-Type": "application/json"
        }, '{absolutely: "nothing"}']);

        // confirm that dom is clear of view elements before each test:
        expect($('svg').length).to.equal(0);
        expect($('#spinner').length).to.equal(0);

        this.protoFetchSpy = sinon.spy(ServiceStatusCollection.prototype, "fetch");

        this.testCollection = new ServiceStatusCollection({
            url: '/null/and/void'
        });

        blueSpinnerGif = "goldstone/static/images/ajax-loader-solinea-blue.gif";

        this.testView = new ServiceStatusView({
            collection: this.testCollection,
            el: '.testContainer',
            width: 800
        });
    });
    afterEach(function() {
        $('body').html('');
        this.server.restore();
        this.protoFetchSpy.restore();
    });
    describe('collection is constructed', function() {
        it('should exist', function() {
            assert.isDefined(this.testCollection, 'this.testCollection has been defined');
            expect(this.testCollection.parse).to.be.a('function');
            expect(this.testCollection.length).to.equal(1);
            this.testCollection.add({
                test1: 'test1'
            });
            expect(this.testCollection.length).to.equal(2);
            this.testCollection.pop();
            expect(this.testCollection.length).to.equal(1);

            // for coverage report
            if (this.testCollection.dummyGen) {
                this.testCollection.dummyGen();
            }
        });
        it('should parse dummy data appropriately', function() {
            var testData = {results:[]};
            var test1 = this.testCollection.parse(testData);
            expect(test1.length).to.equal(0);
            testData = {results:[{name:'fee'},{name:'fi'},{name:'fo'}]};
            var test2 = this.testCollection.parse(testData);
            expect(test2.length).to.equal(3);
            testData = {next: 'garbage/core/hiho', results:[]};
            var test3 = this.testCollection.parse(testData);
            expect(this.testCollection.defaults.nextUrl).to.equal('/core/hiho');
        });
        it('should checkforSets appropriately', function() {
            expect(this.protoFetchSpy.callCount).to.equal(1);
            this.testCollection.reset();
            this.testCollection.add({name: 'bingBap1'},{name: 'bingBap2'},{name: 'bingBap3'},{name: 'bingBap4'});
            this.testCollection.checkForSet();
            expect(this.testCollection.defaults.setAchieved).to.equal(false);
            expect(this.protoFetchSpy.callCount).to.equal(2);
            // now with a duplicate
            this.testCollection.reset();
            this.testCollection.add([{name: 'bingBap3'},{name: 'bingBap2'},{name: 'bingBap3'},{name: 'bingBap3'}]);
            this.testCollection.checkForSet();
            console.log('setAchievedexists?', this.testCollection.defaults.setAchieved);
            expect(this.testCollection.defaults.setAchieved).to.equal(true);
            expect(this.protoFetchSpy.callCount).to.equal(2);
        });
    });

    describe('view is constructed', function() {
        it('should exist', function() {
            assert.isDefined(this.testView, 'this.testView has been defined');
            expect(this.testView).to.be.an('object');
            expect(this.testView.el).to.equal('.testContainer');
            expect($(this.testView.el).text()).to.equal("");

        });
        it('appends the correct class', function() {
            var test = "running";
            var test1 = this.testView.classSelector(test);
            expect(test1).to.equal('alert alert-success');
            test = "not-running";
            var test2 = this.testView.classSelector(test);
            expect(test2).to.equal('alert alert-danger fa fa-exclamation-circle');
        });
        it('behaves properly on sync and render', function() {
            this.update_spy = sinon.spy(this.testView, "update");
            expect(this.update_spy.callCount).to.equal(0);
            this.testCollection.defaults.setAchieved = false;
            this.testCollection.trigger('sync');
            expect(this.update_spy.callCount).to.equal(0);
            this.testCollection.defaults.setAchieved = true;
            this.testCollection.reset();
            this.testCollection.add([{name: 'bingBap1'},{name: 'bingBap2'},{name: 'bingBap33333333333333333333333'},{name: 'bingBap3'},{name: 'bingBap3'}]);
            this.testCollection.trigger('sync');
            expect(this.update_spy.callCount).to.equal(1);
            expect($('.mainContainer .toRemove').length).to.equal(4);

            // replaces characters > 27 with ...
            expect($('.testContainer').text()).to.equal(' bingBap1 bingBap2 bingBap3 bingBap33333333333333333333...');

            // mouseover on truncated nodes brings up tooltip
            expect($('.tooltip').length).to.equal(0);
            $($('.toRemove')[2]).mouseover();
            expect($('.tooltip').length).to.equal(0);
            $($('.toRemove')[3]).mouseover();
            expect($('.tooltip').length).to.equal(1);
            this.update_spy.restore();
        });
        it('can handle a null server payload and append appropriate response', function() {
            this.update_spy = sinon.spy(this.testView, "update");
            expect($('#noDataReturned').length).to.equal(0);
            expect($('#noDataReturned').text()).to.equal('');
            this.testCollection.reset();
            this.testView.update();
            expect($('.testContainer').find('#noDataReturned').length).to.equal(1);
            expect($('#noDataReturned').text()).to.equal('No Data Returned');
            // it doesn't RE-apply 'No Data Returned' if it's already there:
            this.testView.update();
            expect($('.testContainer').find('#noDataReturned').length).to.equal(1);
            expect($('#noDataReturned').text()).to.equal('No Data Returned');
            // it REMOVES 'No Data Returned' if data starts flowing again:
            this.testCollection.add(
            {name:'fee'},{name:'fi'},{name:'fo'}
            );
            this.testView.update();
            expect($('.testContainer').find('#noDataReturned').length).to.equal(0);
            expect($('#noDataReturned').text()).to.equal('');
            expect(this.update_spy.callCount).to.equal(3);
            this.update_spy.restore();
        });
        it('sorts appropriately', function() {
            assert.isDefined(this.testView.sorter, 'this.testView.sorter has been defined');
            var testData = [{
                "ovs-agent1": false,
            }, {
                "ovs-agent2": true,
            }, {
                "ovs-agent3": true,
            }, {
                "neutron-agent3": false
            }, {
                "nova-compute1": true
            }, {
                "neutron-agent1": true
            }, {
                "nova-compute2": false
            }, {
                "neutron-agent2": true
            }, {
                "nova-compute3": true
            }, ];

            var test1 = this.testView.sorter(testData);
            expect(test1).to.deep.equal(
                [{
                    "neutron-agent1": true
                }, {
                    "neutron-agent2": true
                }, {
                    "neutron-agent3": false
                }, {
                    "nova-compute1": true
                }, {
                    "nova-compute2": false
                }, {
                    "nova-compute3": true
                }, {
                    "ovs-agent1": false,
                }, {
                    "ovs-agent2": true
                }, {
                    "ovs-agent3": true
                }]);
        });
    });

});
