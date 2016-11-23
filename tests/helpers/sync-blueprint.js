var Blueprint = require('../../lib/models/blueprint');
var _ = require('ember-cli-lodash-subset');
var stringUtils = require('ember-cli-string-utils');

var SyncBlueprint = Blueprint.extend({

  _process: function(options, beforeHook, process, afterHook) {
    var self = this;
    var intoDir = options.target;

    return this._locals(options).then(function (locals) {
      return Promise.resolve()
      .then(beforeHook.bind(self, options, locals))
      .then(process.bind(self, intoDir, locals))
      .map(self._commit.bind(self))
      .then(afterHook.bind(self, options));
    });
  },

  _locals: function(options) {
    var packageName = options.project.name();
    var moduleName = options.entity && options.entity.name || packageName;
    var sanitizedModuleName = moduleName.replace(/\//g, '-');

    return new Promise(function(resolve) {
      resolve(this.locals(options));
    }.bind(this)).then(function (customLocals) {
      var fileMapVariables = this._generateFileMapVariables(moduleName, customLocals, options);
      var fileMap = this.generateFileMap(fileMapVariables);
      var standardLocals = {
        dasherizedPackageName: stringUtils.dasherize(packageName),
        classifiedPackageName: stringUtils.classify(packageName),
        dasherizedModuleName: stringUtils.dasherize(moduleName),
        classifiedModuleName: stringUtils.classify(sanitizedModuleName),
        camelizedModuleName: stringUtils.camelize(sanitizedModuleName),
        decamelizedModuleName: stringUtils.decamelize(sanitizedModuleName),
        fileMap: fileMap,
        hasPathToken: this.hasPathToken,
        targetFiles: options.targetFiles,
        rawArgs: options.rawArgs
      };

      return _.merge({}, standardLocals, customLocals);
    }.bind(this));
  }

  // _locals: function(options) {
  //   var packageName = options.project.name();
  //   var moduleName = options.entity && options.entity.name || packageName;
  //   var sanitizedModuleName = moduleName.replace(/\//g, '-');

  //   var customLocals = this.locals(options);

  //   return (function (customLocals) {
  //     var fileMapVariables = this._generateFileMapVariables(moduleName, customLocals, options);
  //     var fileMap = this.generateFileMap(fileMapVariables);
  //     var standardLocals = {
  //       dasherizedPackageName: stringUtils.dasherize(packageName),
  //       classifiedPackageName: stringUtils.classify(packageName),
  //       dasherizedModuleName: stringUtils.dasherize(moduleName),
  //       classifiedModuleName: stringUtils.classify(sanitizedModuleName),
  //       camelizedModuleName: stringUtils.camelize(sanitizedModuleName),
  //       decamelizedModuleName: stringUtils.decamelize(sanitizedModuleName),
  //       fileMap: fileMap,
  //       hasPathToken: this.hasPathToken,
  //       targetFiles: options.targetFiles,
  //       rawArgs: options.rawArgs
  //     };

  //     return _.merge({}, standardLocals, customLocals);
  //   }.bind(this))(customLocals);
  // },

  // _process: function(options, beforeHook, process, afterHook) {
  //   var self = this;
  //   var intoDir = options.target;

  //   var locals = this._locals(options);
  //   var reduce;
  //   reduce = beforeHook.bind(self, options, locals)();
  //   reduce = process.bind(self, intoDir, locals)();
  //   reduce = reduce.map(self._commit.bind(self));
  //   reduce = afterHook.bind(self, options)();

  //   return reduce;
  // }

});

module.exports = SyncBlueprint;
