/*global sinon, todo, chai, describe, it, calledOnce*/
//integration tests

describe('tenantSettingsPageView.js spec', function() {
    beforeEach(function() {

        $('body').html('<div class="test-container"></div>');

        // to answer GET requests
        this.server = sinon.fakeServer.create();
        this.server.respondWith('{date_joined: "2015-03-16T20:50:24Z", default_tenant_admin: false, email: "", first_name: "", last_login: "2015-03-16T20:50:24Z", last_name: "", tenant_admin: true, username: "test", uuid: "dd25bce27a094a868c9ccbb0a698972f"}');

        this.testView = new TenantSettingsPageView({
            el: '.test-container'
        });
    });
    afterEach(function() {
        $('body').html('');
        this.server.restore();
    });
    describe('basic test for chart triggering', function() {
        it('renders view', function() {
            this.testView.render();
            this.testView.submitRequest();
            this.server.respond();
            this.testView.getTenantSettings();
            this.server.respond();
            this.testView.addHandlers();

            var testData = [{
                name: "testtenantname",
                owner: "testowner",
                owner_contact: "testowner@sol.com",
                uuid: "b6c904adf1744753b70960c5e10a7d3e"
            },
            {
                name: "testtenantname2",
                owner: "testowner2",
                owner_contact: "testowner@sol.com2",
                uuid: "53b70960c5e10a7d3fb6c904adf17447"
            }];

            this.testView.drawDataTable(testData);
            this.testView.drawDataTable(testData);
            $('.tenant-settings-form').submit();
        });
        it('expects rows to be clickable and editing form to be populated', function() {
            var testData = [{
                name: "testtenantname",
                owner: "testowner",
                owner_contact: "testowner@sol.com",
                uuid: "b6c904adf1744753b70960c5e10a7d3e"
            },
            {
                name: "testtenantname2",
                owner: "testowner2",
                owner_contact: "testowner@sol.com2",
                uuid: "53b70960c5e10a7d3fb6c904adf17447"
            }];

            this.testView.drawDataTable(testData);
            $("#tenants-single-rsrc-table tbody").find('tr').first().click();
            expect($('[name="name"]').val()).to.equal('testtenantname');
            $("#tenants-single-rsrc-table tbody").find('tr').next().click();
            expect($('[name="name"]').val()).to.equal('testtenantname2');


        });
    });
    describe('individual functions', function() {
        it('trims input', function() {
            // append input field
            $('body').append('<input name="test1" type="text">');
            // set input field to 'hello'
            $('[name="test1"]').val('hello');
            expect($('[name="test1"]').val()).to.equal('hello');
            // trim input field
            this.testView.trimInputField('[name="test1"]');
            // input field should equal 'hello'
            expect($('[name="test1"]').val()).to.equal('hello');
            // set input field to ' hello'
            $('[name="test1"]').val(' hello');
            expect($('[name="test1"]').val()).to.equal(' hello');
            // trim input field
            this.testView.trimInputField('[name="test1"]');
            // input field should equal 'hello'
            expect($('[name="test1"]').val()).to.equal('hello');
            // set input field to 'hello '
            $('[name="test1"]').val('hello ');
            expect($('[name="test1"]').val()).to.equal('hello ');
            // trim input field
            this.testView.trimInputField('[name="test1"]');
            // input field should equal 'hello'
            expect($('[name="test1"]').val()).to.equal('hello');
        });
    });
});
