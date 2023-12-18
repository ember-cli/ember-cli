import Application from '<%= modulePrefix %>/app';
import config from '<%= modulePrefix %>/config/environment';
import * as QUnit from 'qunit';
import { setApplication } from '@ember/test-helpers';
import { setup } from 'qunit-dom';
import { start } from 'ember-qunit';

setApplication(Application.create(config.APP));

setup(QUnit.assert);

// Groups individual test's own logs together
QUnit.testStart(({ name }) => console.group(name));
QUnit.testDone(() => console.groupEnd());

start();
