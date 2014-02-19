function buildCommand(cmd) {
  return {
    run: cmd
  };
}

module.exports = {
  build: buildCommand(require('./build')),
  server: buildCommand(require('./server')),
  init: buildCommand(require('./init'))
};
