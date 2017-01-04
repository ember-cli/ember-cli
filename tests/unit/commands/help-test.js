'use strict';

var expect = require('chai').expect;
var EOL = require('os').EOL;
var proxyquire = require('proxyquire');
var path = require('path');
var processHelpString = require('../../helpers/process-help-string');
var convertToJson = require('../../helpers/convert-help-output-to-json');
var commandOptions = require('../../factories/command-options');
var td = require('testdouble');

var lookupCommandStub;
var HelpCommand = proxyquire('../../../lib/commands/help', {
  '../cli/lookup-command'() {
    return lookupCommandStub.apply(this, arguments);
  },
});

describe('help command', function() {
  var options;

  beforeEach(function() {
    options = commandOptions();

    lookupCommandStub = require('../../../lib/cli/lookup-command');
  });

  describe('common to both', function() {
    it('finds command on disk', function() {
      var Command1 = function() {};
      Command1.prototype.printBasicHelp = td.function();
      Command1.prototype.printDetailedHelp = td.function();

      options.commands = {
        Command1,
      };

      var wasCalled;
      lookupCommandStub = function() {
        expect(arguments[0]).to.equal(options.commands);
        expect(arguments[1]).to.equal('command-2');
        wasCalled = true;
        return Command1;
      };

      var command = new HelpCommand(options);

      command.run(options, ['command-2']);

      td.verify(Command1.prototype.printBasicHelp(), { ignoreExtraArgs: true, times: 1 });
      expect(wasCalled).to.be.true;
    });

    it('looks up multiple commands', function() {
      var Command1 = function() {};
      var Command2 = function() {};
      var Command3 = function() {};
      Command1.prototype.printBasicHelp = td.function();
      Command2.prototype.printBasicHelp = td.function();
      Command3.prototype.printBasicHelp = td.function();
      Command1.prototype.printDetailedHelp = td.function();
      Command2.prototype.printDetailedHelp = td.function();
      Command3.prototype.printDetailedHelp = td.function();

      options.commands = {
        Command1,
        Command2,
        Command3,
      };

      var command = new HelpCommand(options);

      command.run(options, ['command-1', 'command-2']);

      td.verify(Command1.prototype.printBasicHelp(), { ignoreExtraArgs: true, times: 1 });
      td.verify(Command2.prototype.printBasicHelp(), { ignoreExtraArgs: true, times: 1 });
      td.verify(Command3.prototype.printBasicHelp(), { ignoreExtraArgs: true, times: 0 });
      td.verify(Command1.prototype.printDetailedHelp(), { ignoreExtraArgs: true, times: 1 });
      td.verify(Command2.prototype.printDetailedHelp(), { ignoreExtraArgs: true, times: 1 });
      td.verify(Command3.prototype.printDetailedHelp(), { ignoreExtraArgs: true, times: 0 });
    });
  });

  describe('unique to text printing', function() {
    it('lists commands', function() {
      var Command1 = function() {};
      var Command2 = function() {};
      Command1.prototype.printBasicHelp = td.function();
      Command2.prototype.printBasicHelp = td.function();
      Command1.prototype.printDetailedHelp = td.function();
      Command2.prototype.printDetailedHelp = td.function();

      options.commands = {
        Command1,
        Command2,
      };

      var command = new HelpCommand(options);

      command.run(options, []);

      td.verify(Command1.prototype.printBasicHelp(), { ignoreExtraArgs: true, times: 1 });
      td.verify(Command2.prototype.printBasicHelp(), { ignoreExtraArgs: true, times: 1 });
      td.verify(Command1.prototype.printDetailedHelp(), { ignoreExtraArgs: true, times: 0 });
      td.verify(Command2.prototype.printDetailedHelp(), { ignoreExtraArgs: true, times: 0 });
    });

    it('works with single command', function() {
      var Command1 = function() {};
      var Command2 = function() {};
      Command1.prototype.printBasicHelp = td.function();
      Command2.prototype.printBasicHelp = td.function();
      Command1.prototype.printDetailedHelp = td.function();
      Command2.prototype.printDetailedHelp = td.function();

      options.commands = {
        Command1,
        Command2,
      };

      var command = new HelpCommand(options);

      command.run(options, ['command-1']);

      td.verify(Command1.prototype.printBasicHelp(), { ignoreExtraArgs: true, times: 1 });
      td.verify(Command2.prototype.printBasicHelp(), { ignoreExtraArgs: true, times: 0 });
      td.verify(Command1.prototype.printDetailedHelp(), { ignoreExtraArgs: true, times: 1 });
      td.verify(Command2.prototype.printDetailedHelp(), { ignoreExtraArgs: true, times: 0 });
    });

    it('works with single command alias', function() {
      var Command1 = function() {};
      Command1.prototype.aliases = ['my-alias'];
      Command1.prototype.printBasicHelp = td.function();
      Command1.prototype.printDetailedHelp = td.function();

      options.commands = {
        Command1,
      };

      var command = new HelpCommand(options);

      command.run(options, ['my-alias']);

      td.verify(Command1.prototype.printBasicHelp(), { ignoreExtraArgs: true, times: 1 });
    });

    it('passes extra commands to `generate`', function() {
      var Generate = function() {};
      Generate.prototype.printBasicHelp = td.function();
      Generate.prototype.printDetailedHelp = td.function();

      options.commands = {
        Generate,
      };

      var command = new HelpCommand(options);

      command.run(options, ['generate', 'something', 'else']);

      var captor = td.matchers.captor();

      td.verify(Generate.prototype.printBasicHelp(captor.capture()), { times: 1 });
      expect(captor.value.rawArgs).to.deep.equal(['something', 'else']);

      td.verify(Generate.prototype.printDetailedHelp(captor.capture()), { times: 1 });
      expect(captor.value.rawArgs).to.deep.equal(['something', 'else']);
    });

    it('handles no extra commands to `generate`', function() {
      var Generate = function() {};
      Generate.prototype.printBasicHelp = td.function();
      Generate.prototype.printDetailedHelp = td.function();

      options.commands = {
        Generate,
      };

      var command = new HelpCommand(options);

      command.run(options, ['generate']);

      var captor = td.matchers.captor();

      td.verify(Generate.prototype.printBasicHelp(captor.capture()), { times: 1 });
      expect(captor.value.rawArgs).to.be.undefined;

      td.verify(Generate.prototype.printDetailedHelp(captor.capture()), { times: 1 });
      expect(captor.value.rawArgs).to.be.undefined;
    });

    it('passes extra commands to `generate` alias', function() {
      var Generate = function() {};
      Generate.prototype.aliases = ['g'];
      Generate.prototype.printBasicHelp = td.function();
      Generate.prototype.printDetailedHelp = td.function();

      options.commands = {
        Generate,
      };

      var command = new HelpCommand(options);

      command.run(options, ['g', 'something', 'else']);

      var captor = td.matchers.captor();

      td.verify(Generate.prototype.printBasicHelp(captor.capture()), { times: 1 });
      expect(captor.value.rawArgs).to.deep.equal(['something', 'else']);

      td.verify(Generate.prototype.printDetailedHelp(captor.capture()), { times: 1 });
      expect(captor.value.rawArgs).to.deep.equal(['something', 'else']);
    });

    it('handles missing command', function() {
      var Command1 = function() {};

      options.commands = {
        Command1,
      };

      var command = new HelpCommand(options);

      command.run(options, ['missing-command']);

      var output = options.ui.output;

      var testString = processHelpString(`\
Requested ember-cli commands:${EOL}\
${EOL}\
\u001b[31mNo help entry for 'missing-command'\u001b[39m${EOL}`);

      expect(output).to.include(testString);
    });

    it('respects skipHelp when listing', function() {
      var Command1 = function() { this.skipHelp = true; };
      var Command2 = function() {};
      Command1.prototype.printBasicHelp = td.function();
      Command2.prototype.printBasicHelp = td.function();

      options.commands = {
        Command1,
        Command2,
      };

      var command = new HelpCommand(options);

      command.run(options, []);

      td.verify(Command1.prototype.printBasicHelp(), { ignoreExtraArgs: true, times: 0 });
      td.verify(Command2.prototype.printBasicHelp(), { ignoreExtraArgs: true, times: 1 });
    });

    it('ignores skipHelp when single', function() {
      var Command1 = function() { this.skipHelp = true; };
      Command1.prototype.printBasicHelp = td.function();
      Command1.prototype.printDetailedHelp = td.function();

      options.commands = {
        Command1,
      };

      var command = new HelpCommand(options);

      command.run(options, ['command-1']);

      td.verify(Command1.prototype.printBasicHelp(), { ignoreExtraArgs: true, times: 1 });
    });

    it('lists addons', function() {
      var Command1 = function() {};
      var Command2 = function() {};
      Command1.prototype.printBasicHelp = td.function();
      Command2.prototype.printBasicHelp = td.function();

      options.project.eachAddonCommand = function(callback) {
        callback('my-addon', {
          Command1,
          Command2,
        });
      };

      var command = new HelpCommand(options);

      command.run(options, []);

      var output = options.ui.output;

      var testString = processHelpString(`${EOL}\
Available commands from my-addon:${EOL}`);

      expect(output).to.include(testString);

      td.verify(Command1.prototype.printBasicHelp(), { ignoreExtraArgs: true, times: 1 });
      td.verify(Command2.prototype.printBasicHelp(), { ignoreExtraArgs: true, times: 1 });
    });

    it('finds single addon command', function() {
      var Command1 = function() {};
      var Command2 = function() {};
      Command1.prototype.printBasicHelp = td.function();
      Command1.prototype.printDetailedHelp = td.function();

      options.project.eachAddonCommand = function(callback) {
        callback('my-addon', {
          Command1,
          Command2,
        });
      };

      var command = new HelpCommand(options);

      command.run(options, ['command-1']);

      td.verify(Command1.prototype.printBasicHelp(), { ignoreExtraArgs: true, times: 1 });
    });
  });

  describe('unique to json printing', function() {
    beforeEach(function() {
      options.json = true;
    });

    it('lists commands', function() {
      var Command1 = function() {
        return {
          getJson() {
            return {
              test1: 'bar',
            };
          },
        };
      };

      var Command2 = function() {
        return {
          getJson() {
            return {
              test2: 'bar',
            };
          },
        };
      };

      options.commands = { Command1, Command2 };

      var command = new HelpCommand(options);

      command.run(options, []);

      var json = convertToJson(options.ui.output);

      expect(json.commands).to.deep.equal([
        {
          test1: 'bar',
        },
        {
          test2: 'bar',
        },
      ]);
    });

    it('handles special option `Path`', function() {
      var Command1 = function() {
        return {
          getJson() {
            return {
              test1: 'Path',
            };
          },
        };
      };

      options.commands = { Command1 };

      var command = new HelpCommand(options);

      command.run(options, ['command-1']);

      var json = convertToJson(options.ui.output);

      expect(json.commands).to.deep.equal([
        {
          test1: 'Path',
        },
      ]);
    });

    it('respects skipHelp when listing', function() {
      var Command1 = function() {
        return {
          skipHelp: true,
        };
      };

      var Command2 = function() {
        return {
          getJson() {
            return {
              test2: 'bar',
            };
          },
        };
      };

      options.commands = { Command1, Command2 };

      var command = new HelpCommand(options);

      command.run(options, []);

      var json = convertToJson(options.ui.output);

      expect(json.commands).to.deep.equal([
        {
          test2: 'bar',
        },
      ]);
    });

    it('lists addons', function() {
      var Command1 = function() {
        return {
          getJson() {
            return {
              test1: 'foo',
            };
          },
        };
      };

      var Command2 = function() {
        return {
          getJson() {
            return {
              test2: 'bar',
            };
          },
        };
      };

      options.project.eachAddonCommand = function(callback) {
        callback('my-addon', { Command1, Command2 });
      };

      var command = new HelpCommand(options);

      command.run(options, []);

      var json = convertToJson(options.ui.output);

      expect(json.addons).to.deep.equal([
        {
          name: 'my-addon',
          commands: [
            {
              test1: 'foo',
            },
            {
              test2: 'bar',
            },
          ],
        },
      ]);
    });
  });
});
