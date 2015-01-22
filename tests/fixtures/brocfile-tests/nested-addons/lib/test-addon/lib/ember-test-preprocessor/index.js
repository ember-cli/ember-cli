var Filter = require('broccoli-filter');

module.exports = {
  name: 'test-preprocessor',
  included: function(app) {
    app.registry.add('js', {
      name: 'test-preprocessor',
      ext: 'test',
      toTree: function(tree, inputPath, outputPath) {
        // This faked out preprocessor doesn't touch the file contents - it
        // just rewrites .test to .js, but otherwise leaves the file intact
        var preprocessor = new Filter(tree, {
          extensions: ['test'],
          targetExtension: 'js',
          srcDir: inputPath,
          destDir: outputPath
        });
        preprocessor.processString = function(string) { return string };
        return preprocessor
      }
    });
  }
};
