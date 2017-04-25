module.exports = {
  name: 'kitchen-sink',

  contentFor(type, config) {
    if (type === 'head') {
      return '"SOME AWESOME STUFF"';
    }
  }
};
