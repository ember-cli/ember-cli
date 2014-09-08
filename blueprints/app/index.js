var Blueprint  = require('../../lib/models/blueprint');
var stringUtil = require('../../lib/utilities/string');

module.exports = Blueprint.extend({
  locals: function(options) {
    var entity          = options.entity;
    var rawName         = entity.name;
    var name            = stringUtil.dasherize(rawName);
    var namespace       = stringUtil.classify(rawName);
    var podModulePrefix = "";

    if (options.pods) {
      podModulePrefix = 'podModulePrefix: config.podModulePrefix,';
    }

    return {
      name: name,
      modulePrefix: name,
      podModulePrefix: podModulePrefix,
      namespace: namespace,
      emberCLIVersion: require('../../package').version
    }
  }
});
