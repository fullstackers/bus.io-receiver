var util = require('util')
  , events = require('events')
  , debug = require('debug')('route')
  , async = require('async')
  , common = require('bus.io-common')
  , Controller = common.Controller
  , Message = common.Message
  , Point = require('./point')
  ;

module.exports = Route;

/**
 * Represents a compiled list of functions that will be executed sequentially
 *
 * @return Route
 */

function Route () {
  if (!(this instanceof Route)) return new Route();
  debug('new route');
  events.EventEmitter.call(this);
}

util.inherits(Route, events.EventEmitter);

/**
 * executes the list of functions, sequentially given the message or an array of args to be passed in
 *
 * @param {Message/Array} message * Could be a Message or an Array with the first item as the message
 * @param {function} done
 */

Route.prototype.process = function (message, done) {/* done() is for testing */
  debug('process', message, typeof done);
  var self = this, params = [];

  //prepare our input
  if (typeof message === 'object' && 
      message instanceof Array && 
      typeof message[0] === 'object' &&
      message[0] instanceof Message ) {
    params = message;
    message = params.shift();
  }
  if (!(message instanceof Message)) throw new Error('message must be a Message');

  // the sequence
  var fns = [
    // TODO clean this up
    function (cb) {
      debug('wrap message with controller');
      var controller = Controller(message);
      controller.on('deliver', function (message) {
        debug('controller on deliver', message, this.message);
        var args = Array.prototype.slice.call(arguments);
        events.EventEmitter.prototype.emit.apply(self, ['deliver'].concat(args).concat(params));
        self.emit('done', 'deliver', args);
      });
      controller.on('respond', function (message) {
        debug('controller on respond', message, this.message);
        var args = Array.prototype.slice.call(arguments);
        events.EventEmitter.prototype.emit.apply(self, ['respond'].concat(args).concat(params));
        self.emit('done', 'respond', args);
      });
      controller.on('consume', function (message) {
        debug('controller on consume', message, this.message);
        var args = Array.prototype.slice.call(arguments);
        events.EventEmitter.prototype.emit.apply(self, ['consume'].concat(args).concat(params));
        self.emit('done', 'consume', args);

      });
      if (typeof done === 'function') {
        debug('we have a done function so bind handlers to invoke done');
        controller.on('deliver', function () {
          debug('controller on deliver done', arguments);
          done.apply(done, Array.prototype.slice.call(arguments));
        });
        controller.on('respond', function () {
          debug('controller on respond done', arguments);
          done.apply(done, Array.prototype.slice.call(arguments));
        });
        controller.on('consume', function () {
          debug('controller on consume done', arguments);
          done.apply(done, Array.prototype.slice.call(arguments));
        });
      }
      var stuff = [controller].concat(params || [])
      debug('controller initialized calling next ', stuff);
      cb(null, stuff);
    }
  ];

  // go through each point and build up a sequence of function or middleware to invoke
  this.list().forEach(function (point) {
    fns.push(function (params, cb) {
      debug('routing step', params);
      if (params[0].message.consumed || params[0].message.delivered || params[0].message.responded) return cb(true);
      point.fn.apply(point.fn, params.concat([ function (err) { if (err) return cb(err); cb(null, params) }]));
    });
  })

  // invoke the sequence
  async.waterfall(fns, function (err, args) {
    debug('last routing step', err, args);
    if (err && err !== true) {
      debug('had an error');
      self.emit('error', err);
    }
    else {
      debug('trigger the next event', message, params);
      events.EventEmitter.prototype.emit.apply(self, ['next', message].concat(params));
      if (typeof done === 'function') {
        done.apply(done, params);
      }
    }
  });
  return this;
};

/**
 * Initializes a list of methods that will invoked
 *
 * @return Array
 */

Route.prototype.list = function () {
  debug('getting the list');
  if (!this._list) {
    this._list = [];
  }
  return this._list;
};
