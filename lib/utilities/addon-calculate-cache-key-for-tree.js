'use strict';

var crypto = require('crypto');

module.exports = function calculateCacheKeyForTree(treeType, addonInstance) {
  var cacheKeyParts = [
    addonInstance.pkg,
    addonInstance.name,
    treeType,
  ];

  return crypto.createHash('md5').update(JSON.stringify(cacheKeyParts), 'utf8').digest('hex');
};
