var util = require('util')
  , events = require('events')
  , debug = require('debug')('bus.io-receiver:router2')
  , Switched = require('switched')
  , common = require('bus.io-common')
  , Controller = common.Controller
  , Message = common.Message
  , slice = Array.prototype.slice
  , emit = events.EventEmitter.prototype.emit
  ;

module.exports = Router;

/**
 * Routes a message through a series of middleware functions
 *
 * @return Router
 */

function Router () {
  if (!(this instanceof Router)) return new Router();
  events.EventEmitter.call(this);
  this._router = Switched();
}

util.inherits(Router, events.EventEmitter);

/**
 * Recursively flatten arrays
 *
 * @api protected
 * @param {mixed} a
 * @return {Array}
 */

var flatten = Router.flatten = function flatten (a) {
  var b = [];
  if (!util.isArray(a)) {
    b.push(a);
  }
  else {
    for (var i=0; i<a.length; i++) {
      b = b.concat(flatten(a[i]));
    }
  }
  return b;
};

/**
 * Uses the passed middleware function(s)
 *
 * @api public
 * @param {mixed}
 * @return Router
 */

Router.prototype.use = function () {
  debug('use', arguments);
  var call = [], args = Router.flatten(slice.call(arguments)), i, arg, type;
  for (i=0; i<args.length; i++) {
    arg = args[i];
    type = typeof arg;
    switch(type) {
    case 'object':
      if (arg instanceof Router) {
        call.push(arg._router);
      }
      else if (util.isRegEx(arg)) {
        call.push(arg);
      }
      break;
    case 'function':
      call.push(this._wrap(arg));
      break;
    case 'string':
      call.push(arg);
      break;
    default:
      continue;
    }
  }
  this._router.use.apply(this._router, call);
  return this;
};

/**
 * Wraps the function passed to the internal router
 *
 * Users pass in functions like 
 *
 * function (msg, sock, next) {
 *
 * }
 *
 * However Switched calls the method like this
 *
 * function (msg, sock, next, end) {
 *
 * }
 *
 * This will return a function that passes only the parameters we want
 *
 * @api private
 * @param {Function} fn
 * @return Function
 */

Router.prototype._wrap = function (fn) {
 if (fn.fn) return fn;
 var wrap = function () {
    var args = slice.call(arguments);
    return fn.apply(this, args.slice(0, args.length-1));
  };
  wrap.fn = fn;
  return wrap;
}

/**
 * routes the message
 *
 * @api public
 * @param {Message} message / Array
 * @return Router
 * @throws Error
 */

Router.prototype.route = function () {
  debug('route', arguments);
  var self = this, args = [];
  slice.call(arguments).forEach(function (arg) {
    if (util.isArray(arg)) {
      args.concat(arg);
    }
    else {
      args.push(arg);
    }
  });
  if (!(typeof args[0] === 'object' && args[0] instanceof Message)) throw new Error('First argument must be a Message instance');
  var end = args[args.length - 1];
  if (typeof end !== 'function') {
    end = function () { debug('done'); };
    args.push(end);
  }
  var controller = args[0] = Controller(args[0]);
  ['deliver', 'respond', 'consume'].forEach(function (name) { self.on(name, self._event(name)); });
  args.unshift(args[0].action());
  debug('route args', args);
  this._router.route.apply(this._router, args);
  return this;
};

/**
 * Returns a functiona that will be used to trigger an event
 *
 * @param {String} name
 * @return Function
 */

Router.prototype._event = function (name) {
  var self = this;
  return function () {
    var args = slice.call(arguments);
    debug('invoking event handler ' + name, args);
    emit.apply(self, [name].concat(args).slice(0, args.length));
    self.emit('done', name, args);
 };
};
