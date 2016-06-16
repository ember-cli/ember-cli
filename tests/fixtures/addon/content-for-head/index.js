module.exports = {
  name: 'content-for-head',

  contentFor: function(type, config) {
    if (type === 'head') {
      return '<meta name="meta/tag/module" data-module="true" content="' + escape(JSON.stringify({ value: '1234' })) + '" />';
    }
  }
};
