var versionUtils      = require('../../../lib/utilities/version-utils');
var emberCLIVersion   = versionUtils.emberCLIVersion;

module.exports = {
  name: 'ember',
  description: null,
  aliases: [],
  works: 'insideProject',
  availableOptions: [],
  anonymousOptions: ['<command (Default: help)>'],
  version: emberCLIVersion(),
  commands: [
    {
      name: 'foo',
      description: 'Initializes the warp drive.',
      aliases: [],
      works: 'insideProject',
      availableOptions: [
        {
          aliases: [
            'd'
          ],
          default: false,
          key: 'dryRun',
          name: 'dry-run',
          required: false
        }
      ],
      anonymousOptions: [
        '<speed>'
      ]
    }
  ],
  addons: []
};
