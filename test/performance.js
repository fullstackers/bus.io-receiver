var Message = require('bus.io-common').Message;
var receiver = require('../.')();
var x = 100000; // number of messages
var y = 1000; // wait time per batch of messages processes
var i = 0; // current message being processed
var m = 2; // number of batches of messages
var n = 0; // current batch
var c = 0;
receiver.on('error', function (err){ console.error('error', err); });
receiver.on('received', function (msg) { c++; });
receiver.use(function (msg, next) { next(); });
receiver.use(/some/, function (msg, next) { next(); });
receiver.use('some *',function (msg, next) { next(); });
receiver.use('some event', function (msg, next) { next(new Error('Some Error')); });
receiver.use(function (err, msg, next) { next(); });
receiver.use('*event', function (msg, next) { msg.deliver(); next(); });
receiver.use('some event', function (msg, next) { throw new Error('We should not get this!!'); });

(function tick () {
  if (++n >= m) { done(); return; }
  console.log('waiting %s seconds', y / 1000); 
  setTimeout(function () {
    for (i=0; i<x; i++) {
      receiver.onReceive(Message({action:'some event'}));
    }
    tick();
  }, y);
})();

function done () { 
  console.log('memory usage: %j\nmessages processed: %s', process.memoryUsage(), c);
  process.exit(0);
}
