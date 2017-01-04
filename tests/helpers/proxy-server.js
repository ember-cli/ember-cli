'use strict';

const http = require('http');

let ProxyServer = function() {
  let _this = this;
  this.called = false;
  this.lastReq = null;
  this.httpServer = http.createServer(function(req, res) {
    _this.called = true;
    _this.lastReq = req;
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('okay');
  });
  this.httpServer.listen(3001);
};

module.exports = ProxyServer;
