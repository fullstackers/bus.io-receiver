[![Build Status](https://travis-ci.org/turbonetix/bus.io-receiver.svg?branch=master)](https://travis-ci.org/turbonetix/bus.io-receiver)
[![NPM version](https://badge.fury.io/js/bus.io-receiver.svg)](http://badge.fury.io/js/bus.io-receiver)
[![David DM](https://david-dm.org/turbonetix/bus.io-receiver.png)](https://david-dm.org/turbonetix/bus.io-receiver.png)

![Bus.IO](https://raw.github.com/turbonetix/bus.io/master/logo.png)

A bus.io-receiver is where middleware is attached to handle messages.

# Features

* The `Receiver` supports the same API as [switched](https://npmjs.org/package/switched "switched").
* Error handling
* [express](https://npmjs.org/package/express "express") like routing

#API

##Receiver

```javascript
var receiver = require('bus.io-receiver')();
```

###Receiver#onReceive(msg:Message, [done:Function])

You use the `onReceive` method as handler for a *subject* that produces messages.  Optionally
you may pass a callback `done` that will be executed right before the `receiver` triggers
a `received` event.

```javascript
var Message = require('bus.io-common').Message;
var EventEmitter = require('events').EventEmitter;
var producer = new EventEmitter();
producer.on('message', receiver.onReceive);
producer.emit('message', Message(), function (msg) { 
  console.log('message received');
});
```

###Receiver#onReceive(msg:Message, [sock:Socket], [done:Function])

The `onReceive` method actually accepts multiple arguments.  Here we are passing in a `socket` as
well as a `done` callback function.

```javascript
var io = require('socket.io')();
var router = require('socket.io-events')();
router.on(function (sock, args) {
  var msg = Message();
  msg.initialize.apply(msg, args);
  receiver.onReceive(msg, sock)
});
io.use(router);

receiver.use(function (msg, sock, next) {
  msg.content(msg.content().toUpperCase());
});

receiver.on(function (err, msg, sock, next) {
  console.log(err);
  next();
});

receiver.on('received', function (msg, sock) {
  sock.emit(msg.action(), msg.content());
});

```

###Receiver#use(path:String, fn:Function)

You attach *middleware* functions to the `receiver` by calling `use()`.

In the case our `receiver` is listening to just *messages*.

```javascript
receiver.use('some event', function (msg, next) {
  //do stuff with msg
  next();
});
```

In the case our `receiver` is listening to both a *message* and a *socket*.

```javascript
receiver.use('some event', function (msg, sock, next) {
  //do stuff with msg
  next();
});
```

###Receiver#use(fn:Function)

To capture *all* messages just pass a `function`.

```javascript
receiver.use('some event', function (msg, next) {
  //do stuff with msg
  next();
});
```

###Receiver#use(fns:Array)

You can pass in an `Array` of functions too.

```javascript
var middlewares = [
  function (msg, next) { /* do stuff! */ next() },
  function (msg, next) { /* do stuff! */ next() },
  function (msg, next) { /* do stuff! */ next() }
];
receiver.use(middlewares);
```

###Receiver#use(a:Function, b:Function, ...)

In the event you want to pass in multiple functions are arguments.

```javascript
var a = function (msg, next) { next(); }
var b = function (msg, next) { next(); }
var c = function (msg, next) { next(); }
receiver.use(a, b, c);
```

###Receiver#use(a:Function, b:Function, ...)

You can pass multiple functions as arguments with a path too.

```javascript
var a = function (msg, next) { next(); }
var b = function (msg, next) { next(); }
var c = function (msg, next) { next(); }
receiver.use('some event', a, b, c);
```

### Events

These are the `events` you can listen for.

#### received

The `received` event is triggered whenever a `message` has been pushed through the `receiver` middleware.

```javascript
receiver.on('received', function (msg) {
  console.log('The message has been received %s', msg.id());
});
```

#### consumed

The `consumed` event is triggered whenever a `message` has been consumed.

```javascript
receiver.on('consumed', function (msg) {
  console.log('consumed msg %s', msg.id());
});
receiver.use(function (msg) {
  msg.consume();
});
```

#### error

Listen to errors here.

```javascript
receiver.on('error', function (msg) {
  //die! (if you must)
  process.exit(1);
});
```

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
