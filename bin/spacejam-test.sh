#!/bin/bash -e

mocha --colors --reporter spec tests/src/*Test*.js
