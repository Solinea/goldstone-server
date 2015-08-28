#!/bin/bash

FULL_CLEAN=false

for arg in "$@" ; do
    case $arg in
        --full-clean)
            FULL_CLEAN=true
        ;;
        --help)
            echo "Usage: $0 [--full-clean]"
            exit 0
        ;;
        *)
            # unknown option
            echo "Usage: $0 [--full-clean]"
            exit 1
        ;;
    esac
done

if [ "$FULL_CLEAN" = true ] ; then
    docker ps -a | awk '{print $1}' | tail +2 | while read c ; do
        docker rm -f $c
    done
    docker images | tail +2 | awk '{print $3}' | while read i ; do
        docker rmi -f $i
    done
else
    docker ps -a | grep 'docker_gs' | awk '{print $1}' | tail +2 | while read c ; do
        docker rm -f $c
    done
    docker images | grep 'goldstone-' | tail +2 | awk '{print $3}' | while read i ; do
        docker rmi -f $i
    done
fi    
