module.exports = {
  name: 'kitchen-sink',

  contentFor: function(type, config) {
    if (type === 'head') {
      return '"SOME AWESOME STUFF"';
    }
  }
};
