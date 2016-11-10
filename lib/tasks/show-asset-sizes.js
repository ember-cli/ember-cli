'use strict';

var Task             = require('../models/task');
var AssetSizePrinter = require('../models/asset-size-printer');

module.exports = Task.extend({
  run: function (options) {
    var sizePrinter = new AssetSizePrinter({
      ui: this.ui,
      outputPath: options.outputPath
    });

    if (options.json) {
      return sizePrinter.printJSON();
    }

    return sizePrinter.print();
  }
});
