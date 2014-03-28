// ==========================================================================
// Project:   Ember - JavaScript Application Framework
// Copyright: Copyright 2013 Stefan Penner and Ember App Kit Contributors
// License:   Licensed under MIT license
//            See https://raw.github.com/stefanpenner/ember-jj-abrams-resolver/master/LICENSE
// ==========================================================================


 // Version: 0.0.1

var JSHINTRC = {
    "predef": [
        "console",
        "Ember",
        "DS",
        "Handlebars",
        "Metamorph",
        "ember_assert",
        "ember_warn",
        "ember_deprecate",
        "ember_deprecateFunc",
        "require",
        "equal",
        "asyncTest",
        "test",
        "raises",
        "deepEqual",
        "start",
        "stop",
        "ok",
        "strictEqual",
        "module",
        "expect",
        "minispade",
        "async",
        "invokeAsync"
    ],

    "node" : false,
    "es5" : true,
    "browser" : true,

    "boss" : true,
    "curly": false,
    "debug": false,
    "devel": false,
    "eqeqeq": true,
    "evil": true,
    "forin": false,
    "immed": false,
    "laxbreak": false,
    "newcap": true,
    "noarg": true,
    "noempty": false,
    "nonew": false,
    "nomen": false,
    "onevar": false,
    "plusplus": false,
    "regexp": false,
    "undef": true,
    "sub": true,
    "strict": false,
    "white": false
}
;

minispade.register('ember-resolver/~tests/core_test', "(function() {/*globals define registry */\n\nvar resolver;\n\nmodule(\"Resolver Tests\",{\n  setup: function(){\n    resolver = registry['resolver'][2]();\n  }\n});\n\ntest(\"can access Resolver\", function(){\n  ok(resolver);\n});\n\n})();\n//@ sourceURL=ember-resolver/~tests/core_test");