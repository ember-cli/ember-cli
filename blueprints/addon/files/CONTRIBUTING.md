# How To Contribute

## Installation

* `git clone <repository-url>`
* `cd <%= addonName %>`
* `<% if (yarn) { %>yarn<% } else { %>npm<% } %> install`

## Linting

* `<% if (yarn) { %>yarn<% } else { %>npm run<% } %> lint`
* `<% if (yarn) { %>yarn<% } else { %>npm run<% } %> lint:fix`

## Running tests

* `<% if (yarn) { %>yarn<% } else { %>npm run<% } %> test:ember` – Runs the test suite on the current Ember version
* `<% if (yarn) { %>yarn<% } else { %>npm run<% } %> test:ember --server` – Runs the test suite in "watch mode"
* `<% if (yarn) { %>yarn<% } else { %>npm run<% } %> test:ember-compatibility` – Runs the test suite against multiple Ember versions

## Running the dummy application

* `<% if (yarn) { %>yarn<% } else { %>npm<% } %> start`
* Visit the dummy application at [http://localhost:4200](http://localhost:4200).

For more information on using ember-cli, visit [https://ember-cli.com/](https://ember-cli.com/).
