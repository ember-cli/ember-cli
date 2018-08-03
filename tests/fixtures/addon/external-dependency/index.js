/* eslint-env node */
module.exports = {
  name: require('./package').name,

  isDevelopingAddon() {
    return true;
  }
};
