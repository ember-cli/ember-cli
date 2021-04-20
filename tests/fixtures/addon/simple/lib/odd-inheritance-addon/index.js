'use strict';

const AddonToExtendFrom = require('../extend-from-addon-directly');

module.exports = AddonToExtendFrom.extend({
  name: require('./package').name,
});
