module.exports = {
  write: function() {
    process.stdout.write.apply(process.stdout, arguments);
  }
};
