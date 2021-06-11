const { buildEmberPlugins } = require('ember-cli-babel');

module.exports = function (api) {
  api.cache(true);

  return {
    presets: [
      [
        require.resolve('@babel/preset-env'),
        {
          targets: require(<% if (blueprint === 'app') { %>'./config/targets'<% } else { %>'./tests/dummy/config/targets'<% } %>),
        },
      ],
    ],
    plugins: [...buildEmberPlugins(__dirname)],
  };
};
