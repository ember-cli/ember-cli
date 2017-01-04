'use strict';

let Task = require('../models/task');
let AssetSizePrinter = require('../models/asset-size-printer');

module.exports = Task.extend({
  run(options) {
    let sizePrinter = new AssetSizePrinter({
      ui: this.ui,
      outputPath: options.outputPath,
    });

    if (options.json) {
      return sizePrinter.printJSON();
    }

    return sizePrinter.print();
  },
});
