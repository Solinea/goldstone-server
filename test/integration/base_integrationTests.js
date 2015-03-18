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
    describe('alerts are raised', function() {
        it('properly replaces and truncates messages', function() {
            var message = 'hi';
            expect($('.test-container').text()).to.equal('');
            goldstone.raiseAlert('.test-container', message);
            expect($('.test-container').text()).to.include('hi');
            message = 'bye';
            goldstone.raiseAlert('.test-container', message);
            expect($('.test-container').text()).to.include('bye');
            message = 'asdflkjasdflkjsadflkjdsaflkjdsaflkjdsaflkjdsflkjdsflkjdsaflkjdsaflkjdsaflkjdsaflkjsdlakfjfdsasdflkjasdflkjsadflkjdsaflkjdsaflkjdsaflkjdsflkjdsflkjdsaflkjdsaflkjdsaflkjdsaflkjsdlakfjfdslkjdsaflkjdsaflkdjfslklkdsajfldksajflsdakjflkdsafj';
            goldstone.raiseAlert('.test-container', message);
            expect($('.test-container').text().length).to.equal(203);
        });
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
