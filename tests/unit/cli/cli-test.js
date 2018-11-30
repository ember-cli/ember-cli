'use strict';

const expect = require('../../chai').expect;
const MockUI = require('console-ui/mock');
const MockAnalytics = require('../../helpers/mock-analytics');
const td = require('testdouble');
const Command = require('../../../lib/models/command');
const Promise = require('rsvp').Promise;

let ui;
let analytics;
let commands = {};
let isWithinProject;
let project;
let willInterruptProcess;

let CLI;

// helper to similate running the CLI
function ember(args) {
  let cli = new CLI({
    ui,
    analytics,
    testing: true,
  });

  let startInstr = td.replace(cli.instrumentation, 'start');
  let stopInstr = td.replace(cli.instrumentation, 'stopAndReport');

  return cli.run({
    tasks: {},
    commands,
    cliArgs: args || [],
    settings: {},
    project,
  }).then(function(value) {
    td.verify(stopInstr('init'), { times: 1 });
    td.verify(startInstr('command'), { times: 1 });
    td.verify(stopInstr('command', td.matchers.anything(), td.matchers.isA(Array)), { times: 1 });
    td.verify(startInstr('shutdown'), { times: 1 });

    return value;
  });
}

function stubCallHelp() {
  return td.replace(CLI.prototype, 'callHelp', td.function());
}

function stubValidateAndRunHelp(name) {
  let stub = stubValidateAndRun(name);
  td.when(stub(), { ignoreExtraArgs: true, times: 1 }).thenReturn('callHelp');
  return stub;
}

function stubValidateAndRun(name) {
  commands[name] = require(`../../../lib/commands/${name}`);

  return td.replace(commands[name].prototype, 'validateAndRun', td.function());
}

function stubRun(name) {
  commands[name] = require(`../../../lib/commands/${name}`);
  return td.replace(commands[name].prototype, 'run', td.function());
}

describe('Unit: CLI', function() {
  beforeEach(function() {
    willInterruptProcess = require('../../../lib/utilities/will-interrupt-process');
    td.replace(willInterruptProcess, 'addHandler', td.function());
    td.replace(willInterruptProcess, 'removeHandler', td.function());

    CLI = require('../../../lib/cli/cli');
    ui = new MockUI();
    analytics = new MockAnalytics();
    commands = { };
    isWithinProject = true;
    project = {
      isEmberCLIProject() { // similate being inside or outside of a project
        return isWithinProject;
      },
      hasDependencies() {
        return true;
      },
      blueprintLookupPaths() {
        return [];
      },
    };
  });

  afterEach(function() {
    td.reset();

    delete process.env.EMBER_ENV;
    commands = ui = undefined;
  });

  this.timeout(10000);

  it('exists', function() {
    expect(CLI).to.be.ok;
  });

  it('ember', function() {
    let help = stubValidateAndRun('help');

    return ember().then(function() {
      td.verify(help(), { ignoreExtraArgs: true, times: 1 });
      let output = ui.output.trim();
      expect(output).to.equal('', 'expected no extra output');
    });
  });

  /*
  it('logError', function() {
    var cli = new CLI({
      ui: ui,
      analytics: analytics,
      testing: true
    });
    var error = new Error('Error message!');
    var expected = {exitCode: 1, ui: ui, error: error};
    expect(cli.logError(error)).to.eql(expected, 'expected error object');
  });
  */

  it('callHelp', function() {
    let cli = new CLI({
      ui,
      analytics,
      testing: true,
    });
    let init = stubValidateAndRun('init');
    let help = stubValidateAndRun('help');
    let helpOptions = {
      environment: {
        tasks: {},
        commands,
        cliArgs: [],
        settings: {},
        project: {
          isEmberCLIProject() { // similate being inside or outside of a project
            return isWithinProject;
          },
          hasDependencies() {
            return true;
          },
          blueprintLookupPaths() {
            return [];
          },
        },
      },
      commandName: 'init',
      commandArgs: [],
    };
    cli.callHelp(helpOptions);
    td.verify(help(), { ignoreExtraArgs: true, times: 1 });
    td.verify(init(), { ignoreExtraArgs: true, times: 0 });
  });

  it('errors correctly if the init hook errors', function() {
    stubValidateAndRun('help');

    let cli = new CLI({
      ui,
      analytics,
      testing: true,
    });

    let startInstr = td.replace(cli.instrumentation, 'start');
    let stopInstr = td.replace(cli.instrumentation, 'stopAndReport');
    let logError = td.replace(cli, 'logError');
    let err = new Error('init failed');

    td.when(stopInstr('init')).thenThrow(err);

    return cli.run({
      tasks: {},
      commands,
      cliArgs: [],
      settings: {},
      project,
    }).then(function() {
      td.verify(startInstr('command'), { times: 0 });
      td.verify(stopInstr('command'), { times: 0 });
      td.verify(startInstr('shutdown'), { times: 1 });
      td.verify(logError(err));
    });
  });

  describe('custom addon command', function() {
    it('beforeRun can return a promise', function() {
      let CustomCommand = Command.extend({
        name: 'custom',

        init() {
          this._super && this._super.init.apply(this, arguments);

          this._beforeRunFinished = false;
        },

        beforeRun() {
          let command = this;

          return new Promise(function(resolve) {
            setTimeout(function() {
              command._beforeRunFinished = true;
              resolve();
            }, 5);
          });
        },

        run() {
          if (!this._beforeRunFinished) {
            throw new Error('beforeRun not completed before run called!');
          }
        },
      });

      project.eachAddonCommand = function(callback) {
        callback('custom-addon', {
          custom: CustomCommand,
        });
      };

      return ember(['custom']);
    });
  });

  describe('command interruption handler', function() {
    let onCommandInterrupt;
    beforeEach(function() {
      onCommandInterrupt = td.matchers.isA(Function);
    });

    it('sets up handler before command run', function() {
      const CustomCommand = Command.extend({
        name: 'custom',

        beforeRun() {
          td.verify(willInterruptProcess.addHandler(onCommandInterrupt));

          return Promise.resolve();
        },

        run() {
          return Promise.resolve();
        },
      });

      project.eachAddonCommand = function(callback) {
        callback('custom-addon', {
          CustomCommand,
        });
      };

      return ember(['custom']);
    });

    it('cleans up handler after command finished', function() {
      stubValidateAndRun('serve');

      return ember(['serve']).finally(function() {
        td.verify(willInterruptProcess.removeHandler(onCommandInterrupt));
      });
    });
  });

  describe('help', function() {
    ['--help', '-h'].forEach(function(command) {
      it(`ember ${command}`, function() {
        let help = stubValidateAndRun('help');

        return ember([command]).then(function() {
          td.verify(help(), { ignoreExtraArgs: true, times: 1 });
          let output = ui.output.trim();
          expect(output).to.equal('', 'expected no extra output');
        });
      });

      it(`ember new ${command}`, function() {
        let help = stubCallHelp();
        stubValidateAndRunHelp('new');

        return ember(['new', command]).then(function() {
          td.verify(help(), { ignoreExtraArgs: true, times: 1 });
          let output = ui.output.trim();
          expect(output).to.equal('', 'expected no extra output');
        });
      });
    });
  });

  ['--version', '-v'].forEach(function(command) {
    it(`ember ${command}`, function() {
      let version = stubValidateAndRun('version');

      return ember([command]).then(function() {
        let output = ui.output.trim();
        expect(output).to.equal('', 'expected no extra output');
        td.verify(version(), { ignoreExtraArgs: true, times: 1 });
      });
    });
  });

  describe('server', function() {
    ['server', 's'].forEach(function(command) {
      it(`ember ${command} --port 9999`, function() {
        let server = stubRun('serve');

        return ember([command, '--port', '9999']).then(function() {
          let captor = td.matchers.captor();
          td.verify(server(captor.capture()), { ignoreExtraArgs: true, times: 1 });
          expect(captor.value.port, 'port').to.equal(9999);
        });
      });

      it(`ember ${command} --host localhost`, function() {
        let server = stubRun('serve');

        return ember(['server', '--host', 'localhost']).then(function() {
          let captor = td.matchers.captor();
          td.verify(server(captor.capture()), { ignoreExtraArgs: true, times: 1 });
          expect(captor.value.host, 'host').to.equal('localhost');
        });
      });

      it(`ember ${command} --port 9292 --host localhost`, function() {
        let server = stubRun('serve');

        return ember([command, '--port', '9292', '--host', 'localhost']).then(function() {
          let captor = td.matchers.captor();
          td.verify(server(captor.capture()), { ignoreExtraArgs: true, times: 1 });
          expect(captor.value.host, 'host').to.equal('localhost');
          expect(captor.value.port, 'port').to.equal(9292);
        });
      });

      it(`ember ${command} --proxy http://localhost:3000/`, function() {
        let server = stubRun('serve');

        return ember([command, '--proxy', 'http://localhost:3000/']).then(function() {
          let captor = td.matchers.captor();
          td.verify(server(captor.capture()), { ignoreExtraArgs: true, times: 1 });
          expect(captor.value.proxy, 'proxy').to.equal('http://localhost:3000/');
        });
      });

      it(`ember ${command} --proxy https://localhost:3009/ --insecure-proxy`, function() {
        let server = stubRun('serve');

        return ember([command, '--insecure-proxy']).then(function() {
          let captor = td.matchers.captor();
          td.verify(server(captor.capture()), { ignoreExtraArgs: true, times: 1 });
          expect(captor.value.insecureProxy, 'insecureProxy').to.equal(true);
        });
      });

      it(`ember ${command} --proxy https://localhost:3009/ --no-insecure-proxy`, function() {
        let server = stubRun('serve');

        return ember([command, '--no-insecure-proxy']).then(function() {
          let captor = td.matchers.captor();
          td.verify(server(captor.capture()), { ignoreExtraArgs: true, times: 1 });
          expect(captor.value.insecureProxy, 'insecureProxy').to.equal(false);
        });
      });

      it(`ember ${command} --watcher events`, function() {
        let server = stubRun('serve');

        return ember([command, '--watcher', 'events']).then(function() {
          let captor = td.matchers.captor();
          td.verify(server(captor.capture()), { ignoreExtraArgs: true, times: 1 });
          expect(captor.value.watcher, 'watcher').to.match(/node|polling|watchman/);
        });
      });

      it(`ember ${command} --watcher polling`, function() {
        let server = stubRun('serve');

        return ember([command, '--watcher', 'polling']).then(function() {
          let captor = td.matchers.captor();
          td.verify(server(captor.capture()), { ignoreExtraArgs: true, times: 1 });
          expect(captor.value.watcher, 'watcher').to.equal('polling');
        });
      });

      it(`ember ${command}`, function() {
        let server = stubRun('serve');

        return ember([command]).then(function() {
          let captor = td.matchers.captor();
          td.verify(server(captor.capture()), { ignoreExtraArgs: true, times: 1 });
          expect(captor.value.watcher, 'watcher').to.match(/node|polling|watchman/);
        });
      });

      ['production', 'development', 'foo'].forEach(function(env) {
        it(`ember ${command} --environment ${env}`, function() {
          let server = stubRun('serve');

          return ember([command, '--environment', env]).then(function() {
            let captor = td.matchers.captor();
            td.verify(server(captor.capture()), { ignoreExtraArgs: true, times: 1 });
            expect(captor.value.environment, 'environment').to.equal(env);
          });
        });
      });

      ['development', 'foo'].forEach(function(env) {
        it(`ember ${command} --environment ${env}`, function() {
          let server = stubRun('serve');
          process.env.EMBER_ENV = 'production';

          return ember([command, '--environment', env]).then(function() {
            td.verify(server(), { ignoreExtraArgs: true, times: 1 });

            expect(process.env.EMBER_ENV).to.equal('production', 'uses EMBER_ENV over environment');
          });
        });
      });

      ['production', 'development', 'foo'].forEach(function(env) {
        it(`EMBER_ENV=${env} ember ${command}`, function() {
          let server = stubRun('serve');

          process.env.EMBER_ENV = env;

          return ember([command]).then(function() {
            td.verify(server(), { ignoreExtraArgs: true, times: 1 });

            expect(process.env.EMBER_ENV).to.equal(env, 'correct environment');
          });
        });
      });
    });
  });

  describe('generate', function() {
    ['generate', 'g'].forEach(function(command) {
      it(`ember ${command} foo bar baz`, function() {
        let generate = stubRun('generate');

        return ember([command, 'foo', 'bar', 'baz']).then(function() {
          let captor = td.matchers.captor();
          td.verify(generate(captor.capture(), ['foo', 'bar', 'baz']), { times: 1 });

          let output = ui.output.trim();

          expect(output).to.equal('', 'expected no extra output');
        });
      });
    });
  });

  describe('init', function() {
    ['init'].forEach(function(command) {
      it(`ember ${command}`, function() {
        let init = stubValidateAndRun('init');

        return ember([command]).then(function() {
          td.verify(init(), { ignoreExtraArgs: true, times: 1 });
        });
      });

      it(`ember ${command} <app-name>`, function() {
        let init = stubRun('init');

        return ember([command, 'my-blog']).then(function() {
          let captor = td.matchers.captor();
          td.verify(init(captor.capture(), ['my-blog']), { times: 1 });

          let output = ui.output.trim();

          expect(output).to.equal('', 'expected no extra output');
        });
      });
    });
  });

  describe('new', function() {
    it('ember new', function() {
      isWithinProject = false;

      let newCommand = stubRun('new');

      return ember(['new']).then(function() {
        td.verify(newCommand(), { ignoreExtraArgs: true, times: 1 });
      });
    });

    it('ember new MyApp', function() {
      isWithinProject = false;

      let newCommand = stubRun('new');

      return ember(['new', 'MyApp']).then(function() {
        td.verify(newCommand(td.matchers.anything(), ['MyApp']), { times: 1 });
      });
    });
  });

  describe('build', function() {
    ['build', 'b'].forEach(function(command) {
      it(`ember ${command}`, function() {
        let build = stubRun('build');

        return ember([command]).then(function() {
          let captor = td.matchers.captor();
          td.verify(build(captor.capture()), { ignoreExtraArgs: true, times: 1 });

          let options = captor.value;
          expect(options.watch).to.equal(false, 'expected the default watch flag to be false');
          expect(options.suppressSizes).to.equal(false, 'expected the default suppress-sizes flag to be false');
        });
      });

      it(`ember ${command} --disable-analytics`, function() {
        let build = stubRun('build');

        return ember([command, '--disable-analytics']).then(function() {
          let captor = td.matchers.captor();
          td.verify(build(captor.capture()), { ignoreExtraArgs: true, times: 1 });

          let options = captor.value;
          expect(options.disableAnalytics).to.equal(true, 'expected the disableAnalytics flag to be true');
        });
      });

      it(`ember ${command} --watch`, function() {
        let build = stubRun('build');

        return ember([command, '--watch']).then(function() {
          let captor = td.matchers.captor();
          td.verify(build(captor.capture()), { ignoreExtraArgs: true, times: 1 });

          let options = captor.value;
          expect(options.watch).to.equal(true, 'expected the watch flag to be true');
        });
      });

      it(`ember ${command} --suppress-sizes`, function() {
        let build = stubRun('build');

        return ember([command, '--suppress-sizes']).then(function() {
          let captor = td.matchers.captor();
          td.verify(build(captor.capture()), { ignoreExtraArgs: true, times: 1 });

          let options = captor.value;
          expect(options.suppressSizes).to.equal(true, 'expected the suppressSizes flag to be true');
        });
      });

      ['production', 'development', 'baz'].forEach(function(env) {
        it(`ember ${command} --environment ${env}`, function() {
          let build = stubRun('build');

          return ember([command, '--environment', env]).then(function() {
            let captor = td.matchers.captor();
            td.verify(build(captor.capture()), { ignoreExtraArgs: true, times: 1 });

            let options = captor.value;
            expect(options.environment).to.equal(env, 'correct environment');
          });
        });
      });

      ['development', 'baz'].forEach(function(env) {
        it(`EMBER_ENV=production ember ${command} --environment ${env}`, function() {
          let build = stubRun('build');

          process.env.EMBER_ENV = 'production';

          return ember([command, '--environment', env]).then(function() {
            td.verify(build(), { ignoreExtraArgs: true, times: 1 });

            expect(process.env.EMBER_ENV).to.equal('production', 'uses EMBER_ENV over environment');
          });
        });
      });

      ['production', 'development', 'baz'].forEach(function(env) {
        it(`EMBER_ENV=${env} ember ${command} `, function() {
          let build = stubRun('build');

          process.env.EMBER_ENV = env;

          return ember([command]).then(function() {
            td.verify(build(), { ignoreExtraArgs: true, times: 1 });

            expect(process.env.EMBER_ENV).to.equal(env, 'correct environment');
          });
        });
      });
    });
  });

  it('ember <valid command>', function() {
    let help = stubValidateAndRun('help');
    let serve = stubValidateAndRun('serve');

    return ember(['serve']).then(function() {
      td.verify(help(), { ignoreExtraArgs: true, times: 0 });
      td.verify(serve(), { ignoreExtraArgs: true, times: 1 });

      let output = ui.output.trim();
      expect(output).to.equal('', 'expected no extra output');
    });
  });

  it.skip('ember <valid command with args>', function() {
    let help = stubValidateAndRun('help');
    let serve = stubValidateAndRun('serve');

    return ember(['serve', 'lorem', 'ipsum', 'dolor', '--flag1=one']).then(function() {
      let args = serve.calledWith[0][0].cliArgs;

      expect(help.called).to.equal(0, 'expected the help command NOT to be run');
      expect(serve.called).to.equal(1, 'expected the foo command to be run');
      expect(args).to.deep.equal(['serve', 'lorem', 'ipsum', 'dolor'], 'expects correct arguments');

      expect(serve.calledWith[0].length).to.equal(2, 'expect foo to receive a total of 4 args');

      let output = ui.output.trim();
      expect(output).to.equal('', 'expected no extra output');
    });
  });

  it('ember <invalid command>', function() {
    let help = stubValidateAndRun('help');

    return (expect(ember(['unknownCommand'])).to.be.rejected).then(error => {
      expect(help.called, 'help command was executed').to.not.be.ok;
      expect(error.name).to.equal('SilentError');
      expect(error.message).to.equal('The specified command unknownCommand is invalid. For available options, see `ember help`.');
    });
  });

  describe.skip('default options config file', function() {
    it('reads default options from .ember-cli file', function() {
      let defaults = ['--output', process.cwd()];
      let build = stubValidateAndRun('build');

      return ember(['build'], defaults).then(function() {

        let options = build.calledWith[0][1].cliOptions;

        expect(options.output).to.equal(process.cwd());
      });
    });
  });

  describe('logError', function() {
    it('returns error status code in production', function() {
      let cli = new CLI({
        ui: new MockUI(),
        testing: false,
      });

      expect(cli.logError('foo')).to.equal(1);
    });

    it('does not throw an error in production', function() {
      let cli = new CLI({
        ui: new MockUI(),
        testing: false,
      });

      let invokeError = cli.logError.bind(cli, new Error('foo'));

      expect(invokeError).to.not.throw();
    });

    it('throws error in testing', function() {
      let cli = new CLI({
        ui: new MockUI(),
        testing: true,
      });

      let invokeError = cli.logError.bind(cli, new Error('foo'));

      expect(invokeError).to.throw(Error, 'foo');
    });
  });

  describe('Global command options', function() {
    let verboseCommand = function(args) {
      return ember(['fake-command', '--verbose'].concat(args));
    };

    describe('--verbose', function() {
      describe('option parsing', function() {
        afterEach(function() {
          delete process.env.EMBER_VERBOSE_FAKE_OPTION_1;
          delete process.env.EMBER_VERBOSE_FAKE_OPTION_2;
        });

        // eslint-disable-next-line no-template-curly-in-string
        it('sets process.env.EMBER_VERBOSE_${NAME} for each space delimited option', function() {
          return expect(verboseCommand(['fake_option_1', 'fake_option_2'])).to.be.rejected.then(error => {
            expect(process.env.EMBER_VERBOSE_FAKE_OPTION_1).to.be.ok;
            expect(process.env.EMBER_VERBOSE_FAKE_OPTION_2).to.be.ok;
            expect(error.name).to.equal('SilentError');
            expect(error.message).to.equal('The specified command fake-command is invalid. For available options, see `ember help`.');
          });
        });

        it('ignores verbose options after --', function() {
          return expect(verboseCommand(['fake_option_1', '--fake-option', 'fake_option_2'])).to.be.rejected.then(error => {
            expect(process.env.EMBER_VERBOSE_FAKE_OPTION_1).to.be.ok;
            expect(process.env.EMBER_VERBOSE_FAKE_OPTION_2).to.not.be.ok;
            expect(error.name).to.equal('SilentError');
            expect(error.message).to.equal('The specified command fake-command is invalid. For available options, see `ember help`.');
          });
        });

        it('ignores verbose options after -', function() {
          return expect(verboseCommand(['fake_option_1', '-f', 'fake_option_2'])).to.be.rejected.then(error => {
            expect(process.env.EMBER_VERBOSE_FAKE_OPTION_1).to.be.ok;
            expect(process.env.EMBER_VERBOSE_FAKE_OPTION_2).to.not.be.ok;
            expect(error.name).to.equal('SilentError');
            expect(error.message).to.equal('The specified command fake-command is invalid. For available options, see `ember help`.');
          });
        });
      });
    });
  });
});
