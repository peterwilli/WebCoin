#!/bin/bash
trap 'kill $(jobs -p)' EXIT
node ./build/dev-server.js &
sleep 3
./node_modules/.bin/electron .
