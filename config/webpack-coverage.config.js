var config = require('./webpack-testing.config.js');

config.module.preLoaders = [{
  test: /\.js$/,
  include: /src/,
  exclude: /(node_modules|test)/,
  loader: 'babel-istanbul'
}];

module.exports = config;
