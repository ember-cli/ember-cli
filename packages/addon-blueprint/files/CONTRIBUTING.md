# How To Contribute

## Installation

- `git clone <repository-url>`
- `cd <%= addonDirectory %>`
- `<% if (pnpm) { %>pnpm<% } else if (yarn) { %>yarn<% } else { %>npm<% } %> install`

## Linting

- `<%= invokeScriptPrefix %> lint`
- `<%= invokeScriptPrefix %> lint:fix`

## Running tests

- `<%= invokeScriptPrefix %> test` – Runs the test suite on the current Ember version
- `<%= invokeScriptPrefix %> test:ember <% if (npm) { %>-- <% } %>--server` – Runs the test suite in "watch mode"
- `<%= invokeScriptPrefix %> test:ember-compatibility` – Runs the test suite against multiple Ember versions

## Running the dummy application

- `<%= invokeScriptPrefix %> start`
- Visit the dummy application at [http://localhost:4200](http://localhost:4200).

For more information on using ember-cli, visit [https://cli.emberjs.com/release/](https://cli.emberjs.com/release/).
