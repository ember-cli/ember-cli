'use strict';

module.exports = {
  get Addon() {
    return require('./addon');
  },
  get AssetSizes() {
    return require('./asset-sizes');
  },
  get Build() {
    return require('./build');
  },
  get Destroy() {
    return require('./destroy');
  },
  get Generate() {
    return require('./generate');
  },
  get Help() {
    return require('./help');
  },
  get Init() {
    return require('./init');
  },
  get Install() {
    return require('./install');
  },
  get New() {
    return require('./new');
  },
  get Serve() {
    return require('./serve');
  },
  get Test() {
    return require('./test');
  },
  get Unknown() {
    return require('./unknown');
  },
  get Version() {
    return require('./version');
  },
};
