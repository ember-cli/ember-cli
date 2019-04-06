'use strict';

const expect = require('chai').expect;
const EOL = require('os').EOL;
const processHelpString = require('../../helpers/process-help-string');
const convertToJson = require('../../helpers/convert-help-output-to-json');
const commandOptions = require('../../factories/command-options');
const td = require('testdouble');

let HelpCommand = require('../../../lib/commands/help');

describe('help command', function() {
  let options;

  beforeEach(function() {
    options = commandOptions();
  });

  describe('common to both', function() {
    it('finds command on disk', function() {
      let Command1 = function() {};
      Command1.prototype.printBasicHelp = td.function();
      Command1.prototype.printDetailedHelp = td.function();

      options.commands = {
        Command1,
      };

      let command = new HelpCommand(options);

      let wasCalled;
      command._lookupCommand = function() {
        expect(arguments[0]).to.equal(options.commands);
        expect(arguments[1]).to.equal('command-2');
        wasCalled = true;
        return Command1;
      };

      command.run(options, ['command-2']);

      td.verify(Command1.prototype.printBasicHelp(), { ignoreExtraArgs: true, times: 1 });
      expect(wasCalled).to.be.true;
    });

    it('looks up multiple commands', function() {
      let Command1 = function() {};
      let Command2 = function() {};
      let Command3 = function() {};
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

      let command = new HelpCommand(options);

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
      let Command1 = function() {};
      let Command2 = function() {};
      Command1.prototype.printBasicHelp = td.function();
      Command2.prototype.printBasicHelp = td.function();
      Command1.prototype.printDetailedHelp = td.function();
      Command2.prototype.printDetailedHelp = td.function();

      options.commands = {
        Command1,
        Command2,
      };

      let command = new HelpCommand(options);

      command.run(options, []);

      td.verify(Command1.prototype.printBasicHelp(), { ignoreExtraArgs: true, times: 1 });
      td.verify(Command2.prototype.printBasicHelp(), { ignoreExtraArgs: true, times: 1 });
      td.verify(Command1.prototype.printDetailedHelp(), { ignoreExtraArgs: true, times: 0 });
      td.verify(Command2.prototype.printDetailedHelp(), { ignoreExtraArgs: true, times: 0 });
    });

    it('works with single command', function() {
      let Command1 = function() {};
      let Command2 = function() {};
      Command1.prototype.printBasicHelp = td.function();
      Command2.prototype.printBasicHelp = td.function();
      Command1.prototype.printDetailedHelp = td.function();
      Command2.prototype.printDetailedHelp = td.function();

      options.commands = {
        Command1,
        Command2,
      };

      let command = new HelpCommand(options);

      command.run(options, ['command-1']);

      td.verify(Command1.prototype.printBasicHelp(), { ignoreExtraArgs: true, times: 1 });
      td.verify(Command2.prototype.printBasicHelp(), { ignoreExtraArgs: true, times: 0 });
      td.verify(Command1.prototype.printDetailedHelp(), { ignoreExtraArgs: true, times: 1 });
      td.verify(Command2.prototype.printDetailedHelp(), { ignoreExtraArgs: true, times: 0 });
    });

    it('works with single command alias', function() {
      let Command1 = function() {};
      Command1.prototype.aliases = ['my-alias'];
      Command1.prototype.printBasicHelp = td.function();
      Command1.prototype.printDetailedHelp = td.function();

      options.commands = {
        Command1,
      };

      let command = new HelpCommand(options);

      command.run(options, ['my-alias']);

      td.verify(Command1.prototype.printBasicHelp(), { ignoreExtraArgs: true, times: 1 });
    });

    it('passes extra commands to `generate`', function() {
      let Generate = function() {};
      Generate.prototype.printBasicHelp = td.function();
      Generate.prototype.printDetailedHelp = td.function();

      options.commands = {
        Generate,
      };

      let command = new HelpCommand(options);

      command.run(options, ['generate', 'something', 'else']);

      let captor = td.matchers.captor();

      td.verify(Generate.prototype.printBasicHelp(captor.capture()), { times: 1 });
      expect(captor.value.rawArgs).to.deep.equal(['something', 'else']);

      td.verify(Generate.prototype.printDetailedHelp(captor.capture()), { times: 1 });
      expect(captor.value.rawArgs).to.deep.equal(['something', 'else']);
    });

    it('handles no extra commands to `generate`', function() {
      let Generate = function() {};
      Generate.prototype.printBasicHelp = td.function();
      Generate.prototype.printDetailedHelp = td.function();

      options.commands = {
        Generate,
      };

      let command = new HelpCommand(options);

      command.run(options, ['generate']);

      let captor = td.matchers.captor();

      td.verify(Generate.prototype.printBasicHelp(captor.capture()), { times: 1 });
      expect(captor.value.rawArgs).to.be.undefined;

      td.verify(Generate.prototype.printDetailedHelp(captor.capture()), { times: 1 });
      expect(captor.value.rawArgs).to.be.undefined;
    });

    it('passes extra commands to `generate` alias', function() {
      let Generate = function() {};
      Generate.prototype.aliases = ['g'];
      Generate.prototype.printBasicHelp = td.function();
      Generate.prototype.printDetailedHelp = td.function();

      options.commands = {
        Generate,
      };

      let command = new HelpCommand(options);

      command.run(options, ['g', 'something', 'else']);

      let captor = td.matchers.captor();

      td.verify(Generate.prototype.printBasicHelp(captor.capture()), { times: 1 });
      expect(captor.value.rawArgs).to.deep.equal(['something', 'else']);

      td.verify(Generate.prototype.printDetailedHelp(captor.capture()), { times: 1 });
      expect(captor.value.rawArgs).to.deep.equal(['something', 'else']);
    });

    it('handles missing command', function() {
      let Command1 = function() {};

      options.commands = {
        Command1,
      };

      let command = new HelpCommand(options);

      command.run(options, ['missing-command']);

      let output = options.ui.output;

      let testString = processHelpString(`\
Requested ember-cli commands:${EOL}\
${EOL}\
\u001b[31mNo help entry for 'missing-command'\u001b[39m${EOL}`);

      expect(output).to.include(testString);
    });

    it('respects skipHelp when listing', function() {
      let Command1 = function() {
        this.skipHelp = true;
      };
      let Command2 = function() {};
      Command1.prototype.printBasicHelp = td.function();
      Command2.prototype.printBasicHelp = td.function();

      options.commands = {
        Command1,
        Command2,
      };

      let command = new HelpCommand(options);

      command.run(options, []);

      td.verify(Command1.prototype.printBasicHelp(), { ignoreExtraArgs: true, times: 0 });
      td.verify(Command2.prototype.printBasicHelp(), { ignoreExtraArgs: true, times: 1 });
    });

    it('ignores skipHelp when single', function() {
      let Command1 = function() {
        this.skipHelp = true;
      };
      Command1.prototype.printBasicHelp = td.function();
      Command1.prototype.printDetailedHelp = td.function();

      options.commands = {
        Command1,
      };

      let command = new HelpCommand(options);

      command.run(options, ['command-1']);

      td.verify(Command1.prototype.printBasicHelp(), { ignoreExtraArgs: true, times: 1 });
    });

    it('lists addons', function() {
      let Command1 = function() {};
      let Command2 = function() {};
      Command1.prototype.printBasicHelp = td.function();
      Command2.prototype.printBasicHelp = td.function();

      options.project.eachAddonCommand = function(callback) {
        callback('my-addon', {
          Command1,
          Command2,
        });
      };

      let command = new HelpCommand(options);

      command.run(options, []);

      let output = options.ui.output;

      let testString = processHelpString(`${EOL}\
Available commands from my-addon:${EOL}`);

      expect(output).to.include(testString);

      td.verify(Command1.prototype.printBasicHelp(), { ignoreExtraArgs: true, times: 1 });
      td.verify(Command2.prototype.printBasicHelp(), { ignoreExtraArgs: true, times: 1 });
    });

    it('finds single addon command', function() {
      let Command1 = function() {};
      let Command2 = function() {};
      Command1.prototype.printBasicHelp = td.function();
      Command1.prototype.printDetailedHelp = td.function();

      options.project.eachAddonCommand = function(callback) {
        callback('my-addon', {
          Command1,
          Command2,
        });
      };

      let command = new HelpCommand(options);

      command.run(options, ['command-1']);

      td.verify(Command1.prototype.printBasicHelp(), { ignoreExtraArgs: true, times: 1 });
    });
  });

  describe('unique to json printing', function() {
    beforeEach(function() {
      options.json = true;
    });

    it('lists commands', function() {
      let Command1 = function() {
        return {
          getJson() {
            return {
              test1: 'bar',
            };
          },
        };
      };

      let Command2 = function() {
        return {
          getJson() {
            return {
              test2: 'bar',
            };
          },
        };
      };

      options.commands = { Command1, Command2 };

      let command = new HelpCommand(options);

      command.run(options, []);

      let json = convertToJson(options.ui.output);

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
      let Command1 = function() {
        return {
          getJson() {
            return {
              test1: 'Path',
            };
          },
        };
      };

      options.commands = { Command1 };

      let command = new HelpCommand(options);

      command.run(options, ['command-1']);

      let json = convertToJson(options.ui.output);

      expect(json.commands).to.deep.equal([
        {
          test1: 'Path',
        },
      ]);
    });

    it('respects skipHelp when listing', function() {
      let Command1 = function() {
        return {
          skipHelp: true,
        };
      };

      let Command2 = function() {
        return {
          getJson() {
            return {
              test2: 'bar',
            };
          },
        };
      };

      options.commands = { Command1, Command2 };

      let command = new HelpCommand(options);

      command.run(options, []);

      let json = convertToJson(options.ui.output);

      expect(json.commands).to.deep.equal([
        {
          test2: 'bar',
        },
      ]);
    });

    it('lists addons', function() {
      let Command1 = function() {
        return {
          getJson() {
            return {
              test1: 'foo',
            };
          },
        };
      };

      let Command2 = function() {
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

      let command = new HelpCommand(options);

      command.run(options, []);

      let json = convertToJson(options.ui.output);

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
