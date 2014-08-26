var util = require('util')
  , events = require('events')
  , debug = require('debug')('bus.io-receiver:receiver')
  , common = require('bus.io-common')
  , Message = common.Message
  , Router = require('./router')
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
    message.delivered = message.responded = message.consumed = undefined;
    var router = self.router();
    router.route.apply(router, [message].concat(args));
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
  var router = this.router();
  router.use.apply(router, slice.call(arguments));
  return this;
};

/**
 * initialize the router
 *
 * @api private
 * @return {Router} router
 */

Receiver.prototype.router = function () {
  debug('get router');
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
