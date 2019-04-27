'use strict';

const expect = require('../../chai').expect;
const commandOptions = require('../../factories/command-options');
const processHelpString = require('../../helpers/process-help-string');
const Yam = require('yam');
const EOL = require('os').EOL;
const td = require('testdouble');
const ci = require('ci-info');
const RSVP = require('rsvp');
const Promise = RSVP.Promise;

let Task = require('../../../lib/models/task');
let Command = require('../../../lib/models/command');

let ServeCommand = Command.extend({
  name: 'serve',
  aliases: ['server', 's'],
  availableOptions: [
    { name: 'port', type: Number, default: 4200 },
    { name: 'host', type: String, default: '0.0.0.0' },
    { name: 'proxy', type: String },
    { name: 'live-reload', type: Boolean, default: true, aliases: ['lr'] },
    { name: 'live-reload-port', type: Number, description: '(Defaults to port number + 31529)' },
    { name: 'environment', type: String, default: 'development' },
  ],
  run(options) {
    return options;
  },
});

let DevelopEmberCLICommand = Command.extend({
  name: 'develop-ember-cli',
  works: 'everywhere',
  availableOptions: [{ name: 'package-name', key: 'packageName', type: String, required: true }],
  run(options) {
    return options;
  },
});

let InsideProjectCommand = Command.extend({
  name: 'inside-project',
  works: 'insideProject',
  run(options) {
    return options;
  },
});

let OutsideProjectCommand = Command.extend({
  name: 'outside-project',
  works: 'outsideProject',
  run(options) {
    return options;
  },
});

let OptionsAliasCommand = Command.extend({
  name: 'options-alias',
  availableOptions: [
    {
      name: 'taco',
      type: String,
      default: 'traditional',
      aliases: [{ 'hard-shell': 'hard-shell' }, { 'soft-shell': 'soft-shell' }],
    },
    {
      name: 'spicy',
      type: Boolean,
      default: true,
      aliases: [{ mild: false }],
    },
    {
      name: 'display-message',
      type: String,
      aliases: ['dm', { hw: 'Hello world' }],
    },
  ],
  run(options) {
    return options;
  },
});

describe('models/command.js', function() {
  let ui;
  let config;
  let options;

  before(function() {
    config = new Yam('ember-cli', {
      secondary: `${process.cwd()}/tests/fixtures/home`,
      primary: `${process.cwd()}/tests/fixtures/project`,
    });
  });

  beforeEach(function() {
    options = commandOptions();
    ui = options.ui;
  });

  afterEach(function() {
    td.reset();
  });

  it('parseArgs() should parse the command options.', function() {
    expect(new ServeCommand(options).parseArgs(['--port', '80'])).to.have.nested.property('options.port', 80);
  });

  (ci.APPVEYOR ? it.skip : it)(
    'parseArgs() should get command options from the config file and command line',
    function() {
      expect(
        new ServeCommand(
          Object.assign(options, {
            settings: config.getAll(),
          })
        ).parseArgs(['--port', '789'])
      ).to.deep.equal({
        options: {
          port: 789,
          environment: 'mock-development',
          host: '0.1.0.1',
          proxy: 'http://iamstef.net/ember-cli',
          liveReload: false,
          checkForUpdates: true,
        },
        args: [],
      });
    }
  );

  it('parseArgs() should set default option values.', function() {
    expect(new ServeCommand(options).parseArgs([])).to.have.nested.property('options.port', 4200);
  });

  (ci.APPVEYOR ? it.skip : it)('parseArgs() should return args too.', function() {
    expect(
      new ServeCommand(
        Object.assign(options, {
          settings: config.getAll(),
        })
      ).parseArgs(['foo', '--port', '80'])
    ).to.deep.equal({
      args: ['foo'],
      options: {
        environment: 'mock-development',
        host: '0.1.0.1',
        proxy: 'http://iamstef.net/ember-cli',
        liveReload: false,
        port: 80,
        checkForUpdates: true,
      },
    });
  });

  it('parseArgs() should warn if an option is invalid.', function() {
    new ServeCommand(
      Object.assign(options, {
        settings: config.getAll(),
      })
    ).parseArgs(['foo', '--envirmont', 'production']);
    expect(ui.output).to.match(
      /The option '--envirmont' is not registered with the 'serve' command. Run `ember serve --help` for a list of supported options./
    );
  });

  it('parseArgs() should parse shorthand options.', function() {
    expect(new ServeCommand(options).parseArgs(['-e', 'tacotown'])).to.have.nested.property(
      'options.environment',
      'tacotown'
    );
  });

  it('parseArgs() should parse shorthand dasherized options.', function() {
    expect(new ServeCommand(options).parseArgs(['-lr', 'false'])).to.have.nested.property('options.liveReload', false);
  });

  it('parseArgs() should parse string options.', function() {
    let CustomAliasCommand = Command.extend({
      name: 'custom-alias',
      availableOptions: [
        {
          name: 'options',
          type: String,
        },
      ],
      run(options) {
        return options;
      },
    });
    const command = new CustomAliasCommand(options).parseArgs(['1', '--options', '--split 2 --random']);
    expect(command).to.have.nested.property('options.options', '--split 2 --random');
  });

  describe('#validateAndRun', function() {
    it('should reject and print a message if a required option is missing.', function() {
      return new DevelopEmberCLICommand(options).validateAndRun([]).catch(function() {
        expect(ui.output).to.match(/requires the option.*package-name/);
      });
    });

    it('should print a message if outside a project and command is not valid there.', function() {
      return new InsideProjectCommand(
        Object.assign(options, {
          project: {
            hasDependencies() {
              return true;
            },
            isEmberCLIProject() {
              return false;
            },
          },
        })
      )
        .validateAndRun([])
        .catch(function(reason) {
          expect(reason.message).to.match(/You have to be inside an ember-cli project/);
        });
    });

    it('selects watcher if an option', function() {
      return new InsideProjectCommand(
        Object.assign(options, {
          availableOptions: [{ type: 'string', name: 'watcher' }],
          project: {
            hasDependencies() {
              return true;
            },
            isEmberCLIProject() {
              return true;
            },
          },
        })
      )
        .validateAndRun([])
        .then(function(options) {
          expect(options).to.have.property('watcher');
        });
    });

    it('selects NO watcher if NOT an option', function() {
      return new InsideProjectCommand(
        Object.assign(options, {
          availableOptions: [{ type: 'string', name: 'foo' }],
          project: {
            hasDependencies() {
              return true;
            },
            isEmberCLIProject() {
              return true;
            },
          },
        })
      )
        .validateAndRun([])
        .then(function(options) {
          expect(options).to.not.have.property('watcher');
        });
    });

    it('should print a message if inside a project and command is not valid there.', function() {
      return new OutsideProjectCommand(options).validateAndRun([]).catch(function(reason) {
        expect(reason.message).to.match(/You cannot use.*inside an ember-cli project/);
      });
    });
  });

  it('should be able to set availableOptions within init', function() {
    let AvailableOptionsInitCommand = Command.extend({
      name: 'available-options-init-command',
      init() {
        this._super.apply(this, arguments);

        this.availableOptions = [
          {
            name: 'spicy',
            type: String,
            default: true,
          },
        ];
      },
      run(options) {
        return options;
      },
    });

    return new AvailableOptionsInitCommand(
      Object.assign(options, {
        project: {
          hasDependencies() {
            return true;
          },
          isEmberCLIProject() {
            return false;
          },
        },
      })
    )
      .validateAndRun([])
      .then(function(commandOptions) {
        expect(commandOptions).to.deep.equal({ spicy: true });
      });
  });

  it('should be able to set availableOptions within beforeRun', function() {
    let AvailableOptionsInitCommand = Command.extend({
      name: 'available-options-init-command',

      availableOptions: [
        {
          name: 'spicy',
          type: Boolean,
          default: true,
        },
      ],

      beforeRun() {
        return new Promise(resolve => {
          resolve(
            this.availableOptions.push({
              name: 'foobar',
              type: String,
              default: 'bazbaz',
            })
          );
        });
      },
      run(options) {
        return options;
      },
    });

    const command = new AvailableOptionsInitCommand(
      Object.assign(options, {
        project: {
          hasDependencies() {
            return true;
          },
          isEmberCLIProject() {
            return false;
          },
        },
      })
    );

    return command.beforeRun().then(() =>
      command.validateAndRun([]).then(commandOptions => {
        expect(commandOptions).to.deep.equal({ spicy: true, foobar: 'bazbaz' });
      })
    );
  });

  it('availableOptions with aliases should work.', function() {
    expect(new OptionsAliasCommand(options).parseArgs(['-soft-shell'])).to.deep.equal({
      options: {
        taco: 'soft-shell',
        spicy: true,
      },
      args: [],
    });
  });

  it('availableOptions with aliases should work with minimum characters.', function() {
    expect(new OptionsAliasCommand(options).parseArgs(['-so'])).to.deep.equal({
      options: {
        taco: 'soft-shell',
        spicy: true,
      },
      args: [],
    });
  });

  it('availableOptions with aliases should work with hyphenated options', function() {
    expect(new OptionsAliasCommand(options).parseArgs(['-dm', 'hi'])).to.deep.equal({
      options: {
        taco: 'traditional',
        spicy: true,
        displayMessage: 'hi',
      },
      args: [],
    });

    expect(new OptionsAliasCommand(options).parseArgs(['-hw'])).to.deep.equal({
      options: {
        taco: 'traditional',
        spicy: true,
        displayMessage: 'Hello world',
      },
      args: [],
    });
  });

  it('registerOptions() should allow adding availableOptions.', function() {
    let optionsAlias = new OptionsAliasCommand(options);
    let extendedAvailableOptions = [
      {
        name: 'filling',
        type: String,
        default: 'adobada',
        aliases: [{ 'carne-asada': 'carne-asada' }, { carnitas: 'carnitas' }, { fish: 'fish' }],
      },
    ];

    optionsAlias.registerOptions({ availableOptions: extendedAvailableOptions });
    // defaults
    expect(optionsAlias.parseArgs([])).to.deep.equal({
      options: {
        taco: 'traditional',
        spicy: true,
        filling: 'adobada',
      },
      args: [],
    });
    // shorthand
    expect(optionsAlias.parseArgs(['-carne'])).to.deep.equal({
      options: {
        taco: 'traditional',
        spicy: true,
        filling: 'carne-asada',
      },
      args: [],
    });
    // last argument wins
    expect(optionsAlias.parseArgs(['-carne', '-fish'])).to.deep.equal({
      options: {
        taco: 'traditional',
        spicy: true,
        filling: 'fish',
      },
      args: [],
    });
  });

  it('registerOptions() should allow overriding availableOptions.', function() {
    let optionsAlias = new OptionsAliasCommand(options);
    let extendedAvailableOptions = [
      {
        name: 'filling',
        type: String,
        default: 'adobada',
        aliases: [{ 'carne-asada': 'carne-asada' }, { carnitas: 'carnitas' }, { fish: 'fish' }],
      },
    ];
    let duplicateExtendedAvailableOptions = [
      {
        name: 'filling',
        type: String,
        default: 'carnitas',
        aliases: [{ 'pollo-asado': 'pollo-asado' }, { 'carne-asada': 'carne-asada' }],
      },
    ];

    optionsAlias.registerOptions({ availableOptions: extendedAvailableOptions });
    // default
    expect(optionsAlias.parseArgs([])).to.deep.equal({
      options: {
        taco: 'traditional',
        spicy: true,
        filling: 'adobada',
      },
      args: [],
    });
    // shorthand
    expect(optionsAlias.parseArgs(['-carne'])).to.deep.equal({
      options: {
        taco: 'traditional',
        spicy: true,
        filling: 'carne-asada',
      },
      args: [],
    });
    optionsAlias.registerOptions({ availableOptions: duplicateExtendedAvailableOptions });
    // override default
    expect(optionsAlias.parseArgs([])).to.deep.equal({
      options: {
        taco: 'traditional',
        spicy: true,
        filling: 'carnitas',
      },
      args: [],
    });
    // last argument wins
    expect(optionsAlias.parseArgs(['-fish', '-pollo'])).to.deep.equal({
      options: {
        taco: 'traditional',
        spicy: true,
        filling: 'pollo-asado',
      },
      args: [],
    });
  });

  it('registerOptions() should not allow aliases with the same name.', function() {
    let optionsAlias = new OptionsAliasCommand(options);
    let extendedAvailableOptions = [
      {
        name: 'filling',
        type: String,
        default: 'adobada',
        aliases: [{ 'carne-asada': 'carne-asada' }, { carnitas: 'carnitas' }, { fish: 'fish' }],
      },
      {
        name: 'favorite',
        type: String,
        default: 'adobada',
        aliases: [{ 'carne-asada': 'carne-asada' }, { carnitas: 'carnitas' }, { fish: 'fish' }],
      },
    ];
    let register = optionsAlias.registerOptions.bind(optionsAlias);

    optionsAlias.availableOptions = extendedAvailableOptions;
    expect(register).to.throw(
      'The "carne-asada" alias is already in use by the "--filling" option and ' +
        'cannot be used by the "--favorite" option. Please use a different alias.'
    );
  });

  it('registerOptions() should warn on options override attempts.', function() {
    let optionsAlias = new OptionsAliasCommand(options);
    let extendedAvailableOptions = [
      {
        name: 'spicy',
        type: Boolean,
        default: true,
        aliases: [{ mild: true }],
      },
    ];
    optionsAlias.registerOptions({ availableOptions: extendedAvailableOptions });
    expect(ui.output).to.match(/The ".*" alias cannot be overridden. Please use a different alias./);
  });

  it('registerOptions() should handle invalid alias definitions.', function() {
    //check for different types, validate proper errors are thrown
    let optionsAlias = new OptionsAliasCommand(options);
    let badArrayAvailableOptions = [
      {
        name: 'filling',
        type: String,
        default: 'adobada',
        aliases: ['meat', [{ 'carne-asada': 'carne-asada' }], { carnitas: 'carnitas' }, { fish: 'fish' }],
      },
    ];
    let badObjectAvailableOptions = [
      {
        name: 'filling',
        type: String,
        default: 'adobada',
        aliases: ['meat', { 'carne-asada': ['steak', 'grilled'] }, { carnitas: 'carnitas' }, { fish: 'fish' }],
      },
    ];
    let register = optionsAlias.registerOptions.bind(optionsAlias);

    optionsAlias.availableOptions = badArrayAvailableOptions;
    expect(register).to.throw(
      'The "[object Object]" [type:array] alias is not an acceptable value. ' +
        'It must be a string or single key object with a string value (for example, "value" or { "key" : "value" }).'
    );

    optionsAlias.availableOptions = badObjectAvailableOptions;
    expect(register).to.throw(
      'The "[object Object]" [type:object] alias is not an acceptable value. ' +
        'It must be a string or single key object with a string value (for example, "value" or { "key" : "value" }).'
    );
  });

  it('parseAlias() should parse aliases and return an object', function() {
    let optionsAlias = new OptionsAliasCommand(options);
    let option = {
      name: 'filling',
      type: String,
      key: 'filling',
      default: 'adobada',
      aliases: [{ 'carne-asada': 'carne-asada' }, { carnitas: 'carnitas' }, { fish: 'fish' }],
    };
    let alias = { carnitas: 'carnitas' };
    expect(optionsAlias.parseAlias(option, alias)).to.deep.equal({
      key: 'carnitas',
      value: ['--filling', 'carnitas'],
      original: { carnitas: 'carnitas' },
    });
  });

  it('validateOption() should validate options', function() {
    let option = {
      name: 'filling',
      type: String,
      default: 'adobada',
      aliases: [{ 'carne-asada': 'carne-asada' }, { carnitas: 'carnitas' }, { fish: 'fish' }],
    };
    let dupe = { name: 'spicy', type: Boolean, default: true, aliases: [{ mild: false }] };
    let noAlias = { name: 'reload', type: Boolean, default: false };
    const aliasCommand = new OptionsAliasCommand(options);
    aliasCommand.registerOptions();
    expect(aliasCommand.validateOption(option)).to.be.ok;

    const serveCommand = new ServeCommand(options);
    serveCommand.registerOptions();
    expect(serveCommand.validateOption(noAlias)).to.be.false;

    const optionsAliasCommand = new OptionsAliasCommand(options);
    optionsAliasCommand.registerOptions();
    expect(optionsAliasCommand.validateOption(dupe)).to.be.false;
  });

  it('validateOption() should throw an error when option is missing name or type', function() {
    let optionsAlias = new OptionsAliasCommand(options);
    let notype = { name: 'taco' };
    let noname = { type: Boolean };

    expect(optionsAlias.validateOption.bind(optionsAlias, notype)).to.throw(
      'The command "options-alias" has an ' + 'option without the required type and name fields.'
    );
    expect(optionsAlias.validateOption.bind(optionsAlias, noname)).to.throw(
      'The command "options-alias" has an ' + 'option without the required type and name fields.'
    );
  });

  it('validateOption() should throw an error when option name is camelCase or capitalized', function() {
    let optionsAlias = new OptionsAliasCommand(options);
    let capital = {
      name: 'Taco',
      type: Boolean,
    };
    let camel = {
      name: 'tacoTown',
      type: Boolean,
    };

    expect(optionsAlias.validateOption.bind(optionsAlias, capital)).to.throw(
      'The "Taco" option\'s name of the "options-alias"' + ' command contains a capital letter.'
    );
    expect(optionsAlias.validateOption.bind(optionsAlias, camel)).to.throw(
      'The "tacoTown" option\'s name of the "options-alias"' + ' command contains a capital letter.'
    );
  });

  it('mergeDuplicateOption() should merge duplicate options together', function() {
    let optionsAlias = new OptionsAliasCommand(options);
    let garbageAvailableOptions = [{ name: 'spicy', type: Boolean, default: true, aliases: [{ mild: true }] }];
    optionsAlias.registerOptions({ availableOptions: garbageAvailableOptions });
    let extendedAvailableOptions = [
      {
        name: 'filling',
        type: String,
        default: 'adobada',
        aliases: [{ 'carne-asada': 'carne-asada' }, { carnitas: 'carnitas' }, { fish: 'fish' }],
      },
    ];
    let duplicateExtendedAvailableOptions = [
      {
        name: 'filling',
        type: String,
        default: 'carnitas',
        aliases: [{ 'pollo-asado': 'pollo-asado' }, { 'carne-asada': 'carne-asada' }],
      },
    ];
    optionsAlias.registerOptions({ availableOptions: extendedAvailableOptions });
    optionsAlias.availableOptions.push(duplicateExtendedAvailableOptions[0]);

    expect(optionsAlias.mergeDuplicateOption('filling')).to.deep.equal([
      {
        name: 'taco',
        type: String,
        default: 'traditional',
        aliases: [{ 'hard-shell': 'hard-shell' }, { 'soft-shell': 'soft-shell' }],
        key: 'taco',
        required: false,
      },
      {
        name: 'display-message',
        type: String,
        aliases: ['dm', { hw: 'Hello world' }],
        key: 'displayMessage',
        required: false,
      },
      {
        name: 'spicy',
        type: Boolean,
        default: true,
        aliases: [{ mild: false }],
        key: 'spicy',
        required: false,
      },
      {
        name: 'filling',
        type: String,
        default: 'carnitas',
        aliases: [
          { 'carne-asada': 'carne-asada' },
          { carnitas: 'carnitas' },
          { fish: 'fish' },
          { 'pollo-asado': 'pollo-asado' },
        ],
        key: 'filling',
        required: false,
      },
    ]);
  });

  it('implicit shorthands work with values.', function() {
    expect(new OptionsAliasCommand(options).parseArgs(['-s', 'false', '-t', 'hard-shell'])).to.deep.equal({
      options: {
        taco: 'hard-shell',
        spicy: false,
      },
      args: [],
    });
  });

  describe('runTask', function() {
    let command;

    class AsyncTask extends Task {
      run(options) {
        return new Promise(function(resolve) {
          setTimeout(() => resolve(options), 50);
        });
      }
    }

    class SyncTask extends Task {
      run(options) {
        return options;
      }
    }

    class FailingTask extends Task {
      run(/* options */) {
        throw new Error('I was born to fail');
      }
    }

    beforeEach(function() {
      // this should be changed to new Command(), but needs more mocking
      command = new ServeCommand(
        Object.assign({}, options, {
          tasks: {
            Async: AsyncTask,
            Sync: SyncTask,
            Failing: FailingTask,
          },
        })
      );
    });

    it('always handles task as a promise', function() {
      return command.runTask('Sync', { param: 'value' }).then(result => {
        expect(result).to.eql({
          param: 'value',
        });
      });
    });

    it('command environment should be shared with a task', function() {
      let taskRun = command.runTask('Async', { param: 'value' });

      expect(command._currentTask.ui).to.eql(command.ui);
      expect(command._currentTask.analytics).to.eql(command.analytics);
      expect(command._currentTask.project).to.eql(command.project);

      return taskRun;
    });

    it('_currentTask should store a reference to the current task', function() {
      expect(command._currentTask).to.be.undefined;
      let taskRun = command.runTask('Sync', { param: 'value' }).then(() => {
        expect(command._currentTask).to.be.undefined;
      });
      expect(command._currentTask).to.be.an.instanceof(SyncTask);

      return taskRun;
    });

    it('_currentTask should cleanup current task on fail', function() {
      return expect(command.runTask('Failing', { param: 'value' })).to.be.rejected.then(() => {
        expect(command._currentTask).to.be.undefined;
      });
    });

    it('throws on attempt to launch concurrent tasks', function() {
      let asyncTaskRun, syncTaskRun;

      expect(() => {
        asyncTaskRun = command.runTask('Async');
        syncTaskRun = command.runTask('Sync');
      }).to.throw(`Concurrent tasks are not supported`);

      return Promise.all([asyncTaskRun, syncTaskRun]);
    });

    it('throws if the task is not found', function() {
      try {
        let taskRun = command.runTask('notfound');

        expect(false, 'task should not be launched').to.equal(true);

        return taskRun;
      } catch (e) {
        expect(e.message).to.equal(`Unknown task "notfound"`);
      }
    });
  });

  describe('help', function() {
    let command;

    beforeEach(function() {
      // this should be changed to new Command(), but needs more mocking
      command = new ServeCommand(options);
    });

    describe('printBasicHelp', function() {
      beforeEach(function() {
        td.replace(command, '_printCommand', td.function());
        td.when(command._printCommand(), { ignoreExtraArgs: true }).thenReturn(' command printed');
      });

      afterEach(function() {
        td.reset();
      });

      it('calls printCommand', function() {
        let output = command.printBasicHelp();

        let testString = processHelpString(`ember serve command printed${EOL}`);

        expect(output).to.equal(testString);
      });

      it('is root', function() {
        command.isRoot = true;

        let output = command.printBasicHelp();

        let testString = processHelpString(`Usage: serve command printed${EOL}`);

        expect(output).to.equal(testString);
      });
    });

    describe('printDetailedHelp', function() {
      it('has no-op function', function() {
        let output = command.printDetailedHelp();

        expect(output).to.be.undefined;
      });
    });

    describe('hasOption', function() {
      it('reports false if no option with that name is present', function() {
        expect(command.hasOption('no-option-by-this-name')).to.be.false;
      });

      it('reports true if option with that name is present', function() {
        expect(command.hasOption('port')).to.be.true;
      });
    });

    describe('getJson', function() {
      beforeEach(function() {
        command._printableProperties = ['test1', 'test2'];
      });

      it('iterates options', function() {
        Object.assign(command, {
          test1: 'a test',
          test2: 'another test',
        });

        let json = command.getJson();

        expect(json).to.deep.equal({
          test1: 'a test',
          test2: 'another test',
        });
      });

      it('calls detailed json', function() {
        td.replace(command, 'addAdditionalJsonForHelp', td.function());

        let options = {};

        let json = command.getJson(options);

        td.verify(command.addAdditionalJsonForHelp(json, options));
      });
    });
  });
});
