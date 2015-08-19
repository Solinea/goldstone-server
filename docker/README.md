Goldstone Dockerfiles and Compose Configuration
===============================================

Docker image definitions and configurations for https://github.com/Solinea/goldstone-server.

## Components

* Elasticsearch >=1.5
* Logstash >=1.5
* PostgreSQL >=9.4
* Redis >=3

## Run Docker Compose
Docker compose allows you to run the entire envirnment, including all links between containers.

To install on Mac OSX, run `brew install docker-compose`.

Then execute `docker-compose up` from the directory containing docker-compose.yml.
  
To run in detached mode, execute `docker-compose up -d`.

## Test Image Builds
`docker build -t docker-registry/image-name:latest`

*Note: The latest tag is required so that docker-compose will work*

## Testing
Run `rake test` to run all Dockerfile image tests.

*Note: If using docker-machine, services will be exposed at the IP* `docker-machine ip`

### Celery
Check the status of the cluster

`docker run --link rabbitcontainer:rabbit --rm celery celery status`