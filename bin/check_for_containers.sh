#!/bin/bash

CONTAINER_NAME=$1
CONTAINER=`docker ps -a | grep $1 | wc -l`

echo $CONTAINER
