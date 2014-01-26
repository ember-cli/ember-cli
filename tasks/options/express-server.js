var grunt = require('grunt');

module.exports = {
	options: {
		APIMethod: "<%= package.APIMethod %>",		// stub or proxy
		proxyURL: "<%= package.proxyURL %>"			// URL to the API server, if using APIMethod: 'proxy'
	}
};