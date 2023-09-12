'use strict';

const { expect } = require('chai');
const InteractiveNewTask = require('../../../lib/tasks/interactive-new');

describe('interactive new task', function () {
  let interactiveNewTask;

  beforeEach(function () {
    interactiveNewTask = new InteractiveNewTask();
  });

  afterEach(function () {
    interactiveNewTask = null;
  });

  it('it runs', async function () {
    const newCommandOptions = {};
    const answers = await interactiveNewTask.run(newCommandOptions, {
      blueprint: 'app',
      name: 'foo',
      langSelection: 'en-US',
      packageManager: 'yarn',
      ciProvider: 'github',
    });

    expect(answers).to.deep.equal({
      blueprint: 'app',
      name: 'foo',
      lang: 'en-US',
      packageManager: 'yarn',
      ciProvider: 'github',
    });
  });

  it('it only displays the `name` question when no app/addon name is provided', async function () {
    let questions = await interactiveNewTask.getQuestions();
    let question = getQuestion('name', questions);

    expect(question.when).to.be.true;

    questions = await interactiveNewTask.getQuestions({ name: 'foo' });
    question = getQuestion('name', questions);

    expect(question.when).to.be.false;
  });

  it('it validates the provided app/addon name', async function () {
    let questions = await interactiveNewTask.getQuestions();
    let question = getQuestion('name', questions);

    expect(question.validate('')).to.equal('Please provide a name.');
    expect(question.validate('app')).to.equal(`We currently do not support \`app\` as a name.`);
    expect(question.validate('foo')).to.be.true;
  });

  it('it only displays the `langSelection` question when no language is provided', async function () {
    let questions = await interactiveNewTask.getQuestions();
    let question = getQuestion('langSelection', questions);

    expect(question.when).to.be.true;

    questions = await interactiveNewTask.getQuestions({ lang: 'nl-BE' });
    question = getQuestion('langSelection', questions);

    expect(question.when).to.be.false;
  });

  it('it only displays the `langDifferent` question when no language is provided and when the user wants to provide a different language', async function () {
    let questions = await interactiveNewTask.getQuestions();
    let question = getQuestion('langDifferent', questions);

    expect(question.when()).to.be.true;

    questions = await interactiveNewTask.getQuestions({ lang: 'nl-BE' });
    question = getQuestion('langDifferent', questions);

    expect(question.when()).to.be.false;

    questions = await interactiveNewTask.getQuestions();
    question = getQuestion('langDifferent', questions);

    expect(question.when({ langSelection: 'nl-BE' })).to.be.false;
  });

  it('it validates the provided different language', async function () {
    let questions = await interactiveNewTask.getQuestions();
    let question = getQuestion('langDifferent', questions);

    expect(question.validate('')).to.equal('Please provide a valid locale code.');
    expect(question.validate('foo')).to.equal('Please provide a valid locale code.');
    expect(question.validate('nl-BE')).to.be.true;
  });

  it('it only displays the `packageManager` question when no package manager is provided', async function () {
    let questions = await interactiveNewTask.getQuestions();
    let question = getQuestion('packageManager', questions);

    expect(question.when).to.be.true;

    questions = await interactiveNewTask.getQuestions({ packageManager: 'pnpm' });
    question = getQuestion('packageManager', questions);

    expect(question.when).to.be.false;
  });

  it('it displays the correct language choices', async function () {
    let userLocale = InteractiveNewTask.DEFAULT_LOCALE;

    class InteractiveNewTaskMock extends InteractiveNewTask {
      getUserLocale() {
        return userLocale;
      }
    }

    interactiveNewTask = new InteractiveNewTaskMock();

    let questions = await interactiveNewTask.getQuestions();
    let question = getQuestion('langSelection', questions);

    expect(question.choices).to.deep.equal([
      {
        name: InteractiveNewTask.DEFAULT_LOCALE,
        value: InteractiveNewTask.DEFAULT_LOCALE,
      },
      {
        name: 'I want to manually provide a different language',
        value: null,
      },
    ]);

    userLocale = 'nl-BE';
    questions = await interactiveNewTask.getQuestions();
    question = getQuestion('langSelection', questions);

    expect(question.choices).to.deep.equal([
      {
        name: InteractiveNewTask.DEFAULT_LOCALE,
        value: InteractiveNewTask.DEFAULT_LOCALE,
      },
      {
        name: 'nl-BE',
        value: 'nl-BE',
      },
      {
        name: 'I want to manually provide a different language',
        value: null,
      },
    ]);
  });

  it('it only displays the `ciProvider` question when no CI provider is provided', async function () {
    let questions = await interactiveNewTask.getQuestions();
    let question = getQuestion('ciProvider', questions);

    expect(question.when).to.be.true;

    questions = await interactiveNewTask.getQuestions({ ciProvider: 'github' });
    question = getQuestion('ciProvider', questions);

    expect(question.when).to.be.false;
  });
});

function getQuestion(name, questions) {
  return questions.find((question) => question.name === name);
}
