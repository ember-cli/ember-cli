'use strict';

var RSVP     = require('rsvp');
var chalk    = require('chalk');
var spawn    = require('child_process').spawn;
var defaults = require('lodash-node/modern/objects/defaults');

module.exports = function run(/* command, args, options */) {
  var command = arguments[0];
  var args = Array.prototype.slice.call(arguments, 1);
  var options = {};

  if (typeof args[args.length - 1] === 'object') {
    options = args.pop();
  }

  options = defaults(options, {
    verbose: true,

    onOutput: function(string) {
      if (options.verbose) { console.log(string); }
    },

    onError: function(string) {
      if (options.verbose) { console.error(chalk.red(string)); }
    }
  });

  return new RSVP.Promise(function(resolve, reject) {
    console.log('Running: ' + command + ' ' + args.join(' '));

    var child = spawn(command, args);
    var result = {
      output: [],
      errors: [],
      code: null
    };

    child.stdout.on('data', function (data) {
      var string = data.toString();

      options.onOutput(string, child);

      result.output.push(string);
    });

    child.stderr.on('data', function (data) {
      var string = data.toString();

      options.onError(string, child);

      result.errors.push(string);
    });

    child.on('close', function (code) {
      result.code = code;

      if (code === 0) {
        resolve(result);
      } else {
        reject(result);
      }
    });
  });
};
