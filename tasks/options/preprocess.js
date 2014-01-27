module.exports = {
  indexHTMLDebugApp: {
    src : 'app/index.html', dest : 'tmp/result/index.html',
    options: { context: { dist: false, tests: false } }
  },
  indexHTMLDebugTests: {
    src : 'app/index.html', dest : 'tmp/result/tests/index.html',
    options: { context: { dist: false, tests: true } }
  },
  indexHTMLDistApp: {
    src : 'app/index.html', dest : 'tmp/result/index.html',
    options: { context: { dist: true, tests: false } }
  },
  indexHTMLDistTests: {
    src : 'app/index.html', dest : 'tmp/result/tests/index.html',
    options: { context: { dist: true, tests: true } }
  }
};