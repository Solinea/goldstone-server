#!/bin/bash
if [[ $TEST_TARGET == "all" || $TEST_TARGET == "patterns" ]]; then
    echo "###  RUN PATTERN TESTS    #####################"
    rspec -f p /test/spec/patterns_spec.rb
fi

if [[ $TEST_TARGET == "all" || $TEST_TARGET == "filters" ]]; then
    echo "###  RUN FILTER Tests  ####################"
    if [[ $RUN_CONFIGTEST == "true" ]]; then
        logstash --configtest -f /test/spec/filter_config
    fi

    rspec -f p /test/spec/filter_spec.rb
fi

