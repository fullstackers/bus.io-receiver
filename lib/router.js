var util = require('util')
  , events = require('events')
  , debug = require('debug')('bus.io-receiver:router')
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
  var self = this;
  var router = this._router = Switched();

  /**
   * Prepares the controller, so when events are triggered the "end" function in
   * the router will be called.
   *
   * @api private
   * @param {Controller} msg
   */

  this._attachEvents = function (msg) {
    debug('attach handlers to controller', msg);
    var args = slice.call(arguments);
    var end = args.pop();
    var next = args.pop();
    ['deliver', 'respond', 'consume'].forEach(function (name) { 
      msg.on(name, self._event(name, end, args));
    });
    next();
  };

  router.use(this._attachEvents);
}

util.inherits(Router, events.EventEmitter);

/**
 * Recursively flatten arrays of arrays 
 *
 * ['a', 'b', ['c', ['d', 'e'], 'f'], 'g'] will be ['a', 'b', 'c', 'd', 'e', 'f', 'g']
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
      else if (util.isRegExp(arg)) {
        call.push(arg);
      }
      break;
    case 'function':
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
      args = args.concat(arg);
    }
    else {
      args.push(arg);
    }
  });
  
  debug('route args', args);

  if (!(typeof args[0] === 'object' && args[0] instanceof Message)) throw new Error('First argument must be a Message instance');

  // we need to check if we have passed in an "end" handler or callback
  // we will pop it off our args because we are wrapping the _end event if we have it
  var _end = 'function' === typeof args[args.length - 1] ? args.pop() : function () { debug('_end'); };

  /**
   * Called when we the we are done routing, this will trigger
   * the "next" event and the Receiver will get it and handle what
   * happens next.
   *
   * @param {mixed}
   */

  var end = function (err) {
    var params = args.slice(1);
    params[0] = params[0].message;
    if (err) {
      debug('has err');
      emit.apply(self, ['error', err].concat(params));
    }
    else {
      debug('no err');
      var proceed  = willProceed(msg);
      debug('proceed? %s', proceed);
      if (proceed) {
        emit.apply(self, ['next'].concat(params));
      }
    }
    _end.apply(self, args);
  };

  // store the end action
  args.push(end);

  // Wrap the first argument which should be a Message into a Controller.
  // The first handler in the router will attach event listeners to the controller
  // that will bubble the event and trigger the "end" method.
  var msg = args[0] = Controller(args[0]);

  var proceed = willProceed(msg);
  debug('proceed %s, %s, %s', msg.message.delivered, msg.message.responded, msg.message.consumed);

  if (!proceed) return end(void 0);

  // store the action name as the event name, this will be passed into the router
  // and the the router will get the handlers that match the action
  args.unshift(args[0].action());

  debug('args', args);

  // invoke the router applying the args e.g. ['say', Message(), end]
  this._router.route.apply(this._router, args);
  return this;
};

/**
 * Returns a functiona that will be used to trigger an event.  It will pass
 * in the args
 *
 * @api private
 * @param {String} name
 * @param {Function} end 
 * @param {Array} args 
 * @return Function
 */

Router.prototype._event = function (name, end, args) {
  var self = this;
  return function _event (msg) {
    debug('_event %s', name);
    emit.apply(self, [name, msg].concat(args.slice(1)));
    self.emit('done', name, [msg].concat(args.slice(1)));
    end();
 };
};


/**
 * Checks if we should procced
 *
 * @api private
 * @param {Controller} msg
 * @return boolean
 */ 

function willProceed(msg) {
 return !(msg.message.delivered || msg.message.responded || msg.message.consumed)
}
