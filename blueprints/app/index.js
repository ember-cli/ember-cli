var stringUtil = require('ember-cli-string-utils');

module.exports = {
  description: 'The default blueprint for ember-cli projects.',

  locals(options) {
    var entity = options.entity;
    var rawName = entity.name;
    var name = stringUtil.dasherize(rawName);
    var namespace = stringUtil.classify(rawName);

    return {
      name,
      modulePrefix: name,
      namespace,
      emberCLIVersion: require('../../package').version,
    };
  },
};
