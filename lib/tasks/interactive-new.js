'use strict';

const Task = require('../models/task');
const isValidProjectName = require('../utilities/valid-project-name');

const DEFAULT_LOCALE = 'en-US';

class InteractiveNewTask extends Task {
  async run(newCommandOptions, _testAnswers) {
    const inquirer = await import('inquirer');

    let prompt = inquirer.createPromptModule();
    let questions = await this.getQuestions(newCommandOptions);
    let answers = await prompt(questions, _testAnswers);

    answers.lang = answers.langSelection || answers.langDifferent;

    delete answers.langSelection;
    delete answers.langDifferent;

    return answers;
  }

  async getQuestions(newCommandOptions = {}) {
    const { isLangCode } = require('is-language-code');

    return [
      {
        name: 'blueprint',
        type: 'list',
        message: 'Is this an app or an addon?',
        choices: [
          {
            name: 'App',
            value: 'app',
          },
          {
            name: 'Addon',
            value: 'addon',
          },
        ],
      },
      {
        name: 'name',
        type: 'input',
        message: ({ blueprint }) => `Please provide the name of your ${blueprint}:`,
        when: !newCommandOptions.name,
        validate: (name) => {
          if (name) {
            if (isValidProjectName(name)) {
              return true;
            }

            return `We currently do not support \`${name}\` as a name.`;
          }

          return 'Please provide a name.';
        },
      },
      {
        name: 'langSelection',
        type: 'list',
        message: ({ blueprint }) => `Please provide the spoken/content language of your ${blueprint}:`,
        when: !newCommandOptions.lang,
        choices: await this.getLangChoices(),
      },
      {
        name: 'langDifferent',
        type: 'input',
        message: 'Please provide the different language:',
        when: ({ langSelection } = {}) => !newCommandOptions.lang && !langSelection,
        validate: (lang) => {
          if (isLangCode(lang).res) {
            return true;
          }

          return 'Please provide a valid locale code.';
        },
      },
      {
        name: 'packageManager',
        type: 'list',
        message: 'Pick the package manager to use when installing dependencies:',
        when: !newCommandOptions.packageManager,
        choices: [
          {
            name: 'NPM',
            value: 'npm',
          },
          {
            name: 'pnpm',
            value: 'pnpm',
          },
          {
            name: 'Yarn',
            value: 'yarn',
          },
          {
            name: 'Ignore/Skip',
            value: null,
          },
        ],
      },
      {
        name: 'ciProvider',
        type: 'list',
        message: 'Which CI provider do you want to use?',
        when: !newCommandOptions.ciProvider,
        choices: [
          {
            name: 'GitHub Actions',
            value: 'github',
          },
          {
            name: 'Travis CI',
            value: 'travis',
          },
          {
            name: 'Ignore/Skip',
            value: null,
          },
        ],
      },
    ];
  }

  async getLangChoices() {
    let userLocale = await this.getUserLocale();
    let langChoices = [
      {
        name: DEFAULT_LOCALE,
        value: DEFAULT_LOCALE,
      },
    ];

    if (userLocale !== DEFAULT_LOCALE) {
      langChoices.push({
        name: userLocale,
        value: userLocale,
      });
    }

    langChoices.push({
      name: 'I want to manually provide a different language',
      value: null,
    });

    return langChoices;
  }

  getUserLocale() {
    const osLocale = require('os-locale');

    return osLocale();
  }
}

module.exports = InteractiveNewTask;
module.exports.DEFAULT_LOCALE = DEFAULT_LOCALE;
