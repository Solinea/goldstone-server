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
        });
        it('should parse dummy data appropriately', function() {
            var testData = {};
            var test1 = this.testCollection.parse(testData);
            expect(test1.length).to.equal(48);
        });
    });

    describe('view is constructed', function() {
        it('should exist', function() {
            assert.isDefined(this.testView, 'this.testView has been defined');
            expect(this.testView).to.be.an('object');
            expect(this.testView.el).to.equal('.testContainer');
            expect($(this.testView.el).text()).to.equal("");

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
            this.testCollection.add({
                data: 'test'
            });
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
