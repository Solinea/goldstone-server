// define collection and link to model

var EventTimelineCollection = Backbone.Collection.extend({

    parse: function(data) {
        return data.results;
    },

    model: EventTimelineModel,

    // thisXhr: null,
    thisXhr: {},

    setXhr: function() {
        // this.thisXhr = this.fetch();


        // ****** start patch
        this.thisXhr = {

            LogCountStart: "2014-09-29T02:02:33Z",
            // LogCountStart: "2014-09-28T22:22:33Z",
            LogCountEnd: "2014-09-30T09:07:12Z",

            getResponseHeader: function(input) {
                if (input === 'LogCountStart') {
                    return this.LogCountStart;
                }
                if (input === 'LogCountEnd') {
                    return this.LogCountEnd;
                }
            }

        };

        // ***** end patch
    },

    initialize: function(options) {
        this.url = options.url;
        this.setXhr();
    },

    sampleData: {
        "count": 3,
        "next": null,
        "previous": null,
        "results": [
        {
            "polymorphic_ctype": 17,
            "uuid": "d10e5cc2-c09e-45ba-95ac-127cfae2394a",
            "event_type": "Syslog Event",
            "created": "2014-09-29T04:22:33Z",
            "updated": "2014-09-30T01:31:07Z",
            "message": "2014-09-28 22:22:33.771 8863 ERROR nova.api.openstack [req-798dba41-5437-4702-8c16-497445facffb f5734077b04d4f9f95cb8fec7699f6f8 3aa3b6e4ce0048a7997d900ddde95d41] "
        },
        {
            "polymorphic_ctype": 17,
            "uuid": "e70e5cc2-c09e-45ba-95ac-127cfae2394a",
            "event_type": "Syslog Event",
            "created": "2014-09-29T04:22:33Z",
            "updated": "2014-09-30T02:31:07Z",
            "message": "2014-09-28 22:22:33.771 8863 ERROR nova.api.openstack [req-798dba41-5437-4702-8c16-497445facffb f5734077b04d4f9f95cb8fec7699f6f8 3aa3b6e4ce0048a7997d900ddde95d41] "
        },
        {
            "polymorphic_ctype": 17,
            "uuid": "d80e5cc2-c09e-45ba-95ac-127cfae2394a",
            "event_type": "Syslog Event",
            "created": "2014-09-29T04:22:33Z",
            "updated": "2014-09-30T03:31:07Z",
            "message": "2014-09-28 22:22:33.771 8863 ERROR nova.api.openstack [req-798dba41-5437-4702-8c16-497445facffb f5734077b04d4f9f95cb8fec7699f6f8 3aa3b6e4ce0048a7997d900ddde95d41] "
        },
        {
            "polymorphic_ctype": 17,
            "uuid": "d70e3cc2-c09e-45ba-95ac-127cfae2394a",
            "event_type": "Syslog Event",
            "created": "2014-09-29T04:22:33Z",
            "updated": "2014-09-30T04:31:07Z",
            "message": "2014-09-28 22:22:33.771 8863 ERROR nova.api.openstack [req-798dba41-5437-4702-8c16-497445facffb f5734077b04d4f9f95cb8fec7699f6f8 3aa3b6e4ce0048a7997d900ddde95d41] "
        },

         {
            "polymorphic_ctype": 17,
            "uuid": "d70e5cc3-c09e-45ba-95ac-127cfae2394a",
            "event_type": "Syslog Event",
            "created": "2014-09-29T04:22:33Z",
            "updated": "2014-09-30T00:31:07Z",
            "message": "2014-09-28 22:22:33.771 8863 ERROR nova.api.openstack [req-798dba41-5437-4702-8c16-497445facffb f5734077b04d4f9f95cb8fec7699f6f8 3aa3b6e4ce0048a7997d900ddde95d41] Caught error: #0122014-09-28 22:22:33.771 8863 TRACE nova.api.openstack Traceback (most recent call last):#0122014-09-28 22:22:33.771 8863 TRACE nova.api.openstack   File \"/usr/lib/python2.6/site-packages/nova/api/openstack/__init__.py\", line 125, in __call__#0122014-09-28 22:22:33.771 8863 TRACE nova.api.openstack     return req.get_response(self.application)#0122014-09-28 22:22:33.771 8863 TRACE nova.api.openstack   File \"/usr/lib/python2.6/site-packages/webob/request.py\", line 1296, in send#0122014-09-28 22:22:33.771 8863 TRACE nova.api.openstack     application, catch_exc_info=False)#0122014-09-28 22:22:33.771 8863 TRACE nova.api.openstack   File \"/usr/lib/python2.6/site-packages/webob/request.py\", line 1260, in call_application#0122014-09-28 22:22:33.771 8863 TRACE nova.api.openstack     app_iter = application(self.environ, start_response)#0122014-09-28 22:22:33.771 8863 TRACE nova.api.openstack   File \"/usr/lib/python2.6/site-packages/webob/dec.py\", line 144, in __call__#0122014-09-28 22:22:33.771 8863 TRACE nova.api.openstack     return resp(environ, start_response)#0122014-09-28 22:22:33.771 8863 TRACE nova.api.openstack   File \"/usr/lib/python2.6/site-packages/keystoneclient/middleware/auth_token.py\", line 679, in __call__#0122014-09-28 22:22:33.771 8863 TRACE nova.api.openstack     return self.app(env, start_response)#0122014-09-28 22:22:33.771 8863 TRACE nova.api.openstack   File \"/usr/lib/python2.6/site-packages/webob/dec.py\", line 144, in __call__#0122014-09-28 22:22:33.771 8863 TRACE nova.api.openstack     return resp(environ, start_response)#0122014-09-28 22:22:33.771 8863 TRACE nova.api.openstack   File \"/usr/lib/python2.6/site-packages/webob/dec.py\", line 144, in __call__#0122014-09-28 22:22:33.771 8863 TRACE nova.api.openstack     return resp(environ, start_response)#0122014-09-28 22:",
            "event_rels": [],
            "entity_rels": [2, 2]
        }, {
            "polymorphic_ctype": 17,
            "uuid": "685ccccd-717a-4c5a-acd1-413f0c64280f",
            "event_type": "Syslog Error",
            "created": "2014-09-29T07:05:12Z",
            "updated": "2014-09-30T01:09:02Z",
            "message": "2014-09-29 07:05:12.363 7102 ERROR nova.compute.manager [req-dec62213-e3ff-4124-b1ef-aaf1f640e264 f5734077b04d4f9f95cb8fec7699f6f8 3aa3b6e4ce0048a7997d900ddde95d41] [instance: 205f143e-108d-483a-8614-d5564d1483c2] Instance failed to spawn#0122014-09-29 07:05:12.363 7102 TRACE nova.compute.manager [instance: 205f143e-108d-483a-8614-d5564d1483c2] Traceback (most recent call last):#0122014-09-29 07:05:12.363 7102 TRACE nova.compute.manager [instance: 205f143e-108d-483a-8614-d5564d1483c2]   File \"/usr/lib/python2.6/site-packages/nova/compute/manager.py\", line 1738, in _spawn#0122014-09-29 07:05:12.363 7102 TRACE nova.compute.manager [instance: 205f143e-108d-483a-8614-d5564d1483c2]     block_device_info)#0122014-09-29 07:05:12.363 7102 TRACE nova.compute.manager [instance: 205f143e-108d-483a-8614-d5564d1483c2]   File \"/usr/lib/python2.6/site-packages/nova/virt/libvirt/driver.py\", line 2286, in spawn#0122014-09-29 07:05:12.363 7102 TRACE nova.compute.manager [instance: 205f143e-108d-483a-8614-d5564d1483c2]     block_device_info)#0122014-09-29 07:05:12.363 7102 TRACE nova.compute.manager [instance: 205f143e-108d-483a-8614-d5564d1483c2]   File \"/usr/lib/python2.6/site-packages/nova/virt/libvirt/driver.py\", line 3707, in _create_domain_and_network#0122014-09-29 07:05:12.363 7102 TRACE nova.compute.manager [instance: 205f143e-108d-483a-8614-d5564d1483c2]     raise exception.VirtualInterfaceCreateException()#0122014-09-29 07:05:12.363 7102 TRACE nova.compute.manager [instance: 205f143e-108d-483a-8614-d5564d1483c2] VirtualInterfaceCreateException: Virtual Interface creation failed#0122014-09-29 07:05:12.363 7102 TRACE nova.compute.manager [instance: 205f143e-108d-483a-8614-d5564d1483c2] ",
            "event_rels": [],
            "entity_rels": [1, 1]
        }, {
            "polymorphic_ctype": 17,
            "uuid": "5149ee4f-1fd7-4ffe-84b8-73ecee5a4d33",
            "event_type": "Syslog Warning",
            "created": "2014-09-29T09:05:16Z",
            "updated": "2014-09-30T02:09:02Z",
            "message": "2014-09-29 07:05:16.189 7102 ERROR nova.compute.manager [req-37e6ee2c-04da-4676-9aea-641941815a7e f5734077b04d4f9f95cb8fec7699f6f8 3aa3b6e4ce0048a7997d900ddde95d41] [instance: d0b7b466-37da-4dae-8ba6-4697091b755d] Instance failed to spawn#0122014-09-29 07:05:16.189 7102 TRACE nova.compute.manager [instance: d0b7b466-37da-4dae-8ba6-4697091b755d] Traceback (most recent call last):#0122014-09-29 07:05:16.189 7102 TRACE nova.compute.manager [instance: d0b7b466-37da-4dae-8ba6-4697091b755d]   File \"/usr/lib/python2.6/site-packages/nova/compute/manager.py\", line 1738, in _spawn#0122014-09-29 07:05:16.189 7102 TRACE nova.compute.manager [instance: d0b7b466-37da-4dae-8ba6-4697091b755d]     block_device_info)#0122014-09-29 07:05:16.189 7102 TRACE nova.compute.manager [instance: d0b7b466-37da-4dae-8ba6-4697091b755d]   File \"/usr/lib/python2.6/site-packages/nova/virt/libvirt/driver.py\", line 2286, in spawn#0122014-09-29 07:05:16.189 7102 TRACE nova.compute.manager [instance: d0b7b466-37da-4dae-8ba6-4697091b755d]     block_device_info)#0122014-09-29 07:05:16.189 7102 TRACE nova.compute.manager [instance: d0b7b466-37da-4dae-8ba6-4697091b755d]   File \"/usr/lib/python2.6/site-packages/nova/virt/libvirt/driver.py\", line 3707, in _create_domain_and_network#0122014-09-29 07:05:16.189 7102 TRACE nova.compute.manager [instance: d0b7b466-37da-4dae-8ba6-4697091b755d]     raise exception.VirtualInterfaceCreateException()#0122014-09-29 07:05:16.189 7102 TRACE nova.compute.manager [instance: d0b7b466-37da-4dae-8ba6-4697091b755d] VirtualInterfaceCreateException: Virtual Interface creation failed#0122014-09-29 07:05:16.189 7102 TRACE nova.compute.manager [instance: d0b7b466-37da-4dae-8ba6-4697091b755d] ",
            "event_rels": [],
            "entity_rels": [1, 1]
        }, {
            "polymorphic_ctype": 17,
            "uuid": "d70e5cc1-c09e-45ba-95ac-127cfae2394a",
            "event_type": "Syslog Error",
            "created": "2014-09-29T05:22:33Z",
            "updated": "2014-09-30T01:31:07Z",
            "message": "2014-09-28 22:22:33.771 8863 ERROR nova.api.openstack [req-798dba41-5437-4702-8c16-497445facffb f5734077b04d4f9f95cb8fec7699f6f8 3aa3b6e4ce0048a7997d900ddde95d41] Caught error: #0122014-09-28 22:22:33.771 8863 TRACE nova.api.openstack Traceback (most recent call last):#0122014-09-28 22:22:33.771 8863 TRACE nova.api.openstack   File \"/usr/lib/python2.6/site-packages/nova/api/openstack/__init__.py\", line 125, in __call__#0122014-09-28 22:22:33.771 8863 TRACE nova.api.openstack     return req.get_response(self.application)#0122014-09-28 22:22:33.771 8863 TRACE nova.api.openstack   File \"/usr/lib/python2.6/site-packages/webob/request.py\", line 1296, in send#0122014-09-28 22:22:33.771 8863 TRACE nova.api.openstack     application, catch_exc_info=False)#0122014-09-28 22:22:33.771 8863 TRACE nova.api.openstack   File \"/usr/lib/python2.6/site-packages/webob/request.py\", line 1260, in call_application#0122014-09-28 22:22:33.771 8863 TRACE nova.api.openstack     app_iter = application(self.environ, start_response)#0122014-09-28 22:22:33.771 8863 TRACE nova.api.openstack   File \"/usr/lib/python2.6/site-packages/webob/dec.py\", line 144, in __call__#0122014-09-28 22:22:33.771 8863 TRACE nova.api.openstack     return resp(environ, start_response)#0122014-09-28 22:22:33.771 8863 TRACE nova.api.openstack   File \"/usr/lib/python2.6/site-packages/keystoneclient/middleware/auth_token.py\", line 679, in __call__#0122014-09-28 22:22:33.771 8863 TRACE nova.api.openstack     return self.app(env, start_response)#0122014-09-28 22:22:33.771 8863 TRACE nova.api.openstack   File \"/usr/lib/python2.6/site-packages/webob/dec.py\", line 144, in __call__#0122014-09-28 22:22:33.771 8863 TRACE nova.api.openstack     return resp(environ, start_response)#0122014-09-28 22:22:33.771 8863 TRACE nova.api.openstack   File \"/usr/lib/python2.6/site-packages/webob/dec.py\", line 144, in __call__#0122014-09-28 22:22:33.771 8863 TRACE nova.api.openstack     return resp(environ, start_response)#0122014-09-28 22:",
            "event_rels": [],
            "entity_rels": [2, 2]
        }]
    }

});
