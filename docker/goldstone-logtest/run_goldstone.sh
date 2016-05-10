#!/bin/bash
echo "Running the goldstone test suite"
echo "    Config: goldstone/config"
echo "    Test cases at goldstone/test"
echo 
echo "Environment:"
cat goldstone.env

./logstash-tester.sh -d goldstone -e goldstone.env -p /logstash/patterns
