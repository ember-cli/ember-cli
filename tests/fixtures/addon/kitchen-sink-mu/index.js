module.exports = {
  name: 'basic-thing',

  contentFor(type, config) {
    if (type === 'head') {
      return '"SOME AWESOME STUFF"';
    }
  }
};
