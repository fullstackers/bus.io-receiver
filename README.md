[![Build Status](https://travis-ci.org/turbonetix/bus.io-receiver.svg?branch=master)](https://travis-ci.org/turbonetix/bus.io-receiver)
[![NPM version](https://badge.fury.io/js/bus.io-receiver.svg)](http://badge.fury.io/js/bus.io-receiver)
[![David DM](https://david-dm.org/turbonetix/bus.io-receiver.png)](https://david-dm.org/turbonetix/bus.io-receiver.png)

![Bus.IO](https://raw.github.com/turbonetix/bus.io/master/logo.png)

A bus.io-receiver is where middleware is attached to handle messages.

# Installation and Environment Setup

Install node.js (See download and install instructions here: http://nodejs.org/).

Clone this repository

    > git clone git@github.com:turbonetix/bus.io-receiver.git

cd into the directory and install the dependencies

    > cd bus.io-receiver
    > npm install && npm shrinkwrap --dev

# Running Tests

Install coffee-script

    > npm install coffee-script -g

Tests are run using grunt.  You must first globally install the grunt-cli with npm.

    > sudo npm install -g grunt-cli

## Unit Tests

To run the tests, just run grunt

    > grunt spec

## TODO
