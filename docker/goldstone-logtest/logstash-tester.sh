#!/bin/bash

usage() {
    echo "
    Logstash Tester - Unit-testing for Logstash configuration fields

    Usage:
        ./logstash-tester.sh [-h] | -d path [-e file] [-p path] 

    Options:
    -d path
        Root directory for all your logstash config and test files.
        It is not optional and it should have a specific structure.
        See documentation for details or the 'example' directory in the
        repository root.
    -e file
        An environment file (see Dockerfile for variables)
    -p path
        The destination for the patterns (should match your patterns_dir
        setting in grok filters.
    -h
        This text.

    Examples
    ./logstash-tester.sh -d example
        The simplest command line form. Run all tests, root dir for config and
        test files is 'example'.
    ./logstash-tester.sh -d example -p /opt/logstash/patterns -e example.env
        Place patterns in /opt/logstash/patterns in the container, and
        use environment variables from example.env.

    More info on the project repository:
        https://github.com/gaspaio/logstash-tester
    "

}

error() {
    echo "$* See help (-h) for details."
    exit 1
}

run_docker() {

    if ! hash docker 2> /dev/null; then
        error "Can't find the Docker executable. Did you install it?"
    fi
    
    echo "====> Build docker image for test"
    docker build -t solinea/goldstone-logtest $BUILD_ARGS -f `pwd`/Dockerfile .

    echo "====> Run test in docker container"
    docker run --rm $RUN_ARGS -it solinea/goldstone-logtest
}

##### main #####

BUILD_ARGS=
RUN_ARGS="-v `pwd`/../goldstone-log/logstash/conf.d:/test/spec/filter_config:ro -v `pwd`/../goldstone-log/logstash/patterns:/logstash/patterns:ro"

while getopts "d:e:p:h" opt; do
    case $opt in
        d)
            if [[ -d $OPTARG ]]; then
                BUILD_ARGS="${BUILD_ARGS} --build-arg TEST_SUITE_DIR=$OPTARG"
            else
                error "'$OPTARG' is not a valid directory."
            fi
            ;;
        e)
            if [[ -f $OPTARG ]]; then
                RUN_ARGS="${RUN_ARGS} --env-file=$OPTARG"
            else
                error "'$OPTARG' is not a valid file."
            fi
            ;;
        p)
            BUILD_ARGS="${BUILD_ARGS} --build-arg PATTERN_TARGET_DIR=$OPTARG"
            ;;
        h)
            usage
            exit 0
            ;;
        :)
            error "Option -$OPTARG requires an argument."
            ;;
        \?)
            error "Invalid option -$OPTARG."
            ;;
    esac
done

run_docker

