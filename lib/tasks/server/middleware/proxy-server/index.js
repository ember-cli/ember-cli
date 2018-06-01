'use strict';

class ProxyServerAddon {
  constructor(project) {
    this.project = project;
    this.name = 'proxy-server-middleware';
  }

  serverMiddleware(opts) {
    let { app, options } = opts;
    let server = options.httpServer;

    if (options.proxy) {
      let proxy = require('http-proxy').createProxyServer({
        target: options.proxy,
        ws: true,
        secure: options.secureProxy,
        changeOrigin: true,
        xfwd: options.transparentProxy,
        preserveHeaderKeyCase: true,
      });

      proxy.on('error', e => {
        options.ui.writeLine(`Error proxying to ${options.proxy}`);
        options.ui.writeError(e);
      });

      const morgan = require('morgan');

      options.ui.writeLine(`Proxying to ${options.proxy}`);

      server.on('upgrade', (req, socket, head) => {
        options.ui.writeLine(`Proxying websocket to ${req.url}`);
        proxy.ws(req, socket, head);
      });

      app.use(morgan('dev'));
      app.use((req, res) => proxy.web(req, res));
    }
  }
}

module.exports = ProxyServerAddon;
