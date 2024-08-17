
global.requestCounter = {
  count: 1,
  update: function () {
    this.count++;
  }
}

global.heartbeat = {
  lastPing: Date.now(),
  interval: 5000,
  timeOut: 10000,
  timeOutCount: 0,
  pingCount: 1,
  maxTimeOut: 5,
  update: function () {
    this.lastPing = Date.now();
    this.pingCount++;
  }
}

function requestCounter(req, res, next) {
  global.requestCounter.update();
  console.log("Request Count: ", global.requestCounter.count);
  next(); // pass to the next middleware
}

module.exports = { requestCounter };