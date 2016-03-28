var versionUtils      = require('../../../lib/utilities/version-utils');
var emberCLIVersion   = versionUtils.emberCLIVersion;

module.exports = {
  name: "ember",
  description: null,
  aliases: [],
  works: "insideProject",
  availableOptions: [],
  anonymousOptions: [
    "<command (Default: help)>"
  ],
  version: emberCLIVersion(),
  commands: [],
  addons: []
};
