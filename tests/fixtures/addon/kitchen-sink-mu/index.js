module.exports = {
  name: require('./package').name,

  contentFor(type, config) {
    if (type === 'head') {
      return '"SOME AWESOME STUFF"';
    }
  }
};
