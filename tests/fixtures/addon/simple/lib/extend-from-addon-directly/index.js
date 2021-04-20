'use strict';

const Addon = require('../../../../../../lib/models/addon');

module.exports = Addon.extend({
  name: require('./package').name,
});
