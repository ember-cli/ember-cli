# How To Contribute

## Installation

* `git clone <repository-url>`
* `cd <%= addonDirectory %>`
* `<% if (pnpm) { %>pnpm<% } else if (yarn) { %>yarn<% } else { %>npm<% } %> install`

## Linting

* `<% if (pnpm) { %>pnpm lint<% } else if (yarn) { %>yarn lint<% } else { %>npm run lint<% } %>`
* `<% if (pnpm) { %>pnpm lint:fix<% } else if (yarn) { %>yarn lint:fix<% } else { %>npm run lint:fix<% } %>`

## Running tests

* `<% if (yarn) { %>yarn<% } else { %>npm run<% } %> test:ember` – Runs the test suite on the current Ember version
* `<% if (yarn) { %>yarn<% } else { %>npm run<% } %> test:ember --server` – Runs the test suite in "watch mode"
* `<% if (yarn) { %>yarn<% } else { %>npm run<% } %> test:ember-compatibility` – Runs the test suite against multiple Ember versions

## Running the dummy application

* `<% if (yarn) { %>yarn<% } else { %>npm<% } %> start`
* Visit the dummy application at [http://localhost:4200](http://localhost:4200).

For more information on using ember-cli, visit [https://cli.emberjs.com/release/](https://cli.emberjs.com/release/).
