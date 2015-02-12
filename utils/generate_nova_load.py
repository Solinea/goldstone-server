#!/usr/bin/python

import os
import time
from datetime import datetime
import pytz
import string
import random
import novaclient.v1_1.client as nvclient

os_params = {
	'username': 'admin',
	'api_key': 'fe67c09d85041ae383c66a83e362f566',
	'project_id': 'admin',
	'auth_url': 'http://10.10.11.230:5000/v2.0'
}

def shutdown_vms(nova):
    '''shuts down a random number of existing vms 
    with our known prefix'''

    existing = nova.servers.list(search_opts={'name':'randgen-*'})
    print "existing random vms = ", existing
    count = len(existing)
    to_remove = random.sample(existing, random.randint(0, len(existing)))
    print "removing vms = ", to_remove

    for v in to_remove:
        v.delete()

def create_vms(nova, max):
    '''creates a random number of vms up to max in the environment'''
    existing = nova.servers.list(search_opts={'name':'randgen-*'})
    print "existing random vms = ", existing
    count = len(existing)
    to_create = random.randint(0, max - count) if (max - count) > 0 else 0
    for i in range(0, to_create + 1):
        image = nova.images.find(name="Cirros 0.3.2")
        flavor = nova.flavors.find(name="m1.tiny")
        name = "randgen-" + ''.join(
            random.choice(string.ascii_lowercase + string.digits) for x in range(6))
        print "creating vm ", name
#        nova.servers.create(name=name, image=image, flavor=flavor, 
#            nics=[{'net-id': "235f6b72-5175-4c4c-a1af-8ae0645c04d9"}])
        nova.servers.create(name=name, image=image, flavor=flavor, 
            nics=[{'net-id': "d23146f2-598e-45b2-ae93-d7c96262b3e3"}])

start = datetime.now(tz=pytz.utc)
print "started at: " + start.isoformat()
nova = nvclient.Client(**os_params)
shutdown_vms(nova)
create_vms(nova,5)
end = datetime.now(tz=pytz.utc)
print "finished at: " + end.isoformat()
print ""
print "-------------------------------"
print ""

