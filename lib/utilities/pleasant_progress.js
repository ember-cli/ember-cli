'use strict';

function PleasantProgress(options) {
  this.progress = 0;
  this._pid = undefined;
  this.message = options.message;
  this.rate = options.rate;
  this.stepString = options.stepString;
}

module.exports = PleasantProgress;

PleasantProgress.prototype.stop = function() {
  this.clear();
  clearInterval(this._pid);
};

PleasantProgress.prototype.start = function() {
  this.stop();
  this.printMessage();
  this._pid = setInterval(this.step.bind(this), this.rate);
};

PleasantProgress.prototype.clear = function() {
  this.progress = 0;
  process.stdout.cursorTo(0);
  process.stdout.clearLine();
};

PleasantProgress.prototype.printMessage = function() {
  if (this.message) {
    process.stdout.write(this.message);
  }
};

PleasantProgress.prototype.step = function() {
  if (this.progress++ > 2) {
    this.clear();
    this.printMessage();
  } else {
    this.didStep();
  }
};

PleasantProgress.prototype.didStep = function() {
  process.stdout.write(this.stepString);
};
