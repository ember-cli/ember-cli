module.exports = {
  name: require('./package').name,

  contentFor(type, config) {
    return '"SOME AWESOME STUFF"';
  }
};
