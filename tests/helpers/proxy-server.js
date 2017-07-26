'use strict';

const http = require('http');

class ProxyServer {
  constructor() {
    this.called = false;
    this.lastReq = null;
    this.httpServer = http.createServer((req, res) => {
      this.called = true;
      this.lastReq = req;
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('okay');
    });
    this.httpServer.listen(3001);
  }
}

module.exports = ProxyServer;
