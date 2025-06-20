import Application from '<%= modulePrefix %>/app';
import config from '<%= modulePrefix %>/config/environment';
import * as QUnit from 'qunit';
import { setApplication } from '@ember/test-helpers';
import { setup } from 'qunit-dom';
import { loadTests } from 'ember-qunit/test-loader';
import { start, setupEmberOnerrorValidation } from 'ember-qunit';

window.addEventListener('beforeunload', function() {
  console.error('Window is about to unload. This means some test or code has tried to either set window.location or submit a form without "event.preventDefault()". Please use a mock window, window service, preventDefault, or some other technique to prevent navigation during testing');

	// eslint-disable-next-line no-debugger
	debugger;
});


setApplication(Application.create(config.APP));

setup(QUnit.assert);
setupEmberOnerrorValidation();
loadTests();
start();
