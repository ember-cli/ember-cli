import Application from '../src/main';
import { setApplication } from '@ember/test-helpers';
import { start } from 'ember-qunit';

setApplication(Application.create({ autoboot: false }));

start();
