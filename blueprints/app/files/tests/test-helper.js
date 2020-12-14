import Application from '<%= modulePrefix %>/app';
import config from '<%= modulePrefix %>/config/environment';
import { setApplication } from '@ember/test-helpers';
import { start } from 'ember-qunit';

setApplication(Application.create(config.APP));

start();
