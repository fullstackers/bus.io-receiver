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
 *
 * Uses the passed middleware function(s)
 *
 * @param {mixed}
 * @return Router
 */

Router.prototype.use = function () {
  debug('use', arguments);
  var args = slice.call(arguments);
  this._router.use.apply(this._router, args);
  return this;
};

/**
 * routes the message
 *
 * @param {Message} message / Array
 * @return Router
 * @throws Error
 */

Router.prototype.route = function () {
  debug('route', arguments);
  var args = [];
  slice.call(arguments).forEach(function (arg) {
    if (util.isArray(arg)) {
      args.concat(arg);
    }
    else {
      args.push(arg);
    }
  });
  if (!(typeof args[0] === 'object' && args[0] instanceof Message)) throw new Error('First argument must be a Message instance');
  args[0] = Controller(args[0]);
  args.unshift(args[0].action());
  debug('route args', args);
  this._router.route.apply(this._router, args);
  return this;
};
