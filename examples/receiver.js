var Message = require('bus.io-common').Message;
var receiver = require('../.')();
receiver.on('error', function (err){ 
  console.log('Received an error: %s', err);
});
receiver.on('received', function (msg) {
  console.log('This receiver is finished and triggered the "received" event with the message %j', msg.data);
});
receiver.use(function (msg, next) {
  console.log('All messages go through this handler!', msg.action());
  next();
});
receiver.use(/some/, function (msg, next) {
  console.log('/some/ messages go through this handler!', msg.action());
  next();
});
receiver.use('some *',function (msg, next) {
  console.log('"some *" messages go through this handler! %s', msg.action());
  next();
});
receiver.use('some event', function (msg, next) {
  console.log('"some event" messages go through this handler! %s', msg.action());
  console.log('triggering an Error that should be captured in the next error handler');
  next(new Error('Some Error'));
});
receiver.use(function (err, msg, next) {
  console.log('We received an "Error" from a previous handler! %s', err);
  console.log('We will receover! by just calling "next()"');
  next();
});
receiver.use('*event', function (msg, next) {
  console.log('"*event*" messages go through this handler! %s', msg.action());
  console.log('we are going to invoke "deliver()" on the msg to prevent the next handler');
  msg.deliver();
  console.log('attempting to call next to trigger the next handler');
  next();
});
receiver.use('some event', function (msg, next) {
  throw new Error('We should not get this!!');
});
receiver.onReceive(Message({action:'some event'}));
