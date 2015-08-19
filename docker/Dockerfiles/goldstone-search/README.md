solinea/goldstone-search
---

Search index for Goldstone.

`solinea/goldstone-search` is a Docker image based on `solinea/elasticsearch`.
It adds the Goldstone specific configurations and index templates. It also
includes the `mobz/elasticsearch-head` and `lukas-vlcek/bigdesk` Elasticsearch
plugins.

# Usage

The JVM Heap size has been set to 256MB for development. This setting should be
updated by setting the `ES_HEAP_SIZE` environment variable.

Additional environment variables have been set to allow for easy naming of the
cluster (`ES_CLUSTERNAME`) and node name (`ES_NODENAME`).

Other valid environment variables are documented at
[https://www.elastic.co/guide/en/elasticsearch/reference/current/setup-service.html]()

## Command Line

Run the container and expose port tcp/9200:

    docker run -p 9200:9200 solinea/goldstone-search

Run the same container, but override the cluster and node names:

    docker run -p 9200:9200 -e ES_CLUSTERNAME=cluster1 -e ES_NODENAME=nodea solinea/goldstone-search

## Docker Compose

# Connecting

If running docker locally:

    MACHINEIP="127.0.0.1"

If running in docker-machine:

    MACHINEIP="$(docker-machine ip ${MACHINE})"

Where `${MACHINE}` is the docker-machine name.

## RESTful JSON API

    http://$MACHINEIP:9200

##Elasticsearch Head

Elasticsearch Head is a web front end for browsing and interacting with the
cluster. It can be accessed at `http://$MACHINEIP:9200/_plugin/head`.

##Elasticsearch Bigdesk

Bigdesk is a cluster status and statistics monitoring tool. It can be accessed
at `http://$MACHINEIP:9200/_plugin/bigdesk/`