var webpack = require('webpack');
var webpackTestConfig = require('./webpack-testing.config');

module.exports = function (config) {
  config.set({
    singleRun: true,
    browsers: [
      'PhantomJS'
    ],
    frameworks: [
      'tap'
    ],
    files: [
      'tests.bundle.js'
    ],
    plugins: [
      'karma-phantomjs-launcher',
      'karma-sourcemap-loader',
      'karma-webpack',
      'karma-coverage',
      'karma-tap',
      'karma-tape-reporter'
    ],
    preprocessors: {
      'tests.bundle.js': [
        'webpack',
        'sourcemap'
      ]
    },
    reporters: [
      'tape',
      'coverage'
    ],
    webpack: webpackTestConfig,
    webpackServer: {
      noInfo: true
    },
    coverageReporter: {
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
  });
};
