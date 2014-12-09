/*global sinon, todo, chai, describe, it, calledOnce*/
//integration tests - serviceStatusView.js

describe('eventsReportView.js spec', function() {
    beforeEach(function() {

        $('body').html('<div class="testContainer" style="width=500"></div><div id="testMultiRsrcView"></div>');

        // to answer GET requests
        this.server = sinon.fakeServer.create();
        this.server.respondWith("GET", "/*", [200, {
                "Content-Type": "application/json"
            },
            'wowza'
        ]);

        // confirm that dom is clear of view elements before each test:
        expect($('svg').length).to.equal(0);
        expect($('#spinner').length).to.equal(0);

    });
    afterEach(function() {
        $('body').html('');
        this.server.restore();
    });
    describe('various goldstone functions are tested', function() {
        it('makes an instantaneous._url', function() {
            var test1 = goldstone.nova.instantaneous._url({}, 'bobo', '/monkey');
            expect(test1).to.equal('/monkey?render=bobo');
            var test2 = goldstone.nova.instantaneous._url({}, undefined, '/monkey');
            expect(test2).to.equal('/monkey');
        });
        it('makes an latestStats', function() {
            var test1 = goldstone.nova.latestStats.url();
            expect(test1).to.equal('/nova/hypervisor/latest-stats');
        });
        it('makes an topology', function() {
            var test1 = goldstone.nova.topology.url();
            expect(test1).to.equal('/nova/topology');
            var test2 = goldstone.nova.topology.url('marvin');
            expect(test2).to.equal('/nova/topology?render=marvin');
        });
        it('makes a zones', function() {
            var test1 = goldstone.nova.zones.url();
            expect(test1).to.equal('/nova/zones?start=undefined&end=undefined&interval=undefined');
            var test2 = goldstone.nova.zones.url(121341234,3145135,50,'true');
            expect(test2).to.equal('/nova/zones?start=121341&end=3145&interval=50&render=true');
        });
        it('triggers loadUrl', function() {
            var test1 = goldstone.nova.zones.loadUrl();
        });
        it('triggers latestStats.loadUrl', function() {
            var test1 = goldstone.nova.latestStats.loadUrl();
        });
        it('triggers drawChart', function() {
            var test1 = goldstone.nova.spawns.drawChart();
        });
    });
});
