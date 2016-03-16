/**
 * Copyright 2015 Solinea, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*global sinon, todo, chai, describe, it, calledOnce*/
//integration tests

describe('ChartHeaderView.js spec', function() {
    beforeEach(function() {

        $('body').html('<div class="testContainer"></div>');

        // to answer GET requests
        this.server = sinon.fakeServer.create();
        this.server.autoRespond = true;
        this.server.respondWith("GET", "*", [200, {
            "Content-Type": "application/json"
        }, '[]']);



        // confirm that dom is clear of view elements before each test:
        expect($('svg').length).to.equal(0);
        expect($('#spinner').length).to.equal(0);


        this.InfoButtonText = Backbone.Model.extend({
            defaults: {
                infoText: {
                    // test
                    testText: 'All your bases are belong to Marvin Martian'
                }
            }
        });


        this.testView = new ChartHeaderView({
            chartTitle: 'Test Chart',
            infoText: 'testText',
        });

        $('.testContainer').append(this.testView.el);


    });
    afterEach(function() {
        $('body').html('');
        this.server.respond();
        this.server.restore();
    });
    describe('view is constructed', function() {
        it('should exist', function() {
            assert.isDefined(this.testView, 'this.testView has been defined');
            expect(this.testView).to.be.an('object');
        });
        it('can be instantiated with or without a column designation', function() {
            this.testView = new ChartHeaderView({
                el: '.testContainer',
                chartTitle: 'Test Chart',
                infoText: 'testText'
            });
        });
        it('provides an info popup', function() {
            var infoButtonTest1 = new this.InfoButtonText().get('infoText');
            expect(infoButtonTest1.testText).to.equal('All your bases are belong to Marvin Martian');
            expect($('.popover').length).to.equal(0);
            expect($('#info-button').length).to.equal(1);
        });
        it('view update appends svg and border elements', function() {
            expect(this.testView.populateInfoButton).to.be.a('function');
            this.testView.render();
            expect($('svg').length).to.equal(0);
            expect($('.chart-panel-header').find('text').text()).to.equal('');
            expect($('.panel-title').text().trim()).to.equal('Test Chart');
            expect($('.mainContainer').text().trim()).to.equal('');
        });
    });
});
