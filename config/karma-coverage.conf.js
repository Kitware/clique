var karmaConfigObject = require('./karma-base.conf');
var webpackTestConfig = require('./webpack-coverage.config');

karmaConfigObject.webpack = webpackTestConfig;

karmaConfigObject.reporters = [
  'coverage'
];

karmaConfigObject.coverageReporter = {
  reporters: [
    {
      type: 'text-summary'
    },
    {
      type: 'html',
      dir: 'coverage/'
    }
  ]
}

module.exports = function (config) {
  config.set(karmaConfigObject);
};
