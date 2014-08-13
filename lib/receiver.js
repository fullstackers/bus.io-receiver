var util = require('util')
  , events = require('events')
  , debug = require('debug')('bus.io-receiver:receiver')
  , common = require('bus.io-common')
  , Message = common.Message
  , Router = require('./router2')
  , slice = Array.prototype.slice
  , emit = events.EventEmitter.prototype.emit
  ;

module.exports = Receiver;

/**
 * A Receiver pipes a message through a series of "middleware" functions that
 * have the ability to consume or manipulate a message before going to its
 * destination.
 */

function Receiver () {

  if (!(this instanceof Receiver)) return new Receiver();

  debug('new receiver');

  events.EventEmitter.call(this);

  var self = this;

  /**
   * We bind this method to an input source
   *
   * @api public
   * @param {Message} message
   * @param {Socekt} socket *optional
   * @param {function} done *optional
   */

  this.onReceive = function () {
    debug('onReceive', arguments);
    var args = slice.call(arguments);

    var message = Message(args.shift());

    if (typeof args[args.length-1] === 'function') {
      var done = args.pop();
    }

    var params = [message].concat(args);
    self.router().route.call(self.router(), params, done);//([Message(message), socket], done);
  };

  /**
   * We use this method to let our listeners know we
   * have received a message
   *
   * @api private
   * @param {Message} message
   * @param {Socekt} socket * optional
   */

  this.onReceived = function (message, socket) {
    debug('onReceived', message.data.id, (socket ? socket.id : null));
    emit.apply(self,['received'].concat(slice.call(arguments)))
  };

  /**
   * Used for propagating the errors
   *
   * @api private
   * @param {Error} err
   */

  this.onError = function (err) {
    debug('onError',err);
    emit.apply(self,['error'].concat(slice.call(arguments)))
  };

  /**
   * Used for propagating the consumed messages
   *
   * @param {Message} message
   * @param {Socket} socket *optional
   */

  this.onConsumed = function (message, socket) {
    debug('onConsumed', message.data.id, (socket ? socket.id : null));
    emit.apply(self,['consumed'].concat(slice.call(arguments)))
  };

}

util.inherits(Receiver, events.EventEmitter);


/**
 * Pass the functions as middleware
 *
 * @api public
 * @param {function|Array} 
 * @return Receiver
 */

Receiver.prototype.use = function () {
  debug('use', arguments);
  var self = this;
  var args = slice.call(arguments);
  var action = '*';
  if (args.length === 0) return this;
  if (args.length === 1 && typeof args[0] !== 'function' && typeof args[0] !== 'object') {
    throw new Error('Expecting a function');
  }
  if (args.length > 1 && typeof args[0] === 'string') {
    action = args.shift();
  }
  args.forEach(function (o) {
    var type = typeof o;
    if (type === 'object' && util.isArray(o)) {
      self.use.apply(self, o);
    }
    else if (type === 'function' && (o.length >= 1 && o.length <= 3)) {
      self.router().on(action, o);
    }
  });
  return this;
};

/**
 * initialize the router
 *
 * @api private
 * @return {Router} router
 */

Receiver.prototype.router = function () {
  debug('router');
  if (!this._router) {
    this._router = Router();
    this._router.addListener('next', this.onReceived);
    this._router.addListener('deliver', this.onReceived);
    this._router.addListener('respond', this.onReceived);
    this._router.addListener('consume', this.onConsumed);
    this._router.addListener('error', this.onError);
  }
  return this._router;
};
