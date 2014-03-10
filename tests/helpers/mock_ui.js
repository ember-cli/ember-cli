module.exports = MockUI;

function MockUI() {
  this.output = [];
}

MockUI.prototype.write = function(message) {
  this.output.push(message);
};

MockUI.prototype.reset = function() {
  this.output = [];
};
