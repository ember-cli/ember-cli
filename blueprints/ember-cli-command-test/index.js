/*jshint node:true*/

var fs          = require('fs');
var path        = require('path');
var stringUtils = require('../../lib/utilities/string');

module.exports = {
  description: 'Node tests for ember-cli commands.',
  
  generatePackageJson: function() {
    var packagePath  = path.join(this.project.root, 'package.json');
    var contents     = JSON.parse(fs.readFileSync(packagePath, { encoding: 'utf8' }));

    contents.scripts['nodetest'] = "node tests/runner.js";
    
    fs.writeFileSync(path.join(this.project.root, 'package.json'), JSON.stringify(contents, null, 2));
  },
  
  afterInstall: function() {
    this.generatePackageJson();
    return this.addPackagesToProject([
      {name: 'glob', target: '~4.0.5'},
      {name: 'chai', target: '~1.9.1'},
      {name: 'mocha', target: '^1.21.4'},
      {name: 'mocha-jshint', target: '^0.0.9'},
      {name: 'rsvp', target: '^3.0.17'},
      {name: 'ember-cli', target: '^0.2.7'}
    ]);
  },
  
  locals: function(options) {
    var classifiedCommandName = stringUtils.classify(options.entity.name);
    
    return {
      commandName: options.entity.name,
      classifiedCommandName: classifiedCommandName
    };
  }
};
