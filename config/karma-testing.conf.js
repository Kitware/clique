var karmaConfigObject = require('./karma-base.conf');
var webpackTestConfig = require('./webpack-testing.config');

karmaConfigObject.webpack = webpackTestConfig;

karmaConfigObject.reporters = [
  'tap'
];

module.exports = function (config) {
  config.set(karmaConfigObject);
};
