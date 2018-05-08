#!/bin/bash -e

mocha --colors --reporter spec tests/lib/*Test*.js
