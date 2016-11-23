var Blueprint = require('../../lib/models/blueprint');
var FileInfo = require('../../lib/models/file-info');

var _ = require('ember-cli-lodash-subset');
var stringUtils = require('ember-cli-string-utils');
var path = require('path');
var fs = require('fs-extra');
var isBinaryFile = require('isbinaryfile').sync;
var processTemplate = require('../../lib/utilities/process-template');

function SyncFileInfo() {
  return FileInfo.apply(this, arguments);
}

SyncFileInfo.prototype = Object.create(FileInfo.prototype);
SyncFileInfo.prototype.constructor = SyncFileInfo;

SyncFileInfo.prototype.render = function() {
  var path = this.inputPath;
  var context = this.templateVariables;

  if (!this.rendered) {
    var fileStat = fs.lstatSync(path);
    if (fileStat.isDirectory()) { return; }

    var content = fs.readFileSync(path, 'utf8');

    if (isBinaryFile(content, fileStat.size)) {
      return content;
    } else {
      try {
        this.rendered = processTemplate(content.toString(), context);
      } catch (err) {
        err.message += ' (Error in blueprint template: ' + path + ')';
        throw err;
      }
    }
  }

  return this.rendered;
};


var SyncBlueprint = Blueprint.extend({

  _locals: function(options) {
    var packageName = options.project.name();
    var moduleName = options.entity && options.entity.name || packageName;
    var sanitizedModuleName = moduleName.replace(/\//g, '-');

    var customLocals = this.locals(options);
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
  },

  _process: function(options, beforeHook, process, afterHook) {
    var self = this;
    var intoDir = options.target;

    var locals = this._locals(options);

    var reduce;
    reduce = beforeHook.bind(self, options, locals)();
    reduce = process.bind(self, intoDir, locals)(reduce);
    reduce = reduce.map(self._commit.bind(self));
    reduce = afterHook.bind(self, options)(reduce);

    return {
      finally: function() {
        // return reduce;
      }
    };
  },

  processFiles: function(intoDir, templateVariables) {
    var files = this._getFilesForInstall(templateVariables.targetFiles);
    var fileInfos = this._getFileInfos(files, intoDir, templateVariables);
    this._checkForNoMatch(fileInfos, templateVariables.rawArgs);

    this._ignoreUpdateFiles();

    return fileInfos;
  },

  buildFileInfo: function(intoDir, templateVariables, file) {
    var mappedPath = this.mapFile(file, templateVariables);

    return new SyncFileInfo({
      action: 'write',
      outputBasePath: path.normalize(intoDir),
      outputPath: path.join(intoDir, mappedPath),
      displayPath: path.normalize(mappedPath),
      inputPath: this.srcPath(file),
      templateVariables: templateVariables,
      ui: this.ui
    });
  }

});

module.exports = SyncBlueprint;
