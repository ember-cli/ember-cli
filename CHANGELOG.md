# ember-cli Changelog

## v6.3.1

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v6.3.0...v6.3.1)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v6.3.0...v6.3.1)

#### Changelog

- [#10685](https://github.com/ember-cli/ember-cli/pull/10685) Add configuration to ember-cli-build to opt new projects out of the deprecated behavior of the Store class extending EmberObject [@kategengler](https://github.com/kategengler)

Thank you to all who took the time to contribute!

## v6.3.0

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v6.2.0...v6.3.0)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v6.2.0...v6.3.0)

#### Changelog

- [#10644](https://github.com/ember-cli/ember-cli/pull/10644)  [BUGFIX beta] `--no-ember-data` fixes [@Windvis](https://github.com/Windvis)
- [#10647](https://github.com/ember-cli/ember-cli/pull/10647) [Bugfix beta]: Update ember-page-title to latest (v9) [@NullVoxPopuli](https://github.com/NullVoxPopuli)
- [#10668](https://github.com/ember-cli/ember-cli/pull/10668) Update the `--no-ember-data` fixtures [@Windvis](https://github.com/Windvis)
- [#10646](https://github.com/ember-cli/ember-cli/pull/10646) [Bugfix release]: Fix eslint parser for js when using --typescript [@NullVoxPopuli](https://github.com/NullVoxPopuli)
- [#10633](https://github.com/ember-cli/ember-cli/pull/10633) [BUGFIX release] Update all EmberData deps to stable [@Windvis](https://github.com/Windvis)
- [#10643](https://github.com/ember-cli/ember-cli/pull/10643) Remove unmaintained ember-cli-lodash-subset in favor of requiring functions directly from lodash [@kategengler](https://github.com/kategengler)
- [#10638](https://github.com/ember-cli/ember-cli/pull/10638) [BUGFIX release] Fix ember-data configuration again [@NullVoxPopuli](https://github.com/NullVoxPopuli)
- [#10534](https://github.com/ember-cli/ember-cli/pull/10534) [CLEANUP] Clean up `outputPaths` deprecation [@bertdeblock](https://github.com/bertdeblock)
- [#10538](https://github.com/ember-cli/ember-cli/pull/10538) [CLEANUP] Clean up Travis CI deprecation [@bertdeblock](https://github.com/bertdeblock)
- [#10586](https://github.com/ember-cli/ember-cli/pull/10586) [INTERNAL] Add tests to ensure no linting errors post generating a new app or addon [@bertdeblock](https://github.com/bertdeblock)
- [#10587](https://github.com/ember-cli/ember-cli/pull/10587) [BUGFIX] Fix including `ember-source` types for v1 addons [@bertdeblock](https://github.com/bertdeblock)
- [#10589](https://github.com/ember-cli/ember-cli/pull/10589) [ENHANCEMENT] Deprecate v1 addon `contentFor` types [RFC 1044] [@bertdeblock](https://github.com/bertdeblock)
- [#10592](https://github.com/ember-cli/ember-cli/pull/10592) [BUGFIX] Fix ESLint config for v1 addons [@bertdeblock](https://github.com/bertdeblock)
- [#10593](https://github.com/ember-cli/ember-cli/pull/10593) [CLEANUP] Clean up old `broccoli-builder` fallback [@bertdeblock](https://github.com/bertdeblock)
- [#10594](https://github.com/ember-cli/ember-cli/pull/10594) [CLEANUP] Clean up old `heimdalljs` deprecation [@bertdeblock](https://github.com/bertdeblock)
- [#10595](https://github.com/ember-cli/ember-cli/pull/10595) [ENHANCEMENT] Update `@glimmer/component` to v2 in blueprints [@bertdeblock](https://github.com/bertdeblock)
- [#10596](https://github.com/ember-cli/ember-cli/pull/10596) [ENHANCEMENT] Vanilla Prettier setup in blueprints [RFC 1055] [@bertdeblock](https://github.com/bertdeblock)
- [#10597](https://github.com/ember-cli/ember-cli/pull/10597) [CLEANUP] Clean up remaining Travis fixtures [@bertdeblock](https://github.com/bertdeblock)
- [#10599](https://github.com/ember-cli/ember-cli/pull/10599) [INTERNAL] Bump `content-tag` to v3 [@SergeAstapov](https://github.com/SergeAstapov)
- [#10612](https://github.com/ember-cli/ember-cli/pull/10612) [BUGFIX release]: tsconfig.json referenced paths to types instead of imports [@NullVoxPopuli](https://github.com/NullVoxPopuli)
- [#10613](https://github.com/ember-cli/ember-cli/pull/10613) [ENHANCEMENT] Support `--ember-data` / `--no-ember-data` flags when creating a new app [@NullVoxPopuli](https://github.com/NullVoxPopuli)
- [#10615](https://github.com/ember-cli/ember-cli/pull/10615) [ENHANCEMENT] Simplify Prettier config in blueprints [@bendemboski](https://github.com/bendemboski)
- [#10616](https://github.com/ember-cli/ember-cli/pull/10616) [INTERNAL] Add test to ensure all package files are parseable [@bertdeblock](https://github.com/bertdeblock)
- [#10617](https://github.com/ember-cli/ember-cli/pull/10617) [ENHANCEMENT] Use `staticInvokables` in the `app` blueprint [@bertdeblock](https://github.com/bertdeblock)
- [#10618](https://github.com/ember-cli/ember-cli/pull/10618) [INTERNAL] Avoid output for `deprecate` tests [@bertdeblock](https://github.com/bertdeblock)
- [#10619](https://github.com/ember-cli/ember-cli/pull/10619) [BUGFIX] Only remove type imports when removing the types from `.gts` files in blueprints [@Windvis](https://github.com/Windvis)
- [#10621](https://github.com/ember-cli/ember-cli/pull/10621) [ENHANCEMENT] Bump `@ember/test-helpers` to v5.1.0 in blueprints [@NullVoxPopuli](https://github.com/NullVoxPopuli)

Thank you to all who took the time to contribute!

## v6.2.3

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v6.2.2...v6.2.3)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v6.2.2...v6.2.3)

#### Changelog

- [#10646](https://github.com/ember-cli/ember-cli/pull/10646) [Bugfix release]: Fix eslint parser for js when using --typescript [@NullVoxPopuli](https://github.com/NullVoxPopuli)

Thank you to all who took the time to contribute!

## v6.2.2

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v6.2.1...v6.2.2)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v6.2.1...v6.2.2)

#### Changelog

- [#10633](https://github.com/ember-cli/ember-cli/pull/10633) [BUGFIX release] Update all EmberData deps to stable [@Windvis](https://github.com/Windvis)
- [#10643](https://github.com/ember-cli/ember-cli/pull/10643) Remove unmaintained ember-cli-lodash-subset in favor of requiring functions directly from lodash [@kategengler](https://github.com/kategengler)

Thank you to all who took the time to contribute!

## v6.2.1

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v6.2.0...v6.2.1)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v6.2.0...v6.2.1)

#### Changelog

- [#10638](https://github.com/ember-cli/ember-cli/pull/10638) [BUGFIX release] Fix ember-data configuration again [@NullVoxPopuli](https://github.com/NullVoxPopuli)

Thank you to all who took the time to contribute!

## v6.2.0

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v6.1.0...v6.2.0)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v6.1.0...v6.2.0)

#### Changelog

- [#10496](https://github.com/ember-cli/ember-cli/pull/10496) [CLEANUP] Clean up support for incorrect values for `BROCCOLI_VIZ` env var [@bertdeblock](https://github.com/bertdeblock)
- [#10555](https://github.com/ember-cli/ember-cli/pull/10555) [ENHANCEMENT] Bump `pnpm/action-setup` to v4 in `app` and `addon` blueprints [@SergeAstapov](https://github.com/SergeAstapov)
- [#10562](https://github.com/ember-cli/ember-cli/pull/10562) [ENHANCEMENT] Allow creating apps and addons everywhere [@bertdeblock](https://github.com/bertdeblock)
- [#10577](https://github.com/ember-cli/ember-cli/pull/10577) [ENHANCEMENT] Remove `@ember/string` from `app` blueprint [@bertdeblock](https://github.com/bertdeblock)
- [#10578](https://github.com/ember-cli/ember-cli/pull/10578) [ENHANCEMENT] Test against Node v22 [@bertdeblock](https://github.com/bertdeblock)
- [#10579](https://github.com/ember-cli/ember-cli/pull/10579) [INTERNAL] Update `sort-package-json` [@bertdeblock](https://github.com/bertdeblock)
- [#10580](https://github.com/ember-cli/ember-cli/pull/10580) [ENHANCEMENT] Update LTS versions in blueprints [@bertdeblock](https://github.com/bertdeblock)
- [#10583](https://github.com/ember-cli/ember-cli/pull/10583) [ENHANCEMENT] Update `app` blueprint to support `ember-qunit` v9 [@ef4](https://github.com/ef4)
- [#10585](https://github.com/ember-cli/ember-cli/pull/10585) [INTERNAL] Support `WRITE_FIXTURES` in more test files [@ef4](https://github.com/ef4)

Thank you to all who took the time to contribute!

## v6.1.0

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v6.0.0...v6.1.0)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v6.0.0...v6.1.0)

#### Changelog

- [#10563](https://github.com/ember-cli/ember-cli/pull/10563) [Backport release]: update @ember/test-helpers. #10522 [@NullVoxPopuli](https://github.com/NullVoxPopuli)
- [#10564](https://github.com/ember-cli/ember-cli/pull/10564) [BUGFIX] Add missing package for TS eslint config [@mkszepp](https://github.com/mkszepp)
- [#10514](https://github.com/ember-cli/ember-cli/pull/10514) [backport release] use fork of remove-types with config: false [@mansona](https://github.com/mansona)
- [#10515](https://github.com/ember-cli/ember-cli/pull/10515) Use colors for the concurrently prefixes in package.json [@NullVoxPopuli](https://github.com/NullVoxPopuli)
- [#10516](https://github.com/ember-cli/ember-cli/pull/10516) Use ESLint 9 and Flat Config [@NullVoxPopuli](https://github.com/NullVoxPopuli)
- [#10521](https://github.com/ember-cli/ember-cli/pull/10521) Make tests easier to run, closes #10520 [@NullVoxPopuli](https://github.com/NullVoxPopuli)
- [#10525](https://github.com/ember-cli/ember-cli/pull/10525) Upgrade concurrently, closes #10524 [@NullVoxPopuli](https://github.com/NullVoxPopuli)
- [#10526](https://github.com/ember-cli/ember-cli/pull/10526) Update ember-resolver, closes #10523 [@NullVoxPopuli](https://github.com/NullVoxPopuli)
- [#10527](https://github.com/ember-cli/ember-cli/pull/10527) Update @ember/test-helpers, closes #10522 [@NullVoxPopuli](https://github.com/NullVoxPopuli)
- [#10530](https://github.com/ember-cli/ember-cli/pull/10530) Update ember-load-initializers to v3 [@mkszepp](https://github.com/mkszepp)
- [#10531](https://github.com/ember-cli/ember-cli/pull/10531) Update stylelint and depended package [@mkszepp](https://github.com/mkszepp)
- [#10535](https://github.com/ember-cli/ember-cli/pull/10535) Upgrade eslint-plugin-ember [@NullVoxPopuli](https://github.com/NullVoxPopuli)

Thank you to all who took the time to contribute!

## v6.0.1

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v6.0.0...v6.0.1)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v6.0.0...v6.0.1)

#### Changelog

- [#10563](https://github.com/ember-cli/ember-cli/pull/10563) [Backport release]: update @ember/test-helpers. #10522 [@NullVoxPopuli](https://github.com/NullVoxPopuli)

Thank you to all who took the time to contribute!

## v6.0.0

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v5.12.0...v6.0.0)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v5.12.0...v6.0.0)

#### Changelog

- [#10559](https://github.com/ember-cli/ember-cli/pull/10559) [ENHANCEMENT] Make deprecations throw when the `until` for `ember-cli` has passed [@kategengler](https://github.com/kategengler)
- [#10453](https://github.com/ember-cli/ember-cli/pull/10453) [ENHANCEMENT] Allow specifying no CI provider [@deanylev](https://github.com/deanylev)
- [#10505](https://github.com/ember-cli/ember-cli/pull/10505) use our fork of remove-types with config: false [@mansona](https://github.com/mansona)
- [#10506](https://github.com/ember-cli/ember-cli/pull/10506) [ENHANCEMENT] Use the official types in the blueprints [@Windvis](https://github.com/Windvis)
- [#10507](https://github.com/ember-cli/ember-cli/pull/10507) Official types in blueprints amendments [@Windvis](https://github.com/Windvis)

Thank you to all who took the time to contribute!

## v5.12.0

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v5.11.0...v5.12.0)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v5.11.0...v5.12.0)

#### Changelog

- [#10483](https://github.com/ember-cli/ember-cli/pull/10483) Bump @embroider/* dependencies [@NullVoxPopuli](https://github.com/NullVoxPopuli)
- [#10486](https://github.com/ember-cli/ember-cli/pull/10486) Bump ember-template-lint [@NullVoxPopuli](https://github.com/NullVoxPopuli)
- [#10481](https://github.com/ember-cli/ember-cli/pull/10481) Bump ember-cli-app-version [@NullVoxPopuli](https://github.com/NullVoxPopuli)
- [#10485](https://github.com/ember-cli/ember-cli/pull/10485) Bump eslint-plugin-ember [@NullVoxPopuli](https://github.com/NullVoxPopuli)
- [#10484](https://github.com/ember-cli/ember-cli/pull/10484) Bump ember-resolver [@NullVoxPopuli](https://github.com/NullVoxPopuli)
- [#10479](https://github.com/ember-cli/ember-cli/pull/10479) Bump @typescript-eslint dependencies to latest [@NullVoxPopuli](https://github.com/NullVoxPopuli)
- [#10482](https://github.com/ember-cli/ember-cli/pull/10482) Bump qunit-dom [@NullVoxPopuli](https://github.com/NullVoxPopuli)
- [#10480](https://github.com/ember-cli/ember-cli/pull/10480) Bump @ember/string [@NullVoxPopuli](https://github.com/NullVoxPopuli)
- [#10499](https://github.com/ember-cli/ember-cli/pull/10499) [ENHANCEMENT] Update `testem` [@bertdeblock](https://github.com/bertdeblock)

Thank you to all who took the time to contribute!

## v5.11.0

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v5.10.0...v5.11.0)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v5.10.0...v5.11.0)

#### Changelog

- [#10474](https://github.com/ember-cli/ember-cli/pull/10474) Improve dx when WelcomePage is present [@ef4](https://github.com/ef4)
- [#10475](https://github.com/ember-cli/ember-cli/pull/10475) Document WRITE_FIXTURES [@kategengler](https://github.com/kategengler)
- [#10476](https://github.com/ember-cli/ember-cli/pull/10476) Bump content-tag to v2 [@SergeAstapov](https://github.com/SergeAstapov)

Thank you to all who took the time to contribute!

## v5.10.0

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v5.9.0...v5.10.0)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v5.9.0...v5.10.0)

#### Changelog

- [#10464](https://github.com/ember-cli/ember-cli/pull/10464) Specified the locale in setupIntl() [@ijlee2](https://github.com/ijlee2)

Thank you to all who took the time to contribute!

## v5.9.0

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v5.8.1...v5.9.0)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v5.8.1...v5.9.0)

#### Changelog

- [#10446](https://github.com/ember-cli/ember-cli/pull/10446) [ENHANCEMENT] Format markdown files in blueprints with Prettier [@bertdeblock](https://github.com/bertdeblock)
- [#10450](https://github.com/ember-cli/ember-cli/pull/10450) [ENHANCEMENT] Remove warning when encountering a `.js` file when generating a TS blueprint [@bertdeblock](https://github.com/bertdeblock)
- [#10452](https://github.com/ember-cli/ember-cli/pull/10452) [BUGFIX] Make sure to use the correct package manager in concurrently scripts [@bertdeblock](https://github.com/bertdeblock)

Thank you to all who took the time to contribute!

## v5.8.1

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v5.8.0...v5.8.1)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v5.8.0...v5.8.1)

#### Changelog

- [#10458](https://github.com/ember-cli/ember-cli/pull/10458) Use Lodash's `_.template` instead of `lodash.template` package [@gorner](https://github.com/gorner)

Thank you to all who took the time to contribute!

## v5.8.0

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v5.7.0...v5.8.0)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v5.7.0...v5.8.0)

#### Changelog

- [#10418](https://github.com/ember-cli/ember-cli/pull/10418) [ENHANCEMENT] Use `content-tag` to parse GTS in blueprints [@IgnaceMaes](https://github.com/IgnaceMaes)
- [#10432](https://github.com/ember-cli/ember-cli/pull/10432) Filter out tsconfig.declarations.json correctly [@bendemboski](https://github.com/bendemboski)
- [#10436](https://github.com/ember-cli/ember-cli/pull/10436) stop using wyvox/action-setup-pnpm [@mansona](https://github.com/mansona)
- [#10437](https://github.com/ember-cli/ember-cli/pull/10437) [ENHANCEMENT] Update LTS scenarios in `addon` blueprint [@bertdeblock](https://github.com/bertdeblock)
- [#10438](https://github.com/ember-cli/ember-cli/pull/10438) [ENHANCEMENT] Add `declarations` folder to `.eslintignore` file in `app` blueprint [@bertdeblock](https://github.com/bertdeblock)
- [#10439](https://github.com/ember-cli/ember-cli/pull/10439) [ENHANCEMENT] Add tsconfig files to `.npmignore` file in `addon` blueprint [@bertdeblock](https://github.com/bertdeblock)

Thank you to all who took the time to contribute!

## v5.7.0

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v5.6.0...v5.7.0)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v5.6.0...v5.7.0)

#### Changelog

- [#10440](https://github.com/ember-cli/ember-cli/pull/10440) Update optional-features.json [@achambers](https://github.com/achambers)
- [#10445](https://github.com/ember-cli/ember-cli/pull/10445) Unpin Node 18 for ci [@kategengler](https://github.com/kategengler)
- [#10425](https://github.com/ember-cli/ember-cli/pull/10425) fix GitHub Action floating deps scenario for PNPM [@jelhan](https://github.com/jelhan)

Thank you to all who took the time to contribute!

## v5.6.0

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v5.5.0...v5.6.0)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v5.5.0...v5.6.0)

#### Changelog

- [#10394](https://github.com/ember-cli/ember-cli/pull/10394) [ENHANCEMENT] automatically select a port by default with `ember serve` [@sportshead](https://github.com/sportshead)
- [#10404](https://github.com/ember-cli/ember-cli/pull/10404) Add a workflow to deploy api docs to ember-learn/ember-cli.github.io [@kategengler](https://github.com/kategengler)
- [#10405](https://github.com/ember-cli/ember-cli/pull/10405) Update to deploy to the master branch and also correct a comment [@kategengler](https://github.com/kategengler)

Thank you to all who took the time to contribute!

## v5.5.0

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v5.4.1...v5.5.0)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v5.4.1...v5.5.0)

#### Changelog

- [#10332](https://github.com/ember-cli/ember-cli/pull/10332) [ENHANCEMENT] Support converting gts files in blueprint [@IgnaceMaes](https://github.com/IgnaceMaes)
- [#10350](https://github.com/ember-cli/ember-cli/pull/10350) [ENHANCEMENT] Deprecate Travis CI support [@bertdeblock](https://github.com/bertdeblock)
- [#10370](https://github.com/ember-cli/ember-cli/pull/10370) When generating a new app with --embroider use all optimisation flags [@mansona](https://github.com/mansona)
- [#10393](https://github.com/ember-cli/ember-cli/pull/10393) [ENHANCEMENT] feat: add skip-install alias to skip-npm [@IgnaceMaes](https://github.com/IgnaceMaes)
- [#10403](https://github.com/ember-cli/ember-cli/pull/10403) Fix some docs that were showing up weirdly in generated api docs [@kategengler](https://github.com/kategengler)
- [#9514](https://github.com/ember-cli/ember-cli/pull/9514) [ENHANCEMENT] Use packager commands in `CONTRIBUTING.md` and `README.md` files in `app` and `addon` blueprints [@elwayman02](https://github.com/elwayman02)

Thank you to all who took the time to contribute!

## v5.4.2

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v5.4.1...v5.4.2)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v5.4.1...v5.4.2)

#### Changelog

- [#10458](https://github.com/ember-cli/ember-cli/pull/10458) Use Lodash's `_.template` instead of `lodash.template` package [@gorner](https://github.com/gorner)

Thank you to all who took the time to contribute!

## v5.4.1

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v5.4.0...v5.4.1)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v5.4.0...v5.4.1)

#### Changelog

- [#10402](https://github.com/ember-cli/ember-cli/pull/10402) [BUGFIX release] use import type in helpers/index.ts :: typechecking in new apps otherwise fails [@NullVoxPopuli](https://github.com/NullVoxPopuli)

Thank you to all who took the time to contribute!

## v5.4.0

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v5.3.0...v5.4.0)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v5.3.0...v5.4.0)

#### Changelog

- [#10388](https://github.com/ember-cli/ember-cli/pull/10388) [CLEANUP] Drop support for Node v16 [@Shishouille](https://github.com/Shishouille)
- [#10345](https://github.com/ember-cli/ember-cli/pull/10345) [BUGFIX beta] App blueprint may not have explicit-any in ember-data types [@NullVoxPopuli](https://github.com/NullVoxPopuli)
- [#10351](https://github.com/ember-cli/ember-cli/pull/10351) [ENHANCEMENT] Remove `ember-lts-4.4` scenario from `addon` blueprint [@bertdeblock](https://github.com/bertdeblock)
- [#10352](https://github.com/ember-cli/ember-cli/pull/10352) [ENHANCEMENT] Add official support for Node.js v20 [@bertdeblock](https://github.com/bertdeblock)
- [#10353](https://github.com/ember-cli/ember-cli/pull/10353) [ENHANCEMENT] Remove all telemetry [@bertdeblock](https://github.com/bertdeblock)
- [#10354](https://github.com/ember-cli/ember-cli/pull/10354) [INTERNAL] Remove `@babel/core` as a dependency [@bertdeblock](https://github.com/bertdeblock)
- [#10368](https://github.com/ember-cli/ember-cli/pull/10368) [ENHANCEMENT] Streamline package-manager CLI options [@bertdeblock](https://github.com/bertdeblock)

Thank you to all who took the time to contribute!

## v5.3.0

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v5.2.0...v5.3.0)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v5.2.0...v5.3.0)

#### Changelog

- [#10346](https://github.com/ember-cli/ember-cli/pull/10346) [BUGFIX release] App blueprint may not have explicit-any in ember-data types  [@NullVoxPopuli](https://github.com/NullVoxPopuli)
- [#10349](https://github.com/ember-cli/ember-cli/pull/10349) [BUGFIX release] Add `@babel/core` to `app` and `addon` blueprints [@bertdeblock](https://github.com/bertdeblock)
- [#10162](https://github.com/ember-cli/ember-cli/pull/10162) [ENHANCEMENT] Deprecate `outputPaths` build option [@bertdeblock](https://github.com/bertdeblock)
- [#10187](https://github.com/ember-cli/ember-cli/pull/10187) [ENHANCEMENT] Remove Node version checking [@bertdeblock](https://github.com/bertdeblock)
- [#10249](https://github.com/ember-cli/ember-cli/pull/10249) Serve app on root url without trailing slash [@mmun](https://github.com/mmun)
- [#10311](https://github.com/ember-cli/ember-cli/pull/10311) [ENHANCEMENT] Add v4.12 LTS scenario to `addon` blueprint [@bertdeblock](https://github.com/bertdeblock)
- [#10316](https://github.com/ember-cli/ember-cli/pull/10316) [BUGFIX] Remove `auto` as a possible value for `locationType` in `config` declaration [@bertdeblock](https://github.com/bertdeblock)
- [#10319](https://github.com/ember-cli/ember-cli/pull/10319) Use pnpm-action from org [@NullVoxPopuli](https://github.com/NullVoxPopuli)
- [#10331](https://github.com/ember-cli/ember-cli/pull/10331) [ENHANCEMENT] Exclude `@ember/string` from `addon` blueprint [@bertdeblock](https://github.com/bertdeblock)
- [#10335](https://github.com/ember-cli/ember-cli/pull/10335) Update ci.yml to trigger on merge queue [@locks](https://github.com/locks)
- [#10337](https://github.com/ember-cli/ember-cli/pull/10337) remove EMBER_CLI_PNPM [@NullVoxPopuli](https://github.com/NullVoxPopuli)
- [#10338](https://github.com/ember-cli/ember-cli/pull/10338) [INTERNAL] Remove `PNPM` experiment from CI matrix [@bertdeblock](https://github.com/bertdeblock)
- [#10341](https://github.com/ember-cli/ember-cli/pull/10341) [ENHANCEMENT] Remove reference to `ember-mocha` in `app` blueprint [@bertdeblock](https://github.com/bertdeblock)
- [#8578](https://github.com/ember-cli/ember-cli/pull/8578) By default make ember test to pick ports automatically [@SparshithNR](https://github.com/SparshithNR)

Thank you to all who took the time to contribute!

## v5.2.1

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v5.2.0...v5.2.1)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v5.2.0...v5.2.1)

#### Changelog

- [#10346](https://github.com/ember-cli/ember-cli/pull/10346) [BUGFIX release] App blueprint may not have explicit-any in ember-data types  [@NullVoxPopuli](https://github.com/NullVoxPopuli)
- [#10349](https://github.com/ember-cli/ember-cli/pull/10349) [BUGFIX release] Add `@babel/core` to `app` and `addon` blueprints [@bertdeblock](https://github.com/bertdeblock)

Thank you to all who took the time to contribute!

## v5.2.0

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v5.1.0...v5.2.0)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v5.1.0...v5.2.0)

#### Changelog

- [#10283](https://github.com/ember-cli/ember-cli/pull/10283) Refactor `--typescript` support in blueprints [@simonihmig](https://github.com/simonihmig)

Thank you to all who took the time to contribute!

## v5.1.0

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v5.0.0...v5.1.0)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v5.0.0...v5.1.0)

#### Changelog

- [#10300](https://github.com/ember-cli/ember-cli/pull/10300) [BUGFIX] Do not try to wire up Testem unless a test framework is detected [@NullVoxPopuli](https://github.com/NullVoxPopuli)
- [#10256](https://github.com/ember-cli/ember-cli/pull/10256) [ENHANCEMENT] Align `hbs` templates generated by `app` blueprint with Prettier defaults [@jelhan](https://github.com/jelhan)
- [#10276](https://github.com/ember-cli/ember-cli/pull/10276) [BUGFIX] Widen peer dependency range for ember-source [@jrjohnson](https://github.com/jrjohnson)
- [#10279](https://github.com/ember-cli/ember-cli/pull/10279) Updated ember-welcome-page to v7.0.2 [@ijlee2](https://github.com/ijlee2)
- [#10287](https://github.com/ember-cli/ember-cli/pull/10287) Implementation of RFC 907 - pnpm support [@NullVoxPopuli](https://github.com/NullVoxPopuli)

Thank you to all who took the time to contribute!

## v5.0.0

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v4.12.1...v5.0.0)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v4.12.1...v5.0.0)

#### Changelog

- [#10244](https://github.com/ember-cli/ember-cli/pull/10244) Update ember-cli-preprocess-registry and add ember-cli-clean-css to the blueprints [@kategengler](https://github.com/kategengler)
- [#10276](https://github.com/ember-cli/ember-cli/pull/10276) Widen peer dependency range for ember-source [@jrjohnson](https://github.com/jrjohnson)
- [#10019](https://github.com/ember-cli/ember-cli/pull/10019) [CLEANUP] Drop support for the `baseURL` environment option [@bertdeblock](https://github.com/bertdeblock)
- [#10106](https://github.com/ember-cli/ember-cli/pull/10106) [CLEANUP] Remove deprecated `PACKAGER` experiment [@bertdeblock](https://github.com/bertdeblock)
- [#10175](https://github.com/ember-cli/ember-cli/pull/10175) [CLEANUP] Clean up `blacklist-whitelist-build-options` deprecation [@bertdeblock](https://github.com/bertdeblock)
- [#10176](https://github.com/ember-cli/ember-cli/pull/10176) [CLEANUP] Clean up `vendor-shim-blueprint` deprecation [@bertdeblock](https://github.com/bertdeblock)
- [#10177](https://github.com/ember-cli/ember-cli/pull/10177) [CLEANUP] Clean up `ember-cli-jshint-support` deprecation [@bertdeblock](https://github.com/bertdeblock)
- [#10178](https://github.com/ember-cli/ember-cli/pull/10178) [CLEANUP] Remove all Bower entries from ignore files in `app` and `addon` blueprints [@bertdeblock](https://github.com/bertdeblock)
- [#10182](https://github.com/ember-cli/ember-cli/pull/10182) [CLEANUP] Clean up `project.bower-dependencies` deprecation [@bertdeblock](https://github.com/bertdeblock)
- [#10183](https://github.com/ember-cli/ember-cli/pull/10183) [CLEANUP] Clean up `project.bower-directory` deprecation [@bertdeblock](https://github.com/bertdeblock)
- [#10184](https://github.com/ember-cli/ember-cli/pull/10184) [CLEANUP] Clean up `blueprint.add-bower-package-to-project` and `blueprint.add-bower-packages-to-project` deprecations [@bertdeblock](https://github.com/bertdeblock)
- [#10185](https://github.com/ember-cli/ember-cli/pull/10185) [CLEANUP] Drop support for the `EMBER_CLI_ERROR_ON_INVALID_ADDON` env flag [@bertdeblock](https://github.com/bertdeblock)
- [#10186](https://github.com/ember-cli/ember-cli/pull/10186) [CLEANUP] Drop support for installing Bower packages [@bertdeblock](https://github.com/bertdeblock)
- [#10193](https://github.com/ember-cli/ember-cli/pull/10193) [CLEANUP] Drop support for `ember-cli-babel` v5 and v6 [@bertdeblock](https://github.com/bertdeblock)
- [#10194](https://github.com/ember-cli/ember-cli/pull/10194) [CLEANUP] Drop support for `ember-cli-shims` [@bertdeblock](https://github.com/bertdeblock)
- [#10195](https://github.com/ember-cli/ember-cli/pull/10195) [CLEANUP] Remove automatic inclusion of jQuery in legacy Ember versions [@bertdeblock](https://github.com/bertdeblock)
- [#10196](https://github.com/ember-cli/ember-cli/pull/10196) [INTERNAL] Remove unused private `_legacyAddonCompile` method on `EmberApp` class [@bertdeblock](https://github.com/bertdeblock)
- [#10197](https://github.com/ember-cli/ember-cli/pull/10197) [CLEANUP] Remove default `minifyJS` options [@bertdeblock](https://github.com/bertdeblock)
- [#10211](https://github.com/ember-cli/ember-cli/pull/10211) Automate output repos [@NullVoxPopuli](https://github.com/NullVoxPopuli)
- [#10217](https://github.com/ember-cli/ember-cli/pull/10217) [CLEANUP] Remove `ember-resolver` fallback [@bertdeblock](https://github.com/bertdeblock)
- [#10218](https://github.com/ember-cli/ember-cli/pull/10218) [CLEANUP] Drop support for including `handlebars.js` via Bower [@bertdeblock](https://github.com/bertdeblock)
- [#10219](https://github.com/ember-cli/ember-cli/pull/10219) [CLEANUP] Drop support for npm versions below v5.7.1 [@bertdeblock](https://github.com/bertdeblock)
- [#10220](https://github.com/ember-cli/ember-cli/pull/10220) [CLEANUP] Drop support for including Ember builds via Bower [@bertdeblock](https://github.com/bertdeblock)
- [#10221](https://github.com/ember-cli/ember-cli/pull/10221) [CLEANUP] Clean up `building-bower-packages` deprecation [@bertdeblock](https://github.com/bertdeblock)
- [#10222](https://github.com/ember-cli/ember-cli/pull/10222) [CLEANUP] Drop support for Node v14 [@bertdeblock](https://github.com/bertdeblock)
- [#10223](https://github.com/ember-cli/ember-cli/pull/10223) [CLEANUP] Drop support for finding addons by their `index.js` name [@bertdeblock](https://github.com/bertdeblock)
- [#10224](https://github.com/ember-cli/ember-cli/pull/10224) [CLEANUP] Drop support for checking if Bower components are installed [@bertdeblock](https://github.com/bertdeblock)
- [#10225](https://github.com/ember-cli/ember-cli/pull/10225) [CLEANUP] Drop support for the `EMBER_CLI_IGNORE_ADDON_NAME_MISMATCH` env flag [@bertdeblock](https://github.com/bertdeblock)
- [#10226](https://github.com/ember-cli/ember-cli/pull/10226) [INTERNAL] Remove all remaining Bower references [@bertdeblock](https://github.com/bertdeblock)
- [#10227](https://github.com/ember-cli/ember-cli/pull/10227) [INTERNAL] Remove JSHint reference [@bertdeblock](https://github.com/bertdeblock)
- [#10229](https://github.com/ember-cli/ember-cli/pull/10229) Update blueprint ignore files [@bertdeblock](https://github.com/bertdeblock)
- [#10231](https://github.com/ember-cli/ember-cli/pull/10231) [INTERNAL] Remove npm version check in `ember new` test [@bertdeblock](https://github.com/bertdeblock)
- [#10232](https://github.com/ember-cli/ember-cli/pull/10232) [CLEANUP] Remove Babel fallback for addons [@bertdeblock](https://github.com/bertdeblock)
- [#10245](https://github.com/ember-cli/ember-cli/pull/10245) change guarding condition for output repos [@NullVoxPopuli](https://github.com/NullVoxPopuli)

Thank you to all who took the time to contribute!

## v4.12.3

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v4.12.2...v4.12.3)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v4.12.2...v4.12.3)

#### Changelog

- [#10458](https://github.com/ember-cli/ember-cli/pull/10458) Use Lodash's `_.template` instead of `lodash.template` package [@gorner](https://github.com/gorner)

Thank you to all who took the time to contribute!

## v4.12.2

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v4.12.1...v4.12.2)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v4.12.1...v4.12.2)

#### Changelog

- [#10314](https://github.com/ember-cli/ember-cli/pull/10314) [BUGFIX] Do not try to wire up Testem unless a test framework is dete… [@NullVoxPopuli](https://github.com/NullVoxPopuli)

Thank you to all who took the time to contribute!

## v4.12.1

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v4.12.0...v4.12.1)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v4.12.0...v4.12.1)

#### Changelog

- [#10251](https://github.com/ember-cli/ember-cli/pull/10251) [BUGFIX release] Remove `stylelint-config-prettier` from `app` blueprint [@bertdeblock](https://github.com/bertdeblock)

Thank you to all who took the time to contribute!

## v4.12.0

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v4.11.0...v4.12.0)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v4.11.0...v4.12.0)

#### Changelog

- [#10039](https://github.com/ember-cli/ember-cli/pull/10039) [CLEANUP] Remove unused test fixtures [@bertdeblock](https://github.com/bertdeblock)
- [#10040](https://github.com/ember-cli/ember-cli/pull/10040) [CLEANUP] Remove MU-related debug code [@bertdeblock](https://github.com/bertdeblock)
- [#10091](https://github.com/ember-cli/ember-cli/pull/10091) [BUGFIX] Fix looking up the default blueprint for scoped addons [@GendelfLugansk](https://github.com/GendelfLugansk)
- [#10107](https://github.com/ember-cli/ember-cli/pull/10107) [INTERNAL] Remove old `uninstall:npm` command [@bertdeblock](https://github.com/bertdeblock)
- [#10122](https://github.com/ember-cli/ember-cli/pull/10122) [ENHANCEMENT] Add Stylelint setup to `app` and `addon` blueprints [RFC 814] [@bmish](https://github.com/bmish)
- [#10142](https://github.com/ember-cli/ember-cli/pull/10142) [ENHANCEMENT] Update ESLint to v8 in `app` and `addon` blueprints [@bertdeblock](https://github.com/bertdeblock)
- [#10157](https://github.com/ember-cli/ember-cli/pull/10157) [ENHANCEMENT] Exclude `ember-cli-terser` when generating apps using the `--embroider` option [@bertdeblock](https://github.com/bertdeblock)
- [#10159](https://github.com/ember-cli/ember-cli/pull/10159) [ENHANCEMENT] Exclude `ember-cli-sri` when generating apps using the `--embroider` option [@bertdeblock](https://github.com/bertdeblock)
- [#10161](https://github.com/ember-cli/ember-cli/pull/10161) [ENHANCEMENT] Remove NPM version checking [@bertdeblock](https://github.com/bertdeblock)
- [#10166](https://github.com/ember-cli/ember-cli/pull/10166) [INTERNAL] Remove unused dependencies [@bertdeblock](https://github.com/bertdeblock)
- [#10169](https://github.com/ember-cli/ember-cli/pull/10169) [ENHANCEMENT] Remove `app.import` comment in `app` blueprint [@bertdeblock](https://github.com/bertdeblock)
- [#10172](https://github.com/ember-cli/ember-cli/pull/10172) [PERFORMANCE] Lazy require heavier packages [@bertdeblock](https://github.com/bertdeblock)
- [#10173](https://github.com/ember-cli/ember-cli/pull/10173) [ENHANCEMENT] Don't delete the newly-generated app directory when an error occurs [@ef4](https://github.com/ef4)
- [#10174](https://github.com/ember-cli/ember-cli/pull/10174) [INTERNAL] Clean up removal of `bower.json` and `package.json` files in `addon` blueprint [@bertdeblock](https://github.com/bertdeblock)
- [#10180](https://github.com/ember-cli/ember-cli/pull/10180) [ENHANCEMENT] Update `ember-welcome-page` to v7 in `app` blueprint [@ijlee2](https://github.com/ijlee2)
- [#10188](https://github.com/ember-cli/ember-cli/pull/10188) [ENHANCEMENT] Update ESLint parser `ecmaVersion` to `latest` in `app` blueprint [@elwayman02](https://github.com/elwayman02)
- [#10189](https://github.com/ember-cli/ember-cli/pull/10189) [ENHANCEMENT] Add v4.8 LTS to `addon` blueprint - Remove v3.28 LTS and `ember-classic` scenario [@bertdeblock](https://github.com/bertdeblock)
- [#10192](https://github.com/ember-cli/ember-cli/pull/10192) [BUGFIX] The `addon` command should throw when no addon name is provided [@bertdeblock](https://github.com/bertdeblock)
- [#10198](https://github.com/ember-cli/ember-cli/pull/10198) [INTERNAL] Output TypeScript apps and addons for StackBlitz [@NullVoxPopuli](https://github.com/NullVoxPopuli)

Thank you to all who took the time to contribute!

## v4.11.0

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v4.10.0...v4.11.0)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v4.10.0...v4.11.0)

#### Changelog

- [#10103](https://github.com/ember-cli/ember-cli/pull/10103) Update `markdown-it-terminal` to v0.4.0 (resolve `markdown-it` vulnerability) [@bertdeblock](https://github.com/bertdeblock)
- [#10109](https://github.com/ember-cli/ember-cli/pull/10109) [RFC 811] Add `ember-modifier` dependency to app blueprint [@SergeAstapov](https://github.com/SergeAstapov)
- [#10110](https://github.com/ember-cli/ember-cli/pull/10110) [RFC 812] Add `tracked-built-ins` dependency to app blueprint [@SergeAstapov](https://github.com/SergeAstapov)

Thank you to all who took the time to contribute!

## v4.10.0

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v4.9.2...v4.10.0)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v4.9.2...v4.10.0)

#### Changelog

- [#10048](https://github.com/ember-cli/ember-cli/pull/10048) Make addAddonsToProject support creating a new project with custom target directory [@simonihmig](https://github.com/simonihmig)
- [#10054](https://github.com/ember-cli/ember-cli/pull/10054) [ENHANCEMENT] Conditionally apply ESLint parser options in `app` and `addon` blueprints [@Windvis](https://github.com/Windvis)
- [#10060](https://github.com/ember-cli/ember-cli/pull/10060) [ENHANCEMENT] Replace `eslint-plugin-node` with `eslint-plugin-n` in blueprints [@Windvis](https://github.com/Windvis)
- [#10062](https://github.com/ember-cli/ember-cli/pull/10062) [ENHANCEMENT] Update Prettier config in blueprints to only use single quotes for `.js` and `.ts` files [@Windvis](https://github.com/Windvis)
- [#10132](https://github.com/ember-cli/ember-cli/pull/10132) Add @ember/string as a dependency of projects [@kategengler](https://github.com/kategengler)

Thank you to all who took the time to contribute!

## v4.9.2

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v4.9.1...v4.9.2)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v4.9.1...v4.9.2)

#### Changelog

- [#10108](https://github.com/ember-cli/ember-cli/pull/10108) [BUGFIX release] Correctly instantiate server watcher [@bertdeblock](https://github.com/bertdeblock)

## v4.9.1

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v4.9.0...v4.9.1)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v4.9.0...v4.9.1)

#### Changelog

- [#10101](https://github.com/ember-cli/ember-cli/pull/10101) [BUGFIX release] Correctly instantiate `Watcher` instance when running `ember test --serve` [@bertdeblock](https://github.com/bertdeblock)

Thank you to all who took the time to contribute!

## v4.9.0

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v4.8.0...v4.9.0)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v4.8.0...v4.9.0)

#### Changelog

- [#10015](https://github.com/ember-cli/ember-cli/pull/10015) Update `glob` to v8 [@bertdeblock](https://github.com/bertdeblock)
- [#10016](https://github.com/ember-cli/ember-cli/pull/10016) Fix indentation in `.ember-cli` file in `app` blueprint [@bertdeblock](https://github.com/bertdeblock)
- [#10017](https://github.com/ember-cli/ember-cli/pull/10017) [ENHANCEMENT] Disable prototype extensions by default in `app` blueprint [@bertdeblock](https://github.com/bertdeblock)
- [#10018](https://github.com/ember-cli/ember-cli/pull/10018) Trap unhandled failures [@ef4](https://github.com/ef4)
- [#10020](https://github.com/ember-cli/ember-cli/pull/10020) [INTERNAL] Fix typos in `serve` command test [@bertdeblock](https://github.com/bertdeblock)
- [#10021](https://github.com/ember-cli/ember-cli/pull/10021) [CLEANUP] Drop support for using `usePods: true` and the `--pod` flag simultaneously [@bertdeblock](https://github.com/bertdeblock)
- [#10022](https://github.com/ember-cli/ember-cli/pull/10022) [ENHANCEMENT] Use `concurrently` instead of `npm-run-all` in `app` blueprint [@bertdeblock](https://github.com/bertdeblock)
- [#10024](https://github.com/ember-cli/ember-cli/pull/10024) [ENHANCEMENT] Add `ember-source` to `peerDependencies` in `addon` blueprint [@bertdeblock](https://github.com/bertdeblock)
- [#10025](https://github.com/ember-cli/ember-cli/pull/10025) [ENHANCEMENT] Update NPM version constraints [@bertdeblock](https://github.com/bertdeblock)
- [#10026](https://github.com/ember-cli/ember-cli/pull/10026) [ENHANCEMENT] Display info message when running the `lint:fix` script post blueprint generation [@bertdeblock](https://github.com/bertdeblock)
- [#10038](https://github.com/ember-cli/ember-cli/pull/10038) Update `filesize` to v10 [@bertdeblock](https://github.com/bertdeblock)
- [#10041](https://github.com/ember-cli/ember-cli/pull/10041) [INTERNAL] Remove end year from copyright notice [@bertdeblock](https://github.com/bertdeblock)
- [#10049](https://github.com/ember-cli/ember-cli/pull/10049) [ENHANCEMENT] Remove the `config/environment.js` file from the `addon` blueprint [@bertdeblock](https://github.com/bertdeblock)
- [#10050](https://github.com/ember-cli/ember-cli/pull/10050) [ENHANCEMENT] Remove `vendor` folder from `app` blueprint [@bertdeblock](https://github.com/bertdeblock)
- [#10051](https://github.com/ember-cli/ember-cli/pull/10051) [ENHANCEMENT] Move `ember-try.js` config file to `tests/dummy/config/ember-try.js` for addons [@bertdeblock](https://github.com/bertdeblock)
- [#10053](https://github.com/ember-cli/ember-cli/pull/10053) Add support for node ESM addons [@hjdivad](https://github.com/hjdivad)
- [#9824](https://github.com/ember-cli/ember-cli/pull/9824) [RFC 638] Interactive way to create new Ember apps and addons [@bertdeblock](https://github.com/bertdeblock)
- [#9972](https://github.com/ember-cli/ember-cli/pull/9972) [ENHANCEMENT] Add support for `--typescript` flag to `app` and `addon` blueprints [@simonihmig](https://github.com/simonihmig)

Thank you to all who took the time to contribute!

## v4.8.0

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v4.7.0...v4.8.0)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v4.7.0...v4.8.0)

#### Changelog

- [#10014](https://github.com/ember-cli/ember-cli/pull/10014) [BUGFIX release] Make sure newly installed addons are discovered when running `ember install` [@bertdeblock](https://github.com/bertdeblock)
- [#9920](https://github.com/ember-cli/ember-cli/pull/9920) [BUGFIX] Make sure a blueprint’s options object and project instance are always available for all public hooks [@bertdeblock](https://github.com/bertdeblock)
- [#9945](https://github.com/ember-cli/ember-cli/pull/9945) [ENHANCEMENT/BREAKING] Add Node v18 to `engines` in `app` and `addon` blueprint (removes support for Node v17) [@bertdeblock](https://github.com/bertdeblock)
- [#9946](https://github.com/ember-cli/ember-cli/pull/9946) [INTERNAL] Unskip `package-info-cache` tests [@bertdeblock](https://github.com/bertdeblock)
- [#9951](https://github.com/ember-cli/ember-cli/pull/9951) Update `js-yaml` to v4 [@bertdeblock](https://github.com/bertdeblock)
- [#9952](https://github.com/ember-cli/ember-cli/pull/9952) Update `walk-sync` to v3 [@bertdeblock](https://github.com/bertdeblock)
- [#9971](https://github.com/ember-cli/ember-cli/pull/9971) Add Ember 4.4 LTS to addon blueprint, remove 3.24 [@simonihmig](https://github.com/simonihmig)
- [#9975](https://github.com/ember-cli/ember-cli/pull/9975) [ENHANCEMENT] Fix `prefer-const` lint violations in `app` and `addon` blueprints [@bmish](https://github.com/bmish)
- [#9987](https://github.com/ember-cli/ember-cli/pull/9987) [BUGFIX] Handle rebuild failures without exiting [@bendemboski](https://github.com/bendemboski)
- [#9988](https://github.com/ember-cli/ember-cli/pull/9988) [BUGFIX] - Address npm-run-all and Yarn 3 conflict & Removed warning [@christianarty](https://github.com/christianarty)

Thank you to all who took the time to contribute!

## v4.7.0

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v4.6.0...v4.7.0)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v4.6.0...v4.7.0)

#### Changelog

- [#10009](https://github.com/ember-cli/ember-cli/pull/10009) [BUGFIX] Handle rebuild failures without exiting [@bendemboski](https://github.com/bendemboski)

Thank you to all who took the time to contribute!

## v4.6.0

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v4.5.0...v4.6.0)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v4.5.0...v4.6.0)

#### Changelog

- [#9890](https://github.com/ember-cli/ember-cli/pull/9890) Make sure addons are discovered only once [@wagenet](https://github.com/wagenet)
- [#9770](https://github.com/ember-cli/ember-cli/pull/9770) Include the addon’s name in the warning when a core command is overridden [@davecombs](https://github.com/davecombs)
- [#9863](https://github.com/ember-cli/ember-cli/pull/9863) [INTERNAL] Add `.prettierignore` file to Ember CLI repo [@bertdeblock](https://github.com/bertdeblock)
- [#9872](https://github.com/ember-cli/ember-cli/pull/9872) [INTERNAL] Use native classes for tasks in test suite [@bertdeblock](https://github.com/bertdeblock)
- [#9885](https://github.com/ember-cli/ember-cli/pull/9885) [CLEANUP] Remove `ie 11` from default targets [@bertdeblock](https://github.com/bertdeblock)
- [#9898](https://github.com/ember-cli/ember-cli/pull/9898) Remove deprecated `addonJsFiles` method on `addon` model [@bertdeblock](https://github.com/bertdeblock)
- [#9899](https://github.com/ember-cli/ember-cli/pull/9899) Remove deprecated internal `silent` error [@bertdeblock](https://github.com/bertdeblock)
- [#9900](https://github.com/ember-cli/ember-cli/pull/9900) Remove unused CLI error class [@bertdeblock](https://github.com/bertdeblock)
- [#9902](https://github.com/ember-cli/ember-cli/pull/9902) Remove support for `ember-cli-inject-live-reload` < v1.10.0 [@bertdeblock](https://github.com/bertdeblock)
- [#9903](https://github.com/ember-cli/ember-cli/pull/9903) Deprecate `vendor-shim` blueprint [@bertdeblock](https://github.com/bertdeblock)
- [#9904](https://github.com/ember-cli/ember-cli/pull/9904) Update Node compatibility warning [@bertdeblock](https://github.com/bertdeblock)
- [#9906](https://github.com/ember-cli/ember-cli/pull/9906) Drop support for Node v12 [@bertdeblock](https://github.com/bertdeblock)
- [#9907](https://github.com/ember-cli/ember-cli/pull/9907) Remove ESLint config file from `server` blueprint [@bertdeblock](https://github.com/bertdeblock)
- [#9908](https://github.com/ember-cli/ember-cli/pull/9908) Remove support for finding an addon by its unscoped name [@bertdeblock](https://github.com/bertdeblock)
- [#9909](https://github.com/ember-cli/ember-cli/pull/9909) Deprecate support for `ember-cli-jshint` [@bertdeblock](https://github.com/bertdeblock)
- [#9917](https://github.com/ember-cli/ember-cli/pull/9917) update beta deps [@kellyselden](https://github.com/kellyselden)
- [#9919](https://github.com/ember-cli/ember-cli/pull/9919) Clean up `ember-addon` object in package file when destroying an in-repo addon [@bertdeblock](https://github.com/bertdeblock)
- [#9935](https://github.com/ember-cli/ember-cli/pull/9935) Update dev changelog script [@kellyselden](https://github.com/kellyselden)
- [#9938](https://github.com/ember-cli/ember-cli/pull/9938) [INTERNAL] Fix internal `sequence` util [@bertdeblock](https://github.com/bertdeblock)
- [#9939](https://github.com/ember-cli/ember-cli/pull/9939) Update `fs-extra` to v10 [@bertdeblock](https://github.com/bertdeblock)
- [#9937](https://github.com/ember-cli/ember-cli/pull/9937) [INTERNAL] Remove old `deprecate` utility [@bertdeblock](https://github.com/bertdeblock)
- [#9941](https://github.com/ember-cli/ember-cli/pull/9941) Update `filesize` to v9 [@bertdeblock](https://github.com/bertdeblock)
- [#9942](https://github.com/ember-cli/ember-cli/pull/9942) Update `isbinaryfile` to v5 [@bertdeblock](https://github.com/bertdeblock)
- [#9944](https://github.com/ember-cli/ember-cli/pull/9944) Add support for Node v18 [@ddzz](https://github.com/ddzz)
- [#9947](https://github.com/ember-cli/ember-cli/pull/9947) [DOC] Update EOL date for Node v16 in `Node Support` doc [@bertdeblock](https://github.com/bertdeblock)
- [#9953](https://github.com/ember-cli/ember-cli/pull/9953) Update `resolve-package-path` to v4 [@bertdeblock](https://github.com/bertdeblock)
- [#9954](https://github.com/ember-cli/ember-cli/pull/9954) Update `jsdom` to v20 [@bertdeblock](https://github.com/bertdeblock)
- [#9969](https://github.com/ember-cli/ember-cli/pull/9969) update ember source beta [@kellyselden](https://github.com/kellyselden)

Thank you to all who took the time to contribute!

## v4.5.0

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v4.4.0...v4.5.0)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v4.4.0...v4.5.0)

#### Changelog

- [#9760](https://github.com/ember-cli/ember-cli/pull/9760) Add `timeout-minutes` to GitHub CI jobs in `app` and `addon` blueprints [@mansona](https://github.com/mansona)
- [#9777](https://github.com/ember-cli/ember-cli/pull/9777) [DOC] Add bower note [@jenweber](https://github.com/jenweber)
- [#9778](https://github.com/ember-cli/ember-cli/pull/9778) Prune lodash dependencies [@locks](https://github.com/locks)
- [#9785](https://github.com/ember-cli/ember-cli/pull/9785) Generate correct directory name in `README.md` and `CONTRIBUTING.md` files [@bertdeblock](https://github.com/bertdeblock)
- [#9805](https://github.com/ember-cli/ember-cli/pull/9805) Add Node v16 to `Node Support` docs [@bertdeblock](https://github.com/bertdeblock)
- [#9823](https://github.com/ember-cli/ember-cli/pull/9823) [RFC 801] Deprecate `blacklist` and `whitelist` build options [@bertdeblock](https://github.com/bertdeblock)
- [#9825](https://github.com/ember-cli/ember-cli/pull/9825) Remove `ember-export-application-global` addon from `app` blueprint [@bertdeblock](https://github.com/bertdeblock)
- [#9848](https://github.com/ember-cli/ember-cli/pull/9848) Update `ember-cli-dependency-checker` to v3.3.1 [@gnclmorais](https://github.com/gnclmorais)
- [#9857](https://github.com/ember-cli/ember-cli/pull/9857) Use `createBuilder` instead of deprecated `buildOutput` in test suite [@geneukum](https://github.com/geneukum)
- [#9858](https://github.com/ember-cli/ember-cli/pull/9858) Remove `EXTEND_PROTOTYPES` object in the app's `config/environment.js` file [@bertdeblock](https://github.com/bertdeblock)
- [#9859](https://github.com/ember-cli/ember-cli/pull/9859) Update `git.io` URLs [@bertdeblock](https://github.com/bertdeblock)
- [#9860](https://github.com/ember-cli/ember-cli/pull/9860) Add inline comment RE: `runningTests` variable [@bertdeblock](https://github.com/bertdeblock)
- [#9886](https://github.com/ember-cli/ember-cli/pull/9886) Remove deletion of `@ember/jquery` in addon blueprint [@bertdeblock](https://github.com/bertdeblock)
- [#9906](https://github.com/ember-cli/ember-cli/pull/9906) Drop support for Node v12 [@bertdeblock](https://github.com/bertdeblock)
- [#9909](https://github.com/ember-cli/ember-cli/pull/9909) Deprecate support for `ember-cli-jshint` [@bertdeblock](https://github.com/bertdeblock)
- [#9914](https://github.com/ember-cli/ember-cli/pull/9914) Temporarily skip failing ember new test for npm versions <= v6.0.0 [@bertdeblock](https://github.com/bertdeblock)
- [#9770](https://github.com/ember-cli/ember-cli/pull/9770) Include the addon’s name in the warning when a core command is overridden [@davecombs](https://github.com/davecombs)
- [#9890](https://github.com/ember-cli/ember-cli/pull/9890) Make sure addons are discovered only once [@wagenet](https://github.com/wagenet)
- [#9898](https://github.com/ember-cli/ember-cli/pull/9898) Remove deprecated `addonJsFiles` method on `addon` model [@bertdeblock](https://github.com/bertdeblock)
- [#9900](https://github.com/ember-cli/ember-cli/pull/9900) Remove unused CLI error class [@bertdeblock](https://github.com/bertdeblock)
- [#9917](https://github.com/ember-cli/ember-cli/pull/9917) update beta deps [@kellyselden](https://github.com/kellyselden)
- [#9919](https://github.com/ember-cli/ember-cli/pull/9919) Clean up `ember-addon` object in package file when destroying an in-repo addon [@bertdeblock](https://github.com/bertdeblock)

Thank you to all who took the time to contribute!

## v4.4.0

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v4.3.0...v4.4.0)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v4.3.0...v4.4.0)

#### Changelog

- [#9611](https://github.com/ember-cli/ember-cli/pull/9611) use more standard markdown for addon readme [@mansona](https://github.com/mansona)
- [#9818](https://github.com/ember-cli/ember-cli/pull/9818) Update actions/checkout action to v3 [@SergeAstapov](https://github.com/SergeAstapov)
- [#9819](https://github.com/ember-cli/ember-cli/pull/9819) Update actions/setup-node action to v3 [@SergeAstapov](https://github.com/SergeAstapov)
- [#9822](https://github.com/ember-cli/ember-cli/pull/9822) Update `since.available` and `since.enabled` versions for Bower deprecations [@bertdeblock](https://github.com/bertdeblock)
- [#9850](https://github.com/ember-cli/ember-cli/pull/9850) Fix contents of addon `.gitignore` file [@bertdeblock](https://github.com/bertdeblock)

Thank you to all who took the time to contribute!

## v4.3.0

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v4.2.0...v4.3.0)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v4.2.0...v4.3.0)

#### Changelog

- [#9707](https://github.com/ember-cli/ember-cli/pull/9707) [RFC 772] Deprecate Bower support [@bertdeblock](https://github.com/bertdeblock)
- [#9387](https://github.com/ember-cli/ember-cli/pull/9387) Add support for specifying a path for the generate command [@NullVoxPopuli](https://github.com/NullVoxPopuli)
- [#9638](https://github.com/ember-cli/ember-cli/pull/9638) Update ember-cli's own dependencies to latest [@rwjblue](https://github.com/rwjblue)
- [#9680](https://github.com/ember-cli/ember-cli/pull/9680) Ignore default folder name used by broccoli-debug [@notmessenger](https://github.com/notmessenger)
- [#9683](https://github.com/ember-cli/ember-cli/pull/9683) chore: replace json-stable-stringify with safe-stable-stringify [@BridgeAR](https://github.com/BridgeAR)
- [#9769](https://github.com/ember-cli/ember-cli/pull/9769) Update markdown-it to v12.3.2 to address vulnerabiliity [@locks](https://github.com/locks)
- [#9781](https://github.com/ember-cli/ember-cli/pull/9781) [ENHANCEMENT] Remove `X-UA-Compatible` meta tag for IE browser [@bobisjan](https://github.com/bobisjan)
- [#9790](https://github.com/ember-cli/ember-cli/pull/9790) Upgrade broccoli-merge-trees [@locks](https://github.com/locks)
- [#9803](https://github.com/ember-cli/ember-cli/pull/9803) [RFC 637] Customizable test setups [@bertdeblock](https://github.com/bertdeblock)
- [#9804](https://github.com/ember-cli/ember-cli/pull/9804) Fix formatting of CI file in app and addon blueprints [@bertdeblock](https://github.com/bertdeblock)
- [#9817](https://github.com/ember-cli/ember-cli/pull/9817) update beta deps [@kellyselden](https://github.com/kellyselden)
- [#9830](https://github.com/ember-cli/ember-cli/pull/9830) update deps before release [@kellyselden](https://github.com/kellyselden)

Thank you to all who took the time to contribute!

## v4.2.0

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v4.1.1...v4.2.0)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v4.1.1...v4.2.0)

#### Changelog

- [#9681](https://github.com/ember-cli/ember-cli/pull/9681) Update URL to Ember CLI website everywhere [@bertdeblock](https://github.com/bertdeblock)
- [#9726](https://github.com/ember-cli/ember-cli/pull/9726) Cancel stale workflows when starting a new one. [@rwjblue](https://github.com/rwjblue)
- [#9731](https://github.com/ember-cli/ember-cli/pull/9731) Add an `assert` and a `deprecate` utility [@bertdeblock](https://github.com/bertdeblock)
- [#9753](https://github.com/ember-cli/ember-cli/pull/9753) Upgrade to `ember-template-lint` v4 in blueprint [@bmish](https://github.com/bmish)

Thank you to all who took the time to contribute!

## v4.1.1

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v4.1.0...v4.1.1)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v4.1.0...v4.1.1)

#### Changelog

- [#9737](https://github.com/ember-cli/ember-cli/pull/9737) Remove jQuery integration scenario from ember-try [@NullVoxPopuli](https://github.com/NullVoxPopuli)
- [#9739](https://github.com/ember-cli/ember-cli/pull/9739) Change blueprint to generate apps using 'history' location [@kategengler](https://github.com/kategengler)
- [#9762](https://github.com/ember-cli/ember-cli/pull/9762) Update @embroider/* packages to 1.0.0. [@rwjblue](https://github.com/rwjblue)

Thank you to all who took the time to contribute!

## v4.1.0

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v4.0.1...v4.1.0)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v4.0.1...v4.1.0)

#### Changelog

- [#9700](https://github.com/ember-cli/ember-cli/pull/9700) [Chore] Update  .npmignore to ignore .github and docs folders [@SergeAstapov](https://github.com/SergeAstapov)
- [#9729](https://github.com/ember-cli/ember-cli/pull/9729) is-language-code@^3.1.0 [@kellyselden](https://github.com/kellyselden)

Thank you to all who took the time to contribute!

## v4.0.1

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v4.0.0...v4.0.1)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v4.0.0...v4.0.1)

#### Changelog

- [#9675](https://github.com/ember-cli/ember-cli/pull/9675) Fix using `pnpm` install inadvertently [@balinterdi](https://github.com/balinterdi)

Thank you to all who took the time to contribute!

## v4.0.0

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v3.28.4...v4.0.0)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v3.28.4...v4.0.0)

#### Changelog

- [#9679](https://github.com/ember-cli/ember-cli/pull/9679) Bump ember-page-title from v6.2.2 to v7.0.0 [@raido](https://github.com/raido)
- [#9694](https://github.com/ember-cli/ember-cli/pull/9694) test in node 16 LTS [@kellyselden](https://github.com/kellyselden)
- [#9696](https://github.com/ember-cli/ember-cli/pull/9696) commands/init: Fix `--yarn` usage [@Turbo87](https://github.com/Turbo87)
- [#9659](https://github.com/ember-cli/ember-cli/pull/9659) Ensure `ember-classic` ember-try scenario uses Ember 3.x [@rwjblue](https://github.com/rwjblue)
- [#9661](https://github.com/ember-cli/ember-cli/pull/9661) Set default CI config blueprints to run all builds [@elwayman02](https://github.com/elwayman02)
- [#9666](https://github.com/ember-cli/ember-cli/pull/9666) Remove IE11 comments from `config/target.js` in app blueprint [@bertdeblock](https://github.com/bertdeblock)
- [#9667](https://github.com/ember-cli/ember-cli/pull/9667) Update eslint-plugin-qunit to v7 in blueprint [@bmish](https://github.com/bmish)
- [#9670](https://github.com/ember-cli/ember-cli/pull/9670) Don't emit an error when the `lint:fix` script fails post blueprint generation [@bertdeblock](https://github.com/bertdeblock)
- [#9574](https://github.com/ember-cli/ember-cli/pull/9574) Update link to Discord in README.md [@MelSumner](https://github.com/MelSumner)
- [#9613](https://github.com/ember-cli/ember-cli/pull/9613) Fix test that started failing with v2.17.0 of qunit [@kategengler](https://github.com/kategengler)
- [#9579](https://github.com/ember-cli/ember-cli/pull/9579) Add `--ci-provider` option to `ember new` and `ember addon` [@snewcomer](https://github.com/snewcomer)
- [#9618](https://github.com/ember-cli/ember-cli/pull/9618) Reload `_packageInfo` as part of `reloadPkg` [@brendenpalmer](https://github.com/brendenpalmer)
- [#9563](https://github.com/ember-cli/ember-cli/pull/9563) Add `pnpm` support to `ember install` command [@Turbo87](https://github.com/Turbo87)
- [#9580](https://github.com/ember-cli/ember-cli/pull/9580) Add `.lint-todo` to prettier ignore [@elwayman02](https://github.com/elwayman02)
- [#9589](https://github.com/ember-cli/ember-cli/pull/9589) Add link to visualizer to perf guide [@mehulkar](https://github.com/mehulkar)
- [#9595](https://github.com/ember-cli/ember-cli/pull/9595) Add support for `addons.exclude` and `addons.include` options [@bertdeblock](https://github.com/bertdeblock)
- [#9623](https://github.com/ember-cli/ember-cli/pull/9623) Update app/addon blueprints to use ember-auto-import@2 [@rwjblue](https://github.com/rwjblue)
- [#9619](https://github.com/ember-cli/ember-cli/pull/9619) Update watch-detector to 1.0.1 [@colenso](https://github.com/colenso)
- [#9605](https://github.com/ember-cli/ember-cli/pull/9605) Properly set `loglevel` flag for npm [@jrvidal](https://github.com/jrvidal)
- [#9609](https://github.com/ember-cli/ember-cli/pull/9609) Ignore additional `ember-try` files for apps and addons [@bertdeblock](https://github.com/bertdeblock)
- [#9644](https://github.com/ember-cli/ember-cli/pull/9644) Default `ember new` and `ember addon` to use GitHub Actions [@rwjblue](https://github.com/rwjblue)

Thank you to all who took the time to contribute!

## v3.28.4

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v3.28.3...v3.28.4)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v3.28.3...v3.28.4)

#### Changelog

- [#9694](https://github.com/ember-cli/ember-cli/pull/9694) test in node 16 LTS [@kellyselden](https://github.com/kellyselden)

Thank you to all who took the time to contribute!

## v3.28.3

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v3.28.2...v3.28.3)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v3.28.2...v3.28.3)

#### Changelog

- [#9670](https://github.com/ember-cli/ember-cli/pull/9670) Don't emit an error when the `lint:fix` script fails post blueprint generation [@bertdeblock](https://github.com/bertdeblock)

Thank you to all who took the time to contribute!

## v3.28.2

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v3.28.1...v3.28.2)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v3.28.1...v3.28.2)

#### Changelog

- [#9659](https://github.com/ember-cli/ember-cli/pull/9659) Ensure `ember-classic` ember-try scenario uses Ember 3.x [@rwjblue](https://github.com/rwjblue)

Thank you to all who took the time to contribute!

## v3.28.1

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v3.28.0...v3.28.1)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v3.28.0...v3.28.1)

#### Changelog

- [#9618](https://github.com/ember-cli/ember-cli/pull/9618) Ensure discovered addons are refreshed after `ember install` (fix usage of default blueprints) [@brendenpalmer](https://github.com/brendenpalmer)

## v4.0.0-beta.1

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v3.28.0...v4.0.0-beta.1)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v3.28.0...v4.0.0-beta.1)

#### Changelog

- [#9574](https://github.com/ember-cli/ember-cli/pull/9574) Update link to Discord in README.md [@MelSumner](https://github.com/MelSumner)
- [#9613](https://github.com/ember-cli/ember-cli/pull/9613) Fix test that started failing with v2.17.0 of qunit [@kategengler](https://github.com/kategengler)
- [#9579](https://github.com/ember-cli/ember-cli/pull/9579) Add `--ci-provider` option to `ember new` and `ember addon` [@snewcomer](https://github.com/snewcomer)
- [#9618](https://github.com/ember-cli/ember-cli/pull/9618) Reload `_packageInfo` as part of `reloadPkg` [@brendenpalmer](https://github.com/brendenpalmer)
- [#9563](https://github.com/ember-cli/ember-cli/pull/9563) Add `pnpm` support to `ember install` command [@Turbo87](https://github.com/Turbo87)
- [#9580](https://github.com/ember-cli/ember-cli/pull/9580) Add `.lint-todo` to prettier ignore [@elwayman02](https://github.com/elwayman02)
- [#9589](https://github.com/ember-cli/ember-cli/pull/9589) Add link to visualizer to perf guide [@mehulkar](https://github.com/mehulkar)
- [#9595](https://github.com/ember-cli/ember-cli/pull/9595) Add support for `addons.exclude` and `addons.include` options [@bertdeblock](https://github.com/bertdeblock)
- [#9623](https://github.com/ember-cli/ember-cli/pull/9623) Update app/addon blueprints to use ember-auto-import@2 [@rwjblue](https://github.com/rwjblue)
- [#9619](https://github.com/ember-cli/ember-cli/pull/9619) Update watch-detector to 1.0.1 [@colenso](https://github.com/colenso)
- [#9627](https://github.com/ember-cli/ember-cli/pull/9627) Update app & addon blueprint dependencies to latest [@rwjblue](https://github.com/rwjblue)
- [#9605](https://github.com/ember-cli/ember-cli/pull/9605) Properly set `loglevel` flag for npm [@jrvidal](https://github.com/jrvidal)
- [#9609](https://github.com/ember-cli/ember-cli/pull/9609) Ignore additional `ember-try` files for apps and addons [@bertdeblock](https://github.com/bertdeblock)
- [#9644](https://github.com/ember-cli/ember-cli/pull/9644) Default `ember new` and `ember addon` to use GitHub Actions [@rwjblue](https://github.com/rwjblue)

Thank you to all who took the time to contribute!

## v3.28.0

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v3.27.0...v3.28.0)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v3.27.0...v3.28.0)

#### Changelog

- [#9505](https://github.com/ember-cli/ember-cli/pull/9505) Pass `realPath` as `root` rather than the dirname for `addonMainPath` [@brendenpalmer](https://github.com/brendenpalmer)
- [#9507](https://github.com/ember-cli/ember-cli/pull/9507) Add a new config, `ember-addon.projectRoot`, to specify the location of the project [@brendenpalmer](https://github.com/brendenpalmer)
- [#9530](https://github.com/ember-cli/ember-cli/pull/9530) Drop Node 10 support [@rwjblue](https://github.com/rwjblue)
- [#9487](https://github.com/ember-cli/ember-cli/pull/9487) Add support for creating a single addon instance per bundle root (which enables dramatically reducing the total number of addon instances) [@davecombs](https://github.com/davecombs)
- [#9524](https://github.com/ember-cli/ember-cli/pull/9524) Update CONTRIBUTING.md to reference cli.emberjs.com [@loganrosen](https://github.com/loganrosen)
- [#9533](https://github.com/ember-cli/ember-cli/pull/9533) Ensure package-info objects are stable when they represent the same addon [@brendenpalmer](https://github.com/brendenpalmer)
- [#9538](https://github.com/ember-cli/ember-cli/pull/9538) ensure backwards compatibility is maintained with `packageRoot` and `root` [@brendenpalmer](https://github.com/brendenpalmer)
- [#9539](https://github.com/ember-cli/ember-cli/pull/9539) avoid setting `root` as `realPath` from the package-info object [@brendenpalmer](https://github.com/brendenpalmer)
- [#9537](https://github.com/ember-cli/ember-cli/pull/9537) Implement LCA host/host addons logic in `ember-cli` [@brendenpalmer](https://github.com/brendenpalmer)
- [#9540](https://github.com/ember-cli/ember-cli/pull/9540) Use relative override paths in blueprint ESLint config [@loganrosen](https://github.com/loganrosen)
- [#9542](https://github.com/ember-cli/ember-cli/pull/9542) Add validation checks for addon instance bundle caching [@brendenpalmer](https://github.com/brendenpalmer)
- [#9543](https://github.com/ember-cli/ember-cli/pull/9543) Add ability to specify a custom `ember-addon.perBundleAddonCacheUtil` utility [@brendenpalmer](https://github.com/brendenpalmer)
- [#9562](https://github.com/ember-cli/ember-cli/pull/9562) Update `addon-proxy` to support Embroider [@brendenpalmer](https://github.com/brendenpalmer)
- [#9565](https://github.com/ember-cli/ember-cli/pull/9565) Drop Node 10 support in blueprint engine spec [@elwayman02](https://github.com/elwayman02)
- [#9568](https://github.com/ember-cli/ember-cli/pull/9568) [BUGFIX release] Skip babel for qunit with embroider [@ctjhoa](https://github.com/ctjhoa)

Thank you to all who took the time to contribute!


## v3.27.0

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v3.26.0...v3.27.0)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v3.26.0-beta.2...v3.27.0)

#### Changelog

- [#9504](https://github.com/ember-cli/ember-cli/pull/9504) Update minimum version of broccoli-concat to address a major issue with cache invalidation [@brendenpalmer](https://github.com/brendenpalmer)
- [#9535](https://github.com/ember-cli/ember-cli/pull/9535) Disable Embroider by default. [@rwjblue](https://github.com/rwjblue)
- [#9557](https://github.com/ember-cli/ember-cli/pull/9557) Update app and addon blueprint dependencies to latest. [@rwjblue](https://github.com/rwjblue)
- [#9558](https://github.com/ember-cli/ember-cli/pull/9558) Switch from `octane` template lint config to `recommended` [@bmish](https://github.com/bmish)
- [#9453](https://github.com/ember-cli/ember-cli/pull/9453) Prevent "yarn-error.log" files being published for addons [@bertdeblock](https://github.com/bertdeblock)
- [#9392](https://github.com/ember-cli/ember-cli/pull/9392) / [#9484](https://github.com/ember-cli/ember-cli/pull/9484) Add eslint-plugin-qunit to blueprint [@bmish](https://github.com/bmish)
- [#9454](https://github.com/ember-cli/ember-cli/pull/9454) / [#9492](https://github.com/ember-cli/ember-cli/pull/9492) Add --embroider as an option for new and init [@thoov](https://github.com/thoov)
- [#9456](https://github.com/ember-cli/ember-cli/pull/9456) Add `.*/` to eslint ignore [@chancancode](https://github.com/chancancode)
- [#9469](https://github.com/ember-cli/ember-cli/pull/9469) Run `lint:fix` script automatically after blueprint generation [@rpemberton](https://github.com/rpemberton)
- [#9480](https://github.com/ember-cli/ember-cli/pull/9480) Refactor getPort to only check required port [@Cartmanishere](https://github.com/Cartmanishere)
- [#9485](https://github.com/ember-cli/ember-cli/pull/9485) Add Ember 3.24 LTS to ember-try configuration [@bertdeblock](https://github.com/bertdeblock)
- [#9488](https://github.com/ember-cli/ember-cli/pull/9488) Update supported Ember version in addon blueprint [@bertdeblock](https://github.com/bertdeblock)
- [#9490](https://github.com/ember-cli/ember-cli/pull/9490) Prevent window.Ember deprecation on Ember 3.27+. [@rwjblue](https://github.com/rwjblue)
- [#9491](https://github.com/ember-cli/ember-cli/pull/9491) Update supported Ember CLI version in addon blueprint [@bertdeblock](https://github.com/bertdeblock)
- [#9495](https://github.com/ember-cli/ember-cli/pull/9495) Enable Embroider by default for new projects [@thoov](https://github.com/thoov)
- [#9500](https://github.com/ember-cli/ember-cli/pull/9500) Fix `lint:fix` script for Windows users [@lupestro](https://github.com/lupestro)

Thank you to all who took the time to contribute!


## v3.26.1

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v3.26.0...v3.26.1)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v3.26.0...v3.26.1)

#### Changelog

- [#9504](https://github.com/ember-cli/ember-cli/pull/9504) Update `broccoli-concat` to avoid a cache invalidation problem in files larger than 10000 characters. [@brendenpalmer](https://github.com/brendenpalmer)

Thank you to all who took the time to contribute!

## v3.26.0

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v3.25.3...v3.26.0)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v3.25.3...v3.26.0)

#### Changelog

- [#9473](https://github.com/ember-cli/ember-cli/pull/9473) Issue a better error message for add-on's missing an entry point (e.g. invalid `ember-addon.main` path) [@ef4](https://github.com/ef4)
- [#9437](https://github.com/ember-cli/ember-cli/pull/9437) Add Prettier files to ".npmignore" file in addon blueprint [@bertdeblock](https://github.com/bertdeblock)
- [#9436](https://github.com/ember-cli/ember-cli/pull/9436) Enable Embroider test scenario for addons [@thoov](https://github.com/thoov)
- [#9435](https://github.com/ember-cli/ember-cli/pull/9435) Use "lint:fix" script in app and addon README files [@bertdeblock](https://github.com/bertdeblock)
- [#9451](https://github.com/ember-cli/ember-cli/pull/9451) update blueprint deps [@kellyselden](https://github.com/kellyselden)

Thank you to all who took the time to contribute!


## v3.25.3

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v3.25.2...v3.25.3)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v3.25.2...v3.25.3)

#### Changelog

- [#9490](https://github.com/ember-cli/ember-cli/pull/9490) Prevent `window.Ember` deprecation when testing (for Ember 3.27+) [@rwjblue](https://github.com/rwjblue)

Thank you to all who took the time to contribute!

## v3.25.2

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v3.25.1...v3.25.2)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v3.25.1...v3.25.2)

#### Changelog

- [#9473](https://github.com/ember-cli/ember-cli/pull/9473) Issue a better error message for add-on's missing an entry point (e.g. invalid `ember-addon.main` path) [@ef4](https://github.com/ef4)

Thank you to all who took the time to contribute!


## v3.25.1

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v3.25.0...v3.25.1)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v3.25.0...v3.25.1)

#### Changelog

- [#9467](https://github.com/ember-cli/ember-cli/pull/9467) Defer `The tests file was not loaded.` warning until after `DOMContentLoaded` [@ef4](https://github.com/ef4)


Thank you to all who took the time to contribute!

## v3.25.0

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v3.24.0...v3.25.0)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v3.24.0...v3.25.0)

#### Changelog

- [#9450](https://github.com/ember-cli/ember-cli/pull/9450) update blueprint deps [@kellyselden](https://github.com/kellyselden)
- Update `ember-data` and `ember-source` to 3.25.0-beta [@kellyselden](https://github.com/kellyselden) / [@rwjblue](https://github.com/rwjblue)

Thank you to all who took the time to contribute!

## v3.24.0

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v3.23.0...v3.24.0)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v3.23.0...v3.24.0)

#### Changelog

- [#9410](https://github.com/ember-cli/ember-cli/pull/9410) Add `.eslintcache` to `.gitignore` for applications and addons [@simonihmig](https://github.com/simonihmig)
- [#9425](https://github.com/ember-cli/ember-cli/pull/9425) Update blueprint dependecies to latest. [@rwjblue](https://github.com/rwjblue)
- [#9372](https://github.com/ember-cli/ember-cli/pull/9372) / [#9382](https://github.com/ember-cli/ember-cli/pull/9382) Add `ember-page-title` to app blueprint [@raido](https://github.com/raido)
- [#9391](https://github.com/ember-cli/ember-cli/pull/9391) / [#9407](https://github.com/ember-cli/ember-cli/pull/9407) Add `prettier` to blueprint [@bmish](https://github.com/bmish)
- [#9402](https://github.com/ember-cli/ember-cli/pull/9402) Prevent build cycles when app is within a watched dir [@ef4](https://github.com/ef4)
- [#9403](https://github.com/ember-cli/ember-cli/pull/9403) Update blueprint to eslint-plugin-ember v10 [@bmish](https://github.com/bmish)
- [#9340](https://github.com/ember-cli/ember-cli/pull/9340) / [#9371](https://github.com/ember-cli/ember-cli/pull/9371) Update blueprints with new testing configuration [@scalvert](https://github.com/scalvert)


Thank you to all who took the time to contribute!

## v3.23.0

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v3.22.0...v3.23.0)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v3.22.0...v3.23.0)

#### Changelog

- [#9369](https://github.com/ember-cli/ember-cli/pull/9369) / [#9406](https://github.com/ember-cli/ember-cli/pull/9406) Update blueprint dependencies to latest. [@rwjblue](https://github.com/rwjblue)
- [#9361](https://github.com/ember-cli/ember-cli/pull/9361) / [#9364](https://github.com/ember-cli/ember-cli/pull/9364) / [#9365](https://github.com/ember-cli/ember-cli/pull/9365) / [#9368](https://github.com/ember-cli/ember-cli/pull/9368) Update dependencies to latest. [@rwjblue](https://github.com/rwjblue)

Thank you to all who took the time to contribute!

## v3.22.0

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v3.21.0...v3.22.0)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v3.21.0...v3.22.0)

#### Changelog

- [#9325](https://github.com/ember-cli/ember-cli/pull/9325) Update dependencies for 3.22 beta series. [@rwjblue](https://github.com/rwjblue)
- [#9325](https://github.com/ember-cli/ember-cli/pull/9325) Update to `eslint-plugin-ember@9.0.0`. [@rwjblue](https://github.com/rwjblue)
- [#9336](https://github.com/ember-cli/ember-cli/pull/9336) Fixup internal test harness fixturify-project helper. [@rwjblue](https://github.com/rwjblue)
- [#9338](https://github.com/ember-cli/ember-cli/pull/9338) Remove requirement to have `loader.js`. [@rwjblue](https://github.com/rwjblue)
- [#9343](https://github.com/ember-cli/ember-cli/pull/9343) Fix yuidoc for private APIs [@jenweber](https://github.com/jenweber)
- [#9359](https://github.com/ember-cli/ember-cli/pull/9359) Upgrade to tiny-lr v2.0.0 [@elwayman02](https://github.com/elwayman02)
- [#9360](https://github.com/ember-cli/ember-cli/pull/9360) Update blueprint dependencies to latest version. [@rwjblue](https://github.com/rwjblue)

Thank you to all who took the time to contribute!

## v3.21.2

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v3.21.1...v3.21.2)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v3.21.1...v3.21.2)

#### Changelog

- [#9327](https://github.com/ember-cli/ember-cli/pull/9327) Update addon `README.md` to indicate Ember 3.16  minimum. [@kellyselden](https://github.com/kellyselden)

Thank you to all who took the time to contribute!

## v3.21.1

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v3.21.0...v3.21.1)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v3.21.0...v3.21.1)

#### Changelog

- [#9321](https://github.com/ember-cli/ember-cli/pull/9321) Add missing `ember-lts-3.20` matrix build to CI configuration. [@kellyselden](https://github.com/kellyselden)
- [#9323](https://github.com/ember-cli/ember-cli/pull/9323) Remove errant `ember-lts-3.12` matrix build from CI configuration. [@rwjblue](https://github.com/rwjblue)
- [#9324](https://github.com/ember-cli/ember-cli/pull/9324) Fix transpilation issues with modern browsers by migrating from `ember-cli-uglify` to `ember-cli-terser` [@rwjblue](https://github.com/rwjblue)

Thank you to all who took the time to contribute!

## v3.21.0

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v3.20.1...v3.21.0)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v3.20.1...v3.21.0)

#### Changelog

- [#9305](https://github.com/ember-cli/ember-cli/pull/9305) Update blueprint dependencies to latest versions. [@rwjblue](https://github.com/rwjblue)
- [#9306](https://github.com/ember-cli/ember-cli/pull/9306) Ensure that `outputReady` receives the final output directory. [@rwjblue](https://github.com/rwjblue)
- [#9308](https://github.com/ember-cli/ember-cli/pull/9308) Add Ember 3.20 LTS to ember-try configuration. [@rwjblue](https://github.com/rwjblue)
- [#9309](https://github.com/ember-cli/ember-cli/pull/9309) Update blueprint dependencies to latest [@rwjblue](https://github.com/rwjblue)
- [#9310](https://github.com/ember-cli/ember-cli/pull/9310) Drop Ember 3.12 from default addon testing matrix. [@rwjblue](https://github.com/rwjblue)
- [#9259](https://github.com/ember-cli/ember-cli/pull/9259) Implement [emberjs/rfcs#635](https://github.com/emberjs/rfcs/blob/master/text/0635-ember-new-lang.md): `ember new --lang` [@josephdsumner](https://github.com/josephdsumner)
- [#9299](https://github.com/ember-cli/ember-cli/pull/9299) Remove explicit `yarn install` in blueprint generated `.travis.yml` (use the Travis CI default of `yarn install --frozen-lockfile`) [@kellyselden](https://github.com/kellyselden)
- [#9289](https://github.com/ember-cli/ember-cli/pull/9289) Update blueprint dependencies / devDependencies [@rwjblue](https://github.com/rwjblue)

## v3.20.2

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v3.20.1...v3.20.2)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v3.20.1...v3.20.2)

#### Changelog

- [#9321](https://github.com/ember-cli/ember-cli/pull/9321) Add missing `ember-lts-3.20` invocation to CI [@kellyselden](https://github.com/kellyselden)

Thank you to all who took the time to contribute!

## v3.20.1

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v3.20.0...v3.20.1)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v3.20.0...v3.20.1)

#### Changelog

- [#9308](https://github.com/ember-cli/ember-cli/pull/9308) Add Ember 3.20 LTS to ember-try configuration. [@rwjblue](https://github.com/rwjblue)

Thank you to all who took the time to contribute!

## v3.20.0

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v3.19.0...v3.20.0)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v3.19.0...v3.20.0)

#### Changelog

- [#9211](https://github.com/ember-cli/ember-cli/pull/9211) bugfix: processAppMiddlewares - check server middleware files [@lifeart](https://github.com/lifeart)
- [#9215](https://github.com/ember-cli/ember-cli/pull/9215) Handle unexpected errors in development mode proxy [@houfeng0923](https://github.com/houfeng0923)
- [#9238](https://github.com/ember-cli/ember-cli/pull/9238) Add config/ember-cli-update.json to app and addon blueprints. [@rwjblue](https://github.com/rwjblue)
- [#9262](https://github.com/ember-cli/ember-cli/pull/9262) Refactor release process. [@rwjblue](https://github.com/rwjblue)
- [#9264](https://github.com/ember-cli/ember-cli/pull/9264) refactor: use Boolean constructor to cast variable in config/targets.js blueprint [@bmish](https://github.com/bmish)
- [032e9a8851af869c7e0cf5ef8c3d930ade38b6c1](https://github.com/ember-cli/ember-cli/commit/032e9a8851af869c7e0cf5ef8c3d930ade38b6c1) Merge branch 'master' into default-blueprint-absolute-imports [@dfreeman](https://github.com/dfreeman)
- [#9273](https://github.com/ember-cli/ember-cli/pull/9273) Avoid relative imports in the default blueprint [@dfreeman](https://github.com/dfreeman)
- [#9277](https://github.com/ember-cli/ember-cli/pull/9277) Allow `ember install` to work with Yarn v2 [@caassandra](https://github.com/caassandra)
- [#9280](https://github.com/ember-cli/ember-cli/pull/9280) Remove `ember-default` ember-try scenario [@mehulkar](https://github.com/mehulkar)
- [#9281](https://github.com/ember-cli/ember-cli/pull/9281) Update blueprint dependencies to latest versions. [@rwjblue](https://github.com/rwjblue)
- [#9282](https://github.com/ember-cli/ember-cli/pull/9282) Deprecate `PACKAGER` experiment. [@rwjblue](https://github.com/rwjblue)
- [#9283](https://github.com/ember-cli/ember-cli/pull/9283) Remove macOS from CI matrix for slow/acceptance tests. [@rwjblue](https://github.com/rwjblue)
- [#9284](https://github.com/ember-cli/ember-cli/pull/9284) Drop support for Node 13. [@rwjblue](https://github.com/rwjblue)
- [56461f26a9b81833f424bf1a23c7ce502d35a43b](https://github.com/ember-cli/ember-cli/commit/56461f26a9b81833f424bf1a23c7ce502d35a43b) Merge branch 'master' into master [@caassandra](https://github.com/caassandra)
- [#9286](https://github.com/ember-cli/ember-cli/pull/9286) Remove unused `lib/utilities/symbol.js` [@IzzatN](https://github.com/IzzatN)
- [#9287](https://github.com/ember-cli/ember-cli/pull/9287) Remove redundant guard in `Addon.prototype.moduleName` [@IzzatN](https://github.com/IzzatN)

Thank you to all who took the time to contribute!

## v3.19.0

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v3.18.0...v3.19.0)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v3.19.0...v3.19.0)

#### Changelog

- [#9239](https://github.com/ember-cli/ember-cli/pull/9239) Update app / addon dependencies to latest. [@rwjblue](https://github.com/rwjblue)
- [#9205](https://github.com/ember-cli/ember-cli/pull/9205) Pass options to middleware [@mrloop](https://github.com/mrloop)
- [#9209](https://github.com/ember-cli/ember-cli/pull/9209) Create small development script to update blueprint dependencies. [@rwjblue](https://github.com/rwjblue)
- [#9212](https://github.com/ember-cli/ember-cli/pull/9212) Ensure that the captured exit is released. [@rwjblue](https://github.com/rwjblue)
- [#9218](https://github.com/ember-cli/ember-cli/pull/9218) Update eslint to 7.0.0. [@rwjblue](https://github.com/rwjblue)
- [#9219](https://github.com/ember-cli/ember-cli/pull/9219) Add ability to pass `--filter` to `dev/update-blueprint-dependencies.js` [@rwjblue](https://github.com/rwjblue)
- [#9240](https://github.com/ember-cli/ember-cli/pull/9240) Ensure `ember serve` property waits for the serve task. [@rwjblue](https://github.com/rwjblue)
- [#9242](https://github.com/ember-cli/ember-cli/pull/9242) Move travis configuration from trusty to xenial [@Gaurav0](https://github.com/Gaurav0)
- [#7538](https://github.com/ember-cli/ember-cli/pull/7538) Fix `configPath` caching [@kanongil](https://github.com/kanongil)
- [#8258](https://github.com/ember-cli/ember-cli/pull/8258) Tweak `isDevelopingAddon` error message [@stefanpenner](https://github.com/stefanpenner)
- [#8813](https://github.com/ember-cli/ember-cli/pull/8813) Update NPM version check to avoid double `npm install` when using `npm@5.7.1` or higher. [@deepan83](https://github.com/deepan83)
- [#9126](https://github.com/ember-cli/ember-cli/pull/9126) chore: fix init help text with the right description [@rajasegar](https://github.com/rajasegar)
- [#9132](https://github.com/ember-cli/ember-cli/pull/9132) Convert commands to use async/await syntax [@locks](https://github.com/locks)
- [#9134](https://github.com/ember-cli/ember-cli/pull/9134) [DOC] Update locals hook example [@locks](https://github.com/locks)
- [#9146](https://github.com/ember-cli/ember-cli/pull/9146) Convert express-server task to async await [@locks](https://github.com/locks)
- [#9147](https://github.com/ember-cli/ember-cli/pull/9147) Convert serve task to async await [@locks](https://github.com/locks)
- [#9148](https://github.com/ember-cli/ember-cli/pull/9148) Convert npm-task task to async/await syntax [@locks](https://github.com/locks)
- [#9149](https://github.com/ember-cli/ember-cli/pull/9149) Update blueprint dependencies to latest [@bmish](https://github.com/bmish)
- [#9157](https://github.com/ember-cli/ember-cli/pull/9157) Convert insert-into-file to async/await syntax [@locks](https://github.com/locks)
- [#9158](https://github.com/ember-cli/ember-cli/pull/9158) Convert clean-remove to async/await syntax [@locks](https://github.com/locks)
- [#9163](https://github.com/ember-cli/ember-cli/pull/9163) Convert in-option-generate-test to async/await syntax [@locks](https://github.com/locks)
- [#9183](https://github.com/ember-cli/ember-cli/pull/9183) Ensure processed addon styles are not doubly-included in vendor.css [@bantic](https://github.com/bantic)

## v3.18.0

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v3.17.0...v3.18.0)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v3.17.0...v3.18.0)

#### Changelog

- [#9063](https://github.com/ember-cli/ember-cli/pull/9063) Fix typo in `Blueprint` documentation. [@bartocc](https://github.com/bartocc)
- [#9068](https://github.com/ember-cli/ember-cli/pull/9068) Adds link to CLI commands doc from README [@entendu](https://github.com/entendu)
- [#9070](https://github.com/ember-cli/ember-cli/pull/9070) Fix a number of causes of unhandled rejections (and ensure tests fail when unhandled rejection occurs). [@stefanpenner](https://github.com/stefanpenner)
- [#9072](https://github.com/ember-cli/ember-cli/pull/9072) Ensure errors during build are properly reported to the console. [@stefanpenner](https://github.com/stefanpenner)
- [#9092](https://github.com/ember-cli/ember-cli/pull/9092) Update `ember-source` and `ember-data` to 3.18 betas. [@rwjblue](https://github.com/rwjblue)
- [#9097](https://github.com/ember-cli/ember-cli/pull/9097) Update production dependencies to latest. [@rwjblue](https://github.com/rwjblue)
- [#9108](https://github.com/ember-cli/ember-cli/pull/9108) Cleanup of async in `CLI` / `Builder` while digging into issues around progress clean up. [@rwjblue](https://github.com/rwjblue)
- [#9188](https://github.com/ember-cli/ember-cli/pull/9188) Add Node 14 to CI [@rwjblue](https://github.com/rwjblue)
- [#9208](https://github.com/ember-cli/ember-cli/pull/9208) Update blueprint dependencies to latest versions. [@rwjblue](https://github.com/rwjblue)
- [#9090](https://github.com/ember-cli/ember-cli/pull/9183) Ensure processed addon styles are not doubly-included in vendor.css [@bantic](https://github.com/bantic)

Thank you to all who took the time to contribute!

## v3.17.0

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v3.16.1...v3.17.0)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v3.16.1...v3.17.0)

#### Changelog

- [#9045](https://github.com/ember-cli/ember-cli/pull/9045) Add final newline in CONTRIBUTING.md [@kellyselden](https://github.com/kellyselden)
- [c30ed27181257ab4319b3a06134e13067ac1e76e](https://github.com/ember-cli/ember-cli/commit/c30ed27181257ab4319b3a06134e13067ac1e76e) Handle a number of unhandled rejections scenarios [@stefanpenner](https://github.com/stefanpenner)
- [c377300bb21485faf0137ce69b54a10b3a458828](https://github.com/ember-cli/ember-cli/commit/c377300bb21485faf0137ce69b54a10b3a458828) Publish yuidoc json as a part of npm package [@sivakumar-kailasam](https://github.com/sivakumar-kailasam)
- [0a8d7a18b5f27147f2cec5574625e53784841601](https://github.com/ember-cli/ember-cli/commit/0a8d7a18b5f27147f2cec5574625e53784841601) Consistently 'use strict'; for our node js files [@kellyselden](https://github.com/kellyselden)
- [64e635c48c76f177769ca73eb9a228149ffbd863](https://github.com/ember-cli/ember-cli/commit/64e635c48c76f177769ca73eb9a228149ffbd863) Ensure buildFailures are reported correctly [@stefanpenner](https://github.com/stefanpenner)
- [#9037](https://github.com/ember-cli/ember-cli/pull/9037) Update Ember and Ember Data to 3.17 betas. [@rwjblue](https://github.com/rwjblue)
- [#9039](https://github.com/ember-cli/ember-cli/pull/9039) Remove long enabled EMBER_CLI_SYSTEM_TEMP experiment. [@rwjblue](https://github.com/rwjblue)
- [#9038](https://github.com/ember-cli/ember-cli/pull/9038) Remove EMBER_CLI_DELAYED_TRANSPILATION experiment. [@rwjblue](https://github.com/rwjblue)
- [#9040](https://github.com/ember-cli/ember-cli/pull/9040) Remove MODULE_UNIFICATION experiment. [@rwjblue](https://github.com/rwjblue)
- [#9009](https://github.com/ember-cli/ember-cli/pull/9009) Use `eslint` and `ember-template-lint` directly (no longer lint during builds/rebuilds by default) [@dcyriller](https://github.com/dcyriller)
- [#9041](https://github.com/ember-cli/ember-cli/pull/9041) Remove usage of RSVP. [@rwjblue](https://github.com/rwjblue)
- [#9042](https://github.com/ember-cli/ember-cli/pull/9042) Include API documentation `yuidoc` JSON output when publishing [@sivakumar-kailasam](https://github.com/sivakumar-kailasam)
- [#9045](https://github.com/ember-cli/ember-cli/pull/9045) Add final newline in CONTRIBUTING.md [@kellyselden](https://github.com/kellyselden)

## v3.16.2

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v3.16.1...v3.16.2)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v3.16.1...v3.16.2)

#### Changelog

- [#9090](https://github.com/ember-cli/ember-cli/pull/9183) Ensure processed addon styles are not doubly-included in vendor.css [@bantic](https://github.com/bantic)

## v3.16.1

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v3.16.0...v3.16.1)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v3.16.0...v3.16.1)

#### Changelog

- [#9090](https://github.com/ember-cli/ember-cli/pull/9090) Backports of critical bugfixes to LTS (3.16) [@rwjblue](https://github.com/rwjblue)
- [#9045](https://github.com/ember-cli/ember-cli/pull/9045) Add final newline in CONTRIBUTING.md [@kellyselden](https://github.com/kellyselden)
- [c30ed27181257ab4319b3a06134e13067ac1e76e](https://github.com/ember-cli/ember-cli/commit/c30ed27181257ab4319b3a06134e13067ac1e76e) Handle a number of unhandled rejections scenarios [@stefanpenner](https://github.com/stefanpenner)
- [c377300bb21485faf0137ce69b54a10b3a458828](https://github.com/ember-cli/ember-cli/commit/c377300bb21485faf0137ce69b54a10b3a458828) Publish yuidoc json as a part of npm package [@sivakumar-kailasam](https://github.com/sivakumar-kailasam)
- [0a8d7a18b5f27147f2cec5574625e53784841601](https://github.com/ember-cli/ember-cli/commit/0a8d7a18b5f27147f2cec5574625e53784841601) Consistently 'use strict'; for our node js files [@kellyselden](https://github.com/kellyselden)
- [64e635c48c76f177769ca73eb9a228149ffbd863](https://github.com/ember-cli/ember-cli/commit/64e635c48c76f177769ca73eb9a228149ffbd863) Ensure buildFailures are reported correctly [@stefanpenner](https://github.com/stefanpenner)

Thank you to all who took the time to contribute!

## v3.16.0

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v3.15.2...v3.16.0)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v3.15.2...v3.16.0)

#### Changelog

- [#8905](https://github.com/ember-cli/ember-cli/pull/8905) Use production environment for `npm run build` / `yarn build` by default [@pichfl](https://github.com/pichfl)
- [#8930](https://github.com/ember-cli/ember-cli/pull/8930) / [#8929](https://github.com/ember-cli/ember-cli/pull/8929) Drop Node 11 support [@SergeAstapov](https://github.com/SergeAstapov)
- [#8932](https://github.com/ember-cli/ember-cli/pull/8932) Add Node.js 13 to test matrix [@SergeAstapov](https://github.com/SergeAstapov)
- [#8941](https://github.com/ember-cli/ember-cli/pull/8941) feat(blueprint): resolve remote blueprints via package manager [@buschtoens](https://github.com/buschtoens)
- [#8944](https://github.com/ember-cli/ember-cli/pull/8944) Travis.yml: Remove deprecated `sudo: false` option [@tniezurawski](https://github.com/tniezurawski)
- [#8943](https://github.com/ember-cli/ember-cli/pull/8943) Travis.yml: use fast_finish instead of undocumented fail_fast [@tniezurawski](https://github.com/tniezurawski)
- [#8962](https://github.com/ember-cli/ember-cli/pull/8962) Drop Ember 3.8 and add Ember 3.16 scenarios in default `config/ember-try.js`. [@kellyselden](https://github.com/kellyselden)
- [#8986](https://github.com/ember-cli/ember-cli/pull/8986) Increase testem browser timeout. [@rwjblue](https://github.com/rwjblue)
- [#9012](https://github.com/ember-cli/ember-cli/pull/9012) Drop support for Node v8 [@jrjohnson](https://github.com/jrjohnson)
- [#9013](https://github.com/ember-cli/ember-cli/pull/9013) Remove useless line break in `.editorconfig` file [@dcyriller](https://github.com/dcyriller)
- [#9023](https://github.com/ember-cli/ember-cli/pull/9023) Update to use Ember + Ember Data 3.16. [@rwjblue](https://github.com/rwjblue)
- [#9026](https://github.com/ember-cli/ember-cli/pull/9026) Add @glimmer/tracking to default blueprint. [@rwjblue](https://github.com/rwjblue)
- [#9028](https://github.com/ember-cli/ember-cli/pull/9028) Update minimum versions of app / addon blueprint dependencies. [@rwjblue](https://github.com/rwjblue)

Thank you to all who took the time to contribute!

## v3.15.2

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v3.15.1...v3.15.2)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v3.15.1...v3.15.2)

#### Changelog

- [#8924](https://github.com/ember-cli/ember-cli/pull/8924) Fix named UMD imports [@kellyselden](https://github.com/kellyselden)
- [#9015](https://github.com/ember-cli/ember-cli/pull/9015) Allow failure of Node 8 CI jobs. [@rwjblue](https://github.com/rwjblue)
- [#9014](https://github.com/ember-cli/ember-cli/pull/9014) Avoid errors when `ui` is not present and a warning will be emitted. [@tmquinn](https://github.com/tmquinn)

Thank you to all who took the time to contribute!

## v3.15.1

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v3.15.0...v3.15.1)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v3.15.0...v3.15.1)

#### Changelog

- [#8977](https://github.com/ember-cli/ember-cli/pull/8977) Fix invalid syntax with ember-classic ember-try scenario. [@rwjblue](https://github.com/rwjblue)

Thank you to all who took the time to contribute!

## v3.15.0

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v3.14.0...v3.15.0)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v3.14.0...v3.15.0)

#### Changelog

- [#8963](https://github.com/ember-cli/ember-cli/pull/8963) Remove `app/templates/components` [@chancancode](https://github.com/chancancode)
- [#8964](https://github.com/ember-cli/ember-cli/pull/8964) Add support for `ember new @scope-here/name-here`. [@rwjblue](https://github.com/rwjblue)
- [#8965](https://github.com/ember-cli/ember-cli/pull/8965) Update ember-resolver to v7.0.0. [@rwjblue](https://github.com/rwjblue)
- [#8971](https://github.com/ember-cli/ember-cli/pull/8971) Add an ember-try scenario for Ember "classic" (pre-octane). [@rwjblue](https://github.com/rwjblue)
- [#8972](https://github.com/ember-cli/ember-cli/pull/8972) Update ember-data to 3.15.0. [@rwjblue](https://github.com/rwjblue)
- [#8933](https://github.com/ember-cli/ember-cli/pull/8933) Remove `app/resolver.js` in favor of importing in `app/app.js` [@rwjblue](https://github.com/rwjblue)
- [#8945](https://github.com/ember-cli/ember-cli/pull/8945) Fix issue with addon `.travis.yml` configuration when using `npm` [@kellyselden](https://github.com/kellyselden)
- [#8946](https://github.com/ember-cli/ember-cli/pull/8946) Drop testing of ember-source@3.4 in the addon blueprints ember-try config [@kellyselden](https://github.com/kellyselden)
- [#8946](https://github.com/ember-cli/ember-cli/pull/8946) Add testing of ember-source@3.12 in the addon blueprints ember-try config [@kellyselden](https://github.com/kellyselden)
- [#8959](https://github.com/ember-cli/ember-cli/pull/8959) Fix issue with addon discovery when npm/yarn leave empty directories in resolvable locations [@stefanpenner](https://github.com/stefanpenner)
- [#8961](https://github.com/ember-cli/ember-cli/pull/8961) Prepare for Octane release in 3.15 [@rwjblue](https://github.com/rwjblue)
  * Adds `ember` property to `package.json` to implement [emberjs/rfcs#558](https://github.com/emberjs/rfcs/pull/558)
  * Adds `@glimmer/component@1.0.0` as a development dependency for both apps and addons
  * Updates `ember-try` to at least 1.4.0 in order to support `config/ember-try.js` scenarios with `ember` `package.json` property (mentioned in emberjs/rfcs#558)
  * Enables Octane related optional features
  * Updates ember-template-lint configuration to use `octane` preset
  * Update to ember-source@3.15 stable
  * Updates all packages in the application blueprint to their latest version
- [#8827](https://github.com/ember-cli/ember-cli/pull/8827) Remove module-unification blueprints [@dcyriller](https://github.com/dcyriller)
- [#8878](https://github.com/ember-cli/ember-cli/pull/8878) Adds flag to throw an error for invalid addon locations [@tmquinn](https://github.com/tmquinn)
- [#8906](https://github.com/ember-cli/ember-cli/pull/8906) Enable broccoli memoization by default in Ember-CLI [@SparshithNR](https://github.com/SparshithNR)
- [#8917](https://github.com/ember-cli/ember-cli/pull/8917) Update CI configuration for applications using `npm` to run a "floating dependencies" test. [@kellyselden](https://github.com/kellyselden)
- [#8926](https://github.com/ember-cli/ember-cli/pull/8926) Add `application` to invalid names [@kennethlarsen](https://github.com/kennethlarsen)

Thank you to all who took the time to contribute!

## v3.14.0

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v3.13.2...v3.14.0)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v3.13.2...v3.14.0)

#### Changelog

- [#8875](https://github.com/ember-cli/ember-cli/pull/8875) Fix ember-cli-htmlbars-inline-precompile deprecation [@HeroicEric](https://github.com/HeroicEric)
- [#8882](https://github.com/ember-cli/ember-cli/pull/8882) Simplify "Get started" message for `ember new` [@dcyriller](https://github.com/dcyriller)
- [#8899](https://github.com/ember-cli/ember-cli/pull/8899) Don't reload the config for instrumentation [@pzuraq](https://github.com/pzuraq)
- [#8900](https://github.com/ember-cli/ember-cli/pull/8900) Include `legacyDecorators` eslint option by default [@pzuraq](https://github.com/pzuraq)
- [#8901](https://github.com/ember-cli/ember-cli/pull/8901) Merge `config/environment.js`'s `EmberENV` configuration with any pre-existing `EmberENV` [@chancancode](https://github.com/chancancode)
- [#8910](https://github.com/ember-cli/ember-cli/pull/8910) Update TravisCI config for `ember new` to restrict CI runs to `master` branch and pull requests [@kellyselden](https://github.com/kellyselden)
- [#8915](https://github.com/ember-cli/ember-cli/pull/8915) Revert changes made to enable "octane" as the default for `ember new` [@rwjblue](https://github.com/rwjblue)
- [#8916](https://github.com/ember-cli/ember-cli/pull/8916) Update ember-source and ember-data to 3.14.x [@rwjblue](https://github.com/rwjblue)
- [#8853](https://github.com/ember-cli/ember-cli/pull/8853) Update ember-resolver to 5.3.0. [@rwjblue](https://github.com/rwjblue)
- [#8812](https://github.com/ember-cli/ember-cli/pull/8812) Clarify installation error message [@jrjohnson](https://github.com/jrjohnson)
- [#8820](https://github.com/ember-cli/ember-cli/pull/8820) Issue deprecation when enabling MODULE_UNIFICATION flag. [@rwjblue](https://github.com/rwjblue)

## v3.13.2

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v3.13.1...v3.13.2)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v3.13.1...v3.13.2)

#### Changelog

- [#8875](https://github.com/ember-cli/ember-cli/pull/8875) Fix ember-cli-htmlbars-inline-precompile deprecation [@HeroicEric](https://github.com/HeroicEric)
- [#8882](https://github.com/ember-cli/ember-cli/pull/8882) Simplify "Get started" message [@dcyriller](https://github.com/dcyriller)
- [#8901](https://github.com/ember-cli/ember-cli/pull/8901) Merge `config/environment.js`'s `EmberENV` configuration with any pre-existing `EmberENV` [@chancancode](https://github.com/chancancode)

Thank you to all who took the time to contribute!

## v3.13.1

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v3.13.0...v3.13.1)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v3.13.0...v3.13.1)

#### Changelog

- [#8857](https://github.com/ember-cli/ember-cli/pull/8857) Tweaks to release scripts. [@rwjblue](https://github.com/rwjblue)
- [#8862](https://github.com/ember-cli/ember-cli/pull/8862) Adjust message for when a new app is created [@dcyriller](https://github.com/dcyriller)

Thank you to all who took the time to contribute!

## v3.13.0

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v3.12.0...v3.13.0)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v3.12.0...v3.13.0)

#### Changelog

- [#8797](https://github.com/ember-cli/ember-cli/pull/8797) Update heimdalljs-fs-monitor to 0.2.3. [@rwjblue](https://github.com/rwjblue)
- [#8798](https://github.com/ember-cli/ember-cli/pull/8798) Update blueprint reference for ember-source to 3.13.0-beta.2. [@rwjblue](https://github.com/rwjblue)
- [#8814](https://github.com/ember-cli/ember-cli/pull/8814) Drop Node 11 from CI. [@rwjblue](https://github.com/rwjblue)
- [#8816](https://github.com/ember-cli/ember-cli/pull/8816) Update app and addon blueprints to latest version of packages. [@rwjblue](https://github.com/rwjblue)
- [#8834](https://github.com/ember-cli/ember-cli/pull/8834) Ensure addon tree is scoped to addon name before compiling templates. [@rwjblue](https://github.com/rwjblue)
- [fd7268b59ddcddca849762a4923c14655da47188](https://github.com/ember-cli/ember-cli/commit/fd7268b59ddcddca849762a4923c14655da47188) Update watch-detector to 1.0.0. [@rwjblue](https://github.com/rwjblue)
- [#8850](https://github.com/ember-cli/ember-cli/pull/8850) Update broccoli dependencies/devDependencies to latest. [@rwjblue](https://github.com/rwjblue)
- [#8851](https://github.com/ember-cli/ember-cli/pull/8851) Update Ember ecosystem packages to latest version. [@rwjblue](https://github.com/rwjblue)
- [#8853](https://github.com/ember-cli/ember-cli/pull/8853) Update ember-resolver to 5.3.0. [@rwjblue](https://github.com/rwjblue)
- [#8642](https://github.com/ember-cli/ember-cli/pull/8642) Use system temp for ember test [@ef4](https://github.com/ef4)
- [#8650](https://github.com/ember-cli/ember-cli/pull/8650) [BUGFIX] reset resolve-package-path caches in PackageInfoCache._clear() [@jamescdavis](https://github.com/jamescdavis)
- [#8633](https://github.com/ember-cli/ember-cli/pull/8633) Refactor template build pipeline to enable co-located templates. [@rwjblue](https://github.com/rwjblue)
- [#8616](https://github.com/ember-cli/ember-cli/pull/8616) [ENHANCEMENT] Gather hardware information when creating instrumentation summaries [@benblank](https://github.com/benblank)
- [#8676](https://github.com/ember-cli/ember-cli/pull/8676) Track the time taken to collect hardware metrics [@benblank](https://github.com/benblank)
- [#8678](https://github.com/ember-cli/ember-cli/pull/8678) give ember-cli a progress indicator [@stefanpenner](https://github.com/stefanpenner)
- [#8588](https://github.com/ember-cli/ember-cli/pull/8588) [dx] Detail app / addon creation messages [@dcyriller](https://github.com/dcyriller)
- [#8687](https://github.com/ember-cli/ember-cli/pull/8687) Add .git directory to npmignore [@rwwagner90](https://github.com/rwwagner90)
- [#8701](https://github.com/ember-cli/ember-cli/pull/8701) Add ember-cli-htmlbars to default addon dependencies [@haochuan](https://github.com/haochuan)
- [#8747](https://github.com/ember-cli/ember-cli/pull/8747) Update Windows documentation link [@loganrosen](https://github.com/loganrosen)
- [#8772](https://github.com/ember-cli/ember-cli/pull/8772) fix typos :) [@aspala](https://github.com/aspala)
- [#8564](https://github.com/ember-cli/ember-cli/pull/8564) Adds babel-eslint as the default ESlint parser [@pzuraq](https://github.com/pzuraq)

Thank you to all who took the time to contribute!

## v3.12.1

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v3.12.0...v3.12.1)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v3.12.0...v3.12.1)

#### Community Contributions

- [#8797](https://github.com/ember-cli/ember-cli/pull/8797) Update heimdalljs-fs-monitor to 0.2.3. [@rwjblue](https://github.com/rwjblue)
- [#8959](https://github.com/ember-cli/ember-cli/pull/8959) Ensure `node_modules/*` directories without a `package.json` are not considered as part of the addon discovery process [@stefanpenner](https://github.com/stefanpenner)

Thank you to all who took the time to contribute!

## v3.12.0

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v3.11.0...v3.12.0)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v3.11.0...v3.12.0)

#### Community Contributions

- [#8753](https://github.com/ember-cli/ember-cli/pull/8753) Quote empty strings in printCommand [@chancancode](https://github.com/chancancode)
- [#8774](https://github.com/ember-cli/ember-cli/pull/8774) Remove --disable-gpu flag when starting headless chrome [@stefanpenner](https://github.com/stefanpenner)

## v3.11.0

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v3.10.0...v3.11.0)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v3.10.0...v3.11.0)

#### Community Contributions

- [#8659](https://github.com/ember-cli/ember-cli/pull/8659) ecmaVersion 2015 is out of date [@kellyselden](https://github.com/kellyselden)
- [#8660](https://github.com/ember-cli/ember-cli/pull/8660) start testing ember-lts-3.8 in ember-try [@kellyselden](https://github.com/kellyselden)
- [#8662](https://github.com/ember-cli/ember-cli/pull/8662) use async/await in ember-try config [@kellyselden](https://github.com/kellyselden)
- [#8664](https://github.com/ember-cli/ember-cli/pull/8664) fix README ember min version [@kellyselden](https://github.com/kellyselden)
- [#8674](https://github.com/ember-cli/ember-cli/pull/8674) ensure we use Promise.prototype.finally polyfil for node 8 compat [@stefanpenner](https://github.com/stefanpenner)
- [#8675](https://github.com/ember-cli/ember-cli/pull/8675) [beta] Gather hardware information when creating instrumentation summaries. [@stefanpenner](https://github.com/stefanpenner)
- [#8679](https://github.com/ember-cli/ember-cli/pull/8679) Adding change logging for backwards compatibility [@thoov](https://github.com/thoov)
- [#8680](https://github.com/ember-cli/ember-cli/pull/8680) [Fixes #8677] ensure watcher parity [@stefanpenner](https://github.com/stefanpenner)
- [#8595](https://github.com/ember-cli/ember-cli/pull/8595) `Project#config` should use `EMBER_ENV` as default environment when none is passed in [@nlfurniss](https://github.com/nlfurniss)
- [#8604](https://github.com/stefanpenner/ember-cli/pull/8604) CONTRIBUTING: Clarify the way to start working on the repo. [@MonsieurDart](https://github.com/MonsieurDart)
- [#8621](https://github.com/ember-cli/ember-cli/pull/8621) project.findAddonByName was intended to be public [@stefanpenner](https://github.com/stefanpenner)
- [#8697](https://github.com/ember-cli/ember-cli/pull/8697) Update to Broccoli 3.1. [@thoov](https://github.com/thoov)
- [#8692](https://github.com/ember-cli/ember-cli/pull/8692) Allow `prettier` usage on `app/index.html` [@lougreenwood](https://github.com/lougreenwood)

Thank you to all who took the time to contribute!

## v3.10.1

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v3.10.0...v3.10.1)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v3.10.0...v3.10.1)

#### Community Contributions

- [#8645](https://github.com/ember-cli/ember-cli/pull/8645) Update addon and application blueprints to account for Node 6 support being removed. [@kellyselden](https://github.com/kellyselden)
- [#8631](https://github.com/ember-cli/ember-cli/pull/8631) Add CI testing for Node 12. [@rwjblue](https://github.com/rwjblue)

## v3.10.0

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v3.9.0...v3.10.0)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v3.9.0...v3.10.0)

#### Community Contributions

- [#8631](https://github.com/ember-cli/ember-cli/pull/8631) Add CI testing for Node 12. [@rwjblue](https://github.com/rwjblue)
- [#8563](https://github.com/ember-cli/ember-cli/pull/8563) Drop Node 6 support [@Turbo87](https://github.com/Turbo87)
- [#8566](https://github.com/ember-cli/ember-cli/pull/8566) Modernize `build-watch.js` and `build-watch-test.js` [@xg-wang](https://github.com/xg-wang)
- [#8569](https://github.com/ember-cli/ember-cli/pull/8569) Modernize `bower-install-test.js` [@RichardOtvos](https://github.com/RichardOtvos)
- [#8565](https://github.com/ember-cli/ember-cli/pull/8565) Modernize `git-init.js` and `git-init-test.js` [@xg-wang](https://github.com/xg-wang)
- [#8572](https://github.com/ember-cli/ember-cli/pull/8572) Use eslint-plugin-node v8 in blueprints [@kellyselden](https://github.com/kellyselden)
- [#8205](https://github.com/ember-cli/ember-cli/pull/8205) Run eslint-plugin-node on apps [@kellyselden](https://github.com/kellyselden)
- [#8606](https://github.com/ember-cli/ember-cli/pull/8606) Modernize `models/instrumentation-test.js` [@Semeia-io](https://github.com/Semeia-io)
- [#8607](https://github.com/ember-cli/ember-cli/pull/8607) Modernize `models/addon-test.js` [@Semeia-io](https://github.com/Semeia-io)
- [#8462](https://github.com/ember-cli/ember-cli/pull/8462) blueprints: Update `ember-cli-eslint` to v5.1.0 [@Turbo87](https://github.com/Turbo87)
- [#8461](https://github.com/ember-cli/ember-cli/pull/8461) blueprints: Update `ember-welcome-page` to v4.0.0 [@Turbo87](https://github.com/Turbo87)
- [#8460](https://github.com/ember-cli/ember-cli/pull/8460) blueprints: Update `ember-qunit` to v4.4.1 [@Turbo87](https://github.com/Turbo87)
- [#8396](https://github.com/ember-cli/ember-cli/pull/8396) blueprints: Update dependencies [@mistahenry](https://github.com/mistahenry)
- [#8470](https://github.com/ember-cli/ember-cli/pull/8470) Remove obsolete `BROCCOLI_2` experiment [@Turbo87](https://github.com/Turbo87)
- [#8469](https://github.com/ember-cli/ember-cli/pull/8469) Move all package related path resolution to `resolve-package-path` [@stefanpenner](https://github.com/stefanpenner)
- [#8515](https://github.com/ember-cli/ember-cli/pull/8515) Corrected tiny typo in JSDoc [@rbarbey](https://github.com/rbarbey)
- [#8517](https://github.com/ember-cli/ember-cli/pull/8517) Add `--output-path` to test command [@step2yeung](https://github.com/step2yeung)
- [#8528](https://github.com/ember-cli/ember-cli/pull/8528) Ensure packager respects source map config when concatting [@stefanpenner](https://github.com/stefanpenner)
- [#8540](https://github.com/ember-cli/ember-cli/pull/8540) Fixed broken npm link documentation link [@yohanmishkin](https://github.com/yohanmishkin)

Thank you to all who took the time to contribute!


## v3.9.0

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v3.8.2...v3.9.0)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v3.8.2...v3.9.0)

#### Community Contributions

- [#8444](https://github.com/ember-cli/ember-cli/pull/8444) Ensure Node 11 does not issue warning [@jeanduplessis](https://github.com/jeanduplessis)
- [#8425](https://github.com/ember-cli/ember-cli/pull/8425) Update Broccoli website URL [@hakilebara](https://github.com/hakilebara)
- [#8383](https://github.com/ember-cli/ember-cli/pull/8383) Update `ember-welcome-page` usage to angle brackets [@locks](https://github.com/locks)
- [#8435](https://github.com/ember-cli/ember-cli/pull/8435) Don't add extra slash in dist paths [@knownasilya](https://github.com/knownasilya)
- [#8358](https://github.com/ember-cli/ember-cli/pull/8358) In MU apps, exclude TS test files from the app JS file [@ppcano](https://github.com/ppcano)
- [#8373](https://github.com/ember-cli/ember-cli/pull/8373) package-info-cache: Add `heimdalljs-logger` logging [@Turbo87](https://github.com/Turbo87)
- [#8379](https://github.com/ember-cli/ember-cli/pull/8379) Fix the module path for MU non-acceptance tests [@ppcano](https://github.com/ppcano)
- [#8387](https://github.com/ember-cli/ember-cli/pull/8387) Fix non-acceptance tests for MU addons [@ppcano](https://github.com/ppcano)
- [#8289](https://github.com/ember-cli/ember-cli/pull/8289) Include addon styles for MU apps [@ppcano](https://github.com/ppcano)
- [#8399](https://github.com/ember-cli/ember-cli/pull/8399) Improve jQuery deprecation message [@simonihmig](https://github.com/simonihmig)
- [#8397](https://github.com/ember-cli/ember-cli/pull/8397) Update packages [@btecu](https://github.com/btecu)
- [#8432](https://github.com/ember-cli/ember-cli/pull/8432) Fix how MU blueprints fetches `ember-source` [@ppcano](https://github.com/ppcano)
- [#8433](https://github.com/ember-cli/ember-cli/pull/8433) MU blueprints: enable `EMBER_MODULE_UNIFICATION` feature flag [@ppcano](https://github.com/ppcano)
- [#8414](https://github.com/ember-cli/ember-cli/pull/8414) `preprocessTemplates` is called only once in MU layout [@ppcano](https://github.com/ppcano)
- [#8434](https://github.com/ember-cli/ember-cli/pull/8434) Fix comment on the `environment.js` blueprint files [@ppcano](https://github.com/ppcano)

Thank you to all who took the time to contribute!

## v3.8.3

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v3.8.2...v3.8.3)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v3.8.2...v3.8.3)

#### Community Contributions

- [#8631](https://github.com/ember-cli/ember-cli/pull/8631) Add CI testing for Node 12. [@rwjblue](https://github.com/rwjblue)

Thank you to all who took the time to contribute!

## v3.8.2

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v3.8.1...v3.8.2)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v3.8.1...v3.8.2)

#### Community Contributions

- [#8482](https://github.com/ember-cli/ember-cli/pull/8482) Update `ember-ajax` in blueprints and tests [@boris-petrov](https://github.com/boris-petrov)
- [#8370](https://github.com/ember-cli/ember-cli/pull/8370) Use `moduleName()` for templates [@pzuraq](https://github.com/pzuraq)
- [#8556](https://github.com/ember-cli/ember-cli/pull/8556) Ensure packager respects source map config when concatting [@stefanpenner](https://github.com/stefanpenner)

Thank you to all who took the time to contribute!


## v3.8.1

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v3.8.0...v3.8.1)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v3.8.0...v3.8.1)

#### Community Contributions

- [#8261](https://github.com/ember-cli/ember-cli/pull/8261) add server/**/*.js to eslint node files for app [@kellyselden](https://github.com/kellyselden)
- [#8467](https://github.com/ember-cli/ember-cli/pull/8467) Ensure npm version is available during ember new / ember install foo. [@rwjblue](https://github.com/rwjblue)

Thank you to all who took the time to contribute!


## v3.8.0

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v3.7.1...v3.8.0)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v3.7.1...v3.8.0)

#### Community Contributions

- [#8175](https://github.com/ember-cli/ember-cli/pull/8175) Do not watch `tests` directory when tests are disabled [@f1sherman](https://github.com/f1sherman)
- [#8052](https://github.com/ember-cli/ember-cli/pull/8052) Use non-greedy pattern for `{{content-for}}` [@mpirio](https://github.com/mpirio)
- [#8325](https://github.com/ember-cli/ember-cli/pull/8325) Add contributing guidelines section to Docs [@jamesgeorge007](https://github.com/jamesgeorge007)
- [#8326](https://github.com/ember-cli/ember-cli/pull/8326) package.json: Move `fixturify` to `devDependencies` [@Turbo87](https://github.com/Turbo87)
- [#8329](https://github.com/ember-cli/ember-cli/pull/8329) livereload-server: Fix logger output [@Turbo87](https://github.com/Turbo87)
- [#8328](https://github.com/ember-cli/ember-cli/pull/8328) tasks/server: Remove obsolete `exists-sync` dependency declaration [@Turbo87](https://github.com/Turbo87)
- [#8313](https://github.com/ember-cli/ember-cli/pull/8313) Update ember-ajax to v4.x [@maxwondercorn](https://github.com/maxwondercorn)
- [#8309](https://github.com/ember-cli/ember-cli/pull/8309) blueprints/addon: Add Contributing section [@knownasilya](https://github.com/knownasilya)
- [#8327](https://github.com/ember-cli/ember-cli/pull/8327) Improve `ember-cli` entry file [@Turbo87](https://github.com/Turbo87)
- [#8330](https://github.com/ember-cli/ember-cli/pull/8330) blueprints/app/gitignore: Ignore Yarn PnP files [@Turbo87](https://github.com/Turbo87)
- [#8331](https://github.com/ember-cli/ember-cli/pull/8331) Update `ember-cli-dependency-checker` to v3.1.0 [@Turbo87](https://github.com/Turbo87)
- [#8323](https://github.com/ember-cli/ember-cli/pull/8323) Dynamically fetch the `ember-source` version for MU blueprints [@ppcano](https://github.com/ppcano)
- [#8427](https://github.com/ember-cli/ember-cli/pull/8427) Fix install warnings for @babel/core [@jrjohnson](https://github.com/jrjohnson)

Thank you to all who took the time to contribute!


## v3.7.1

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v3.7.0...v3.7.1)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v3.7.0...v3.7.1)

#### Community Contributions

- [#8357](https://github.com/ember-cli/ember-cli/pull/8357) blueprints/addon: Fix incorrect job formatting in `.travis.yml` config [@buschtoens](https://github.com/buschtoens)

Thank you to all who took the time to contribute!


## v3.7.0

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v3.6.1...v3.7.0)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v3.6.1...v3.7.0)

#### Community Contributions

- [#8262](https://github.com/ember-cli/ember-cli/pull/8262) spelling fix [@jfdnc](https://github.com/jfdnc)
- [#8264](https://github.com/ember-cli/ember-cli/pull/8264) Remove redundant _requireBuildPackages and format comments [@xg-wang](https://github.com/xg-wang)
- [#8275](https://github.com/ember-cli/ember-cli/pull/8275) Fix dead link in CONTRIBUTING.md [@hakilebara](https://github.com/hakilebara)
- [#8279](https://github.com/ember-cli/ember-cli/pull/8279) CHANGELOG: Drop releases before v2.8.0 [@Turbo87](https://github.com/Turbo87)
- [#8286](https://github.com/ember-cli/ember-cli/pull/8286) Provide a compatibility section in addon READMEs [@kennethlarsen](https://github.com/kennethlarsen)
- [#8296](https://github.com/ember-cli/ember-cli/pull/8296) Add ember-source@3.4 LTS ember-try scenario. [@rwjblue](https://github.com/rwjblue)
- [#8297](https://github.com/ember-cli/ember-cli/pull/8297) Remove last usage of Babel 6. [@rwjblue](https://github.com/rwjblue)
- [#8299](https://github.com/ember-cli/ember-cli/pull/8299) remove ember-lts-2.16 ember-try scenario [@kellyselden](https://github.com/kellyselden)
- [#8308](https://github.com/ember-cli/ember-cli/pull/8308) ignore .env* files [@kellyselden](https://github.com/kellyselden)
- [#8351](https://github.com/ember-cli/ember-cli/pull/8351) Update Ember and Ember Data to v3.7.0 [@Turbo87](https://github.com/Turbo87)
- [#8352](https://github.com/ember-cli/ember-cli/pull/8352) Fix `relative-module-paths` caching [@Turbo87](https://github.com/Turbo87)

Thank you to all who took the time to contribute!


## v3.6.1

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v3.6.0...v3.6.1)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v3.6.0...v3.6.1)

#### Community Contributions

- [#8288](https://github.com/ember-cli/ember-cli/pull/8288) Add `ember-default` scenario to `ember-try` config again [@bendemboski](https://github.com/bendemboski)
- [#8296](https://github.com/ember-cli/ember-cli/pull/8296) Add ember-source@3.4 LTS ember-try scenario. [@rwjblue](https://github.com/rwjblue)

Thank you to all who took the time to contribute!


## v3.6.0

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v3.5.1...v3.6.0)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v3.5.1...v3.6.0)

#### Community Contributions

- [#7958](https://github.com/ember-cli/ember-cli/pull/7958) Gather doc files in docs directory [@dcyriller](https://github.com/dcyriller)
- [#8032](https://github.com/ember-cli/ember-cli/pull/8032) Update minimum broccoli-viz version [@gandalfar](https://github.com/gandalfar)
- [#7974](https://github.com/ember-cli/ember-cli/pull/7974) Prevent double builds in CI for branches pushed by owner [@rwjblue](https://github.com/rwjblue)
- [#8096](https://github.com/ember-cli/ember-cli/pull/8096) Use regex to parse /livereload urls [@SparshithNR](https://github.com/SparshithNR)
- [#8086](https://github.com/ember-cli/ember-cli/pull/8086) Prefer walk-sync for AssetPrinterSize (speeds things up) [@stefanpenner](https://github.com/stefanpenner)
- [#8108](https://github.com/ember-cli/ember-cli/pull/8108) Put `package-info-cache` warnings under `DEBUG` control [@dcombslinkedin](https://github.com/dcombslinkedin)
- [#8203](https://github.com/ember-cli/ember-cli/pull/8203) Move contribution info away from `README` to `CONTRIBUTING` [@kennethlarsen/feature](https://github.com/kennethlarsen/feature)
- [#8147](https://github.com/ember-cli/ember-cli/pull/8147) Bump ember-cli-babel@7 in application blueprint [@SergeAstapov](https://github.com/SergeAstapov)
- [#8142](https://github.com/ember-cli/ember-cli/pull/8142) Fix yarn test failures [@abhilashlr](https://github.com/abhilashlr)
- [#8138](https://github.com/ember-cli/ember-cli/pull/8138) Remove ember-ajax from addon blueprint [@initram](https://github.com/initram)
- [#8143](https://github.com/ember-cli/ember-cli/pull/8143) adding fix to use NULL nodeModuleList to optimize when dealing with non-addons [@dcombslinkedin](https://github.com/dcombslinkedin)
- [#8179](https://github.com/ember-cli/ember-cli/pull/8179) Do not include `.jshintrc` and `.eslintrc` when generating `lib` or `packages` [@ppcano](https://github.com/ppcano)
- [#8162](https://github.com/ember-cli/ember-cli/pull/8162) remove any /* eslint-env node */ [@kellyselden](https://github.com/kellyselden)
- [#8174](https://github.com/ember-cli/ember-cli/pull/8174) Fix links in Addon API docs header [@dfreeman](https://github.com/dfreeman)
- [#8171](https://github.com/ember-cli/ember-cli/pull/8171) Add `--ssl` options to `ember test` [@nathanhammond](https://github.com/nathanhammond)
- [#8165](https://github.com/ember-cli/ember-cli/pull/8165) Remove unused "ember-default" scenario [@kellyselden](https://github.com/kellyselden)
- [#8202](https://github.com/ember-cli/ember-cli/pull/8202) Specify explicit ember-cli version in project update instructions [@nickschot](https://github.com/nickschot)
- [#8277](https://github.com/ember-cli/ember-cli/pull/8277) DefaultPackager: Move `addon-test-support` out of the `tests` folder [@Turbo87](https://github.com/Turbo87)
- [#8278](https://github.com/ember-cli/ember-cli/pull/8278) DefaultPackager: Fix addon preprocessing [@Turbo87](https://github.com/Turbo87)
- [#8287](https://github.com/ember-cli/ember-cli/pull/8287) blueprints/app: Update Ember and Ember Data to v3.6.0 [@Turbo87](https://github.com/Turbo87)

Thank you to all who took the time to contribute!


## v3.5.1

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v3.5.0...v3.5.1)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v3.5.0...v3.5.1)

#### Community Contributions

- [#8127](https://github.com/ember-cli/ember-cli/pull/8127) Fix eslint errors in new app [@Gaurav0](https://github.com/Gaurav0)
- [#8130](https://github.com/ember-cli/ember-cli/pull/8130) Use regex to parse /livereload urls [@rwjblue](https://github.com/rwjblue)
- [#8141](https://github.com/ember-cli/ember-cli/pull/8141) Use `debug` for `package-info-cache` messages [@stefanpenner](https://github.com/stefanpenner)
- [#8150](https://github.com/ember-cli/ember-cli/pull/8150) Fix `toTree()` with custom paths [@wagenet](https://github.com/wagenet)

Thank you to all who took the time to contribute!


## v3.5.0

The following changes are required if you are upgrading from the previous
version:

- Users
  + [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v3.4.3...v3.5.0)
  + Upgrade your project's ember-cli version - [docs](https://ember-cli.com/user-guide/#upgrading)
- Addon Developers
  + [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v3.4.3...v3.5.0)
  + No changes required
- Core Contributors
  + No changes required

#### Community Contributions

- [#8079](https://github.com/ember-cli/ember-cli/pull/8079) add .template-lintrc.js to npmignore [@kellyselden](https://github.com/kellyselden)
- [#8083](https://github.com/ember-cli/ember-cli/pull/8083) Catch InvalidNodeError for Broccoli 2.0 and fallback to broccoli-builder [@oligriffiths](https://github.com/oligriffiths)
- [#8117](https://github.com/ember-cli/ember-cli/pull/8117) Do not ignore dotfiles in ESLint [@Gaurav0](https://github.com/Gaurav0)
- [#7365](https://github.com/ember-cli/ember-cli/pull/7365) Migrate from ember-cli-qunit to ember-qunit. [@rwjblue](https://github.com/rwjblue)
- [#8062](https://github.com/ember-cli/ember-cli/pull/8062) Add `yarn.lock` to `.npmignore` [@Turbo87](https://github.com/Turbo87)
- [#8064](https://github.com/ember-cli/ember-cli/pull/8064) Update `qunit-dom` to v0.8.0 [@Turbo87](https://github.com/Turbo87)
- [#8067](https://github.com/ember-cli/ember-cli/pull/8067) Less restrictive blueprints - change how addons are identified [@scalvert](https://github.com/scalvert)
- [#8068](https://github.com/ember-cli/ember-cli/pull/8068) Enable BROCCOLI_2 and SYSTEM_TEMP experiments by default. [@rwjblue](https://github.com/rwjblue)
- [#8069](https://github.com/ember-cli/ember-cli/pull/8069) Adding back feature to customization of serveURL [@SparshithNR](https://github.com/SparshithNR)
- [#7798](https://github.com/ember-cli/ember-cli/pull/7798) Add Broccoli 2.0 support [@oligriffiths](https://github.com/oligriffiths)
- [#7916](https://github.com/ember-cli/ember-cli/pull/7916) Support node-http-proxy timeout options [@jboler](https://github.com/jboler)
- [#7937](https://github.com/ember-cli/ember-cli/pull/7937) Update fallback default browser targets from IE9 -> IE11. [@arthirm](https://github.com/arthirm)
- [#7984](https://github.com/ember-cli/ember-cli/pull/7984) Reject when command args validation fails [@zonkyio](https://github.com/zonkyio)
- [#7946](https://github.com/ember-cli/ember-cli/pull/7946) upgrade ember-cli-htmlbars to 3.x [@stefanpenner](https://github.com/stefanpenner)
- [#8000](https://github.com/ember-cli/ember-cli/pull/8000) Adding `--in` option to `ember generate` and `ember destroy` to allow blueprint generation for in repo addons in custom paths. [@scalvert](https://github.com/scalvert)
- [#8028](https://github.com/ember-cli/ember-cli/pull/8028) Add `public` to the list of disallowed application names [@twokul](https://github.com/twokul)

Thank you to all who took the time to contribute!


## v3.4.4

#### Blueprint Changes

- [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v3.4.3...v3.4.4)
- [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v3.4.3...v3.4.4)

#### Community Contributions

- [#8277](https://github.com/ember-cli/ember-cli/pull/8277) DefaultPackager: Move `addon-test-support` out of the `tests` folder [@Turbo87](https://github.com/Turbo87)
- [#8278](https://github.com/ember-cli/ember-cli/pull/8278) DefaultPackager: Fix addon preprocessing [@Turbo87](https://github.com/Turbo87)

Thank you to all who took the time to contribute!


## v3.4.3

The following changes are required if you are upgrading from the previous
version:

- Users
  + [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v3.4.2...v3.4.3)
  + Upgrade your project's ember-cli version - [docs](https://ember-cli.com/user-guide/#upgrading)
- Addon Developers
  + [`ember new` diff](https://github.com/ember-cli/ember-addon-output/compare/v3.4.2...v3.4.3)
  + No changes required
- Core Contributors
  + No changes required

#### Community Contributions

- [#8044](https://github.com/ember-cli/ember-cli/pull/8044) Fix livereload issues when SSL is enabled. [@SparshithNR](https://github.com/SparshithNR)
- [#8046](https://github.com/ember-cli/ember-cli/pull/8046) Do not to fail to build if `tests` folder is not present [@twokul](https://github.com/twokul)
- [#8047](https://github.com/ember-cli/ember-cli/pull/8047) Fix `app.import` transforms for tests [@twokul](https://github.com/twokul)
- [#8048](https://github.com/ember-cli/ember-cli/pull/8048) Make sure app content always "wins" over addon content. [@twokul](https://github.com/twokul)
- [#8057](https://github.com/ember-cli/ember-cli/pull/8057) Ensure livereload support does not break proxied websockets. [@rwjblue](https://github.com/rwjblue)
- [#8058](https://github.com/ember-cli/ember-cli/pull/8058) Tweak invalid / missing package log output to be more actionable [@dcombslinkedin](https://github.com/dcombslinkedin)

Thank you to all who took the time to contribute!

## v3.4.2

The following changes are required if you are upgrading from the previous
version:

- Users
  + [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v3.4.1...v3.4.2)
  + Upgrade your project's ember-cli version - [docs](https://ember-cli.com/user-guide/#upgrading)
- Addon Developers
  + [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v3.4.1...v3.4.2)
  + No changes required
- Core Contributors
  + No changes required

#### Community Contributions

- [#8024](https://github.com/ember-cli/ember-cli/pull/8024) [BUGFIX] Remove 2.12 scenario from travis.yml [@cibernox](https://github.com/cibernox)
- [#8033](https://github.com/ember-cli/ember-cli/pull/8033) Restore `styles` behaviour [@twokul](https://github.com/twokul)
- [#8038](https://github.com/ember-cli/ember-cli/pull/8038) Ensure livereload proxy is scoped to only live reload prefix. [@rwjblue](https://github.com/rwjblue)

Thank you to all who took the time to contribute!

## v3.4.1

The following changes are required if you are upgrading from the previous
version:

- Users
  + [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v3.3.0...v3.4.1)
  + Upgrade your project's ember-cli version - [docs](https://ember-cli.com/user-guide/#upgrading)
- Addon Developers
  + [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v3.3.0...v3.4.1)
- Core Contributors
  + No changes required

#### Community Contributions

- [#7791](https://github.com/ember-cli/ember-cli/pull/7791) Add Node 10 to support matrix [@stefanpenner](https://github.com/stefanpenner)
- [#7803](https://github.com/ember-cli/ember-cli/pull/7803) Migrate to using Travis stages [@rwjblue](https://github.com/rwjblue)
- [#7808](https://github.com/ember-cli/ember-cli/pull/7808) Drop Node 4 support [@Turbo87](https://github.com/Turbo87)
- [#7947](https://github.com/ember-cli/ember-cli/pull/7947) Add support for in repo addons in non-conventional directories [@scalvert](https://github.com/scalvert)
- [#7954](https://github.com/ember-cli/ember-cli/pull/7954) Add template linting [@rwjblue](https://github.com/rwjblue)
- [#7956](https://github.com/ember-cli/ember-cli/pull/7956) Embrace stages in CI [@rwjblue](https://github.com/rwjblue)
- [#7977](https://github.com/ember-cli/ember-cli/pull/7977) Use existing build from specified path [@SparshithNR](https://github.com/SparshithNR)
- [#7997](https://github.com/ember-cli/ember-cli/pull/7997) Update `ember-data` and `ember-source` to 3.4.0 [@btecu](https://github.com/btecu)
- [#8019](https://github.com/ember-cli/ember-cli/pull/8019) Revert "[PERF] Speed up package info cache" [@rwjblue](https://github.com/rwjblue)
- [#8013](https://github.com/ember-cli/ember-cli/pull/8013) Fix SASS compilation issues [@twokul](https://github.com/twokul)

Thank you to all who took the time to contribute!

## v3.4.0

This version was unpublished from NPM because the published tar file contained a
bug. NPM is write-only (that is you can unpublish a package but you cannot
re-publish it with the same version) and that leaves us with only one option:
publish a new version. We effectively fast-forwarding to `3.4.1`.

## v3.4.0-beta.3

The following changes are required if you are upgrading from the previous
version:

- Users
  + Upgrade your project's ember-cli version - [docs](https://ember-cli.com/user-guide/#upgrading)
- Addon Developers
  + No changes required
- Core Contributors
  + No changes required

#### Community Contributions

- [#7952](https://github.com/ember-cli/ember-cli/pull/7952) [BUGFIX release] Fix crash when tree objects are used in config [@kanongil](https://github.com/kanongil)
- [#7962](https://github.com/ember-cli/ember-cli/pull/7962) Dependency updates... [@rwjblue](https://github.com/rwjblue)
- [#7965](https://github.com/ember-cli/ember-cli/pull/7965) Don’t produce duplicate warnings when invoking findAddonByName with a… [@stefanpenner](https://github.com/ember-cli)
- [#7966](https://github.com/ember-cli/ember-cli/pull/7966) adding flag to stop repeated dumping of same package errors [@dcombslinkedin](https://github.com/dcombslinkedin)
- [#7969](https://github.com/ember-cli/ember-cli/pull/7969) Update addon.js [@stefanpenner](https://github.com/ember-cli)
- [#7970](https://github.com/ember-cli/ember-cli/pull/7970) Fix findAddonByName in beta. [@rwjblue](https://github.com/rwjblue)
- [#7977](https://github.com/ember-cli/ember-cli/pull/7977) Use existing build from specified path, --path option added [@SparshithNR](https://github.com/SparshithNR)
- [#7979](https://github.com/ember-cli/ember-cli/pull/7979) Stabilize + Lock-down add-on discovery order. [@stefanpenner](https://github.com/ember-cli)
- [#7983](https://github.com/ember-cli/ember-cli/pull/7983) Remove unneeded logging. [@stefanpenner](https://github.com/ember-cli)

Thank you to all who took the time to contribute!

## v3.4.0-beta.2

The following changes are required if you are upgrading from the previous
version:

- Users
  + [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v3.4.0-beta.1...v3.4.0-beta.2)
  + Upgrade your project's ember-cli version - [docs](https://ember-cli.com/user-guide/#upgrading)
- Addon Developers
  + [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v3.4.0-beta.1...v3.4.0-beta.2)
  + No changes required
- Core Contributors
  + No changes required

#### Community Contributions

- [#7902](https://github.com/ember-cli/ember-cli/pull/7902) add .eslintignore to .npmignore [@kellyselden](https://github.com/kellyselden)
- [#7904](https://github.com/ember-cli/ember-cli/pull/7904) further unify all our `.*ignore` files [@kellyselden](https://github.com/kellyselden)
- [#7905](https://github.com/ember-cli/ember-cli/pull/7905) Fix release branch tests [@kellyselden](https://github.com/kellyselden)
- [#7917](https://github.com/ember-cli/ember-cli/pull/7917) Adding entries for the package-info-cache work to the contribution list [@dcombslinkedin](https://github.com/dcombslinkedin)
- [#7940](https://github.com/ember-cli/ember-cli/pull/7940) Enable LiveReload and normal app server to share a single port. [@SparshithNR](https://github.com/SparshithNR)
- [#7947](https://github.com/ember-cli/ember-cli/pull/7947) Adding support for in repo addons in non-conventional directories [@scalvert](https://github.com/scalvert)
- [#7949](https://github.com/ember-cli/ember-cli/pull/7949) Upgrade blueprint dependency versions [@stefanpenner](https://github.com/stefanpenner)
- [#7950](https://github.com/ember-cli/ember-cli/pull/7950) Better handle ambiguity between package.json and index.js name field. [@rwjblue](https://github.com/rwjblue)
  - Changes the addon blueprint to ensure name property just references the package.json's name
  - Introduce a hard error when locally developing an addon whose `package.json` name differs from `index.js` name.
  - Updates `Project.prototype.findAddonByName` / `Addon.prototype.findAddonByName` to handle the changes to mentioned above. Specifically, `findAddonByName` will prefer exact matches to the `package.json` name over exact matches in `index.js` name.
- [#7954](https://github.com/ember-cli/ember-cli/pull/7954) Add template linting. [@rwjblue](https://github.com/rwjblue)
- [#7956](https://github.com/ember-cli/ember-cli/pull/7956) Embrace stages in CI. [@rwjblue](https://github.com/rwjblue)

Thank you to all who took the time to contribute!

## v3.4.0-beta.1

The following changes are required if you are upgrading from the previous
version:

- Users
  + [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v3.3.0...v3.4.0-beta.1)
  + Upgrade your project's ember-cli version - [docs](https://ember-cli.com/user-guide/#upgrading)
- Addon Developers
  + [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v3.3.0...v3.4.0-beta.1)
- Core Contributors
  + No changes required

#### Community Contributions

- [#7792](https://github.com/ember-cli/ember-cli/pull/7792) Add node 10 to test matrix [@stefanpenner](https://github.com/stefanpenner)
- [#7801](https://github.com/ember-cli/ember-cli/pull/7801) Update node support policy docs. [@rwjblue](https://github.com/rwjblue)
- [#7804](https://github.com/ember-cli/ember-cli/pull/7804) removing extra `app` folder check and error message [@stonecircle](https://github.com/stonecircle)

Thank you to all who took the time to contribute!

## v3.3.0

The following changes are required if you are upgrading from the previous
version:

- Users
  + [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v3.2.0...v3.3.0)
  + Upgrade your project's ember-cli version - [docs](https://ember-cli.com/user-guide/#upgrading)
- Addon Developers
  + [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v3.2.0...v3.3.0)
- Core Contributors
  + No changes required

## v3.2.0

The following changes are required if you are upgrading from the previous
version:

- Users
  + [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v3.1.4...v3.2.0)
  + Upgrade your project's ember-cli version - [docs](https://ember-cli.com/user-guide/#upgrading)
- Addon Developers
  + [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v3.1.4...v3.2.0)
- Core Contributors
  + No changes required

#### Community Contributions

- [#7560](https://github.com/ember-cli/ember-cli/pull/7560) Migrate to new format for mode specific arguments in testem config. [@rwjblue](https://github.com/rwjblue)
- [#7621](https://github.com/ember-cli/ember-cli/pull/7621) Take newer symlink-or-copy [@ef4](https://github.com/ef4)
- [#7698](https://github.com/ember-cli/ember-cli/pull/7698) Update `ember-cli-qunit` dependency [@CodingItWrong](https://github.com/CodingItWrong)
- [#7729](https://github.com/ember-cli/ember-cli/pull/7729) package-info-cache (fast package caching) [@dcombslinkedin](https://github.com/dcombslinkedin)
- [#7809](https://github.com/ember-cli/ember-cli/pull/7809) Do not attempt to compress server sent events. [@rwjblue](https://github.com/rwjblue)
- [#7811](https://github.com/ember-cli/ember-cli/pull/7811) replace TRAVIS with CI [@kellyselden](https://github.com/kellyselden)
- [#7813](https://github.com/ember-cli/ember-cli/pull/7813) speed up addon initialization by using PackageInfoCache instead of Addon.lookup [@dcombslinkedin](https://github.com/dcombslinkedin)
- [#7833](https://github.com/ember-cli/ember-cli/pull/7833) blueprints/addon: Add `yarn.lock` file to `.npmignore` [@Turbo87](https://github.com/Turbo87)
- [#7836](https://github.com/ember-cli/ember-cli/pull/7836) tests: Increase timeout for linting tests [@Turbo87](https://github.com/Turbo87)
- [#7857](https://github.com/ember-cli/ember-cli/pull/7857) Filter out blacklisted addons before calling included hook [@dnachev](https://github.com/dnachev)
- [#7880](https://github.com/ember-cli/ember-cli/pull/7880) testem: Improve Chrome command line flags [@stefanpenner](https://github.com/stefanpenner)

Thank you to all who took the time to contribute!

## v3.2.0-beta.2

The following changes are required if you are upgrading from the previous
version:

- Users
  + [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v3.2.0-beta.1...v3.2.0-beta.2)
  + Upgrade your project's ember-cli version - [docs](https://ember-cli.com/user-guide/#upgrading)
- Addon Developers
  + [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v3.2.0-beta.1...v3.2.0-beta.2)
- Core Contributors
  + No changes required

#### Community Contributions

- [#7792](https://github.com/ember-cli/ember-cli/pull/7792) Add node 10 to test matrix [@stefanpenner](https://github.com/stefanpenner)
- [#7801](https://github.com/ember-cli/ember-cli/pull/7801) Update node support policy docs. [@rwjblue](https://github.com/rwjblue)
- [#7804](https://github.com/ember-cli/ember-cli/pull/7804) removing extra `app` folder check and error message [@stonecircle](https://github.com/stonecircle)

Thank you to all who took the time to contribute!


## v3.2.0-beta.1

The following changes are required if you are upgrading from the previous
version:

- Users
  + [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v3.1.2...v3.2.0-beta.1)
  + Upgrade your project's ember-cli version - [docs](https://ember-cli.com/user-guide/#upgrading)
- Addon Developers
  + [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v3.1.2...v3.2.0-beta.1)
- Core Contributors
  + No changes required

#### Community Contributions

- [#7490](https://github.com/ember-cli/ember-cli/pull/7490) Module Unification Addons [@rwjblue](https://github.com/rwjblue)
- [#7605](https://github.com/ember-cli/ember-cli/pull/7605) blueprints/app: Add `qunit-dom` dependency by default [@Turbo87](https://github.com/Turbo87)
- [#7501](https://github.com/ember-cli/ember-cli/pull/7501) add delayed transpilation [@kellyselden](https://github.com/kellyselden)
- [#7634](https://github.com/ember-cli/ember-cli/pull/7634) Addon._treeFor optimization [@kellyselden](https://github.com/kellyselden)
- [#7635](https://github.com/ember-cli/ember-cli/pull/7635) Packaged Bower [@twokul](https://github.com/twokul)
- [#7637](https://github.com/ember-cli/ember-cli/pull/7637) More comprehensive detect if ember-cli is being run within CI or not. [@stefanpenner](https://github.com/ember-cli)
- [#7641](https://github.com/ember-cli/ember-cli/pull/7641) update console-ui [@kellyselden](https://github.com/kellyselden)
- [#7665](https://github.com/ember-cli/ember-cli/pull/7665) Package config [@twokul](https://github.com/twokul)
- [#7661](https://github.com/ember-cli/ember-cli/pull/7661) Double linting test timeout [@ro0gr](https://github.com/ro0gr)
- [#7659](https://github.com/ember-cli/ember-cli/pull/7659) Exclude addon-test-support from eslint node files [@kolybasov](https://github.com/kolybasov)
- [#7660](https://github.com/ember-cli/ember-cli/pull/7660) improve logic for if addon is module-unification [@iezer](https://github.com/iezer)
- [#7658](https://github.com/ember-cli/ember-cli/pull/7658) Module Unification Addon blueprint [@cibernox](https://github.com/cibernox)
- [#7654](https://github.com/ember-cli/ember-cli/pull/7654) Package Vendor [@twokul](https://github.com/twokul)
- [#7650](https://github.com/ember-cli/ember-cli/pull/7650) compile all addons at once optimization [@kellyselden](https://github.com/kellyselden)
- [#7655](https://github.com/ember-cli/ember-cli/pull/7655) Package tests [@twokul](https://github.com/twokul)
- [#7649](https://github.com/ember-cli/ember-cli/pull/7649) only use the standard compilers to compile addon code [@kellyselden](https://github.com/kellyselden)
- [#7731](https://github.com/ember-cli/ember-cli/pull/7731) restore `addon-import` logic [@GavinJoyce](https://github.com/GavinJoyce)
- [#7671](https://github.com/ember-cli/ember-cli/pull/7671) Include _super call in example of Addon.included [@jacobq](https://github.com/jacobq)
- [#7667](https://github.com/ember-cli/ember-cli/pull/7667) MU addons must generate a MU dummy app [@cibernox](https://github.com/cibernox)
- [#7662](https://github.com/ember-cli/ember-cli/pull/7662) Remove redundant checks [@twokul](https://github.com/twokul)
- [#7664](https://github.com/ember-cli/ember-cli/pull/7664) Support serving wasm with application/wasm [@stefanpenner](https://github.com/ember-cli)
- [#7668](https://github.com/ember-cli/ember-cli/pull/7668) Only watch test/dummy/app on addons if it exist [@cibernox](https://github.com/cibernox)
- [#7739](https://github.com/ember-cli/ember-cli/pull/7739) remove config caching [@GavinJoyce](https://github.com/GavinJoyce)
- [#7708](https://github.com/ember-cli/ember-cli/pull/7708) Update default broccoli-asset-rev [@ef4](https://github.com/ef4)
- [#7676](https://github.com/ember-cli/ember-cli/pull/7676) Deprecate ember-cli-babel 5.x [@raytiley](https://github.com/raytiley)
- [#7679](https://github.com/ember-cli/ember-cli/pull/7679) Update init to be src/ friendly [@mixonic](https://github.com/mixonic)
- [#7674](https://github.com/ember-cli/ember-cli/pull/7674) Package Public [@twokul](https://github.com/twokul)
- [#7678](https://github.com/ember-cli/ember-cli/pull/7678) Use a recent release of Ember canary for MU [@stefanpenner](https://github.com/ember-cli)
- [#7742](https://github.com/ember-cli/ember-cli/pull/7742) Package Javascript [@twokul](https://github.com/twokul)
- [#7702](https://github.com/ember-cli/ember-cli/pull/7702) Don't run `addon-import` blueprint if `project.isModuleUnification()` [@GavinJoyce](https://github.com/GavinJoyce)
- [#7685](https://github.com/ember-cli/ember-cli/pull/7685) fix the shims messaging [@kellyselden](https://github.com/kellyselden)
- [#7711](https://github.com/ember-cli/ember-cli/pull/7711) remove exists-sync, use fs.existsSync [@stefanpenner](https://github.com/stefanpenner)
- [#7762](https://github.com/ember-cli/ember-cli/pull/7762) Remove default value for `ember addon --yarn` [@lennyburdette](https://github.com/lennyburdette)
- [#7724](https://github.com/ember-cli/ember-cli/pull/7724) github package was renamed @octokit/rest [@kellyselden](https://github.com/kellyselden)
- [#7758](https://github.com/ember-cli/ember-cli/pull/7758) Allowing cwd to be passed to testem without being overridden by ember-cli [@arthirm](https://github.com/arthirm)
- [#7737](https://github.com/ember-cli/ember-cli/pull/7737) Fix issues identified with "delayed transpilation" system. [@rwjblue](https://github.com/rwjblue)
- [#7735](https://github.com/ember-cli/ember-cli/pull/7735) Disable MU by default [@stefanpenner](https://github.com/stefanpenner)
- [#7753](https://github.com/ember-cli/ember-cli/pull/7753) Update `qunit-dom` dependency [@Turbo87](https://github.com/Turbo87)
- [#7764](https://github.com/ember-cli/ember-cli/pull/7764) Skip running custom "*-addon" blueprint if module unification [@GavinJoyce](https://github.com/GavinJoyce)
- [#7767](https://github.com/ember-cli/ember-cli/pull/7767) Upgrade ember-load-initializers [@GavinJoyce](https://github.com/GavinJoyce)
- [#7768](https://github.com/ember-cli/ember-cli/pull/7768) Don't try to use default addon-import if app is MU [@GavinJoyce](https://github.com/GavinJoyce)
- [#7769](https://github.com/ember-cli/ember-cli/pull/7769) add blueprints to linting coverage [@kellyselden](https://github.com/kellyselden)
- [#7771](https://github.com/ember-cli/ember-cli/pull/7771) forgot .eslintignore in MU [@kellyselden](https://github.com/kellyselden)

Thank you to all who took the time to contribute!


## v3.1.4

- Users
  + [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v3.1.3...v3.1.4)
  + Upgrade your project's ember-cli version - [docs](https://ember-cli.com/user-guide/#upgrading)
- Addon Developers
  + [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v3.1.3...v3.1.4)

#### Community Contributions

- [#7801](https://github.com/ember-cli/ember-cli/pull/7801) Update node support policy docs. [@rwjblue](https://github.com/rwjblue)
- [#7809](https://github.com/ember-cli/ember-cli/pull/7809) Do not attempt to compress server sent events. [@rwjblue](https://github.com/rwjblue)

Thank you to all who took the time to contribute!


## v3.1.3

The following changes are required if you are upgrading from the previous
version:

- Users
  + [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v3.1.2...v3.1.3)
  + Upgrade your project's ember-cli version - [docs](https://ember-cli.com/user-guide/#upgrading)
- Addon Developers
  + [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v3.1.2...v3.1.3)
- Core Contributors
  + No changes required

#### Community Contributions

- [#7769](https://github.com/ember-cli/ember-cli/pull/7769) add blueprints to linting coverage [@kellyselden](https://github.com/kellyselden)
- [#7771](https://github.com/ember-cli/ember-cli/pull/7771) forgot .eslintignore in MU [@kellyselden](https://github.com/kellyselden)
- [#7792](https://github.com/ember-cli/ember-cli/pull/7792) Add node 10 to test matrix [@stefanpenner](https://github.com/stefanpenner)

Thank you to all who took the time to contribute!


## v3.1.2

The following changes are required if you are upgrading from the previous
version:

- Users
  + [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v3.1.1...v3.1.2)
  + Upgrade your project's ember-cli version - [docs](https://ember-cli.com/user-guide/#upgrading)
- Addon Developers
  + [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v3.1.1...v3.1.2)
- Core Contributors
  + No changes required

#### Community Contributions

- [#7749](https://github.com/ember-cli/ember-cli/pull/7749) remove trailing comma [@kellyselden](https://github.com/kellyselden)
- [#7752](https://github.com/ember-cli/ember-cli/pull/7752) Fix test fixtures [@Turbo87](https://github.com/Turbo87)
- [#7759](https://github.com/ember-cli/ember-cli/pull/7759) Ensure css is minified correctly [@twokul](https://github.com/twokul)

Thank you to all who took the time to contribute!


## v3.1.1

The following changes are required if you are upgrading from the previous
version:

- Users
  + [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v3.1.0...v3.1.1)
  + Upgrade your project's ember-cli version - [docs](https://ember-cli.com/user-guide/#upgrading)
- Addon Developers
  + [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v3.1.0...v3.1.1)
- Core Contributors
  + No changes required

#### Community Contributions

- [#7746](https://github.com/ember-cli/ember-cli/pull/7746) Revert "arthirm/testem-bug-fix" [@Turbo87](https://github.com/Turbo87)


## v3.1.0

The following changes are required if you are upgrading from the previous
version:

- Users
  + [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v3.0.3...v3.1.0)
  + Upgrade your project's ember-cli version - [docs](https://ember-cli.com/user-guide/#upgrading)
- Addon Developers
  + [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v3.0.3...v3.1.0)
- Core Contributors
  + No changes required

#### Community Contributions

- [#7670](https://github.com/ember-cli/ember-cli/pull/7670) Support serving wasm with application/wasm [@rwjblue](https://github.com/rwjblue)
- [#7683](https://github.com/ember-cli/ember-cli/pull/7683) Revert "EmberApp: Remove deprecated `contentFor()` hooks" [@stefanpenner](https://github.com/ember-c
li)
- [#7691](https://github.com/ember-cli/ember-cli/pull/7691) Add support for .npmrc for blueprints [@thoov](https://github.com/thoov)
- [#7694](https://github.com/ember-cli/ember-cli/pull/7694) [BACKPORT release] Ensure config() memoizing is considers if the [@stefanpenner](https://github.com/
ember-cli)
- [#7719](https://github.com/ember-cli/ember-cli/pull/7719) reorder ember-cli-build.js in blueprint [@kellyselden](https://github.com/kellyselden)
- [#7720](https://github.com/ember-cli/ember-cli/pull/7720) assert no filters matched [@kellyselden](https://github.com/kellyselden)
- [#7721](https://github.com/ember-cli/ember-cli/pull/7721) update eslint-plugin-node for addons [@stefanpenner](https://github.com/ember-cli)
- [#7728](https://github.com/ember-cli/ember-cli/pull/7728) Passing defaultOptions to testem to prevent the cwd and config_dir set in testem.js from being ov
erridden by ember-cli [@arthirm](https://github.com/arthirm)
- [#7732](https://github.com/ember-cli/ember-cli/pull/7732) Merge pull request #7728 from arthirm/testem-bug-fix [@arthirm](https://github.com/arthirm)
- [#7736](https://github.com/ember-cli/ember-cli/pull/7736) add addon-test-support/index.js to eslint glob bug mitigation [@kellyselden](https://github.com/k
ellyselden)

Thank you to all who took the time to contribute!


## v3.0.4

The following changes are required if you are upgrading from the previous
version:

- Users
  + [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v3.0.3...v3.0.4)
  + Upgrade your project's ember-cli version - [docs](https://ember-cli.com/user-guide/#upgrading)
- Addon Developers
  + [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v3.0.3...v3.0.4)
- Core Contributors
  + No changes required

#### Community Contributions

- [#7746](https://github.com/ember-cli/ember-cli/pull/7746) Revert "arthirm/testem-bug-fix" [@Turbo87](https://github.com/Turbo87)


## v3.0.3

The following changes are required if you are upgrading from the previous
version:

- Users
  + Upgrade your project's ember-cli version - [docs](https://ember-cli.com/user-guide/#upgrading)
- Addon Developers
  + No changes required
- Core Contributors
  + No changes required

#### Community Contributions

- [#7719](https://github.com/ember-cli/ember-cli/pull/7719) reorder ember-cli-build.js in blueprint [@kellyselden](https://github.com/kellyselden)
- [#7720](https://github.com/ember-cli/ember-cli/pull/7720) assert no filters matched [@kellyselden](https://github.com/kellyselden)
- [#7721](https://github.com/ember-cli/ember-cli/pull/7721) update eslint-plugin-node for addons [@stefanpenner](https://github.com/ember-cli)
- [#7728](https://github.com/ember-cli/ember-cli/pull/7728) Passing defaultOptions to testem to prevent the cwd and config_dir set in testem.js from being overridden by ember-cli [@arthirm](https://github.com/arthirm)
- [#7736](https://github.com/ember-cli/ember-cli/pull/7736) add addon-test-support/index.js to eslint glob bug mitigation [@kellyselden](https://github.com/kellyselden)

Thank you to all who took the time to contribute!

## v3.0.2

The following changes are required if you are upgrading from the previous
version:

- Users
  + Upgrade your project's ember-cli version - [docs](https://ember-cli.com/user-guide/#upgrading)
- Addon Developers
  + No changes required
- Core Contributors
  + No changes required

#### Community Contributions

- [#7691](https://github.com/ember-cli/ember-cli/pull/7691) Add support for .npmrc for blueprints [@thoov](https://github.com/thoov)
- [#7694](https://github.com/ember-cli/ember-cli/pull/7694) [BACKPORT release] Ensure config() memoizing is considers if the [@stefanpenner](https://github.com/ember-cli)

Thank you to all who took the time to contribute!

## v3.0.1

The following changes are required if you are upgrading from the previous
version:

- Users
  + Upgrade your project's ember-cli version - [docs](https://ember-cli.com/user-guide/#upgrading)
- Addon Developers
  + No changes required
- Core Contributors
  + No changes required

#### Community Contributions

- [#7626](https://github.com/ember-cli/ember-cli/pull/7626) Fix 'const' declarations in non-strict mode are not supported [@Turbo87](https://github.com/Turbo87)
- [#7627](https://github.com/ember-cli/ember-cli/pull/7627) Fixing test fixtures from 3.0.0 release [@Turbo87](https://github.com/Turbo87)
- [#7670](https://github.com/ember-cli/ember-cli/pull/7670) Support serving wasm with application/wasm [@rwjblue](https://github.com/rwjblue)
- [#7683](https://github.com/ember-cli/ember-cli/pull/7683) Revert "EmberApp: Remove deprecated `contentFor()` hooks" [@stefanpenner](https://github.com/ember-cli)

Thank you to all who took the time to contribute!

## v3.0.0

The following changes are required if you are upgrading from the previous
version:

- Users
  + [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v2.18.2...v3.0.0)
  + Upgrade your project's ember-cli version - [docs](https://ember-cli.com/user-guide/#upgrading)
- Addon Developers
  + [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v2.18.2...v3.0.0)
- Core Contributors
  + No changes required

#### Community Contributions

- [#7566](https://github.com/ember-cli/ember-cli/pull/7566) testem: Use `--no-sandbox` on TravisCI [@Turbo87](https://github.com/Turbo87)
- [#7569](https://github.com/ember-cli/ember-cli/pull/7569) mark "lib" folder as node style in eslint for apps [@kellyselden](https://github.com/kellyselden)
- [#7589](https://github.com/ember-cli/ember-cli/pull/7589) [BACKPORT release] upgrade testem [@stefanpenner](https://github.com/ember-cli)
- [#7594](https://github.com/ember-cli/ember-cli/pull/7594) Install optional dependencies when creating a new project [@stefanpenner](https://github.com/ember-cli)
- [#7610](https://github.com/ember-cli/ember-cli/pull/7610) Change isMainVendorFile check [@twokul](https://github.com/twokul/twokul)
- [#7447](https://github.com/ember-cli/ember-cli/pull/7447) Remove ember-cli-legacy-blueprints. [@rwjblue](https://github.com/rwjblue)
- [#7528](https://github.com/ember-cli/ember-cli/pull/7528) EmberApp: Overwrite `app/config/environment` in `tests.js` [@Turbo87](https://github.com/Turbo87)
- [#7536](https://github.com/ember-cli/ember-cli/pull/7536) Avoid bower usage in config/ember-try.js. [@rwjblue](https://github.com/rwjblue)
- [#7546](https://github.com/ember-cli/ember-cli/pull/7546) Remove unused testing helper files. [@rwjblue](https://github.com/rwjblue)
- [#7548](https://github.com/ember-cli/ember-cli/pull/7548) Make async/await work nicely by default. [@rwjblue](https://github.com/rwjblue)
- [#7549](https://github.com/ember-cli/ember-cli/pull/7549) Use `sudo: required` to work around issue in CI. [@rwjblue](https://github.com/rwjblue)
- [#7553](https://github.com/ember-cli/ember-cli/pull/7553) Remove embertest from ESLint configuration. [@rwjblue](https://github.com/rwjblue)
- [#7554](https://github.com/ember-cli/ember-cli/pull/7554) Make ember-try a direct addon dependency. [@rwjblue](https://github.com/rwjblue)
- [#7522](https://github.com/ember-cli/ember-cli/pull/7522) utilities: Remove deprecated `deprecateUI()` function [@Turbo87](https://github.com/Turbo87)
- [#7502](https://github.com/ember-cli/ember-cli/pull/7502) Cleanup and correct node-support.md. [@stefanpenner](https://github.com/ember-cli)
- [#7487](https://github.com/ember-cli/ember-cli/pull/7487) [BUGFIX] give `ember new` error messages consistent color [@GavinJoyce](https://github.com/GavinJoyce)
- [#7479](https://github.com/ember-cli/ember-cli/pull/7479) Improve default addon README [@Turbo87](https://github.com/Turbo87)
- [#7512](https://github.com/ember-cli/ember-cli/pull/7512) fix alpha ordering in npmignore [@stefanpenner](https://github.com/ember-cli)
- [#7520](https://github.com/ember-cli/ember-cli/pull/7520) Remove deprecated commands [@Turbo87](https://github.com/Turbo87)
- [#7523](https://github.com/ember-cli/ember-cli/pull/7523) Remove deprecated code from `EmberApp` class [@Turbo87](https://github.com/Turbo87)
- [#7524](https://github.com/ember-cli/ember-cli/pull/7524) Remove deprecated `Blueprint` code [@Turbo87](https://github.com/Turbo87)
- [#7525](https://github.com/ember-cli/ember-cli/pull/7525) Remove deprecated `Project` and `Addon` code [@Turbo87](https://github.com/Turbo87)
- [#7527](https://github.com/ember-cli/ember-cli/pull/7527) EmberApp: Remove deprecated `contentFor()` hooks [@Turbo87](https://github.com/Turbo87)

Thank you to all who took the time to contribute!


## v2.18.2

The following changes are required if you are upgrading from the previous
version:

- Users
  + [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v2.18.1...v2.18.2)
  + Upgrade your project's ember-cli version - [docs](https://ember-cli.com/user-guide/#upgrading)
- Addon Developers
  + [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v2.18.1...v2.18.2)
- Core Contributors
  + No changes required

#### Community Contributions

- [#7569](https://github.com/ember-cli/ember-cli/pull/7569) mark "lib" folder as node style in eslint for apps [@kellyselden](https://github.com/kellyselden)
- [#7589](https://github.com/ember-cli/ember-cli/pull/7589) upgrade testem [@stefanpenner](https://github.com/stefanpenner)
- [#7594](https://github.com/ember-cli/ember-cli/pull/7594) Install optional dependencies when creating a new project [@tomdale](https://github.com/tomdale)

Thank you to all who took the time to contribute!


## v2.18.1

The following changes are required if you are upgrading from the previous
version:

- Users
  + [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v2.18.0...v2.18.1)
  + Upgrade your project's ember-cli version - [docs](https://ember-cli.com/user-guide/#upgrading)
- Addon Developers
  + [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v2.18.0...v2.18.1)
- Core Contributors
  + No changes required

#### Community Contributions

- [#7566](https://github.com/ember-cli/ember-cli/pull/7566) testem: Use `--no-sandbox` on TravisCI [@Turbo87](https://github.com/Turbo87)

Thank you to all who took the time to contribute!


## v2.18.0

The following changes are required if you are upgrading from the previous
version:

- Users
  + [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v2.17.2...v2.18.0)
  + Upgrade your project's ember-cli version - [docs](https://ember-cli.com/user-guide/#upgrading)
- Addon Developers
  + [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v2.17.2...v2.18.0)
- Core Contributors
  + No changes required

#### Community Contributions

- [#7489](https://github.com/ember-cli/ember-cli/pull/7489) Fix regression with scoped package name mismatches [@rwwagner90](https://github.com/rwwagner90)
- [#7507](https://github.com/ember-cli/ember-cli/pull/7507) Ensure testing honors config/environment settings. [@rwjblue](https://github.com/rwjblue)
- [#7513](https://github.com/ember-cli/ember-cli/pull/7513) fix alpha ordering in npmignore [@kellyselden](https://github.com/kellyselden)
- [#7516](https://github.com/ember-cli/ember-cli/pull/7516) Fix `ember new --yarn` not using yarn [@Turbo87](https://github.com/Turbo87)
- [#7529](https://github.com/ember-cli/ember-cli/pull/7529) Backport & fixup linting changes. [@rwjblue](https://github.com/rwjblue)
- [#7474](https://github.com/ember-cli/ember-cli/pull/7474) Give plugins and extends their own lines [@rwwagner90](https://github.com/rwwagner90)
- [#7475](https://github.com/ember-cli/ember-cli/pull/7475) don't treat strings as regex in insertIntoFile [@kellyselden](https://github.com/kellyselden)
- [#7477](https://github.com/ember-cli/ember-cli/pull/7477) Restore `separator: '\n;'` to vendor JS concat [@kellyselden/lenny](https://github.com/kellyselden/lenny)
- [#7478](https://github.com/ember-cli/ember-cli/pull/7478) Remove obsolete CONFIG_CACHING feature flag [@Turbo87](https://github.com/Turbo87)
- [#7481](https://github.com/ember-cli/ember-cli/pull/7481) NpmInstallTask: `useYarn` from constructor args [@lennyburdette](https://github.com/lennyburdette)
- [#7395](https://github.com/ember-cli/ember-cli/pull/7395) Make "testdouble" dependency optional in MockProcess class [@ro0gr](https://github.com/ro0gr)
- [#7382](https://github.com/ember-cli/ember-cli/pull/7382) add option to not create file [@kellyselden](https://github.com/kellyselden)
- [#7385](https://github.com/ember-cli/ember-cli/pull/7385) remove node 7 testing [@kellyselden](https://github.com/kellyselden)
- [#6955](https://github.com/ember-cli/ember-cli/pull/6955) Discover dependencies of npm-linked addons [@ef4](https://github.com/ef4)
- [#7164](https://github.com/ember-cli/ember-cli/pull/7164) Fix generate command when both usePods option and --pod argument is used [@emrekutlu](https://github.com/emrekutlu)
- [#7428](https://github.com/ember-cli/ember-cli/pull/7428) Fix bad recursion in ember-cli-shims detection [@cibernox](https://github.com/cibernox)
- [#7419](https://github.com/ember-cli/ember-cli/pull/7419) Delete crossdomain.xml [@sandstrom](https://github.com/sandstrom)
- [#7424](https://github.com/ember-cli/ember-cli/pull/7424) Adding documentation for experiments [@sangm](https://github.com/sangm)
- [#7414](https://github.com/ember-cli/ember-cli/pull/7414) Fixes Project#hasDependencies to only check for dependencies instead … [@MiguelMadero/mmadero](https://github.com/MiguelMadero/mmadero)
- [#7406](https://github.com/ember-cli/ember-cli/pull/7406) Remove livereload url from output [@topaxi](https://github.com/topaxi)
- [#7401](https://github.com/ember-cli/ember-cli/pull/7401) Resolve node modules correctly [@ef4](https://github.com/ef4)
- [#7443](https://github.com/ember-cli/ember-cli/pull/7443) Use `overrides` for a single `.eslintrc.js`. [@rwjblue](https://github.com/rwjblue)
- [#7435](https://github.com/ember-cli/ember-cli/pull/7435) add ember-try ignores to npmignore [@kellyselden](https://github.com/kellyselden)
- [#7432](https://github.com/ember-cli/ember-cli/pull/7432) Avoid publishing massive temp folder leaked by ember-try [@ef4](https://github.com/ef4)
- [#7438](https://github.com/ember-cli/ember-cli/pull/7438) skip uninstall if no matching package is installed [@makepanic](https://github.com/makepanic)
- [#7455](https://github.com/ember-cli/ember-cli/pull/7455) Add eslint-plugin-ember to default linting config. [@rwjblue](https://github.com/rwjblue)
- [#7456](https://github.com/ember-cli/ember-cli/pull/7456) Use fs-extra's `ensureDir` to avoid race condition in `mk-tmp-dir-in`. [@rwjblue](https://github.com/rwjblue)
- [#7457](https://github.com/ember-cli/ember-cli/pull/7457) Avoid directly requiring `blueprints/app/files/package.json`. [@rwjblue](https://github.com/rwjblue)

Thank you to all who took the time to contribute!


## 2.17.2

The following changes are required if you are upgrading from the previous
version:

- Users
  + [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v2.17.1...v2.17.2)
  + Upgrade your project's ember-cli version - [docs](https://ember-cli.com/user-guide/#upgrading)
- Addon Developers
  + [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v2.17.1...v2.17.2)
  + No changes required
- Core Contributors
  + No changes required

#### Community Contributions

- [#7489](https://github.com/ember-cli/ember-cli/pull/7489) Fix regression with scoped package name mismatches [@rwwagner90](https://github.com/rwwagner90)
- [#7507](https://github.com/ember-cli/ember-cli/pull/7507) Ensure testing honors config/environment settings. [@rwjblue](https://github.com/rwjblue)
- [#7513](https://github.com/ember-cli/ember-cli/pull/7513) fix alpha ordering in npmignore [@kellyselden](https://github.com/kellyselden)
- [#7516](https://github.com/ember-cli/ember-cli/pull/7516) Fix `ember new --yarn` not using yarn [@Turbo87](https://github.com/Turbo87)

Thank you to all who took the time to contribute!


## 2.17.1

The following changes are required if you are upgrading from the previous
version:

- Users
  + [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v2.17.0...v2.17.1)
  + Upgrade your project's ember-cli version - [docs](https://ember-cli.com/user-guide/#upgrading)
- Addon Developers
  + [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v2.17.0...v2.17.1)
  + No changes required
- Core Contributors
  + No changes required

#### Community Contributions

- [#7475](https://github.com/ember-cli/ember-cli/pull/7475) don't treat strings as regex in insertIntoFile [@kellyselden](https://github.com/kellyselden)
- [#7477](https://github.com/ember-cli/ember-cli/pull/7477) Restore `separator: '\n;'` to vendor JS concat [@lennyburdette](https://github.com/lennyburdette)
- [#7478](https://github.com/ember-cli/ember-cli/pull/7478) Remove obsolete CONFIG_CACHING feature flag [@Turbo87](https://github.com/Turbo87)
- [#7481](https://github.com/ember-cli/ember-cli/pull/7481) NpmInstallTask: `useYarn` from constructor args [@lennyburdette](https://github.com/lennyburdette)

Thank you to all who took the time to contribute!


## 2.17.0

The following changes are required if you are upgrading from the previous
version:

- Users
  + [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v2.16.2...v2.17.0)
  + Upgrade your project's ember-cli version - [docs](https://ember-cli.com/user-guide/#upgrading)
- Addon Developers
  + [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v2.16.2...v2.17.0)
- Core Contributors
  + No changes required

#### Community Contributions

- [#7232](https://github.com/ember-cli/ember-cli/pull/7232) don't compress responses with the x-no-compression response header [@akatov](https://github.com/akatov)
- [#7272](https://github.com/ember-cli/ember-cli/pull/7272) Fixes `undefined` values in merged aliases [@twokul](https://github.com/twokul)
- [#7342](https://github.com/ember-cli/ember-cli/pull/7342) Updating testem.js for the app blueprint [@scalvert](https://github.com/scalvert)
- [#7360](https://github.com/ember-cli/ember-cli/pull/7360) "server" -> "serve" in package.json blueprint [@kellyselden](https://github.com/kellyselden)
- [#7353](https://github.com/ember-cli/ember-cli/pull/7353) remove ember-cli-shim warning [@NullVoxPopuli](https://github.com/NullVoxPopuli)
- [#7369](https://github.com/ember-cli/ember-cli/pull/7369) Fix issue with linting within an addon without an `app/` directory. [@rwjblue](https://github.com/rwjblue)
- [#7372](https://github.com/ember-cli/ember-cli/pull/7372) Fix travis.yml in addon blueprint [@simonihmig](https://github.com/simonihmig)
- [#7377](https://github.com/ember-cli/ember-cli/pull/7377) Invoke transform registeration before included hook is called. [@kratiahuja](https://github.com/kratiahuja)
- [#7378](https://github.com/ember-cli/ember-cli/pull/7378) Ensure test-support and addon-test-support are linted. [@rwjblue](https://github.com/rwjblue)
- [#7381](https://github.com/ember-cli/ember-cli/pull/7381) Changes default Chrome remote debugging port. [@Oreoz](https://github.com/Oreoz)
- [#7409](https://github.com/ember-cli/ember-cli/pull/7409) cherry pick #7382 into beta [@kellyselden](https://github.com/kellyselden)
- [#7416](https://github.com/ember-cli/ember-cli/pull/7416) Add support for Node 9. [@rwjblue](https://github.com/rwjblue)
- [#7417](https://github.com/ember-cli/ember-cli/pull/7417) Issue warning for Node 7. [@rwjblue](https://github.com/rwjblue)
- [#7427](https://github.com/ember-cli/ember-cli/pull/7427) Remove emoji alias [@tristanpemble](https://github.com/tristanpemble)
- [#7430](https://github.com/ember-cli/ember-cli/pull/7430) ember-try: Add `useYarn` flag if necessary [@Turbo87](https://github.com/Turbo87)
- [#7436](https://github.com/ember-cli/ember-cli/pull/7436) retire 2.8, introduce 2.16 [@kellyselden](https://github.com/kellyselden)
- [#7437](https://github.com/ember-cli/ember-cli/pull/7437) Update to ember-cli-qunit@4.1.1. [@rwjblue](https://github.com/rwjblue)
- [#7439](https://github.com/ember-cli/ember-cli/pull/7439) Cherry pick #7432 and #7435 to release [@kellyselden](https://github.com/kellyselden)
- [#7449](https://github.com/ember-cli/ember-cli/pull/7449) Update `ember-cli-shims` to v1.2.0 [@Turbo87](https://github.com/Turbo87)
- [#7460](https://github.com/ember-cli/ember-cli/pull/7460) remove trailing comma from testem.js [@stefanpenner](https://github.com/ember-cli)

Thank you to all who took the time to contribute!


## 2.17.0-beta.2

The following changes are required if you are upgrading from the previous
version:

- Users
  + [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v2.17.0-beta.1...v2.17.0-beta.2)
  + Upgrade your project's ember-cli version - [docs](https://ember-cli.com/user-guide/#upgrading)
- Addon Developers
  + [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v2.17.0-beta.1...v2.17.0-beta.2)
- Core Contributors
  + No changes required

#### Community Contributions

- [#7353](https://github.com/ember-cli/ember-cli/pull/7353) remove ember-cli-shim warning [@NullVoxPopuli](https://github.com/NullVoxPopuli)
- [#7369](https://github.com/ember-cli/ember-cli/pull/7369) Fix issue with linting within an addon without an `app/` directory. [@rwjblue](https://github.com/rwjblue)
- [#7372](https://github.com/ember-cli/ember-cli/pull/7372) Fix travis.yml in addon blueprint [@simonihmig](https://github.com/simonihmig)
- [#7377](https://github.com/ember-cli/ember-cli/pull/7377) Invoke transform registeration before included hook is called. [@kratiahuja](https://github.com/kratiahuja)
- [#7378](https://github.com/ember-cli/ember-cli/pull/7378) Ensure test-support and addon-test-support are linted. [@rwjblue](https://github.com/rwjblue)
- [#7381](https://github.com/ember-cli/ember-cli/pull/7381) Changes default Chrome remote debugging port. [@Oreoz](https://github.com/Oreoz)
- [#7409](https://github.com/ember-cli/ember-cli/pull/7409) cherry pick #7382 into beta [@kellyselden](https://github.com/kellyselden)
- [#7416](https://github.com/ember-cli/ember-cli/pull/7416) Add support for Node 9. [@rwjblue](https://github.com/rwjblue)
- [#7417](https://github.com/ember-cli/ember-cli/pull/7417) Issue warning for Node 7. [@rwjblue](https://github.com/rwjblue)

Thank you to all who took the time to contribute!


## 2.17.0-beta.1

The following changes are required if you are upgrading from the previous
version:

- Users
  + [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v2.16.0...v2.17.0-beta.1)
  + Upgrade your project's ember-cli version - [docs](https://ember-cli.com/user-guide/#upgrading)
- Addon Developers
  + [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v2.16.0...v2.17.0-beta.1)
  + No changes required
- Core Contributors
  + No changes required

#### Community Contributions

- [#7344](https://github.com/ember-cli/ember-cli/pull/7344) Update mocha to the latest version 🚀 [@stefanpenner/greenkeeper](https://github.com/ember-cli/greenkeeper)
- [#7322](https://github.com/ember-cli/ember-cli/pull/7322) [INTERNAL] Update NPM to npm [@kimroen](https://github.com/kimroen)
- [#7232](https://github.com/ember-cli/ember-cli/pull/7232) ENHANCEMENT - don't compress responses with the x-no-compression response header [@akatov](https://github.com/akatov)
- [#7272](https://github.com/ember-cli/ember-cli/pull/7272) Fixes `undefined` values in merged aliases [@twokul](https://github.com/twokul)
- [#7317](https://github.com/ember-cli/ember-cli/pull/7317) [INTERNAL] Introduce `broccoli-assembler` [@twokul](https://github.com/twokul)
- [#7338](https://github.com/ember-cli/ember-cli/pull/7338) [INTERNAL] Port test helpers to class syntax [@twokul](https://github.com/twokul)
- [#7340](https://github.com/ember-cli/ember-cli/pull/7340) bump `rsvp` [@bekzod](https://github.com/bekzod)
- [#7342](https://github.com/ember-cli/ember-cli/pull/7342) Updating testem.js for the app blueprint [@scalvert](https://github.com/scalvert)
- [#7345](https://github.com/ember-cli/ember-cli/pull/7345) correct `rsvp` version in yarn.lock [@bekzod](https://github.com/bekzod)
- [#7360](https://github.com/ember-cli/ember-cli/pull/7360) "server" -> "serve" in package.json blueprint [@kellyselden](https://github.com/kellyselden)
- [#7363](https://github.com/ember-cli/ember-cli/pull/7363) Update to ember-cli-qunit@4.1.0-beta.1. [@rwjblue](https://github.com/rwjblue)
- [#7367](https://github.com/ember-cli/ember-cli/pull/7367) Bump ember-source to 2.17.0-beta.1. [@rwjblue](https://github.com/rwjblue)


Thank you to all who took the time to contribute!

## 2.16.2

The following changes are required if you are upgrading from the previous
version:

- Users
  + [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v2.16.1...v2.16.2)
  + Upgrade your project's ember-cli version - [docs](https://ember-cli.com/user-guide/#upgrading)
- Addon Developers
  + [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v2.16.1...v2.16.2)
  + No changes required
- Core Contributors
  + No changes required

#### Community Contributions

- [#7372](https://github.com/ember-cli/ember-cli/pull/7372) [BUGFIX] Fix travis.yml in addon blueprint [@simonihmig](https://github.com/simonihmig)
- [#7377](https://github.com/ember-cli/ember-cli/pull/7377) [BUGFIX] Invoke transform registeration before included hook is called. [@kratiahuja](https://github.com/kratiahuja)

Thank you to all who took the time to contribute!

## 2.16.1

The following changes are required if you are upgrading from the previous
version:

- Users
  + [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v2.16.0...v2.16.1)
  + Upgrade your project's ember-cli version - [docs](https://ember-cli.com/user-guide/#upgrading)
- Addon Developers
  + [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v2.16.0...v2.16.1)
  + No changes required
- Core Contributors
  + No changes required

#### Community Contributions

- [#7369](https://github.com/ember-cli/ember-cli/pull/7369) Fix issue with linting within an addon without an `app/` directory. [@rwjblue](https://github.com/rwjblue)

Thank you to all who took the time to contribute!

## 2.16.0

The following changes are required if you are upgrading from the previous
version:

- Users
  + [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v2.15.1...v2.16.0)
  + Upgrade your project's ember-cli version - [docs](https://ember-cli.com/user-guide/#upgrading)
- Addon Developers
  + [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v2.15.1...v2.16.0)
  + No changes required
- Core Contributors
  + No changes required

#### Community Contributions

- [#7341](https://github.com/ember-cli/ember-cli/pull/7341) tasks/npm-task: Adjust version constraints to not warn for npm@5 [@Turbo87](https://github.com/Turbo87)
- [#7346](https://github.com/ember-cli/ember-cli/pull/7346) Use "ci" mode for testem.js [@Turbo87](https://github.com/Turbo87)
- [#7348](https://github.com/ember-cli/ember-cli/pull/7348) Update "ember-cli-uglify" to v2.0.0 [@Turbo87](https://github.com/Turbo87)
- [#7349](https://github.com/ember-cli/ember-cli/pull/7349) Limit allowed concurrency in CI environments. [@rwjblue](https://github.com/rwjblue)
- [#7361](https://github.com/ember-cli/ember-cli/pull/7361) Update "ember-data" to v2.16.2 [@Turbo87](https://github.com/Turbo87)
- [#7364](https://github.com/ember-cli/ember-cli/pull/7364) preserve final newline in addon's package.json [@kellyselden](https://github.com/kellyselden)
- [#7316](https://github.com/ember-cli/ember-cli/pull/7316) Bump blueprint to Ember Data 2.15.0 [@locks](https://github.com/locks)
- [#7320](https://github.com/ember-cli/ember-cli/pull/7320) move "private" key in package.json [@kellyselden](https://github.com/kellyselden)
- [#7333](https://github.com/ember-cli/ember-cli/pull/7333) models/project: Use deep cloning instead of freezing the config [@Turbo87](https://github.com/Turbo87)
- [#7178](https://github.com/ember-cli/ember-cli/pull/7178) readme npm/yarn updates with tests [@kellyselden](https://github.com/kellyselden)
- [#6908](https://github.com/ember-cli/ember-cli/pull/6908) Several fixes for the module unification feature flag [@mixonic](https://github.com/mixonic)
- [#7137](https://github.com/ember-cli/ember-cli/pull/7137) add in-app testing page reference [@kellyselden](https://github.com/kellyselden)
- [#7086](https://github.com/ember-cli/ember-cli/pull/7086) Mock process [@ro0gr](https://github.com/ro0gr)
- [#7108](https://github.com/ember-cli/ember-cli/pull/7108) remove unnecessary `.push` [@bekzod](https://github.com/bekzod)
- [#7033](https://github.com/ember-cli/ember-cli/pull/7033) Ensure addon blueprint calls `this.filesPath` [@status200](https://github.com/status200)
- [#7109](https://github.com/ember-cli/ember-cli/pull/7109) Fix `ember install` for scoped packages [@ef4](https://github.com/ef4)
- [#6963](https://github.com/ember-cli/ember-cli/pull/6963) Preserve header key case when serving with proxy [@jpadilla](https://github.com/jpadilla)
- [#7119](https://github.com/ember-cli/ember-cli/pull/7119) added `app` directory for linting [@bekzod](https://github.com/bekzod)
- [#7074](https://github.com/ember-cli/ember-cli/pull/7074) Fix eslint warning on generated config/environment.js [@morhook](https://github.com/morhook)
- [#7065](https://github.com/ember-cli/ember-cli/pull/7065) Set the basePort for livereload from 49153 -> 7020 [@eriktrom](https://github.com/eriktrom)
- [#7239](https://github.com/ember-cli/ember-cli/pull/7239) Remove private `_mergeTrees` function [@twokul](https://github.com/twokul)
- [#7221](https://github.com/ember-cli/ember-cli/pull/7221) Bumps `broccoli-builder` version to include stack traces fix [@twokul](https://github.com/twokul)
- [#7233](https://github.com/ember-cli/ember-cli/pull/7233) Convert blueprints to use modules and bump ember-cli-babel [@rwwagner90](https://github.com/rwwagner90)
- [#7235](https://github.com/ember-cli/ember-cli/pull/7235) bump `ember-cli-lodash-subset` [@bekzod](https://github.com/bekzod)
- [#7227](https://github.com/ember-cli/ember-cli/pull/7227) Don't merge `emberCLITree` twice [@twokul](https://github.com/twokul)
- [#7294](https://github.com/ember-cli/ember-cli/pull/7294) Fix --test-port description [@akashdsouza](https://github.com/akashdsouza)
- [#7259](https://github.com/ember-cli/ember-cli/pull/7259) Convert MarkdownColor to class syntax [@locks](https://github.com/locks)
- [#7244](https://github.com/ember-cli/ember-cli/pull/7244) Using shorthands for functions [@twokul](https://github.com/twokul)
- [#7248](https://github.com/ember-cli/ember-cli/pull/7248) Bump `amd-name-resolver` version to enable parallel babel transpile [@mikrostew](https://github.com/mikrostew)
- [#7245](https://github.com/ember-cli/ember-cli/pull/7245) Add API to allow addons to define and use custom transform with app.import [@kratiahuja](https://github.com/kratiahuja)
- [#7266](https://github.com/ember-cli/ember-cli/pull/7266) Fix JSON format of asset sizes report [@simplabs](https://github.com/simplabs)
- [#7264](https://github.com/ember-cli/ember-cli/pull/7264) Introduces Bundler [@twokul](https://github.com/twokul)
- [#7262](https://github.com/ember-cli/ember-cli/pull/7262) Convert to classes [@twokul](https://github.com/twokul)
- [#7261](https://github.com/ember-cli/ember-cli/pull/7261) double test timeout for install-test-slow [@ro0gr](https://github.com/ro0gr)
- [#7275](https://github.com/ember-cli/ember-cli/pull/7275) Allow server middleware to answer non-get (POST/PATCH...) requests [@cibernox](https://github.com/cibernox)
- [#7269](https://github.com/ember-cli/ember-cli/pull/7269) Extract vendor generation into bundler [@twokul](https://github.com/twokul)
- [#7292](https://github.com/ember-cli/ember-cli/pull/7292) Add Documentation Link and Supported Versions [@CrshOverride](https://github.com/CrshOverride)
- [#7296](https://github.com/ember-cli/ember-cli/pull/7296) Drop un-needed Ember import [@mixonic](https://github.com/mixonic)
- [#7300](https://github.com/ember-cli/ember-cli/pull/7300) Refactor Custom Transformation logic [@sangm](https://github.com/sangm)
- [#7303](https://github.com/ember-cli/ember-cli/pull/7303) Introduces a way to debug application/add-on trees [@twokul](https://github.com/twokul)
- [#7314](https://github.com/ember-cli/ember-cli/pull/7314) Removes babel module transform [@twokul](https://github.com/twokul)
- [#7315](https://github.com/ember-cli/ember-cli/pull/7315) fix image uri [@xg-wang](https://github.com/xg-wang)

Thank you to all who took the time to contribute!


## 2.15.1

The following changes are required if you are upgrading from the previous
version:

- Users
  + [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v2.15.0...v2.15.1)
  + Upgrade your project's ember-cli version - [docs](https://ember-cli.com/user-guide/#upgrading)
- Addon Developers
  + [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v2.15.0...v2.15.1)
  + No changes required
- Core Contributors
  + No changes required

#### Community Contributions

- [#7316](https://github.com/ember-cli/ember-cli/pull/7316) Bump blueprint to Ember Data 2.15.0 [@locks](https://github.com/locks)
- [#7320](https://github.com/ember-cli/ember-cli/pull/7320) move "private" key in package.json [@kellyselden](https://github.com/kellyselden)

Thank you to all who took the time to contribute!


## 2.15.0

The following changes are required if you are upgrading from the previous
version:

- Users
  + [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v2.14.2...v2.15.0)
  + Upgrade your project's ember-cli version - [docs](https://ember-cli.com/user-guide/#upgrading)
- Addon Developers
  + [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v2.14.2...v2.15.0)
  + No changes required
- Core Contributors
  + No changes required

#### Community Contributions

- [#7286](https://github.com/ember-cli/ember-cli/pull/7286) Update `amd-name-resolver` version to enable parallel babel transpile [@mikrostew](https://github.com/mikrostew)
- [#7309](https://github.com/ember-cli/ember-cli/pull/7309) model/project: Freeze app config before caching it [@Turbo87](https://github.com/Turbo87)
- [#7310](https://github.com/ember-cli/ember-cli/pull/7310) models/project: Hide app config caching behind CONFIG_CACHING feature flag [@Turbo87](https://github.com/Turbo87)

Thank you to all who took the time to contribute!


## 2.15.0-beta.2

The following changes are required if you are upgrading from the previous
version:

- Users
  + [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v2.15.0-beta.1...v2.15.0-beta.2)
  + Upgrade your project's ember-cli version - [docs](https://ember-cli.com/user-guide/#upgrading)
- Addon Developers
  + [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v2.15.0-beta.1...v2.15.0-beta.2)
  + No changes required
- Core Contributors
  + No changes required

#### Community Contributions

- [#7210](https://github.com/ember-cli/ember-cli/pull/7210) Ember try remove test [@kellyselden](https://github.com/kellyselden)
- [#7186](https://github.com/ember-cli/ember-cli/pull/7186) node 8 [@stefanpenner](https://github.com/stefanpenner)
- [#7136](https://github.com/ember-cli/ember-cli/pull/7136) ember test work with both —server and —path [@stefanpenner](https://github.com/stefanpenner)
- [#7224](https://github.com/ember-cli/ember-cli/pull/7224) context issue fix [@bekzod](https://github.com/bekzod)
- [#7206](https://github.com/ember-cli/ember-cli/pull/7206) release] remove MODEL_FACTORY_INJECTIONS [@kellyselden](https://github.com/kellyselden)
- [#7205](https://github.com/ember-cli/ember-cli/pull/7205) release] 2 12 lts testing [@kellyselden](https://github.com/kellyselden)
- [#7193](https://github.com/ember-cli/ember-cli/pull/7193) cherry pick "install npm 4 in addon travis using npm" [@kellyselden](https://github.com/kellyselden)
- [#7194](https://github.com/ember-cli/ember-cli/pull/7194) stay in sync with editorconfig and other blueprints regarding newlines [@kellyselden](https://github.com/kellyselden)
- [#7204](https://github.com/ember-cli/ember-cli/pull/7204) release] explain node 4 in addons [@kellyselden](https://github.com/kellyselden)
- [#7208](https://github.com/ember-cli/ember-cli/pull/7208) Fixes typo in babel transpilation options [@pzuraq/bugfix](https://github.com/pzuraq/bugfix)
- [#7231](https://github.com/ember-cli/ember-cli/pull/7231) Don't merge `emberCLITree` twice [@twokul](https://github.com/twokul)
- [#7246](https://github.com/ember-cli/ember-cli/pull/7246) cherry-pick "Bumps `broccoli-builder` version to include stack traces fix [@twokul](https://github.com/twokul)
- [#7270](https://github.com/ember-cli/ember-cli/pull/7270) Cache Project model config. [@stefanpenner](https://github.com/ember-cli)
- [#7273](https://github.com/ember-cli/ember-cli/pull/7273) Asset sizes [@simplabs](https://github.com/simplabs)

Thank you to all who took the time to contribute!


## 2.15.0-beta.1

The following changes are required if you are upgrading from the previous
version:

- Users
  + [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v2.14.0...v2.15.0-beta.1)
  + Upgrade your project's ember-cli version - [docs](https://ember-cli.com/user-guide/#upgrading)
- Addon Developers
  + [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v2.14.0...v2.15.0-beta.1)
  + No changes required
- Core Contributors
  + No changes required

#### Community Contributions

- [#6988](https://github.com/ember-cli/ember-cli/pull/6988) update addon lts testing [@kellyselden](https://github.com/kellyselden)
- [#7132](https://github.com/ember-cli/ember-cli/pull/7132) Bump ember-cli-eslint [@rwwagner90](https://github.com/rwwagner90)
- [#7026](https://github.com/ember-cli/ember-cli/pull/7026) explain node 4 in addons [@kellyselden](https://github.com/kellyselden)
- [#7002](https://github.com/ember-cli/ember-cli/pull/7002) update from npm 2 when using node 4 [@kellyselden](https://github.com/kellyselden)
- [#7014](https://github.com/ember-cli/ember-cli/pull/7014) fixup #6941 [@stefanpenner](https://github.com/stefanpenner)
- [#7025](https://github.com/ember-cli/ember-cli/pull/7025) remove MODEL_FACTORY_INJECTIONS [@stefanpenner](https://github.com/stefanpenner)
- [#7003](https://github.com/ember-cli/ember-cli/pull/7003) Allow node 7.x on Windows [@btecu](https://github.com/btecu)
- [#7090](https://github.com/ember-cli/ember-cli/pull/7090) Documentation around error propagation & version bumps [@twokul](https://github.com/twokul)
- [#7048](https://github.com/ember-cli/ember-cli/pull/7048) Update yarn.lock with latest allowed dependencies. [@rwjblue](https://github.com/rwjblue)
- [#7046](https://github.com/ember-cli/ember-cli/pull/7046) Pass only packages to npm uninstall task that exist [@raido](https://github.com/raido)
- [#7041](https://github.com/ember-cli/ember-cli/pull/7041) Revert rawMode to original value during windows signals cleanup [@ro0gr](https://github.com/ro0gr)
- [#7045](https://github.com/ember-cli/ember-cli/pull/7045) Make app.import() work with files inside `node_modules` [@Turbo87](https://github.com/Turbo87)
- [#7032](https://github.com/ember-cli/ember-cli/pull/7032) BUGFIX Corrected a typo in Windows elevation test error message. [@jpschober](https://github.com/jpschober)
- [#7068](https://github.com/ember-cli/ember-cli/pull/7068) Remove reference to "lib/ext/promise" from docs [@ro0gr](https://github.com/ro0gr)
- [#7057](https://github.com/ember-cli/ember-cli/pull/7057) Use https in references to emberjs website [@ahmadsoe](https://github.com/ahmadsoe)
- [#7056](https://github.com/ember-cli/ember-cli/pull/7056) fix_typos [@fixTypos](https://github.com/fixTypos)
- [#7064](https://github.com/ember-cli/ember-cli/pull/7064) remove the implied npm install and test from travis [@kellyselden](https://github.com/kellyselden)
- [#7054](https://github.com/ember-cli/ember-cli/pull/7054) Allow imports from scoped packages [@dfreeman](https://github.com/dfreeman)
- [#7150](https://github.com/ember-cli/ember-cli/pull/7150) fix typo [@stefanpenner](https://github.com/stefanpenner)
- [#7102](https://github.com/ember-cli/ember-cli/pull/7102) use `.test` instead of `.match` when appropriate [@bekzod](https://github.com/bekzod)
- [#7095](https://github.com/ember-cli/ember-cli/pull/7095) loggers `let` => `const` [@bekzod](https://github.com/bekzod)
- [#7084](https://github.com/ember-cli/ember-cli/pull/7084) change var to let in ARCHITECTURE.md [@ro0gr](https://github.com/ro0gr)
- [#7100](https://github.com/ember-cli/ember-cli/pull/7100) use native `Object.assign` [@bekzod](https://github.com/bekzod)
- [#7101](https://github.com/ember-cli/ember-cli/pull/7101) use `.reduce` in `addonPackages` [@bekzod](https://github.com/bekzod)
- [#7094](https://github.com/ember-cli/ember-cli/pull/7094) concat instead of `unshift each` in `_processedExternalTree` [@bekzod](https://github.com/bekzod)
- [#7080](https://github.com/ember-cli/ember-cli/pull/7080) Node support doc [@stefanpenner](https://github.com/stefanpenner)
- [#7099](https://github.com/ember-cli/ember-cli/pull/7099) use native `[].any` and `Object.keys` [@bekzod](https://github.com/bekzod)
- [#7096](https://github.com/ember-cli/ember-cli/pull/7096) removed redundant `self` references [@bekzod](https://github.com/bekzod)
- [#7081](https://github.com/ember-cli/ember-cli/pull/7081) update deps [@stefanpenner](https://github.com/stefanpenner)
- [#7093](https://github.com/ember-cli/ember-cli/pull/7093) use arrow function in `discoverFromDependencies` [@bekzod](https://github.com/bekzod)
- [#7085](https://github.com/ember-cli/ember-cli/pull/7085) remove "Aligned require statements" style guide [@ro0gr](https://github.com/ro0gr)
- [#7092](https://github.com/ember-cli/ember-cli/pull/7092) avoid extra iteration, use `reduce` instead of `map/filter` combination [@bekzod](https://github.com/bekzod)
- [#7161](https://github.com/ember-cli/ember-cli/pull/7161) Use headless chrome in addon build config [@sivakumar-kailasam](https://github.com/sivakumar-kailasam)
- [#7123](https://github.com/ember-cli/ember-cli/pull/7123) double mocha-eslint test timeout [@ro0gr](https://github.com/ro0gr)
- [#7118](https://github.com/ember-cli/ember-cli/pull/7118) cleanup `appAndDependencies` [@bekzod](https://github.com/bekzod)
- [#7105](https://github.com/ember-cli/ember-cli/pull/7105) use `const` where appropriate [@bekzod](https://github.com/bekzod)
- [#7106](https://github.com/ember-cli/ember-cli/pull/7106) cleanup tangled promise [@bekzod](https://github.com/bekzod)
- [#7114](https://github.com/ember-cli/ember-cli/pull/7114) explain the old code in bin/ember [@kellyselden](https://github.com/kellyselden)
- [#7104](https://github.com/ember-cli/ember-cli/pull/7104) cleanup `addon/dependencies` [@bekzod](https://github.com/bekzod)
- [#7107](https://github.com/ember-cli/ember-cli/pull/7107) cleanup promise chain [@bekzod](https://github.com/bekzod)
- [#7113](https://github.com/ember-cli/ember-cli/pull/7113) simplified promise chain in `git-init` [@bekzod](https://github.com/bekzod)
- [#7110](https://github.com/ember-cli/ember-cli/pull/7110) convert to RSVP promise inside `utilities/execa` [@bekzod](https://github.com/bekzod)
- [#7152](https://github.com/ember-cli/ember-cli/pull/7152) Remove redundant chrome installation since appveyor has latest chrome [@sivakumar-kailasam](https://github.com/sivakumar-kailasam)
- [#7151](https://github.com/ember-cli/ember-cli/pull/7151) Change `broccoli-middleware` to `1.0.0` :tada: [@twokul](https://github.com/twokul)
- [#7148](https://github.com/ember-cli/ember-cli/pull/7148) Replace phantom.js usage with headless chrome [@sivakumar-kailasam](https://github.com/sivakumar-kailasam)
- [#7147](https://github.com/ember-cli/ember-cli/pull/7147) Add Replacer to FileInfo [@stefanpenner](https://github.com/stefanpenner)
- [#7133](https://github.com/ember-cli/ember-cli/pull/7133) ember-cli-dependency-checker major version bump [@kellyselden](https://github.com/kellyselden)
- [#7175](https://github.com/ember-cli/ember-cli/pull/7175) mention chrome is required now [@kellyselden](https://github.com/kellyselden)
- [#7160](https://github.com/ember-cli/ember-cli/pull/7160) link + integrity is currently causing double loads [@stefanpenner](https://github.com/stefanpenner)
- [#7153](https://github.com/ember-cli/ember-cli/pull/7153) Update yarn.lock [@rwjblue](https://github.com/rwjblue)
- [#7180](https://github.com/ember-cli/ember-cli/pull/7180) install npm 4 in addon travis using npm [@kellyselden](https://github.com/kellyselden)
- [#7167](https://github.com/ember-cli/ember-cli/pull/7167) Upgrade testem to allow browser_args in testem.json [@sivakumar-kailasam](https://github.com/sivakumar-kailasam)
- [#7169](https://github.com/ember-cli/ember-cli/pull/7169) Travis multiple blank line cleanup and if block code consolidation [@kellyselden](https://github.com/kellyselden)
- [#7173](https://github.com/ember-cli/ember-cli/pull/7173) Removed unused dependencies [@t-sauer](https://github.com/t-sauer)
- [#7177](https://github.com/ember-cli/ember-cli/pull/7177) verify npm/yarn logic in travis files [@kellyselden](https://github.com/kellyselden)
- [#7181](https://github.com/ember-cli/ember-cli/pull/7181) node 8 but with npm4 [@stefanpenner](https://github.com/stefanpenner)
- [#7195](https://github.com/ember-cli/ember-cli/pull/7195) fix  --non-interactive test regression [@kellyselden](https://github.com/kellyselden)
- [#7196](https://github.com/ember-cli/ember-cli/pull/7196) fix a bad merge conflict resolution [@kellyselden](https://github.com/kellyselden)
- [#7197](https://github.com/ember-cli/ember-cli/pull/7197) use newer yarn on travis [@kellyselden](https://github.com/kellyselden)
- [#7200](https://github.com/ember-cli/ember-cli/pull/7200) verify welcome page logic [@kellyselden](https://github.com/kellyselden)

Thank you to all who took the time to contribute!


## 2.14.2

The following changes are required if you are upgrading from the previous
version:

- Users
  + [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v2.14.1...v2.14.2)
  + Upgrade your project's ember-cli version - [docs](https://ember-cli.com/user-guide/#upgrading)
- Addon Developers
  + [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v2.14.1...v2.14.2)
  + No changes required
- Core Contributors
  + No changes required

#### Community Contributions

- [#7273](https://github.com/ember-cli/ember-cli/pull/7273) Fix --json option for asset sizes command [@simplabs](https://github.com/simplabs)

Thank you to all who took the time to contribute!


## 2.14.1

The following changes are required if you are upgrading from the previous
version:

- Users
  + [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v2.14.0...v2.14.1)
  + Upgrade your project's ember-cli version - [docs](https://ember-cli.com/user-guide/#upgrading)
- Addon Developers
  + [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v2.14.0...v2.14.1)
  + No changes required
- Core Contributors
  + No changes required

#### Community Contributions

- [#7186](https://github.com/ember-cli/ember-cli/pull/7186) [release] node 8 [@stefanpenner](https://github.com/stefanpenner)
- [#7193](https://github.com/ember-cli/ember-cli/pull/7193) cherry pick "install npm 4 in addon travis using npm" [@kellyselden](https://github.com/kellyselden)
- [#7194](https://github.com/ember-cli/ember-cli/pull/7194) stay in sync with editorconfig and other blueprints regarding newlines [@kellyselden](https://github.com/kellyselden)
- [#7204](https://github.com/ember-cli/ember-cli/pull/7204) [bugfix release] explain node 4 in addons [@kellyselden](https://github.com/kellyselden)
- [#7205](https://github.com/ember-cli/ember-cli/pull/7205) [bugfix release] 2 12 lts testing [@kellyselden](https://github.com/kellyselden)
- [#7206](https://github.com/ember-cli/ember-cli/pull/7206) [bugfix release] remove MODEL_FACTORY_INJECTIONS [@kellyselden](https://github.com/kellyselden)
- [#7208](https://github.com/ember-cli/ember-cli/pull/7208) bugfix(legacy-addons): Fixes typo in babel transpilation options [@pzuraq](https://github.com/pzuraq)
- [#7210](https://github.com/ember-cli/ember-cli/pull/7210) [bugfix release] Ember try remove test [@kellyselden](https://github.com/kellyselden)
- [#7246](https://github.com/ember-cli/ember-cli/pull/7246) [BUGFIX release] cherry-pick "Bumps `broccoli-builder` version to include stack traces fix" [@twokul](https://github.com/twokul)

## 2.14.0

The following changes are required if you are upgrading from the previous
version:

- Users
  + [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v2.13.3...v2.14.0)
  + Upgrade your project's ember-cli version - [docs](https://ember-cli.com/user-guide/#upgrading)
- Addon Developers
  + [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v2.13.3...v2.14.0)
  + No changes required
- Core Contributors
  + No changes required

#### Community Contributions

- [#6937](https://github.com/ember-cli/ember-cli/pull/6937) various blueprint cleanup and consistency [@kellyselden](https://github.com/kellyselden)
- [#6862](https://github.com/ember-cli/ember-cli/pull/6862) Update minimum ember-try version. [@rwjblue](https://github.com/rwjblue)
- [#6932](https://github.com/ember-cli/ember-cli/pull/6932) make blueprint files public [@kellyselden](https://github.com/kellyselden)
- [#6874](https://github.com/ember-cli/ember-cli/pull/6874) Add .eslintrc.js files to blueprints [@rwwagner90](https://github.com/rwwagner90)
- [#6868](https://github.com/ember-cli/ember-cli/pull/6868) Add --welcome option to `new` and `init` so that it can be skipped with --no-welcome [@romulomachado](https://github.com/romulomachado)
- [#6873](https://github.com/ember-cli/ember-cli/pull/6873) Add ~ to ember-cli in package.json in blueprints [@rwwagner90](https://github.com/rwwagner90)
- [#6934](https://github.com/ember-cli/ember-cli/pull/6934) missed node 4 - es6 updates in blueprints [@kellyselden](https://github.com/kellyselden)
- [#6890](https://github.com/ember-cli/ember-cli/pull/6890) Replace lib/utilities/DAG.js with dag-map package [@rwwagner90](https://github.com/rwwagner90)
- [#6888](https://github.com/ember-cli/ember-cli/pull/6888) Print out `yarn install` when yarn.lock file is present [@samdemaeyer](https://github.com/samdemaeyer)
- [#6883](https://github.com/ember-cli/ember-cli/pull/6883) broccoli/ember-app: Make app/index.html optional [@Turbo87](https://github.com/Turbo87)
- [#6886](https://github.com/ember-cli/ember-cli/pull/6886) Handle addon constructor errors gracefully [@jsturgis](https://github.com/jsturgis)
- [#6889](https://github.com/ember-cli/ember-cli/pull/6889) Use const/let in all blueprints [@simonihmig](https://github.com/simonihmig)
- [#6938](https://github.com/ember-cli/ember-cli/pull/6938) Add ESLint config to "server" and "lib" blueprints [@kellyselden](https://github.com/kellyselden)
- [#6910](https://github.com/ember-cli/ember-cli/pull/6910) [BUGFIX] Add yuidocs for the addon:init method [@mattmarcum](https://github.com/mattmarcum)
- [#6896](https://github.com/ember-cli/ember-cli/pull/6896) Removed all references to Bower in blueprint README. [@michielboekhoff](https://github.com/michielboekhoff)
- [#6903](https://github.com/ember-cli/ember-cli/pull/6903) remove npm experiment refs [@tylerturdenpants](https://github.com/tylerturdenpants)
- [#6907](https://github.com/ember-cli/ember-cli/pull/6907) Ignore files created by Ember-Try [@elwayman02](https://github.com/elwayman02)
- [#6898](https://github.com/ember-cli/ember-cli/pull/6898) Update ember-export-application-global to babel@6 version. [@rwjblue](https://github.com/rwjblue)
- [#6915](https://github.com/ember-cli/ember-cli/pull/6915) Run YUIDoc on single `it` [@sduquej](https://github.com/sduquej)
- [#6912](https://github.com/ember-cli/ember-cli/pull/6912) Stop creating recursive symlink (addon requiring itself) [@clekstro](https://github.com/clekstro)
- [#6911](https://github.com/ember-cli/ember-cli/pull/6911) Fix dirty git state [@clekstro](https://github.com/clekstro)
- [#6966](https://github.com/ember-cli/ember-cli/pull/6966) ENHANCEMENT: throw when converting `npm install foo` to `yarn install foo` [@pichfl](https://github.com/pichfl)
- [#6940](https://github.com/ember-cli/ember-cli/pull/6940) remove lint filter [@kellyselden](https://github.com/kellyselden)
- [#6936](https://github.com/ember-cli/ember-cli/pull/6936) use RSVP.resolve shorthand [@kellyselden](https://github.com/kellyselden)
- [#6919](https://github.com/ember-cli/ember-cli/pull/6919) Do not use `chalk.white` when displaying asset sizes [@lucasmazza](https://github.com/lucasmazza)
- [#6939](https://github.com/ember-cli/ember-cli/pull/6939) replace ': function(' with '(' [@kellyselden](https://github.com/kellyselden)
- [#6935](https://github.com/ember-cli/ember-cli/pull/6935) use our string style since converted from json [@kellyselden](https://github.com/kellyselden)
- [#6942](https://github.com/ember-cli/ember-cli/pull/6942) object shorthand blueprint cleanup [@kellyselden](https://github.com/kellyselden)
- [#6984](https://github.com/ember-cli/ember-cli/pull/6984) Fix perf-guide to have correct file names for build visualization [@kratiahuja](https://github.com/kratiahuja)
- [#7007](https://github.com/ember-cli/ember-cli/pull/7007) Updated npm version for ember-data to use ~ instead of ^ [@fushi](https://github.com/fushi)
- [#7038](https://github.com/ember-cli/ember-cli/pull/7038) Update "ember-cli-htmlbars" [@stefanpenner](https://github.com/stefanpenner)
- [#7059](https://github.com/ember-cli/ember-cli/pull/7059) Addon#setupPreprocessorRegistry should be invoked after `addon.app` is set. [@stefanpenner](https://github.com/stefanpenner)
- [#7130](https://github.com/ember-cli/ember-cli/pull/7130) yarn: Use --non-interactive flag [@Turbo87](https://github.com/Turbo87)
- [#7191](https://github.com/ember-cli/ember-cli/pull/7191) blueprints/app: Update "ember-source" and "ember-data" to v2.14.0 [@Turbo87](https://github.com/Turbo87)
- [#7192](https://github.com/ember-cli/ember-cli/pull/7192) tests/acceptance: Delete broken "ember generate http-proxy" test [@Turbo87](https://github.com/Turbo87)

Thank you to all who took the time to contribute!


### 2.14.0-beta.2

The following changes are required if you are upgrading from the previous
version:

- Users
  + [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v2.14.0-beta.1...v2.14.0-beta.2)
  + Upgrade your project's ember-cli version - [docs](https://ember-cli.com/user-guide/#upgrading)
- Addon Developers
  + [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v2.14.0-beta.1...v2.14.0-beta.2)
  + No changes required
- Core Contributors
  + No changes required

#### Community Contributions

- [#7007](https://github.com/ember-cli/ember-cli/pull/7007) Updated npm version for ember-data to use ~ instead of ^ [@fushi](https://github.com/fushi)
- [#6996](https://github.com/ember-cli/ember-cli/pull/6996) Update to non-beta version of ember-cli-qunit. [@rwjblue](https://github.com/rwjblue)
- [#6991](https://github.com/ember-cli/ember-cli/pull/6991) cleanup [@stefanpenner](https://github.com/stefanpenner)
- [#7009](https://github.com/ember-cli/ember-cli/pull/7009) fix extra new line and easier to read indentation [@Turbo87](https://github.com/Turbo87)
- [#7011](https://github.com/ember-cli/ember-cli/pull/7011) npmTask should throw when trying to convert `npm install foo` to `yarn install foo` [@Turbo87](https://github.com/Turbo87)
- [#7015](https://github.com/ember-cli/ember-cli/pull/7015) Do not set committer for the initial git commit [@Turbo87](https://github.com/Turbo87)
- [#7023](https://github.com/ember-cli/ember-cli/pull/7023) Allow broccoli-babel-transpiler to float with SemVer. [@rwjblue](https://github.com/rwjblue)
- [#7028](https://github.com/ember-cli/ember-cli/pull/7028) add yarn missing default comment [@kellyselden](https://github.com/kellyselden)
- [#7036](https://github.com/ember-cli/ember-cli/pull/7036) Ensure `lintTree` results cannot clobber tests. [@rwjblue](https://github.com/rwjblue)
- [#7038](https://github.com/ember-cli/ember-cli/pull/7038) Update "ember-cli-htmlbars" [@stefanpenner](https://github.com/stefanpenner)
- [#7049](https://github.com/ember-cli/ember-cli/pull/7049) Prevent warnings from broccoli-babel-transpiler. [@rwjblue](https://github.com/rwjblue)
- [#7051](https://github.com/ember-cli/ember-cli/pull/7051) Corrected a typo in Windows elevation test error message. [@Turbo87](https://github.com/Turbo87)
- [#7052](https://github.com/ember-cli/ember-cli/pull/7052) Pass only package to npm uninstall task that exist [@Turbo87](https://github.com/Turbo87)

Thank you to all who took the time to contribute!


### 2.14.0-beta.1

The following changes are required if you are upgrading from the previous
version:

- Users
  + [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v2.13.0...v2.14.0-beta.1)
  + Upgrade your project's ember-cli version - [docs](https://ember-cli.com/user-guide/#upgrading)
- Addon Developers
  + [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v2.13.0...v2.14.0-beta.1)
  + No changes required
- Core Contributors
  + No changes required

#### Community Contributions

- [#6918](https://github.com/ember-cli/ember-cli/pull/6918) Update markdown-it-terminal to the latest version 🚀 [@stefanpenner](https://github.com/ember-cli)
- [#6862](https://github.com/ember-cli/ember-cli/pull/6862) Update minimum ember-try version. [@rwjblue](https://github.com/rwjblue)
- [#6859](https://github.com/ember-cli/ember-cli/pull/6859) Update fs-extra to the latest version 🚀 [@stefanpenner](https://github.com/ember-cli)
- [#6937](https://github.com/ember-cli/ember-cli/pull/6937) various blueprint cleanup and consistency [@kellyselden](https://github.com/kellyselden)
- [#6874](https://github.com/ember-cli/ember-cli/pull/6874) Add .eslintrc.js files to blueprints [@rwwagner90](https://github.com/rwwagner90)
- [#6868](https://github.com/ember-cli/ember-cli/pull/6868) Add --welcome option to `new` and `init` so that it can be skipped with --no-welcome [@romulomachado](https://github.com/romulomachado)
- [#6873](https://github.com/ember-cli/ember-cli/pull/6873) Add ~ to ember-cli in package.json in blueprints [@rwwagner90](https://github.com/rwwagner90)
- [#6932](https://github.com/ember-cli/ember-cli/pull/6932) make blueprint files public [@kellyselden](https://github.com/kellyselden)
- [#6890](https://github.com/ember-cli/ember-cli/pull/6890) Replace lib/utilities/DAG.js with dag-map package [@rwwagner90](https://github.com/rwwagner90)
- [#6888](https://github.com/ember-cli/ember-cli/pull/6888) Print out `yarn install` when yarn.lock file is present [@samdemaeyer](https://github.com/samdemaeyer)
- [#6883](https://github.com/ember-cli/ember-cli/pull/6883) broccoli/ember-app: Make app/index.html optional [@Turbo87](https://github.com/Turbo87)
- [#6886](https://github.com/ember-cli/ember-cli/pull/6886) Handle addon constructor errors gracefully [@jsturgis](https://github.com/jsturgis)
- [#6889](https://github.com/ember-cli/ember-cli/pull/6889) Use const/let in all blueprints [@simonihmig](https://github.com/simonihmig)
- [#6940](https://github.com/ember-cli/ember-cli/pull/6940) remove lint filter [@kellyselden](https://github.com/kellyselden)
- [#6910](https://github.com/ember-cli/ember-cli/pull/6910) [BUGFIX] Add yuidocs for the addon:init method [@mattmarcum](https://github.com/mattmarcum)
- [#6896](https://github.com/ember-cli/ember-cli/pull/6896) Removed all references to Bower in blueprint README. [@michielboekhoff](https://github.com/michielboekhoff)
- [#6903](https://github.com/ember-cli/ember-cli/pull/6903) remove npm experiment refs [@tylerturdenpants](https://github.com/tylerturdenpants)
- [#6907](https://github.com/ember-cli/ember-cli/pull/6907) Ignore files created by Ember-Try [@elwayman02](https://github.com/elwayman02)
- [#6898](https://github.com/ember-cli/ember-cli/pull/6898) Update ember-export-application-global to babel@6 version. [@rwjblue](https://github.com/rwjblue)
- [#6942](https://github.com/ember-cli/ember-cli/pull/6942) object shorthand blueprint cleanup [@stefanpenner](https://github.com/ember-cli)
- [#6936](https://github.com/ember-cli/ember-cli/pull/6936) use RSVP.resolve shorthand [@kellyselden](https://github.com/kellyselden)
- [#6934](https://github.com/ember-cli/ember-cli/pull/6934) missed node 4 - es6 updates in blueprints [@kellyselden](https://github.com/kellyselden)
- [#6912](https://github.com/ember-cli/ember-cli/pull/6912) Stop creating recursive symlink (addon requiring itself) [@clekstro](https://github.com/clekstro)
- [#6935](https://github.com/ember-cli/ember-cli/pull/6935) use our string style since converted from json [@kellyselden](https://github.com/kellyselden)
- [#6919](https://github.com/ember-cli/ember-cli/pull/6919) Do not use `chalk.white` when displaying asset sizes [@lucasmazza](https://github.com/lucasmazza)
- [#6915](https://github.com/ember-cli/ember-cli/pull/6915) Run YUIDoc on single `it` [@sduquej](https://github.com/sduquej)
- [#6911](https://github.com/ember-cli/ember-cli/pull/6911) Fix dirty git state [@clekstro](https://github.com/clekstro)
- [#6938](https://github.com/ember-cli/ember-cli/pull/6938) Add ESLint config to "server" and "lib" blueprints [@kellyselden](https://github.com/kellyselden)
- [#6939](https://github.com/ember-cli/ember-cli/pull/6939) replace ': function(' with '(' [@kellyselden](https://github.com/kellyselden)
- [#6966](https://github.com/ember-cli/ember-cli/pull/6966) ENHANCEMENT: throw when converting `npm install foo` to `yarn install foo` [@pichfl](https://github.com/pichfl)
- [#6984](https://github.com/ember-cli/ember-cli/pull/6984) Fix perf-guide to have correct file names for build visualization [@kratiahuja](https://github.com/kratiahuja)
- [#6987](https://github.com/ember-cli/ember-cli/pull/6987) Update fs-extra to the latest version 🚀 [@stefanpenner](https://github.com/ember-cli)

Thank you to all who took the time to contribute!


### 2.13.3

The following changes are required if you are upgrading from the previous
version:

- Users
  + [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v2.13.2...v2.13.3)
  + Upgrade your project's ember-cli version - [docs](https://ember-cli.com/user-guide/#upgrading)
- Addon Developers
  + [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v2.13.2...v2.13.3)
  + No changes required
- Core Contributors
  + No changes required

#### Community Contributions

- [#7076](https://github.com/ember-cli/ember-cli/pull/7076) node 8 [@stefanpenner](https://github.com/stefanpenner)
- [#7077](https://github.com/ember-cli/ember-cli/pull/7077) Add reasonable `uglify-js` options. [@rwjblue](https://github.com/rwjblue)

Thank you to all who took the time to contribute!


### 2.13.2

The following changes are required if you are upgrading from the previous
version:

- Users
  + [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v2.13.1...v2.13.2)
  + Upgrade your project's ember-cli version - [docs](https://ember-cli.com/user-guide/#upgrading)
- Addon Developers
  + [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v2.13.1...v2.13.2)
  + No changes required
- Core Contributors
  + No changes required

#### Community Contributions

- [#7023](https://github.com/ember-cli/ember-cli/pull/7023) Allow broccoli-babel-transpiler to float with SemVer. [@rwjblue](https://github.com/rwjblue)
- [#7028](https://github.com/ember-cli/ember-cli/pull/7028) add yarn missing default comment [@kellyselden](https://github.com/kellyselden)
- [#7036](https://github.com/ember-cli/ember-cli/pull/7036) Ensure `lintTree` results cannot clobber tests. [@rwjblue](https://github.com/rwjblue)
- [#7049](https://github.com/ember-cli/ember-cli/pull/7049) Prevent warnings from broccoli-babel-transpiler. [@rwjblue](https://github.com/rwjblue)
- [#7051](https://github.com/ember-cli/ember-cli/pull/7051) Corrected a typo in Windows elevation test error message. [@Turbo87](https://github.com/Turbo87)
- [#7052](https://github.com/ember-cli/ember-cli/pull/7052) Pass only package to npm uninstall task that exist [@Turbo87](https://github.com/Turbo87)

Thank you to all who took the time to contribute!


### 2.13.1

The following changes are required if you are upgrading from the previous
version:

- Users
  + [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v2.13.0...v2.13.1)
  + Upgrade your project's ember-cli version - [docs](https://ember-cli.com/user-guide/#upgrading)
- Addon Developers
  + [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v2.13.0...v2.13.1)
  + No changes required
- Core Contributors
  + No changes required

#### Community Contributions

- [#6991](https://github.com/ember-cli/ember-cli/pull/6991) cleanup [@stefanpenner](https://github.com/stefanpenner)
- [#6996](https://github.com/ember-cli/ember-cli/pull/6996) Update to non-beta version of ember-cli-qunit [@rwjblue](https://github.com/rwjblue)
- [#7009](https://github.com/ember-cli/ember-cli/pull/7009) fix extra new line and easier to read indentation [@Turbo87](https://github.com/Turbo87)
- [#7011](https://github.com/ember-cli/ember-cli/pull/7011) npmTask should throw when trying to convert `npm install foo` to `yarn install foo` [@Turbo87](https://github.com/Turbo87)
- [#7015](https://github.com/ember-cli/ember-cli/pull/7015) Do not set committer for the initial git commit [@Turbo87](https://github.com/Turbo87)

Thank you to all who took the time to contribute!


### 2.13.0

The following changes are required if you are upgrading from the previous
version:

- Users
  + [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v2.12.3...v2.13.0)
  + Upgrade your project's ember-cli version - [docs](https://ember-cli.com/user-guide/#upgrading)
- Addon Developers
  + [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v2.12.3...v2.13.0)
  + No changes required
- Core Contributors
  + No changes required

#### Community Contributions

- [#6978](https://github.com/ember-cli/ember-cli/pull/6978) Update dependencies to Babel 6 versions. [@rwjblue](https://github.com/rwjblue)
- [#6980](https://github.com/ember-cli/ember-cli/pull/6980) Update ember-ajax to v3.0.0. [@rwjblue](https://github.com/rwjblue)
- [#6983](https://github.com/ember-cli/ember-cli/pull/6983) blueprints: Remove Bower from README [@stefanpenner](https://github.com/ember-cli)
- [#6986](https://github.com/ember-cli/ember-cli/pull/6986) Revert nopt dependency update [@calderas](https://github.com/calderas)
- [#6992](https://github.com/ember-cli/ember-cli/pull/6992) blueprints/app: Update "ember-source" and "ember-data" to v2.13.0 [@Turbo87](https://github.com/Turbo87)

Thank you to all who took the time to contribute!


### 2.13.0-beta.4

The following changes are required if you are upgrading from the previous
version:

- Users
  + [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v2.13.0-beta.3...v2.13.0-beta.4)
  + Upgrade your project's ember-cli version - [docs](https://ember-cli.com/user-guide/#upgrading)
- Addon Developers
  + [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v2.13.0-beta.3...v2.13.0-beta.4)
  + No changes required
- Core Contributors
  + No changes required

#### Community Contributions

- [#6944](https://github.com/ember-cli/ember-cli/pull/6944) Include ember-testing.js when using ember-source [@trentmwillis](https://github.com/trentmwillis)
- [#6961](https://github.com/ember-cli/ember-cli/pull/6961) ensure addon.css is always included [@stefanpenner](https://github.com/stefanpenner)
- [#6968](https://github.com/ember-cli/ember-cli/pull/6968) Configure ESLint to parse ES2017 by default [@cibernox](https://github.com/cibernox)
- [#6969](https://github.com/ember-cli/ember-cli/pull/6969) Remove `.bowerrc` from blueprints [@pichfl](https://github.com/pichfl)

Thank you to all who took the time to contribute!


### 2.13.0-beta.3

The following changes are required if you are upgrading from the previous
version:

- Users
  + [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v2.13.0-beta.2...v2.13.0-beta.3)
  + Upgrade your project's ember-cli version - [docs](https://ember-cli.com/user-guide/#upgrading)
- Addon Developers
  + [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v2.13.0-beta.2...v2.13.0-beta.3)
  + No changes required
- Core Contributors
  + No changes required

#### Community Contributions

- [#6901](https://github.com/ember-cli/ember-cli/pull/6901) Update ember-welcome-page to use Babel 6. [@rwjblue](https://github.com/rwjblue)
- [#6904](https://github.com/ember-cli/ember-cli/pull/6904) Update ember-cli-qunit to use Babel 6. [@rwjblue](https://github.com/rwjblue)
- [#6905](https://github.com/ember-cli/ember-cli/pull/6905) Update various addons to use Babel 6. [@rwjblue](https://github.com/rwjblue)
- [#6928](https://github.com/ember-cli/ember-cli/pull/6928) Add 🐹 as "ember" alias [@Turbo87](https://github.com/Turbo87)
- [#6929](https://github.com/ember-cli/ember-cli/pull/6929) Backport fixes to release branch [@Turbo87](https://github.com/Turbo87)

Thank you to all who took the time to contribute!


### 2.13.0-beta.2

The following changes are required if you are upgrading from the previous
version:

- Users
  + [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v2.13.0-beta.1...v2.13.0-beta.2)
  + Upgrade your project's ember-cli version - [docs](https://ember-cli.com/user-guide/#upgrading)
- Addon Developers
  + [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v2.13.0-beta.1...v2.13.0-beta.2)
  + No changes required
- Core Contributors
  + No changes required

#### Community Contributions

- [#6861](https://github.com/ember-cli/ember-cli/pull/6861) Don't generate `addon-config/targets.js` in addons [@cibernox](https://github.com/cibernox)
- [#6871](https://github.com/ember-cli/ember-cli/pull/6871) Use `yarn install --no-lockfile` in travis for addons [@rwwagner90](https://github.com/rwwagner90)
- [#6874](https://github.com/ember-cli/ember-cli/pull/6874) Add .eslintrc.js files to blueprints [@rwwagner90](https://github.com/rwwagner90)
- [#6884](https://github.com/ember-cli/ember-cli/pull/6884) Remove guard in `treeForAddon` around `addon/**/*.js` files. [@rwjblue](https://github.com/rwjblue)
- [#6885](https://github.com/ember-cli/ember-cli/pull/6885) Work around broken bower installation for old npm versions [@Turbo87](https://github.com/Turbo87)

Thank you to all who took the time to contribute!


### 2.13.0-beta.1

The following changes are required if you are upgrading from the previous
version:

- Users
  + [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v2.12.0...v2.13.0-beta.1)
  + Upgrade your project's ember-cli version - [docs](https://ember-cli.com/user-guide/#upgrading)
- Addon Developers
  + [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v2.12.0...v2.13.0-beta.1)
  + No changes required
- Core Contributors
  + No changes required

#### Community Contributions

- [#6795](https://github.com/ember-cli/ember-cli/pull/6795) Cleanup EmberApp class [@Turbo87](https://github.com/Turbo87)
- [#6615](https://github.com/ember-cli/ember-cli/pull/6615) Command interruption [@ro0gr](https://github.com/ro0gr)
- [#6472](https://github.com/ember-cli/ember-cli/pull/6472) add ability to clean up old files in generators [@kellyselden](https://github.com/kellyselden)
- [#6796](https://github.com/ember-cli/ember-cli/pull/6796) Update dependencies to latest versions. [@stefanpenner](https://github.com/ember-cli)
- [#6718](https://github.com/ember-cli/ember-cli/pull/6718) Pass init instrumentation to CLI if we have it [@stefanpenner](https://github.com/ember-cli)
- [#6717](https://github.com/ember-cli/ember-cli/pull/6717) Make instrumentation more resilient to errors [@stefanpenner](https://github.com/ember-cli)
- [#6716](https://github.com/ember-cli/ember-cli/pull/6716) Remove link to transition guide when ember-cli-build.js file is missing [@status200](https://github.com/status200)
- [#6715](https://github.com/ember-cli/ember-cli/pull/6715) Fix build console output when using environment variable [@status200](https://github.com/status200)
- [#6690](https://github.com/ember-cli/ember-cli/pull/6690) BUGFIX #6679 - workaround for tiny-lr not reloading on empty files arguments [@gandalfar](https://github.com/gandalfar)
- [#6617](https://github.com/ember-cli/ember-cli/pull/6617) Remove wasted work around addon's addon trees. [@rwjblue](https://github.com/rwjblue)
- [#6798](https://github.com/ember-cli/ember-cli/pull/6798) Update ember-cli-preprocess-registry to get latest clean-css. [@stefanpenner](https://github.com/ember-cli)
- [#6747](https://github.com/ember-cli/ember-cli/pull/6747) Use EOL to fix one Windows CI failure. [@rwjblue](https://github.com/rwjblue)
- [#6727](https://github.com/ember-cli/ember-cli/pull/6727) remove bower install from travis [@kellyselden](https://github.com/kellyselden)
- [#6745](https://github.com/ember-cli/ember-cli/pull/6745) ensure SIGINT ember serve produces instrumentation [@stefanpenner](https://github.com/ember-cli)
- [#6731](https://github.com/ember-cli/ember-cli/pull/6731) This reverts commit cb6bac632dc8dc1c49b30583f0fa135364c5c408, reversing
changes made to be142aaf7801bf64f4322583c7d82ae7c7066c52. [@rwjblue](https://github.com/rwjblue)
- [#6737](https://github.com/ember-cli/ember-cli/pull/6737) Make project require public [@asakusuma](https://github.com/asakusuma)
- [#6741](https://github.com/ember-cli/ember-cli/pull/6741) addon needs to mirror filesToRemove from app [@kellyselden](https://github.com/kellyselden)
- [#6742](https://github.com/ember-cli/ember-cli/pull/6742) Promote cacheKeyForTree to public API [@trentmwillis](https://github.com/trentmwillis)
- [#6734](https://github.com/ember-cli/ember-cli/pull/6734) chore(package): update broccoli-concat to version 3.1.1 [@stefanpenner](https://github.com/ember-cli)
- [#6739](https://github.com/ember-cli/ember-cli/pull/6739) Remove bower.json files again [@Turbo87](https://github.com/Turbo87)
- [#6728](https://github.com/ember-cli/ember-cli/pull/6728) remove application.hbs newline [@stefanpenner](https://github.com/ember-cli)
- [#6736](https://github.com/ember-cli/ember-cli/pull/6736) start using filesToRemove [@kellyselden](https://github.com/kellyselden)
- [#6748](https://github.com/ember-cli/ember-cli/pull/6748) Use yarn if yarn.lock exists or `--yarn` is used [@Turbo87](https://github.com/Turbo87)
- [#6805](https://github.com/ember-cli/ember-cli/pull/6805) more old file cleanup [@kellyselden](https://github.com/kellyselden)
- [#6789](https://github.com/ember-cli/ember-cli/pull/6789) Support npm packages as `ember new` blueprints [@Turbo87](https://github.com/Turbo87)
- [#6758](https://github.com/ember-cli/ember-cli/pull/6758) Fixes blueprints noop log removals [@gadogado](https://github.com/gadogado)
- [#6768](https://github.com/ember-cli/ember-cli/pull/6768) Normalize end-of-line characters in strings to compare prior to diffing [@koopa](https://github.com/koopa)
- [#6785](https://github.com/ember-cli/ember-cli/pull/6785) Refactor InstallBlueprintTask class [@Turbo87](https://github.com/Turbo87)
- [#6776](https://github.com/ember-cli/ember-cli/pull/6776) Implement targets RFC [@cibernox](https://github.com/cibernox)
- [#6778](https://github.com/ember-cli/ember-cli/pull/6778) Don't print heimdall stack on errors [@stefanpenner](https://github.com/ember-cli)
- [#6766](https://github.com/ember-cli/ember-cli/pull/6766) Remove flagging for `experiments.INSTRUMENTATION`. [@stefanpenner](https://github.com/ember-cli)
- [#6759](https://github.com/ember-cli/ember-cli/pull/6759) Enable instrumentation experiment with public `instrument` method. [@rwjblue](https://github.com/rwjblue)
- [#6756](https://github.com/ember-cli/ember-cli/pull/6756) `yarn upgrade` [@rwjblue](https://github.com/rwjblue)
- [#6754](https://github.com/ember-cli/ember-cli/pull/6754) Interrupt command with an error if no _currentTask [@ro0gr](https://github.com/ro0gr)
- [#6825](https://github.com/ember-cli/ember-cli/pull/6825) EmberApp: Use "src/ui/index.html" if it exists [@Turbo87](https://github.com/Turbo87)
- [#6797](https://github.com/ember-cli/ember-cli/pull/6797) Remove "proxyquire" dependency [@Turbo87](https://github.com/Turbo87)
- [#6792](https://github.com/ember-cli/ember-cli/pull/6792) package.json: Remove "npm" from greenkeeper ignore list [@stefanpenner](https://github.com/ember-cli)
- [#6791](https://github.com/ember-cli/ember-cli/pull/6791) Convert EmberApp and EmberAddon to ES6 classes [@Turbo87](https://github.com/Turbo87)
- [#6840](https://github.com/ember-cli/ember-cli/pull/6840) Add logging for `this.runTask` within commands. [@rwjblue](https://github.com/rwjblue)
- [#6804](https://github.com/ember-cli/ember-cli/pull/6804) Remove missing init instrumentation warning [@stefanpenner](https://github.com/ember-cli)
- [#6800](https://github.com/ember-cli/ember-cli/pull/6800) tests/blueprints: Use arrow functions for callbacks [@Turbo87](https://github.com/Turbo87)
- [#6799](https://github.com/ember-cli/ember-cli/pull/6799) Refactor `capture-exit` usage to avoid releasing exit. [@rwjblue](https://github.com/rwjblue)
- [#6845](https://github.com/ember-cli/ember-cli/pull/6845) Convert more promise chains to coroutines [@Turbo87](https://github.com/Turbo87)
- [#6806](https://github.com/ember-cli/ember-cli/pull/6806) Adds eslint-plugin-mocha [@gadogado](https://github.com/gadogado)
- [#6835](https://github.com/ember-cli/ember-cli/pull/6835) EmberApp: Use "src/ui/styles" over "app/styles" if it exists [@Turbo87](https://github.com/Turbo87)
- [#6824](https://github.com/ember-cli/ember-cli/pull/6824) chore(package): update broccoli-merge-trees to version 1.2.3 [@stefanpenner](https://github.com/ember-cli)
- [#6816](https://github.com/ember-cli/ember-cli/pull/6816) Resolve path when calling UnwatchedDir for Bower [@arthirm](https://github.com/arthirm)
- [#6821](https://github.com/ember-cli/ember-cli/pull/6821) Add tests for EmberApp.index() method [@Turbo87](https://github.com/Turbo87)
- [#6828](https://github.com/ember-cli/ember-cli/pull/6828) Use Babel 6 [@stefanpenner](https://github.com/ember-cli)
- [#6839](https://github.com/ember-cli/ember-cli/pull/6839) Allow `ember new -b <blueprint> foo` to opt-in to yarn by default. [@rwjblue](https://github.com/rwjblue)
- [#6846](https://github.com/ember-cli/ember-cli/pull/6846) tests: Use "chai-as-promised" assertions [@Turbo87](https://github.com/Turbo87)
- [#6847](https://github.com/ember-cli/ember-cli/pull/6847) print the `serving on http://host:port/basePath` after each rebuild [@stefanpenner](https://github.com/ember-cli)
- [#6852](https://github.com/ember-cli/ember-cli/pull/6852) Replace "itr2array" helper with Array.from() [@Turbo87](https://github.com/Turbo87)
- [#6853](https://github.com/ember-cli/ember-cli/pull/6853) tests: Remove unused variables [@Turbo87](https://github.com/Turbo87)
- [#6857](https://github.com/ember-cli/ember-cli/pull/6857) Update testdouble to the latest version 🚀 [@stefanpenner](https://github.com/ember-cli)

Thank you to all who took the time to contribute!


### 2.12.3

The following changes are required if you are upgrading from the previous
version:

- Users
  + [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v2.12.2...v2.12.3)
  + Upgrade your project's ember-cli version - [docs](https://ember-cli.com/user-guide/#upgrading)
- Addon Developers
  + [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v2.12.2...v2.12.3)
  + No changes required
- Core Contributors
  + No changes required

#### Community Contributions

- [#6986](https://github.com/ember-cli/ember-cli/pull/6986) Revert nopt dependency update [@calderas](https://github.com/calderas)

Thank you to all who took the time to contribute!


### 2.12.2

The following changes are required if you are upgrading from the previous
version:

- Users
  + [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v2.12.1...v2.12.2)
  + Upgrade your project's ember-cli version - [docs](https://ember-cli.com/user-guide/#upgrading)
- Addon Developers
  + [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v2.12.1...v2.12.2)
  + No changes required
- Core Contributors
  + No changes required

#### Community Contributions

- [#6929](https://github.com/ember-cli/ember-cli/pull/6929) Backport fixes to release branch [@Turbo87](https://github.com/Turbo87)
- [#6944](https://github.com/ember-cli/ember-cli/pull/6944) Include ember-testing.js when using ember-source [@trentmwillis](https://github.com/trentmwillis)
- [#6974](https://github.com/ember-cli/ember-cli/pull/6974) Unnecessary "ember-cli-eslint" install [@tylerturdenpants](https://github.com/tylerturdenpants)

Thank you to all who took the time to contribute!


### 2.12.1

The following changes are required if you are upgrading from the previous
version:

- Users
  + [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v2.12.0...v2.12.1)
  + Upgrade your project's ember-cli version - [docs](https://ember-cli.com/user-guide/#upgrading)
- Addon Developers
  + [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v2.12.0...v2.12.1)
  + No changes required
- Core Contributors
  + No changes required

#### Community Contributions

- [#6879](https://github.com/ember-cli/ember-cli/pull/6879) Add .eslintrc.js files to blueprints [@rwwagner90](https://github.com/rwwagner90)
- [#6884](https://github.com/ember-cli/ember-cli/pull/6884) Remove guard in `treeForAddon` around `addon/**/*.js` files. [@rwjblue](https://github.com/rwjblue)
- [#6885](https://github.com/ember-cli/ember-cli/pull/6885) Work around broken bower installation for old npm versions [@Turbo87](https://github.com/Turbo87)

Thank you to all who took the time to contribute!


### 2.12.0

The following changes are required if you are upgrading from the previous
version:

- Users
  + [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v2.11.1...v2.12.0)
  + Upgrade your project's ember-cli version - [docs](https://ember-cli.com/user-guide/#upgrading)
- Addon Developers
  + [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v2.11.1...v2.12.0)
  + No changes required
- Core Contributors
  + No changes required

#### Community Contributions

- [#6669](https://github.com/ember-cli/ember-cli/pull/6669) tasks/bower-install: Fix "bower" lookup [@Turbo87](https://github.com/Turbo87)
- [#6606](https://github.com/ember-cli/ember-cli/pull/6606) Instrumentation [@stefanpenner](https://github.com/ember-cli)
- [#6540](https://github.com/ember-cli/ember-cli/pull/6540) removing jshint reference in blueprints [@kellyselden](https://github.com/kellyselden)
- [#5874](https://github.com/ember-cli/ember-cli/pull/5874) Don't process CSS imports by default [@stefanpenner](https://github.com/ember-cli)
- [#6516](https://github.com/ember-cli/ember-cli/pull/6516) Properly call `preprocessTree` / `postprocessTree` for addons. [@rwjblue](https://github.com/rwjblue)
- [#6627](https://github.com/ember-cli/ember-cli/pull/6627) Lazily require `broccoli-babel-transpiler`. [@rwjblue](https://github.com/rwjblue)
- [#6630](https://github.com/ember-cli/ember-cli/pull/6630) [DOC] Update license year [@cjnething](https://github.com/cjnething)
- [#6626](https://github.com/ember-cli/ember-cli/pull/6626) Flesh out `init` instrumentation. [@stefanpenner](https://github.com/ember-cli)
- [#6629](https://github.com/ember-cli/ember-cli/pull/6629) Enable more ESLint rules [@Turbo87](https://github.com/Turbo87)
- [#6624](https://github.com/ember-cli/ember-cli/pull/6624) Update version of ember-cli-eslint used in new applications. [@rwjblue](https://github.com/rwjblue)
- [#6613](https://github.com/ember-cli/ember-cli/pull/6613) Add missing annotations. [@rwjblue](https://github.com/rwjblue)
- [#6625](https://github.com/ember-cli/ember-cli/pull/6625) Update dependencies previous avoided due to Node 0.12 support. [@rwjblue](https://github.com/rwjblue)
- [#6628](https://github.com/ember-cli/ember-cli/pull/6628) Ensure `beforeRun` is included in `command` instrumentation. [@rwjblue](https://github.com/rwjblue)
- [#6684](https://github.com/ember-cli/ember-cli/pull/6684) [fixes #6672] ensure example clearly indicates promise usage [@stefanpenner](https://github.com/ember-cli)
- [#6641](https://github.com/ember-cli/ember-cli/pull/6641) Properly sort the linting rules in the ES6 section. [@rwjblue](https://github.com/rwjblue)
- [#6639](https://github.com/ember-cli/ember-cli/pull/6639) Disable usage of `var`. [@rwjblue](https://github.com/rwjblue)
- [#6633](https://github.com/ember-cli/ember-cli/pull/6633) Split serving assets into two different in-repo addons [@kratiahuja](https://github.com/kratiahuja)
- [#6640](https://github.com/ember-cli/ember-cli/pull/6640) Enable a few additional ES6 linting rules. [@rwjblue](https://github.com/rwjblue)
- [#6634](https://github.com/ember-cli/ember-cli/pull/6634) Remove "ember-cli-app-version" from "addon" blueprint [@Turbo87](https://github.com/Turbo87)
- [#6631](https://github.com/ember-cli/ember-cli/pull/6631) 🏎 Lazily install "bower" if required [@Turbo87](https://github.com/Turbo87)
- [#6636](https://github.com/ember-cli/ember-cli/pull/6636) Use ES6 features [@Turbo87](https://github.com/Turbo87)
- [#6689](https://github.com/ember-cli/ember-cli/pull/6689) Update fs-extra to the latest version 🚀 [@stefanpenner](https://github.com/ember-cli)
- [#6649](https://github.com/ember-cli/ember-cli/pull/6649) Make in-repo-addon blueprint 'use strict'. [@stefanpenner](https://github.com/ember-cli)
- [#6644](https://github.com/ember-cli/ember-cli/pull/6644) Use  ES6 classes for internal classes [@Turbo87](https://github.com/Turbo87)
- [#6646](https://github.com/ember-cli/ember-cli/pull/6646) Fix some of the issues in #6623 [@stefanpenner](https://github.com/ember-cli)
- [#6645](https://github.com/ember-cli/ember-cli/pull/6645) Make project.config() public [@simonihmig](https://github.com/simonihmig)
- [#6647](https://github.com/ember-cli/ember-cli/pull/6647) Convert CoreObject classes to ES6 classes extending CoreObject [@Turbo87](https://github.com/Turbo87)
- [#6699](https://github.com/ember-cli/ember-cli/pull/6699) RELEASE: Make code snippet copy-pasta compatible [@Turbo87](https://github.com/Turbo87)
- [#6663](https://github.com/ember-cli/ember-cli/pull/6663) Add stats and logging for addon tree caching opt out [@trentmwillis](https://github.com/trentmwillis)
- [#6655](https://github.com/ember-cli/ember-cli/pull/6655) Update execa to the latest version 🚀 [@stefanpenner](https://github.com/ember-cli)
- [#6660](https://github.com/ember-cli/ember-cli/pull/6660) Preserve user errors in instrumentation hook [@stefanpenner](https://github.com/ember-cli)
- [#6652](https://github.com/ember-cli/ember-cli/pull/6652) [BUGFIX] Revert "Remove arbitrary *.js filtering for addon tree." [@nathanhammond](https://github.com/nathanhammond)
- [#6654](https://github.com/ember-cli/ember-cli/pull/6654) blueprints/app: Update "ember-cli-qunit" dependency [@Turbo87](https://github.com/Turbo87)
- [#6674](https://github.com/ember-cli/ember-cli/pull/6674) Update core-object to the latest version 🚀 [@stefanpenner](https://github.com/ember-cli)
- [#6685](https://github.com/ember-cli/ember-cli/pull/6685) Revert "remove travis sudo check" [@stefanpenner](https://github.com/ember-cli)
- [#6683](https://github.com/ember-cli/ember-cli/pull/6683) ensure `Task.prototype.run` returns promises [@stefanpenner](https://github.com/ember-cli)
- [#6680](https://github.com/ember-cli/ember-cli/pull/6680) Use global npm with version check [@Turbo87](https://github.com/Turbo87)
- [#6681](https://github.com/ember-cli/ember-cli/pull/6681) Run "ember-cli-eslint" blueprint on "ember init" [@Turbo87](https://github.com/Turbo87)
- [#6678](https://github.com/ember-cli/ember-cli/pull/6678) Avoid error upon registering a heimdall monitor twice. [@rwjblue](https://github.com/rwjblue)
- [#6682](https://github.com/ember-cli/ember-cli/pull/6682) Update the minimum version of ember-try [@kategengler](https://github.com/kategengler)
- [#6671](https://github.com/ember-cli/ember-cli/pull/6671) add description to build environment option [@kellyselden](https://github.com/kellyselden)
- [#6664](https://github.com/ember-cli/ember-cli/pull/6664) Update github to the latest version 🚀 [@stefanpenner](https://github.com/ember-cli)
- [#6731](https://github.com/ember-cli/ember-cli/pull/6731) Revert changes removing `bower.json` from default blueprints. [@rwjblue](https://github.com/rwjblue)
- [#6704](https://github.com/ember-cli/ember-cli/pull/6704) Update lockfile to use latest allowed versions. [@stefanpenner](https://github.com/ember-cli)
- [#6688](https://github.com/ember-cli/ember-cli/pull/6688) Replace custom Promise class with RSVP [@Turbo87](https://github.com/Turbo87)
- [#6696](https://github.com/ember-cli/ember-cli/pull/6696) Add --test-port 0 for random port [@morhook](https://github.com/morhook)
- [#6698](https://github.com/ember-cli/ember-cli/pull/6698) Remove "bower.json" and only create if necessary [@Turbo87](https://github.com/Turbo87)
- [#6692](https://github.com/ember-cli/ember-cli/pull/6692) tests/acceptance/generate: Fix flaky tests [@Turbo87](https://github.com/Turbo87)
- [#6705](https://github.com/ember-cli/ember-cli/pull/6705) add description to serve and test environment option [@kellyselden](https://github.com/kellyselden)
- [#6710](https://github.com/ember-cli/ember-cli/pull/6710) Fix linting issue with beta branch. [@rwjblue](https://github.com/rwjblue)
- [#6770](https://github.com/ember-cli/ember-cli/pull/6770) models/addon: Add @since tag to this.import() [@stefanpenner](https://github.com/ember-cli)
- [#6808](https://github.com/ember-cli/ember-cli/pull/6808) Use `_shouldCompileJS` to guard precompilation of addon JS. [@rwjblue](https://github.com/rwjblue)
- [#6827](https://github.com/ember-cli/ember-cli/pull/6827) Use `amd` for transpiling modules with babel@5. [@stefanpenner](https://github.com/ember-cli)
- [#6830](https://github.com/ember-cli/ember-cli/pull/6830) Revert "Use `amd` for transpiling modules with babel@5." [@stefanpenner](https://github.com/ember-cli)
- [#6856](https://github.com/ember-cli/ember-cli/pull/6856) models/project: Fix dependencies() documentation [@Turbo87](https://github.com/Turbo87)
- [#6860](https://github.com/ember-cli/ember-cli/pull/6860) blueprints/app: Update "ember-source" and "ember-data" to v2.12.0 [@Turbo87](https://github.com/Turbo87)

Thank you to all who took the time to contribute!


### 2.12.0-beta.2

The following changes are required if you are upgrading from the previous
version:

- Users
  + [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v2.12.0-beta.1...v2.12.0-beta.2)
  + Upgrade your project's ember-cli version - [docs](https://ember-cli.com/user-guide/#upgrading)
- Addon Developers
  + [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v2.12.0-beta.1...v2.12.0-beta.2)
  + No changes required
- Core Contributors
  + No changes required

#### Community Contributions

- [#6681](https://github.com/ember-cli/ember-cli/pull/6681) Run "ember-cli-eslint" blueprint on "ember init" [@Turbo87](https://github.com/Turbo87)
- [#6698](https://github.com/ember-cli/ember-cli/pull/6698) Remove "bower.json" and only create if necessary [@Turbo87](https://github.com/Turbo87)
- [#6711](https://github.com/ember-cli/ember-cli/pull/6711) Update `ember-cli-htmlbars-inline-precompile` requirement [@SaladFork](https://github.com/SaladFork)
- [#6720](https://github.com/ember-cli/ember-cli/pull/6720) ignore license change on init [@kellyselden](https://github.com/kellyselden)
- [#6721](https://github.com/ember-cli/ember-cli/pull/6721) use ~ instead of ^ for ember-source [@kellyselden](https://github.com/kellyselden)
- [#6763](https://github.com/ember-cli/ember-cli/pull/6763) Change livereload PortFinder.basePort to 49153 [@Turbo87](https://github.com/Turbo87)
- [#6808](https://github.com/ember-cli/ember-cli/pull/6808) Use `_shouldCompileJS` to guard precompilation of addon JS. [@rwjblue](https://github.com/rwjblue)

Thank you to all who took the time to contribute!


### 2.12.0-beta.1

The following changes are required if you are upgrading from the previous
version:

- Users
  + [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v2.11.0...v2.12.0-beta.1)
  + Upgrade your project's ember-cli version - [docs](https://ember-cli.com/user-guide/#upgrading)
- Addon Developers
  + [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v2.11.0...v2.12.0-beta.1)
  + No changes required
- Core Contributors
  + No changes required

#### Community Contributions

- [#6645](https://github.com/ember-cli/ember-cli/pull/6645) Make project.config() public [@simonihmig](https://github.com/simonihmig)
- [#6540](https://github.com/ember-cli/ember-cli/pull/6540) removing jshint reference in blueprints [@kellyselden](https://github.com/kellyselden)
- [#5874](https://github.com/ember-cli/ember-cli/pull/5874) Don't process CSS imports by default [@wagenet](https://github.com/wagenet)
- [#6516](https://github.com/ember-cli/ember-cli/pull/6516) Properly call `preprocessTree` / `postprocessTree` for addons. [@rwjblue](https://github.com/rwjblue)
- [#6600](https://github.com/ember-cli/ember-cli/pull/6600) Apply clean-base-url to config.rootURL [@nathanhammond](https://github.com/nathanhammond)
- [#6622](https://github.com/ember-cli/ember-cli/pull/6622) Remove support for Node 0.12. [@rwjblue](https://github.com/rwjblue)
- [#6624](https://github.com/ember-cli/ember-cli/pull/6624) Update version of ember-cli-eslint used in new applications. [@rwjblue](https://github.com/rwjblue)
- [#6625](https://github.com/ember-cli/ember-cli/pull/6625) Update dependencies previous avoided due to Node 0.12 support. [@rwjblue](https://github.com/rwjblue)
- [#6633](https://github.com/ember-cli/ember-cli/pull/6633) Split serving assets into two different in-repo addons [@kratiahuja](https://github.com/kratiahuja)
- [#6634](https://github.com/ember-cli/ember-cli/pull/6634) Remove "ember-cli-app-version" from "addon" blueprint [@Turbo87](https://github.com/Turbo87)
- [#6630](https://github.com/ember-cli/ember-cli/pull/6630) [DOC] Update license year [@cjnething](https://github.com/cjnething)
- [#6631](https://github.com/ember-cli/ember-cli/pull/6631) 🏎 Lazily install "bower" if required [@Turbo87](https://github.com/Turbo87)
- [#6636](https://github.com/ember-cli/ember-cli/pull/6636) Use ES6 features [@Turbo87](https://github.com/Turbo87)
- [#6649](https://github.com/ember-cli/ember-cli/pull/6649) Make in-repo-addon blueprint 'use strict'. [@stefanpenner](https://github.com/ember-cli)
- [#6647](https://github.com/ember-cli/ember-cli/pull/6647) Convert CoreObject classes to ES6 classes extending CoreObject [@Turbo87](https://github.com/Turbo87)
- [#6644](https://github.com/ember-cli/ember-cli/pull/6644) Use  ES6 classes for internal classes [@Turbo87](https://github.com/Turbo87)
- [#6654](https://github.com/ember-cli/ember-cli/pull/6654) blueprints/app: Update "ember-cli-qunit" dependency [@Turbo87](https://github.com/Turbo87)
- [#6688](https://github.com/ember-cli/ember-cli/pull/6688) Replace custom Promise class with RSVP [@Turbo87](https://github.com/Turbo87)
- [#6680](https://github.com/ember-cli/ember-cli/pull/6680) Use global npm with version check [@Turbo87](https://github.com/Turbo87)

Thank you to all who took the time to contribute!


### 2.11.1

The following changes are required if you are upgrading from the previous
version:

- Users
  + [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v2.11.0...v2.11.1)
  + Upgrade your project's ember-cli version - [docs](https://ember-cli.com/user-guide/#upgrading)
- Addon Developers
  + [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v2.11.0...v2.11.1)
  + No changes required
- Core Contributors
  + No changes required

#### Community Contributions

- [#6711](https://github.com/ember-cli/ember-cli/pull/6711) Update `ember-cli-htmlbars-inline-precompile` requirement [@SaladFork](https://github.com/SaladFork)
- [#6720](https://github.com/ember-cli/ember-cli/pull/6720) ignore license change on init [@kellyselden](https://github.com/kellyselden)
- [#6721](https://github.com/ember-cli/ember-cli/pull/6721) use ~ instead of ^ for ember-source [@kellyselden](https://github.com/kellyselden)
- [#6763](https://github.com/ember-cli/ember-cli/pull/6763) Change livereload PortFinder.basePort to 49153 [@Turbo87](https://github.com/Turbo87)

Thank you to all who took the time to contribute!


### 2.11.0

The following changes are required if you are upgrading from the previous
version:

- Users
  + [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v2.10.2...v2.11.0)
  + Upgrade your project's ember-cli version - [docs](https://ember-cli.com/user-guide/#upgrading)
- Addon Developers
  + [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v2.10.2...v2.11.0)
  + No changes required
- Core Contributors
  + No changes required

#### Notes:
- This version of Ember CLI _will not officially support Node.js v0.12_ per the [Ember Node.js LTS Support policy](https://emberjs.com/blog/2016/09/07/ember-node-lts-support.html).
- As part of this release we have made the default behavior inclusion of Ember from npm via the `ember-source` npm package.

#### Community Contributions

- [#6531](https://github.com/ember-cli/ember-cli/pull/6531) Update to latest capture-exit, revert work around. [@stefanpenner](https://github.com/rwjblue)
- [#6525](https://github.com/ember-cli/ember-cli/pull/6525) utilities/npm: Run npm commands via "execa" [@Turbo87](https://github.com/Turbo87)
- [#6533](https://github.com/ember-cli/ember-cli/pull/6533) blueprints/addon: Fix path to "ember" executable in ".travis.yml" [@Turbo87](https://github.com/Turbo87)
- [#6536](https://github.com/ember-cli/ember-cli/pull/6536) fix phantom use on travis [@kellyselden](https://github.com/kellyselden)
- [#6537](https://github.com/ember-cli/ember-cli/pull/6537) Prevent deprecation from `ember-cli-babel` config options. [@rwjblue](https://github.com/rwjblue)
- [#6707](https://github.com/ember-cli/ember-cli/pull/6707) Change usage of shims for ember-source@2.11.0 final. [@stefanpenner](https://github.com/rwjblue)
- [#6254](https://github.com/ember-cli/ember-cli/pull/6254) [BUGFIX] Do not rely on ember-resolver, detect bower package instead [@martndemus](https://github.com/martndemus)
- [#6319](https://github.com/ember-cli/ember-cli/pull/6319) Use --save-dev by default when installing addons [@binhums](https://github.com/binhums)
- [#6378](https://github.com/ember-cli/ember-cli/pull/6378) Prepares Ember CLI for new version of ember-welcome-page [@locks](https://github.com/locks)
- [#6460](https://github.com/ember-cli/ember-cli/pull/6460) Refactor processTemplate. [@nathanhammond](https://github.com/nathanhammond)
- [#6385](https://github.com/ember-cli/ember-cli/pull/6385) Respect testem exit code [@johanneswuerbach](https://github.com/johanneswuerbach)
- [#6387](https://github.com/ember-cli/ember-cli/pull/6387) Adds Node 7 to testing matrix [@twokul](https://github.com/twokul)
- [#6388](https://github.com/ember-cli/ember-cli/pull/6388) Adds Node 7 to `engines` in `package.json` [@twokul](https://github.com/twokul)
- [#6407](https://github.com/ember-cli/ember-cli/pull/6407) Improve silent.js Deprecation [@nathanhammond](https://github.com/nathanhammond)
- [#6443](https://github.com/ember-cli/ember-cli/pull/6443) Fix preProcessTree API docs. [@kratiahuja](https://github.com/kratiahuja)
- [#6425](https://github.com/ember-cli/ember-cli/pull/6425) Adding json out for 'ember asset-sizes' [@kiwiupover](https://github.com/kiwiupover)
- [#6423](https://github.com/ember-cli/ember-cli/pull/6423) [BUGFIX] integrate capture exit [@stefanpenner](https://github.com/stefanpenner)
- [#6427](https://github.com/ember-cli/ember-cli/pull/6427) Document outputFile option [@ro0gr](https://github.com/ro0gr)
- [#6436](https://github.com/ember-cli/ember-cli/pull/6436) [BUGFIX] Watch vendor by default. [@nathanhammond](https://github.com/nathanhammond)
- [#6484](https://github.com/ember-cli/ember-cli/pull/6484) [BUGFIX] Fix remaining ember-source issues. [@nathanhammond](https://github.com/nathanhammond)
- [#6453](https://github.com/ember-cli/ember-cli/pull/6453) Avoid creating extraneous merge-trees. [@rwjblue](https://github.com/rwjblue)
- [#6496](https://github.com/ember-cli/ember-cli/pull/6496) [BUGFIX release] Revert the reverted revert. Ember assign not available in all ember try scenarios [@webark](https://github.com/webark)
- [#6482](https://github.com/ember-cli/ember-cli/pull/6482) Cleanup unused deps [@ro0gr](https://github.com/ro0gr)
- [#6475](https://github.com/ember-cli/ember-cli/pull/6475) extract ui to console-ui [@stefanpenner](https://github.com/stefanpenner)
- [#6479](https://github.com/ember-cli/ember-cli/pull/6479) docs: Blueprint:renamedFiles [@les2](https://github.com/les2)

Thank you to all who took the time to contribute!


### 2.10.1

The following changes are required if you are upgrading from the previous
version:

- Users
  + [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v2.10.0...v2.10.1)
  + Upgrade your project's ember-cli version - [docs](http://ember-cli.com/user-guide/#upgrading)
- Addon Developers
  + [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v2.10.0...v2.10.1)
  + No changes required
- Core Contributors
  + No changes required

#### Community Contributions

- [#6485](https://github.com/ember-cli/ember-cli/pull/6485) tests/runner: Fix "capture-exit" compatibility [@Turbo87](https://github.com/Turbo87)
- [#6496](https://github.com/ember-cli/ember-cli/pull/6496) Revert the reverted revert. Ember assign not available in all ember try scenarios [@webark](https://github.com/webark)
- [#6531](https://github.com/ember-cli/ember-cli/pull/6531) Update to latest capture-exit, revert work around. [@rwjblue](https://github.com/rwjblue)
- [#6533](https://github.com/ember-cli/ember-cli/pull/6533) blueprints/addon: Fix path to "ember" executable in ".travis.yml" [@Turbo87](https://github.com/Turbo87)
- [#6536](https://github.com/ember-cli/ember-cli/pull/6536) fix phantom use on travis [@kellyselden](https://github.com/kellyselden)
- [#6693](https://github.com/ember-cli/ember-cli/pull/6693) Backport subprocess invocation of npm to v2.10 [@Turbo87](https://github.com/Turbo87)

Thank you to all who took the time to contribute!


### 2.10.0

The following changes are required if you are upgrading from the previous
version:

- Users
  + [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v2.9.1...v2.10.0)
  + Upgrade your project's ember-cli version - [docs](http://ember-cli.com/user-guide/#upgrading)
- Addon Developers
  + [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v2.9.1...v2.10.0)
  + No changes required
- Core Contributors
  + No changes required

#### Notes:
- This version of Ember CLI _no longer supports Node.js v0.10_ per the [Ember Node.js LTS Support policy](https://emberjs.com/blog/2016/09/07/ember-node-lts-support.html).
- As part of this release we have experimental support for including Ember from npm via the `ember-source` npm package. We hope to discover the gaps during this release cycle and make that the default in a future release.

#### Community Contributions

- [#5994](https://github.com/ember-cli/ember-cli/pull/5994) No 'diff' option when binaries are involved (confirm-dialog). [@fpauser](https://github.com/fpauser)
- [#6241](https://github.com/ember-cli/ember-cli/pull/6241) destroy deletes empty folders [@kellyselden](https://github.com/kellyselden)
- [#6096](https://github.com/ember-cli/ember-cli/pull/6096) Fix and improve Watcher.detectWatcher [@stefanpenner](https://github.com/stefanpenner)
- [#6081](https://github.com/ember-cli/ember-cli/pull/6081) [BUGFIX] Header files import concat [@stefanpenner](https://github.com/stefanpenner)
- [#6296](https://github.com/ember-cli/ember-cli/pull/6296) Include relative path on ember asset-sizes [@josemarluedke](https://github.com/josemarluedke)
- [#6301](https://github.com/ember-cli/ember-cli/pull/6301) [Fixes #6300] consistent concat, regardless of system EOL [@stefanpenner](https://github.com/stefanpenner)
- [#6305](https://github.com/ember-cli/ember-cli/pull/6305) Use Ember.assign for start-app test helper.
- [#6307](https://github.com/ember-cli/ember-cli/pull/6307) Node.js LTS updates. [@nathanhammond](https://github.com/nathanhammond)
- [#6306](https://github.com/ember-cli/ember-cli/pull/6306) [ENHANCEMENT] Use npm 3 [@dfreeman](https://github.com/dfreeman)
- [#6337](https://github.com/ember-cli/ember-cli/pull/6337) DOC: #addBowerPackagesToProject `source` option [@olleolleolle](https://github.com/olleolleolle)
- [#6358](https://github.com/ember-cli/ember-cli/pull/6358) Use secure URLs in docs where possible [@xtian](https://github.com/xtian)
- [#6363](https://github.com/ember-cli/ember-cli/pull/6363) [ENHANCEMENT] Add 2.8-lts scenario to default ember-try config [@BrianSipple](https://github.com/BrianSipple)
- [#6369](https://github.com/ember-cli/ember-cli/pull/6369) Enable ember-source. [@nathanhammond](https://github.com/nathanhammond)

Thank you to all who took the time to contribute!


### 2.10.0-beta.2

The following changes are required if you are upgrading from the previous
version:

- Users
  + [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v2.10.0-beta.1...v2.10.0-beta.2)
  + Upgrade your project's ember-cli version - [docs](http://ember-cli.com/user-guide/#upgrading)
- Addon Developers
  + [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v2.10.0-beta.1...v2.10.0-beta.2)
  + No changes required
- Core Contributors
  + No changes required

#### Notes:
- This version of Ember CLI _no longer supports Node.js v0.10_ per the [Ember Node.js LTS Support policy](https://emberjs.com/blog/2016/09/07/ember-node-lts-support.html).
- As part of this release we have experimental support for including Ember from npm via the `ember-source` npm package. We hope to discover the gaps during this release cycle and make that the default in a future release.

#### Community Contributions

- [#6375](https://github.com/ember-cli/ember-cli/pull/6375) Bump Ember versions. [@nathanhammond](https://github.com/nathanhammond)

Thank you to all who took the time to contribute!


### 2.10.0-beta.1

The following changes are required if you are upgrading from the previous
version:

- Users
  + [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v2.9.0...v2.10.0-beta.1)
  + Upgrade your project's ember-cli version - [docs](http://ember-cli.com/user-guide/#upgrading)
- Addon Developers
  + [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v2.9.0...v2.10.0-beta.1)
  + No changes required
- Core Contributors
  + No changes required

#### Notes:
- This version of Ember CLI _no longer supports Node.js v0.10_ per the [Ember Node.js LTS Support policy](https://emberjs.com/blog/2016/09/07/ember-node-lts-support.html).
- As part of this release we have experimental support for including Ember from npm via the `ember-source` npm package. We hope to discover the gaps during this release cycle and make that the default in a future release.

#### Community Contributions

- [#5994](https://github.com/ember-cli/ember-cli/pull/5994) No 'diff' option when binaries are involved (confirm-dialog). [@fpauser](https://github.com/fpauser)
- [#6241](https://github.com/ember-cli/ember-cli/pull/6241) destroy deletes empty folders [@kellyselden](https://github.com/kellyselden)
- [#6096](https://github.com/ember-cli/ember-cli/pull/6096) Fix and improve Watcher.detectWatcher [@stefanpenner](https://github.com/stefanpenner)
- [#6081](https://github.com/ember-cli/ember-cli/pull/6081) [BUGFIX] Header files import concat [@stefanpenner](https://github.com/stefanpenner)
- [#6296](https://github.com/ember-cli/ember-cli/pull/6296) Include relative path on ember asset-sizes [@josemarluedke](https://github.com/josemarluedke)
- [#6301](https://github.com/ember-cli/ember-cli/pull/6301) [Fixes #6300] consistent concat, regardless of system EOL [@stefanpenner](https://github.com/stefanpenner)
- [#6305](https://github.com/ember-cli/ember-cli/pull/6305) Use Ember.assign for start-app test helper.
- [#6307](https://github.com/ember-cli/ember-cli/pull/6307) Node.js LTS updates. [@nathanhammond](https://github.com/nathanhammond)
- [#6306](https://github.com/ember-cli/ember-cli/pull/6306) [ENHANCEMENT] Use npm 3 [@dfreeman](https://github.com/dfreeman)
- [#6337](https://github.com/ember-cli/ember-cli/pull/6337) DOC: #addBowerPackagesToProject `source` option [@olleolleolle](https://github.com/olleolleolle)
- [#6358](https://github.com/ember-cli/ember-cli/pull/6358) Use secure URLs in docs where possible [@xtian](https://github.com/xtian)
- [#6363](https://github.com/ember-cli/ember-cli/pull/6363) [ENHANCEMENT] Add 2.8-lts scenario to default ember-try config [@BrianSipple](https://github.com/BrianSipple)
- [#6369](https://github.com/ember-cli/ember-cli/pull/6369) Enable ember-source. [@nathanhammond](https://github.com/nathanhammond)

Thank you to all who took the time to contribute!


### 2.9.1

The following changes are required if you are upgrading from the previous
version:

- Users
  + [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v2.9.0...v2.9.1)
  + Upgrade your project's ember-cli version - [docs](http://ember-cli.com/user-guide/#upgrading)
- Addon Developers
  + [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v2.9.0...v2.9.1)
  + No changes required
- Core Contributors
  + No changes required

#### Community Contributions

- [#6371](https://github.com/ember-cli/ember-cli/pull/6371) blueprints/app: Update Ember and Ember Data to v2.9.0 [@Turbo87](https://github.com/Turbo87)

Thank you to all who took the time to contribute!


### 2.9.0

The following changes are required if you are upgrading from the previous
version:

- Users
  + [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v2.8.0...v2.9.0)
  + Upgrade your project's ember-cli version - [docs](http://ember-cli.com/user-guide/#upgrading)
- Addon Developers
  + [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v2.8.0...v2.9.0)
  + No changes required
- Core Contributors
  + No changes required

Notes:
- This update includes a version bump of QUnit to 2.0.0. Please pay close attention to your test suites.

#### Community Contributions

- [#6232](https://github.com/ember-cli/ember-cli/pull/6232) suggest testing addons against LTS [@kellyselden](https://github.com/kellyselden)
- [#6235](https://github.com/ember-cli/ember-cli/pull/6235) remove `default` ember try scenario [@kellyselden](https://github.com/kellyselden)
- [#6249](https://github.com/ember-cli/ember-cli/pull/6249) Update to ember-cli-qunit@3.0.1. [@rwjblue](https://github.com/rwjblue)
- [#6276](https://github.com/ember-cli/ember-cli/pull/6276) Revert #6193 (Ember.assign) [@nathanhammond](https://github.com/nathanhammond)
- [#6176](https://github.com/ember-cli/ember-cli/pull/6176) fixed typo in the example code in the comments in the blueprint.js [@foxnewsnetwork](https://github.com/foxnewsnetwork)
- [#5395](https://github.com/ember-cli/ember-cli/pull/5395) Skip bower/npm install on blueprint install if manifests are missing [@stefanpenner](https://github.com/stefanpenner)
- [#5976](https://github.com/ember-cli/ember-cli/pull/5976) Anonymous AMD Support [@ef4](https://github.com/ef4)
- [#6086](https://github.com/ember-cli/ember-cli/pull/6086) Use heimdalljs for structured instrumentation & structured logging [@hjdivad](https://github.com/hjdivad)
- [#6103](https://github.com/ember-cli/ember-cli/pull/6103) store add-on initialization/lookup times [@stefanpenner](https://github.com/stefanpenner)
- [#6127](https://github.com/ember-cli/ember-cli/pull/6127) Remove invalid backticks in docs [@san650](https://github.com/san650)
- [#6132](https://github.com/ember-cli/ember-cli/pull/6132) [Bugfix] Destroy in-repo-addon [@andyklimczak](https://github.com/andyklimczak)
- [#6193](https://github.com/ember-cli/ember-cli/pull/6193) Changed the start-app test helper to use `Ember.assign`. [@workmanw](https://github.com/workmanw)
- [#6145](https://github.com/ember-cli/ember-cli/pull/6145) Update .gitignore for npm-debug.log [@hckhanh](https://github.com/hckhanh)
- [#6139](https://github.com/ember-cli/ember-cli/pull/6139) Updating app/addon blueprints to latest dependency versions [@elwayman02](https://github.com/elwayman02)
- [#6148](https://github.com/ember-cli/ember-cli/pull/6148) Update to _findHost to use do/while. [@nathanhammond](https://github.com/nathanhammond)
- [#6206](https://github.com/ember-cli/ember-cli/pull/6206) Remove debug from package.json [@marpo60](https://github.com/marpo60)
- [#6171](https://github.com/ember-cli/ember-cli/pull/6171) Adding a test to cover historySupportMiddleware with unknown location type [@jasonmit](https://github.com/jasonmit)
- [#6162](https://github.com/ember-cli/ember-cli/pull/6162) Upgraded ember-cli-app-version to 2.0.0 [@taras](https://github.com/taras)
- [#6198](https://github.com/ember-cli/ember-cli/pull/6198) display cleanup progress. [@stefanpenner](https://github.com/stefanpenner)
- [#6189](https://github.com/ember-cli/ember-cli/pull/6189) `testem.js` must be loaded from `/`. [@rwjblue](https://github.com/rwjblue)
- [#6188](https://github.com/ember-cli/ember-cli/pull/6188) [BUGFIX] - fix reference for `ui.prompt` [@tgandee79](https://github.com/tgandee79)
- [#6182](https://github.com/ember-cli/ember-cli/pull/6182) [BUGFIX beta] Allow empty string as rootURL [@kanongil](https://github.com/kanongil)
- [#6186](https://github.com/ember-cli/ember-cli/pull/6186) [ENHANCEMENT] Warn when empty rootURL is used with history addon [@kanongil](https://github.com/kanongil)
- [#6180](https://github.com/ember-cli/ember-cli/pull/6180) bump portfinder to v1.0.7 [@eriktrom](https://github.com/eriktrom)
- [#6194](https://github.com/ember-cli/ember-cli/pull/6194) [BUGFIX beta] Prevent Ember Data from overriding Date.parse. [@bmac](https://github.com/bmac)
- [#6208](https://github.com/ember-cli/ember-cli/pull/6208) Replace "ember-cli-broccoli" with "broccoli-{brocfile-loader, builder, middleware}" [@Turbo87](https://github.com/Turbo87)
- [#6211](https://github.com/ember-cli/ember-cli/pull/6211) Document `--port 0` in ember serve's command line usage [@sivakumar-kailasam](https://github.com/sivakumar-kailasam)
- [#6227](https://github.com/ember-cli/ember-cli/pull/6227) add tests for alphabetize-object-keys [@kellyselden](https://github.com/kellyselden)
- [#6228](https://github.com/ember-cli/ember-cli/pull/6228) in-repo-addon: sort additions to ember-addon/paths [@kellyselden](https://github.com/kellyselden)

Thank you to all who took the time to contribute!


### 2.9.0-beta.2

The following changes are required if you are upgrading from the previous
version:

- Users
  + [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v2.9.0-beta.1...v2.9.0-beta.2)
  + Upgrade your project's ember-cli version - [docs](https://ember-cli.com/user-guide/#upgrading)
- Addon Developers
  + [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v2.9.0-beta.1...v2.9.0-beta.2)
  + No changes required
- Core Contributors
  + No changes required

Notes:
- This update includes a version bump of QUnit to 2.0.0. Please pay close attention to your test suites.
- This update is marked as unsupporting Node 0.10. Please prepare for removal of support per [Ember's Node.js LTS Support policy](https://emberjs.com/blog/2016/09/07/ember-node-lts-support.html).

#### Community Contributions

- [#6232](https://github.com/ember-cli/ember-cli/pull/6232) suggest testing addons against LTS [@kellyselden](https://github.com/kellyselden)
- [#6235](https://github.com/ember-cli/ember-cli/pull/6235) remove `default` ember try scenario [@kellyselden](https://github.com/kellyselden)
- [#6249](https://github.com/ember-cli/ember-cli/pull/6249) Update to ember-cli-qunit@3.0.1. [@rwjblue](https://github.com/rwjblue)
- [#6250](https://github.com/ember-cli/ember-cli/pull/6250) Update engine field in package.json [@nathanhammond](https://github.com/nathanhammond)
- [#6276](https://github.com/ember-cli/ember-cli/pull/6276) Revert #6193 (Ember.assign) [@nathanhammond](https://github.com/nathanhammond)

Thank you to all who took the time to contribute!


### 2.9.0-beta.1

The following changes are required if you are upgrading from the previous
version:

- Users
  + [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v2.8.0...v2.9.0-beta.1)
  + Upgrade your project's ember-cli version - [docs](https://ember-cli.com/user-guide/#upgrading)
- Addon Developers
  + [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v2.8.0...v2.9.0-beta.1)
  + No changes required
- Core Contributors
  + No changes required

#### Community Contributions

- [#6176](https://github.com/ember-cli/ember-cli/pull/6176) fixed typo in the example code in the comments in the blueprint.js [@foxnewsnetwork](https://github.com/foxnewsnetwork)
- [#5395](https://github.com/ember-cli/ember-cli/pull/5395) Skip bower/npm install on blueprint install if manifests are missing [@stefanpenner](https://github.com/stefanpenner)
- [#5976](https://github.com/ember-cli/ember-cli/pull/5976) Anonymous AMD Support [@ef4](https://github.com/ef4)
- [#6086](https://github.com/ember-cli/ember-cli/pull/6086) Use heimdalljs for structured instrumentation & structured logging [@hjdivad](https://github.com/hjdivad)
- [#6103](https://github.com/ember-cli/ember-cli/pull/6103) store add-on initialization/lookup times [@stefanpenner](https://github.com/stefanpenner)
- [#6127](https://github.com/ember-cli/ember-cli/pull/6127) Remove invalid backticks in docs [@san650](https://github.com/san650)
- [#6132](https://github.com/ember-cli/ember-cli/pull/6132) [Bugfix] Destroy in-repo-addon [@andyklimczak](https://github.com/andyklimczak)
- [#6193](https://github.com/ember-cli/ember-cli/pull/6193) Changed the start-app test helper to use `Ember.assign`. [@workmanw](https://github.com/workmanw)
- [#6145](https://github.com/ember-cli/ember-cli/pull/6145) Update .gitignore for npm-debug.log [@hckhanh](https://github.com/hckhanh)
- [#6139](https://github.com/ember-cli/ember-cli/pull/6139) Updating app/addon blueprints to latest dependency versions [@elwayman02](https://github.com/elwayman02)
- [#6148](https://github.com/ember-cli/ember-cli/pull/6148) Update to _findHost to use do/while. [@nathanhammond](https://github.com/nathanhammond)
- [#6206](https://github.com/ember-cli/ember-cli/pull/6206) Remove debug from package.json [@marpo60](https://github.com/marpo60)
- [#6171](https://github.com/ember-cli/ember-cli/pull/6171) Adding a test to cover historySupportMiddleware with unknown location type [@jasonmit](https://github.com/jasonmit)
- [#6162](https://github.com/ember-cli/ember-cli/pull/6162) Upgraded ember-cli-app-version to 2.0.0 [@taras](https://github.com/taras)
- [#6198](https://github.com/ember-cli/ember-cli/pull/6198) display cleanup progress. [@stefanpenner](https://github.com/stefanpenner)
- [#6189](https://github.com/ember-cli/ember-cli/pull/6189) `testem.js` must be loaded from `/`. [@rwjblue](https://github.com/rwjblue)
- [#6188](https://github.com/ember-cli/ember-cli/pull/6188) [BUGFIX] - fix reference for `ui.prompt` [@tgandee79](https://github.com/tgandee79)
- [#6182](https://github.com/ember-cli/ember-cli/pull/6182) [BUGFIX beta] Allow empty string as rootURL [@kanongil](https://github.com/kanongil)
- [#6186](https://github.com/ember-cli/ember-cli/pull/6186) [ENHANCEMENT] Warn when empty rootURL is used with history addon [@kanongil](https://github.com/kanongil)
- [#6180](https://github.com/ember-cli/ember-cli/pull/6180) bump portfinder to v1.0.7 [@eriktrom](https://github.com/eriktrom)
- [#6194](https://github.com/ember-cli/ember-cli/pull/6194) [BUGFIX beta] Prevent Ember Data from overriding Date.parse. [@bmac](https://github.com/bmac)
- [#6208](https://github.com/ember-cli/ember-cli/pull/6208) Replace "ember-cli-broccoli" with "broccoli-{brocfile-loader, builder, middleware}" [@Turbo87](https://github.com/Turbo87)
- [#6211](https://github.com/ember-cli/ember-cli/pull/6211) Document `--port 0` in ember serve's command line usage [@sivakumar-kailasam](https://github.com/sivakumar-kailasam)
- [#6227](https://github.com/ember-cli/ember-cli/pull/6227) add tests for alphabetize-object-keys [@kellyselden](https://github.com/kellyselden)
- [#6228](https://github.com/ember-cli/ember-cli/pull/6228) in-repo-addon: sort additions to ember-addon/paths [@kellyselden](https://github.com/kellyselden)

Thank you to all who took the time to contribute!


### 2.8.0

The following changes are required if you are upgrading from the previous
version:

- Users
  + [`ember new` diff](https://github.com/ember-cli/ember-new-output/compare/v2.7.0...v2.8.0)
  + Upgrade your project's ember-cli version - [docs](https://ember-cli.com/user-guide/#upgrading)
- Addon Developers
  + [`ember addon` diff](https://github.com/ember-cli/ember-addon-output/compare/v2.7.0...v2.8.0)
  + No changes required
- Core Contributors
  + No changes required

#### Community Contributions

- [#6050](https://github.com/ember-cli/ember-cli/pull/6050) Make app/addon readmes consistent [@elwayman02](https://github.com/elwayman02)
- [#6005](https://github.com/ember-cli/ember-cli/pull/6005) [BUGFIX] Fixes broccoli errors when `tests` dir is not present [@twokul](https://github.com/twokul)
- [#5986](https://github.com/ember-cli/ember-cli/pull/5986) added transparent-proxy option to ember serve command [@badazz91](https://github.com/badazz91)
- [#6012](https://github.com/ember-cli/ember-cli/pull/6012) switch to a rollup subset of lodash and shave off 20 - 30%+ boot time [@stefanpenner](https://github.com/stefanpenner)
- [#6017](https://github.com/ember-cli/ember-cli/pull/6017) Allow `ember install addon_name --save` in addons. [@xcambar](https://github.com/xcambar)
- [#6030](https://github.com/ember-cli/ember-cli/pull/6030) [ENHANCEMENT] Asset Sizes I moved the creation of asset sizes to an object. [@kiwiupover](https://github.com/kiwiupover)
- [#6052](https://github.com/ember-cli/ember-cli/pull/6052) Turn on strict mode for tests. [@nathanhammond](https://github.com/nathanhammond)
- [#6043](https://github.com/ember-cli/ember-cli/pull/6043) [BUGFIX beta] Test nested addon import [@xcambar](https://github.com/xcambar)
- [#6045](https://github.com/ember-cli/ember-cli/pull/6045) [Enhancement] Return raw asset-size as data instead of strings [@kiwiupover](https://github.com/kiwiupover)
- [#6072](https://github.com/ember-cli/ember-cli/pull/6072) Makes sure dependecies are loaded on demand [@twokul](https://github.com/twokul)
- [#6092](https://github.com/ember-cli/ember-cli/pull/6092) Remove ember-qunit-notifications [@trentmwillis](https://github.com/trentmwillis)
- [#6094](https://github.com/ember-cli/ember-cli/pull/6094) Remove jQuery usage to read meta config. [@rwjblue](https://github.com/rwjblue)
- [#6095](https://github.com/ember-cli/ember-cli/pull/6095) [INTERNAL] Remove unused 'es3Safe' option [@ursm](https://github.com/ursm)
- [#6102](https://github.com/ember-cli/ember-cli/pull/6102) Refactor/cleanup/reduce slow tests [@stefanpenner](https://github.com/stefanpenner)
- [#6112](https://github.com/ember-cli/ember-cli/pull/6112) More specific docs for included hook [@xcambar](https://github.com/xcambar)
- [#6098](https://github.com/ember-cli/ember-cli/pull/6098) [BUGFIX beta] ServerWatcher disregards --watcher=* [@stefanpenner](https://github.com/stefanpenner)
- [#6166](https://github.com/ember-cli/ember-cli/pull/6166) changed --insecure-proxy to --secure-proxy in ember serve command [@badazz91](https://github.com/badazz91)

Thank you to all who took the time to contribute!
