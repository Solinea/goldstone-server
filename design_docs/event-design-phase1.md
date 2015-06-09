## Event and Alert System Design (phase 1) ##

An event is the record of some activity that is generated or proxied via an integration known to Goldstone Server.  Examples of event sources include the log stream (Error or Warning level messages), ceilometer (via the event pipeline), or directly from a notification bus such as the one used by OpenStack.  

## Phase 1 Objectives ##
* Ingest events from ceilometer
* Ingest Error and Warning messages in log stream
* Transform events into CADF (PyCADF) format
* Store in an ES daily events index
* Provide an event table with sort, filter, and search capability

## Phase 1 Stretch ##
* Add more dashboard elements including:
	* historgram of time (x) vs. event count (y) tied to filtered results stacked based on CADF severity levels
* Implement resource-centric event dashboard tied to Nova model


## References ##

* [PyCADF Developer Guide](http://docs.openstack.org/developer/pycadf/)
* [CADF OpenStack Case Study](http://www.dmtf.org/sites/default/files/standards/documents/DSP2038_1.0.0.pdf)


> Written with [StackEdit](https://stackedit.io/).